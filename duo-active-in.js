var Ice = require("ice").Ice;
var DUO = require("idm-slice/duo_idm").DUO;

_ = console.info.bind(console);
module.exports = function(RED) {

    function DUOActiveInputNode(config) {
	RED.nodes.createNode(this, config);
	this.addr = config.addr.toUpperCase();

	var node = this;
	node.status({fill: "yellow", shape: "ring", text: "waiting..."});

	var ic_config = RED.nodes.getNode(config.ic);
	var ic = ic_config.ic;

	// check if nothing is connected
	if (config.wires[0].length == 0) {
	    var msg = "not connected";
	    node.status({fill: "red", shape: "ring", text: msg});
	    return;
	}

	// get proxy to Wiring Service
	var wiring = null;
	var wiring_config = RED.nodes.getNode(config.wiring_service);
	if (wiring_config)
	    var wiring = wiring_config.get_proxy(ic);

	// warn if multiple consumers and no wiring service defined
	if (! wiring && config.wires[0].length > 1)
	    node.warn("Multiple consumers but no Wiring Service defined! Using only one.");

	// delay invocation, wait for other nodes to be created (min: 100 ms)
	var delay = 100 + parseInt(config.delay);
	setTimeout( function() {
	    if (wiring == null)
		connect_directly(node, config, ic);
	    else
		connect_using_service(node, config, wiring);
	}, delay);
    }

    function connect_directly(node, config, ic) {
	// get proxy to IDM router
	var router_config = RED.nodes.getNode(config.router);
	var proxy = router_config.get_proxy(ic);

	// create proxy to destination
	var dst_oid = node.addr.replace(":", "");
	dst_oid = ic.stringToIdentity(dst_oid);
	proxy = proxy.ice_identity(dst_oid);

	// cast to DUO.IDM.Active.W
	proxy = DUO.IDM.Active.WPrx.uncheckedCast(proxy);
	node.log(proxy.toString());

	// call to setObserver
	var observer = config.wires[0][0];
	observer = RED.nodes.getNode(observer).addr;
	observer = string_to_address(observer);
	if (observer == null) {
	    node.status({fill: "red", shape: "ring", text: "ERROR"});
	    node.error("Invalid observer address!");
	    return;
	}

	node.log("set observer to '" + observer.toString("hex") + "'");
	proxy.setObserver(observer)
	     .then(function() {
		 node.status({fill: "green", shape: "ring", text: "observer set"});
	     })
	     .exception(function(ex) {
		 node.status({fill: "red", shape: "ring", text: "ERROR"});
		 node.error(ex.toString());
	     });
    }

    function connect_using_service(node, config, wiring) {
	// get producer addr
	var producer = node.addr.replace(":", "");

	// iter over all connected nodes on output 0
	var promises = [];
	for (var i in config.wires[0]) {
	    var consumer = config.wires[0][i];
	    consumer = RED.nodes.getNode(consumer).addr;
	    consumer = consumer.toUpperCase().replace(":", "");

	    var pm = wiring.addObserver(producer, consumer);
	    promises.push(pm);
	}

	Ice.Promise.all(promises)
	   .then(function() {
	       node.status({fill: "green", shape: "ring", text: "observer set"});
	   })
	   .exception(function(ex) {
	       node.status({fill: "red", shape: "ring", text: "ERROR"});
	       node.error(ex.toString());
	   });
    }

    function string_to_address(s) {
	s = s.trim().replace(":", "");

	var addr = [];
	for (var i=0; i<=s.length/2; i=i+2) {
	    var c = s[i] + s[i+1];
	    if (! (/^(\-|\+)?([0-9a-fA-F]+|Infinity)$/.test(c)))
		return null;
	    addr.push(parseInt(c, 16));
	}

	return new Buffer(addr);
    }

    RED.nodes.registerType("Active in", DUOActiveInputNode);
}
