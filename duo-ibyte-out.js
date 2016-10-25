_ = console.info.bind(console);

var DUO = require("duo_idm").DUO;

module.exports = function(RED) {

    function DUOIByteClientNode(config) {
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
 	var addr_oid = node.addr.replace(":", "");
 	addr_oid = ic.stringToIdentity(addr_oid);
 	proxy = proxy.ice_identity(addr_oid);

 	// cast to DUO.IDM.IByte.W
 	proxy = DUO.IDM.IByte.WPrx.uncheckedCast(proxy);
 	node.log(proxy.toString());

 	node.on('input', function(msg) {
	    var value = parseInt(msg.payload);
	    if (value > 255 || value < 0 || isNaN(value)) {
		node.warn("Invalid input: " + msg.payload);
		return;
	    }

 	    // call set(state) on proxy
 	    proxy.set(value, "")
		 .then(function() { node.log(node.addr + ".set called"); })
		 .exception(function(e) { node.error("ERROR: " + e.toString()); });
 	});
    }

    RED.nodes.registerType("IByte out", DUOIByteClientNode);
}
