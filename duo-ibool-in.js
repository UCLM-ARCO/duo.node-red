_ = console.info.bind(console);

module.exports = function(RED) {

    // load duo_idm.ice
    var Ice = require("ice").Ice;
    var DUO = require("duo_idm").DUO;

    IBoolI = Ice.Class(DUO.IDM.IBool.W, {
	__init__: function(node) {
	    this.node = node;
	},

	set: function(value, source) {
	    _("set called!!!");
	},
    });

    function DUOIBoolServerNode(config) {
 	RED.nodes.createNode(this, config);
 	this.addr = config.addr.toUpperCase();

	var node = this;
 	var router_config = RED.nodes.getNode(config.router);
 	var adapter_config = RED.nodes.getNode(config.adapter);

 	// get adapter and register servant
	var adapter = adapter_config.adapter;
	var servant = new IBoolI(node);
	adapter.add(servant, this.addr);
    }

    RED.nodes.registerType("IBool in", DUOIBoolServerNode);
}
