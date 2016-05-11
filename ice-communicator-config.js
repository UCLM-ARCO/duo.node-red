_ = console.info.bind(console);

var Ice = require("ice").Ice;

module.exports = function(RED) {

    function IceCommunicatorConfigNode(config) {
	RED.nodes.createNode(this, config);
	var node = this;

	// props needed for bidir connection
	var idata = new Ice.InitializationData();
	idata.properties = Ice.createProperties();
	idata.properties.setProperty("Ice.ACM.Server.Close", "0");
	idata.properties.setProperty("Ice.ACM.Heartbeat", "3");
	idata.properties.setProperty("Ice.ACM.Timeout", "30");

	node.ic = Ice.initialize(idata);
    }

    RED.nodes.registerType("ice-communicator", IceCommunicatorConfigNode);
}
