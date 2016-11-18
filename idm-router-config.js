var IDM = require("idm-slice/idm").IDM;

module.exports = function(RED) {

    function IDMRouterConfigNode(config) {
	RED.nodes.createNode(this, config);
	var node = this;

	node.host = config.host;
	node.port = config.port;
	node.addr = config.addr.toUpperCase();

	node.get_proxy = function(ic) {
	    var prx = node.addr.replace(":", "") +
		      " -e 1.0 -o:tcp -h " + node.host + " -p " + node.port;
	    prx = ic.stringToProxy(prx);
	    return IDM.NeighborDiscovery.ListenerPrx.uncheckedCast(prx);
	}
    }

    RED.nodes.registerType("idm-router", IDMRouterConfigNode);
}
