_ = console.info.bind(console);

module.exports = function(RED) {

    var topic = "";
    function BoolNode(config) {
 	RED.nodes.createNode(this, config);
	topic = config.topic;
    }

    RED.nodes.registerType("toggle in", BoolNode);

    RED.httpAdmin.post(
	"/bool-input/:id",
	RED.auth.needsPermission("inject.write"),
	function(req, res) {

            var node = RED.nodes.getNode(req.params.id);
            if (node == null)
		res.sendStatus(404);

 	    node.send({payload: req.body.state == "true", topic: topic});
            res.sendStatus(200);
	}
    );
}
