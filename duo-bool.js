_ = console.info.bind(console);

module.exports = function(RED) {

    // load duo_idm.ice
    var DUO = require("duo_idm").DUO;

    function DUOIBoolClientNode(config) {
	RED.nodes.createNode(this, config);
	this.addr = config.addr.toUpperCase();

	var router_config = RED.nodes.getNode(config.router);
	var ice_config = RED.nodes.getNode(config.ice);

	// create communicator
	var ic = ice_config.ic;

	// get proxy to IDM router
	var router_prx = "ROUTER -o:tcp -h " + router_config.host + " -p " + router_config.port;
	var proxy = ic.stringToProxy(router_prx);

	// create proxy to destination
	var addr_oid = this.addr.replace(":", "");
	addr_oid = ic.stringToIdentity(addr_oid);
	proxy = proxy.ice_identity(addr_oid);

	// cast to DUO.IDM.IBool.W
	proxy = DUO.IDM.IBool.WPrx.uncheckedCast(proxy);
	this.log(proxy.toString());

	this.on('input', function(msg) {
	    // call set(state) on proxy
	    proxy.set(msg.payload, "");
	});
    }

    RED.nodes.registerType("IBool", DUOIBoolClientNode);
}
