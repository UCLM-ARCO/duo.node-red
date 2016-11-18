// -*- coding: utf-8 -*-

_ = console.info.bind(console);

var DUO = require("idm-slice/duo_idm").DUO;

module.exports = function(RED) {

    function DUOIStringClientNode(config) {
	var node = this;
	RED.nodes.createNode(this, config);
	node.addr = config.addr.toUpperCase();

	var router_config = RED.nodes.getNode(config.router);
	var ic_config = RED.nodes.getNode(config.ic);

	// get communicator
	var ic = ic_config.ic;

	// get proxy to IDM router
	var proxy = router_config.get_proxy(ic);

	// create proxy to destination
	var addr_oid = this.addr.replace(":", "");
	addr_oid = ic.stringToIdentity(addr_oid);
	proxy = proxy.ice_identity(addr_oid);

	// cast to DUO.IDM.IString.W
	proxy = DUO.IDM.IString.WPrx.uncheckedCast(proxy);
	this.log(proxy.toString());

	this.on('input', function(msg) {
	    // call set(state) on proxy (note: "" + is for coercion)
	    proxy.set("" + msg.payload, "")
		 .then(function() { node.log(node.addr + ".set called"); })
		 .exception(function(e) { node.error("ERROR: " + e.toString()); });
	});
    }

    RED.nodes.registerType("IString out", DUOIStringClientNode);
}
