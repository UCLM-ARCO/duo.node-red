// -*- coding: utf-8 -*-

_ = console.info.bind(console);

var Ice = require("ice").Ice;
var DUO = require("duo_idm").DUO;

module.exports = function(RED) {

    ActiveWI = Ice.Class(DUO.IDM.Active.W, {
	__init__: function(node, router) {
	    this.node =  node;
	    this.router = router;
	    this.observer = null;

	    if (node.observer) {
		var addr = node.observer.trim().replace(":", "").toUpperCase();
		this.set_str_observer(addr);
	    }
	},

	setObserver: function(addr) {
	    addr = this.address_to_string(addr);
	    this.set_str_observer(addr);
	},

	set_str_observer: function(addr) {
	    var oid = Ice.stringToIdentity(addr);
	    var observer = this.router.ice_identity(oid);
	    this.observer = this.cast_to_correct_type(observer, this.node.observer_type);

	    this.node.observer = addr;
	    set_status(this.node);
	},

	address_to_string: function(addr) {
	    var result = "";

	    for (var i in addr.toString()) {
		var c = addr[i].toString(16);
		if ((c.length % 2) > 0)
		    c = "0" + c;
		result += c;
	    }
	    return result.toUpperCase();
	},

	cast_to_correct_type: function(proxy, type) {
	    switch (type) {
		case "ibool":
		    return DUO.IDM.IBool.WPrx.uncheckedCast(proxy);
		case "iint":
		    return DUO.IDM.IInt.WPrx.uncheckedCast(proxy);
		case "istring":
		    return DUO.IDM.IString.WPrx.uncheckedCast(proxy);
		default:
		    this.node.error("Unknown observer type!");
	    }
	},
    });

    function DUOActiveOutputNode(config) {
 	var node = this;
 	RED.nodes.createNode(this, config);
	node.addr = config.addr.toUpperCase();
	node.observer = config.observer.trim().replace(":", "").toUpperCase();
	node.observer_type = config.observer_type;

	var status_ready =    {fill: 'green',  shape: 'ring', text: 'ready'};
	var status_starting = {fill: 'yellow', shape: 'ring', text: 'starting...'};
	var status_error =    {fill: 'red',    shape: 'ring', text: 'error!'};
	set_status(node, "starting");

 	var router_config = RED.nodes.getNode(config.router);
 	var adapter_node = RED.nodes.getNode(config.adapter);

	var servant;
	adapter_node.on("adapter-ready", function() {
	    var adapter = adapter_node.adapter;
	    var ic = adapter_node.get_communicator();
	    var router = router_config.get_proxy(ic);

	    servant = new ActiveWI(node, router);
	    adapter.add(servant, node.addr.replace(":", ""))
		   .then(function(prx) {
		       node.log("servant added, oid: " + prx.ice_getIdentity().name);
		       set_status(node, "ready");
		       register_on_router(prx);
		   })
		   .exception(function(ex) {
		       node.error(ex.toString());
		       set_status(node, "error");
		   });
	});

	node.on('input', function(msg) {
	    if (! servant.observer) {
		node.warn("Observer not set, nothing to do");
		return;
	    }

	    var value = cast_payload(msg.payload);
	    if (value === undefined)
		return;

	    servant.observer.set(value, "")
		 .then(function() { node.log(node.observer + ".set called"); })
		 .exception(function(e) { node.error("ERROR: " + e.toString()); });
	});

	function register_on_router(prx) {
	    prx = prx.ice_oneway().toString();
	    var ic = adapter_node.get_communicator();
	    var router = router_config.get_proxy(ic);
	    router.adv(prx)
		  .exception(function(ex) {
		      node.error(ex.toString());
		  });
	}

	function cast_payload(value) {
	    switch (node.observer_type) {
		case "ibool":
		    return value.toString().toLowerCase().trim() == "true";

		case "iint":
		    value = parseInt(value);
		    if (isNaN(value)) {
			node.warn("Invalid input: " + msg.payload);
			return;
		    }
		    return value;

		case "istring":
		    return value.toString();

		default:
		    node.error("Unknown observer type!");
	    };
	}
    }

    function set_status(node, status) {
	var configs = {
	    ready: {fill: 'green',  shape: 'ring', text: 'ready'},
	    starting: {fill: 'yellow', shape: 'ring', text: 'starting...'},
	    error: {fill: 'red',    shape: 'ring', text: 'error!'},
	};

	var observer = "<not set> | ";
	if (node.observer)
	    observer = node.observer + " | ";

	if (status === undefined)
	    status = node.current_status;

	var c = configs[status];
	c.text = observer + c.text
	node.status(c);
	node.current_status = status;
    }

    RED.nodes.registerType("Active out", DUOActiveOutputNode);
}
