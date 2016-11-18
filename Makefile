# -*- mode: makefile-gmake; coding: utf-8 -*-

SLICE_PATH = /usr/share/slice

all:

run: depends
	node-red -v

# NOTE: install locally, because I'm having trouble with global installation
install-depends:
	[ -d node_modules/ice ] || npm install ice

upload: clean
	npm --userconfig=~/.npmrc-uclm publish

.PHONY: clean
clean:
	$(RM) -vr *~ node_modules
