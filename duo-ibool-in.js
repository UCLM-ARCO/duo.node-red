// -*- coding: utf-8 -*-

_ = console.info.bind(console);

var Ice = require("ice").Ice;
var DUO = require("duo_idm").DUO;

module.exports = function(RED) {

    IBoolI = Ice.Class(DUO.IDM.IBool.W, {
	__init__: function(node) {
	    this.node = node;
	},

	set: function(value, source) {
	    source = this.address_to_string(source);
	    this.node.send({payload: value, source: source, topic: this.node.topic});
	},

	address_to_string: function(addr) {
	    var result = "";

	    for (var i in addr.toString()) {
		var c = addr[i].toString(16);
		if ((c.length % 2) > 0)
		    c = "0" + c;
		result += c;
	    }
	    return result.toUpperCase();
	},
    });

    function DUOIBoolServerNode(config) {
	RED.nodes.createNode(this, config);
	var node = this;

 	node.addr = config.addr.toUpperCase();
	node.topic = config.topic;
	set_status(node, "starting");

 	var router_config = RED.nodes.getNode(config.router);
 	var adapter_node = RED.nodes.getNode(config.adapter);

	// wait for adapter and then register servant
	adapter_node.on("adapter-ready", function() {
	    var adapter = adapter_node.adapter;
	    var servant = new IBoolI(node);
	    adapter.add(servant, node.addr.replace(":", ""))
		   .then(function(prx) {
		       node.log("servant added, oid: " + prx.ice_getIdentity().name);
		       set_status(node, "ready")
		       register_on_router(prx);
		   })
		   .exception(function(ex) {
		       node.error(ex.toString());
		       set_status(node, "error");
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

    function set_status(node, status) {
	var configs = {
	    ready: {fill: 'green',  shape: 'ring', text: 'ready'},
	    starting: {fill: 'yellow', shape: 'ring', text: 'starting...'},
	    error: {fill: 'red',    shape: 'ring', text: 'error!'},
	};

	node.status(configs[status]);
    }

    RED.nodes.registerType("IBool in", DUOIBoolServerNode);
}
