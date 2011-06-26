# Makefile for stickynotes firefox addon
# make stickynotes.xpi

RS = src/chrome.manifest src/install.rdf
DIR = src/chrome/content
SRC = $(DIR)/overlay.js $(DIR)/overlay.xul $(DIR)/side_bar.xul $(DIR)/side_bar.js $(DIR)/Sidebar.js  $(DIR)/Sticky.js $(DIR)/DAO.js 
TARGET = dist/stickynotes.xpi
DEPLOY_FILE = "C:\Users\hiroki\AppData\Roaming\Mozilla\Firefox\Profiles\nabkjmj3.stickysnotes\extensions\stickynotes@kumabook.com.xpi"

SQLITE = "C:\Users\hiroki\AppData\Roaming\Mozilla\Firefox\Profiles\nabkjmj3.stickysnotes\stickynotes.sqlite"

LOG_DIR = "log/"

UNIT_DIR = "tests/unit/"

UNIT_LOG = unittest.log
UNIT_LOG_SJIS = unittest_sjis.log
LOG_FILES = $(UNIT_LOG)
FF_OPTION = --no-remote -p stickynotes 

JSDOC = tools/jsdoc-toolkit


run: deploy
	firefox $(FF_OPTION)  2>&1 > $(LOG_DIR)\stickynotes_`date +%m%d_%H%M`.log
deploy: compile
	cp $(TARGET) $(DEPLOY_FILE)

compile : $(SRC) $(RS) Makefile
	cd src ; zip -r ../dist/stickynotes.xpi chrome chrome.manifest install.rdf
fixstyle:
	fixjsstyle src/chrome/content/*
doc: $(SRC)
	java -jar $(JSDOC)/jsrun.jar $(JSDOC)/app/run.js  --template=$(JSDOC)/templates/jsdoc --directory=doc src/chrome/content/*.js

unit: deploy 
	firefox $(FF_OPTION)   -uxu-testcase $(UNIT_DIR)  -uxu-log $(UNIT_LOG)  -uxu-priority must
	ruby script/convert.rb  $(UNIT_LOG)
	mv $(UNIT_LOG_SJIS) $(UNIT_LOG)	
	cat $(UNIT_LOG)
#	tools/uxu-utils-0.8.0/fire-test-runner  --named-profile=dev_for_stickynotes --quit "tests/unit/test_test.test.js"

clean: 
	find . -name \*~ -exec rm {} \; 
	rm $(SQLITE)
	rm $(UNIT_LOG)
