_ = console.info.bind(console);

module.exports = function(RED) {

    var Ice = require("ice").Ice;

    function ZeroCIceConfigNode(config) {
	RED.nodes.createNode(this, config);
	this.ic = Ice.initialize();
    }

    RED.nodes.registerType("zeroc-ice", ZeroCIceConfigNode);
}
