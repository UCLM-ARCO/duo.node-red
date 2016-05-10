_ = console.info.bind(console);

module.exports = function(RED) {

    var Ice = require("ice").Ice;

    function IceCommunicatorConfigNode(config) {
	RED.nodes.createNode(this, config);
	this.ic = Ice.initialize();
    }

    RED.nodes.registerType("ice-communicator", IceCommunicatorConfigNode);
}
