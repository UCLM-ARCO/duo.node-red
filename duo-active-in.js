_ = console.info.bind(console);

module.exports = function(RED) {

    // load duo_idm.ice
    var DUO = require("duo_idm").DUO;

    function DUOActiveInputNode(config) {
	RED.nodes.createNode(this, config);
	this.addr = config.addr.toUpperCase();

	var node = this;
	var router_config = RED.nodes.getNode(config.router);
	var ic_config = RED.nodes.getNode(config.ic);
	var ic = ic_config.ic;

	var observer = config.wires[0][0];
	if (observer == undefined) {
	    var msg = "not connected";
	    node.status({fill: "red", shape: "ring", text: msg});
	    return;
	}

	// get proxy to IDM router
	var router_prx = "ROUTER -e 1.0 -o:tcp -h "
		       + router_config.host + " -p " + router_config.port;
	var proxy = ic.stringToProxy(router_prx);

	// create proxy to destination
	var dst_oid = this.addr.replace(":", "");
	dst_oid = ic.stringToIdentity(dst_oid);
	proxy = proxy.ice_identity(dst_oid);

	// cast to DUO.IDM.Active.W
	proxy = DUO.IDM.Active.WPrx.uncheckedCast(proxy);
	this.log(proxy.toString());

	// delay invocation, wait for other nodes to be created
	setTimeout( function() {
	    addr = RED.nodes.getNode(observer).addr;
	    observer = str_to_address(addr);
	    proxy.setObserver(observer)
		 .then(function() {
		     var msg = "observer set";
		     node.status({fill: "green", shape: "ring", text: msg});
		 })
		 .exception(function(ex) {
		     var msg = ex.toString();
		     node.status({fill: "red", shape: "ring", text: msg});
		     node.error(msg);
		 });
	}, 100);
    }

    function str_to_address(s) {
	var fields = s.split(":");
	var addr = [];
	for (var i in fields)
	    addr.push(parseInt(fields[i], 16));
	return new Buffer(addr);
    }

    RED.nodes.registerType("Active in", DUOActiveInputNode);
}
