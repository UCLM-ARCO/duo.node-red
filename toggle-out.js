_ = console.info.bind(console);

module.exports = function(RED) {

    function BoolNode(config) {
 	RED.nodes.createNode(this, config);
	var node = this;

	node.on("input", function(msg) {
	    var status = msg.payload ? "true" : "false";
	    var color = msg.payload ? "green" : "red";
	    node.status({text: status, fill: color, shape: "dot"});
	});
    }

    RED.nodes.registerType("toggle out", BoolNode);
}
