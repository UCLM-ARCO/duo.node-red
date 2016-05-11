_ = console.info.bind(console);

var Ice = require("ice").Ice;
var DUO = require("duo_idm").DUO;

module.exports = function(RED) {

    IBoolI = Ice.Class(DUO.IDM.IBool.W, {
	__init__: function(node) {
	    this.node = node;
	},

	set: function(value, source) {
	    this.node.send({payload: value});
	},
    });

    function DUOIBoolServerNode(config) {
	RED.nodes.createNode(this, config);
	var node = this;
	var status_ready =    {fill: 'green',  shape: 'ring', text: 'ready'};
	var status_starting = {fill: 'yellow', shape: 'ring', text: 'starting...'};
	var status_error =    {fill: 'red',    shape: 'ring', text: 'error!'};

 	node.addr = config.addr.toUpperCase();
	node.status(status_starting);

 	var router_config = RED.nodes.getNode(config.router);
 	var adapter_node = RED.nodes.getNode(config.adapter);

	// wait for adapter and then register servant
	adapter_node.on("adapter-ready", function() {
	    var adapter = adapter_node.adapter;
	    var servant = new IBoolI(node);
	    adapter.add(servant, node.addr.replace(":", ""))
		   .then(function(prx) {
		       node.log("servant added, oid: " + prx.ice_getIdentity().name);
		       node.status(status_ready);
		       register_on_router(prx);
		   })
		   .exception(function(ex) {
		       node.error(ex.toString());
		       node.status(status_error);
		   });
	});

	function register_on_router(prx) {
	    if (! router_config) {
		node.warn("router not defined, will not send adv's");
		return;
	    }

	    prx = prx.ice_oneway().toString();
	    var ic = adapter_node.get_communicator();
	    var router = router_config.get_proxy(ic);
	    router.adv(prx)
		  .exception(function(ex) {
		      node.error(ex.toString());
		  });
	}
    }

    RED.nodes.registerType("IBool in", DUOIBoolServerNode);
}
