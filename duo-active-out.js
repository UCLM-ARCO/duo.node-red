// -*- coding: utf-8 -*-

_ = console.info.bind(console);

var Ice = require("ice").Ice;
var DUO = require("duo_idm").DUO;

module.exports = function(RED) {

    ActiveWI = Ice.Class(DUO.IDM.Active.W, {
	__init__: function(node) {
	    this.node =  node;
	    this.observer = null;

	    // FIXME: if observer is set by config, create proxy to it
	},

	setObserver: function(addr) {
	    _("call to setObserver");
	    // FIXME:  - get observer proxy using addr and router
	    // FIXME:  - update settings with new observer
	    // FIXME:  - cast msg.payload to proper type
	},
    });

    function DUOActiveOutputNode(config) {
 	var node = this;
 	RED.nodes.createNode(this, config);
	node.addr = config.addr.toUpperCase();
	node.observer_type = config.observer_type;

	var status_ready =    {fill: 'green',  shape: 'ring', text: 'ready'};
	var status_starting = {fill: 'yellow', shape: 'ring', text: 'starting...'};
	var status_error =    {fill: 'red',    shape: 'ring', text: 'error!'};
	node.status(status_starting);

 	var router_config = RED.nodes.getNode(config.router);
 	var adapter_node = RED.nodes.getNode(config.adapter);

	var servant;
	adapter_node.on("adapter-ready", function() {
	    var adapter = adapter_node.adapter;
	    servant = new ActiveWI(node);
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

	node.on('input', function(msg) {
	    if (! servant.observer) {
		node.warn("Observer not set, nothing to do");
		return;
	    }

	    var value = cast_payload(msg.payload);
	    if (value === undefined)
		return;

	    servant.observer.set(value, "")
		 .then(function() { node.log(node.observer + ".set called"); })
		 .exception(function(e) { node.error("ERROR: " + e.toString()); });
	});

	function register_on_router(prx) {
	    prx = prx.ice_oneway().toString();
	    var ic = adapter_node.get_communicator();
	    var router = router_config.get_proxy(ic);
	    router.adv(prx)
		  .exception(function(ex) {
		      node.error(ex.toString());
		  });
	}

	function cast_payload(value) {
	    _(node.observer_type);
	    switch (node.observer_type) {
		case "ibool":
		    return value.toString().toLowerCase().trim() == "true";

		case "iint":
		    value = parseInt(value);
		    if (isNaN(value)) {
			node.warn("Invalid input: " + msg.payload);
			return;
		    }
		    return value;

		case "istring":
		    return value.toString();

		default:
		    node.error("Unknown observer type!");
	    };
	}
    }

    RED.nodes.registerType("Active out", DUOActiveOutputNode);
}
