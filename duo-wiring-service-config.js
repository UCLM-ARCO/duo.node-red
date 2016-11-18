var DUO = require("idm-slice/duo_wiring").DUO;

_ = console.info.bind(console);
module.exports = function(RED) {

    function DuoWiringServiceConfigNode(config) {
	RED.nodes.createNode(this, config);
	var node = this;

	node.host = config.host;
	node.port = config.port;

	node.get_proxy = function(ic) {
	    var prx = "WiringService -t:tcp -h " + node.host + " -p " + node.port;
	    prx = ic.stringToProxy(prx);
	    return DUO.IDM.WiringServicePrx.uncheckedCast(prx);
	}
    }

    RED.nodes.registerType("duo-wiring-service", DuoWiringServiceConfigNode);
}
