_ = console.info.bind(console);

var Ice = require("ice").Ice;
var Utils = require("remote-adapter").Utils;
var spawn = require('child_process').spawn;
var path = require("path");

module.exports = function(RED) {

    function IceAdapterConfigNode(config) {
	RED.nodes.createNode(this, config);

	var node = this;
	node.host = config.host;
	node.port = config.port;

	node.get_communicator = function() {
	    return node.ic;
	}

	setTimeout(function() { on_communicator_ready(node, config); }, 100);
    }

    function on_communicator_ready(node, config) {
	node.ic = get_communicator_by_name(RED, config.ic);
	if (! node.ic) {
	    node.error("Invalid communicator");
	    return;
	}

	var props = clean_properties(node, config.properties);
	var child;

	run_remote_adapter_service(node, config.host, config.port, props)
	    .then(function(child_) {
		node.log("remote adapter running...");
		child = child_;
		var proxy = "RemoteAdapter -t:tcp -h " + config.host + " -p " + config.port;
		createRemoteObjectAdapter(node.ic, proxy, node)
		    .then(on_adapter_ready)
		    .exception(on_adapter_fail);
	    })
	    .exception(function(ex) {
		node.error(ex.toString());
	    });

	node.on('close', function() {
	    if (child) {
                child.kill();
		child = null;
            }
	});

	function on_adapter_ready(adapter) {
	    node.adapter = adapter;
	    node.emit("adapter-ready");
	}

	function on_adapter_fail(ex) {
	    node.error(ex.toString());
	}
    }

    RED.nodes.registerType("ice-adapter", IceAdapterConfigNode);
}

// --------------------------------------------------------------------------------

function get_communicator_by_name(RED, name) {
    if (RED === undefined || name === undefined)
	return;

    var info;
    RED.nodes.eachNode(function(n) {
	if (! info && n.name == name) {
	    info = n;
	}
    });

    if (info) {
	var node = RED.nodes.getNode(info.id);
	if (node)
	    return node.ic;
    }
}

function run_remote_adapter_service(node, host, port, props) {
    var pwd = path.dirname(__filename);
    var cmd = path.join(pwd, "utils/remote-adapter.py");
    var args = ("--host " + host + " --port " + port + " --adapter-name " + node.name).split(" ");
    args.push("--properties");
    args.push(props);

    var retval = new Ice.Promise();
    var child = spawn(cmd, args);

    var notified = false;
    child.stdout.on('data', function(d) {
	d = d.toString().trim();
	// note: if no process spawned, uncomment this
	// node.log(d);

	if (notified)
	    return;

	if (d == "ready") {
	    retval.succeed(child);
	    notified = true;
	}
    });

    child.stderr.on('data', function(d) {
	node.error(d.toString());
    });

    child.on('error', function(e) {
	node.error(e.toString());
	retval.fail(e);
    });

    return retval;
}

function clean_properties(node, props) {
    var cleaned = [];
    for (var i in props) {
	var p = props[i].replace("${name}", node.name)
			.replace("${port}", node.port)
			.replace("${host}", node.host)
			.trim();

	if (p)
	    cleaned.push(p);
    }

    return JSON.stringify(cleaned);
}

// --------------------------------------------------------------------------------

RemoteAdapter = function(adapter, r_adapter_prx, node) {
    this.adapter = adapter;
    this.r_adapter = r_adapter_prx;
    this.node = node;
};

RemoteAdapter.prototype.addWithUUID = function(servant) {
    var prx = this.adapter.addWithUUID(servant);
    return this.r_adapter.add(prx);
};

RemoteAdapter.prototype.add = function(servant, oid) {
    this.node.log("add servant, oid: " + oid);
    var ic = this.getCommunicator();
    var prx = this.adapter.add(servant, ic.stringToIdentity(oid));
    return this.r_adapter.add(prx);
};

RemoteAdapter.prototype.getCommunicator = function() {
    return this.adapter.getCommunicator();
};

createRemoteObjectAdapter = function(ic, strprx, node) {
    var retval = new Ice.Promise();

    ic.createObjectAdapter("")
	.then(on_adapter_ready)
	.exception(function(ex) {
	    node.error(ex.toString());
	    retval.fail(ex);
	});

    var adapter;
    function on_adapter_ready(adapter_) {
	adapter = adapter_;

	var r_adapter_prx = ic.stringToProxy(strprx);
	return Utils.RemoteAdapterPrx.checkedCast(r_adapter_prx)
		    .then(on_remote_adapter_prx_ready);
    };

    function on_remote_adapter_prx_ready(r_adapter_prx) {
	var conn = r_adapter_prx.ice_getCachedConnection();
 	conn.setAdapter(adapter);

	var r_adapter = new RemoteAdapter(adapter, r_adapter_prx, node);
	return retval.succeed(r_adapter);
    };

    return retval;
};

// --------------------------------------------------------------------------------
