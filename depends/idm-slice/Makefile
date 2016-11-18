# -*- mode: makefile-gmake; coding: utf-8 -*-

SLICE_PATH = /usr/share/slice

all: slices

# NOTE: install slice2js with: "sudo npm -g install slice2js"
slices:
	slice2js -I$(SLICE_PATH) $(SLICE_PATH)/duo/duo_idm.ice
	slice2js -I$(SLICE_PATH) $(SLICE_PATH)/duo/duo_wiring.ice
	slice2js ../../utils/remote-adapter.ice
	slice2js $(SLICE_PATH)/idm/idm.ice

# fix invalid library paths for this package
	sed -i 's/require("idm\/idm")/require("idm-slice\/idm")/g' duo_idm.js

upload: clean slices
	npm --userconfig=~/.npmrc-uclm publish

.PHONY: clean
clean:
	$(RM) -vr *~ duo_idm.js duo_wiring.js idm.js remote-adapter.js
