#!/usr/bin/env python
# -*- mode: python; coding: utf-8 -*-

import sys
import os
import Ice
import time
import json
from argparse import ArgumentParser

pwd = os.path.abspath(os.path.dirname(__file__))
slice_path = os.path.join(pwd, "remote-adapter.ice")
Ice.loadSlice(slice_path)
import Utils


class MessageForwarder(Ice.Blobject):
    def __init__(self, peer, adapter):
        self.peer = peer
        self.adapter = adapter

    def ice_invoke(self, in_params, current):
        try:
            print " - forward to '{} (op: {})'\n".format(
                self.peer.ice_getIdentity().name, current.operation),
            return self.peer.ice_invoke(
                current.operation, current.mode, in_params, current.ctx)
        except Ice.Exception as e:
            msg = "  : ERROR: "
            msg += "> " + str(e).replace("\n", "\n" + " " * len(msg) + "> ")
            print msg + "\n",

            self.discard()
            return True, buffer("")

    def discard(self):
        oid = self.peer.ice_getIdentity()
        print "  : discarding observer ({})...\n".format(oid.name),
        try:
            self.adapter.remove(oid)
        except Ice.NotRegisteredException:
            pass


class RemoteAdapterI(Utils.RemoteAdapter):
    def __init__(self, adapter):
        self.adapter = adapter

    def add(self, peer, current):
        oid = peer.ice_getIdentity()
        peer = current.con.createProxy(oid)
        servant = MessageForwarder(peer, self.adapter)
        print "add object:", oid.name

        try:
            return self.adapter.add(servant, oid)
        except Ice.AlreadyRegisteredException:
            self.adapter.remove(oid)
            return self.adapter.add(servant, oid)


class Server(Ice.Application):
    def run(self, args):
        if not self.parse_args(args):
            return -1

        ic = self.communicator()
        props = ic.getProperties()
        for p in json.loads(self.args.properties):
            k, v = map(str, p.split("="))
            props.setProperty(k, v)

        # NOTE: let the nodejs spawned process to be killed before we start again (on deploy)
        time.sleep(0.5)

        endps = "tcp -h {} -p {}".format(self.args.host, self.args.port)
        adapter = ic.createObjectAdapterWithEndpoints("Adapter", endps)
        adapter.activate()
        adapter.add(RemoteAdapterI(adapter), ic.stringToIdentity("RemoteAdapter"))

        # NOTE: token to notify process is ready, do not modify
        print "ready"
        sys.stdout.flush()

        self.shutdownOnInterrupt()
        ic.waitForShutdown()

    def parse_args(self, args):
        parser = ArgumentParser()
        parser.add_argument("--host", default="0.0.0.0")
        parser.add_argument("--port", type=int, default=12345)
        parser.add_argument("--properties", default='[]')

        try:
            self.args = parser.parse_args(args[1:])
            return True
        except SystemExit:
            return False


if __name__ == '__main__':
    ice_args = [
        "--Ice.ThreadPool.Client.SizeMax=10",
        "--Ice.ThreadPool.Server.SizeMax=10",
        "--Ice.ACM.Server.Close=0",
    ]

    args = sys.argv[:] + ice_args
    Server().main(args)
