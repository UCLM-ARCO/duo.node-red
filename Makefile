# -*- mode: makefile-gmake; coding: utf-8 -*-

SLICE_PATH = /usr/share/slice

all:

run: depends
	node-red -v

# NOTE: install locally, because I'm having trouble with global installation
depends: slices
	[ -d node_modules/ice ] || npm install ice

# NOTE: install slice2js with: "sudo npm -g install slice2js"
slices:
	[ -d node_modules ] || mkdir node_modules
	slice2js --output-dir node_modules -I$(SLICE_PATH) $(SLICE_PATH)/duo/duo_idm.ice
	slice2js --output-dir node_modules utils/remote-adapter.ice

	[ -d node_modules/idm ] || mkdir -p node_modules/idm
	slice2js --output-dir node_modules/idm $(SLICE_PATH)/idm/idm.ice

upload: clean
	npm publish

.PHONY: clean
clean:
	$(RM) -vr *~ node_modules
