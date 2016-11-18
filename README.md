This package provides a set of nodes that will add support for IDM on
your Node-RED installation. IDM (Inter Domain Messaging) is a
middleware used to **connect different types of hardware** which uses
different types of communication protocols and technologies.

For example, you can use IDM to receive the temperature of a RS-485
thermostat, and then send a command to a XBee controller that will
switch off the cooling system, and also send a notification to your
Smartphone using the Internet. IDM will handle the problems related to
use three different technologies here (in the example, RS-485, ZigBee
and WiFi/Ethernet, but it is not limited to these).

Along with the IDM nodes, this package also provides a basic set of
data-types' nodes, called *DUO* (bool, byte, int, string, etc). Each
type has two kind of nodes: client and servant. Using the client, you
can send the payload to a remote servant (implemented somewhere: on an
Arduino, a Raspberry Pi, another Node-RED, etc). The servant will
allow you to receive this type of message.

For more information about IDM, see [Infraestructura IoT con
IDM](https://arcoresearchgroup.wordpress.com/2016/09/06/infraestructura-iot-con-idm/).

Installation of dependencies on Debian
======================================

First, set up the APT repository [http://pike.esi.uclm.es](http://pike.esi.uclm.es) using:

    wget -qO- http://pike.esi.uclm.es/add-pike-repo.sh | sudo sh

Now, install the following packages:

    sudo apt-get install idm duo duo-wiring-service

Overview of Nodes
=================

The following is a list of the provided nodes, and its main
features. For a more detailed explanation, see the node 'info' tab on
Node-RED.

`DUO` data types
-----------------

* `IBool client`: it sends the payload (converted to boolean) to the
  configured object (specified by its `IDM address`).

* `IBool servant`: injects a message with the proper `payload` (`true`
  or `false`) when it receives an invocation.

* `IByte client`: it sends the payload (converted to byte, range from
   0 to 255) to the configured object (specified by its `IDM
   address`).

* `IByte servant`: injects a message with the proper `payload` (a
  number, range from 0 to 255) when it receives an invocation.

* `IInt client`: it sends the payload (converted to number) to the
   configured object (specified by its `IDM address`).

* `IInt servant`: injects a message with the proper `payload` (a
  number) when it receives an invocation.

* `IString client`: it sends the payload (as a strig) to the
   configured object (specified by its `IDM address`).

* `IString servant`: injects a message with the proper `payload` (a
  string) when it receives an invocation.

* `Active client`: establish the observer of a `DUO.Active`
  servant. Using the `Active` client, you can attach an observer
  that will be notified about any change. Example: you have an
  `Active` light and you want to know when someone switchs it on or
  off.

* `Active servant`: this is an `Active` servant, you can set an
  observer to it, and it will be notified when a new message (of the
  selected type) arrives.

`IDM` configuration nodes
-------------------------

* `ice-adapter`: this is the object adapter where servant will be
  added. Here, you can specify the endpoints to listen on (for
  example, in TCP: host and port).

* `ice-communicator`: this is the broker object for the
  middleware. Just create one using the default settings.

* `idm-router`: this is the location (as an *Ice Proxy*) of the used
  `IDM` Router. This router will handle the message forwarding through
  your IDM network.

* `duo-wiring-service`: a service that cand handle multiple observer
  setups.

Other useful nodes
------------------

* `toggle in`: a simple toggle button to provide input from the
  Node-RED editor. It does not send a predefinded state, but changes
  its state on each click.

* `toggle out`: a simple widget to show the payload of the last
  message. It changes its status to 'true', if payload can be
  coerced to `true`, otherwise it will show 'false'.
