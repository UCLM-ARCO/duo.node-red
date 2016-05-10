_ = console.info.bind(console);

module.exports = function(RED) {

    function IceAdapterConfigNode(config) {
	RED.nodes.createNode(this, config);
    }

    RED.nodes.registerType("ice-adapter", IceAdapterConfigNode);
}
