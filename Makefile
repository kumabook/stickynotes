# Makefile for stickynotes firefox addon
# make stickynotes.xpi

RS = src/chrome.manifest src/install.rdf
DIR = src/chrome/content
SRC = $(DIR)/overlay.js $(DIR)/overlay.xul $(DIR)/sidebar.xul $(DIR)/sidebar_overlay.js \
$(DIR)/Sidebar.js  $(DIR)/Sticky.js $(DIR)/base.js 
TARGET = dist/stickynotes.xpi
TARGET_TEST = dist/stickynotes-test.xpi


#firefox environment
#change as your os, profile

OS=$(shell uname)
ifeq (${OS}, Darwin)
	FIREFOX_ROOT=/Applications/Devfox.app/Contents/MacOS/
	COMMAND=$(FIREFOX_ROOT)/firefox
	PROFILE=~/Library/Application\ Support/Devfox/Profiles/stickynotes
else 
	PROFILE="C:\Users\hiroki\AppData\Roaming\Mozilla\Firefox\Profiles\nabkjmj3.stickysnotes\"
endif
DEPLOY_FILE = ${PROFILE}/extensions/sticky@filenamezero.dip.jp.xpi
DEPLOY_TEST_FILE = ${PROFILE}/extensions/stickynotes-test@kumabook.com.xpi

SQLITE = ${PROFILE}/stickynotes.sqlite

LOG_DIR = log/

UNIT_DIR = tests/unit/

UNIT_LOG = unittest.log
UNIT_LOG_SJIS = unittest_sjis.log
LOG_FILES = $(UNIT_LOG)
FF_OPTION = --no-remote -p stickynotes 

JSDOC = tools/jsdoc-toolkit

run: deploy
	${COMMAND}
createProfile:
	$(COMMAND) -ProfileManager
deploy: $(TARGET)
deploy: compile
	cp $(TARGET) $(DEPLOY_FILE)

compile : $(SRC) $(RS) Makefile
#	cd src ; zip -r ../dist/stickynotes.xpi chrome chrome.manifest install.rdf 
	cd src ; zip -r ../dist/stickynotes.xpi chrome/locale chrome.manifest install.rdf chrome/content/*.js chrome/content/*.xul
fixstyle:
	fixjsstyle src/chrome/content/*
doc: $(SRC)
	java -jar $(JSDOC)/jsrun.jar $(JSDOC)/app/run.js  --template=$(JSDOC)/templates/jsdoc --directory=doc src/chrome/content/*.js
test: deploy
	cd tests ; zip -r ../dist/stickynotes-test.xpi chrome.manifest install.rdf chrome/content/*.js chrome/content/*.xul chrome/qunit
	cp $(TARGET_TEST) $(DEPLOY_TEST_FILE)
	${COMMAND}
	rm $(DEPLOY_TEST_FILE)
unit: deploy 
	firefox $(FF_OPTION)   -uxu-testcase $(UNIT_DIR)  -uxu-log $(UNIT_LOG)  -uxu-priority must
	ruby script/convert.rb  $(UNIT_LOG)
	mv $(UNIT_LOG_SJIS) $(UNIT_LOG)	
	cat $(UNIT_LOG)
#	tools/uxu-utils-0.8.0/fire-test-runner  --named-profile=dev_for_stickynotes --quit "tests/unit/test_test.test.js"

clean: 
	find . -name \*~ -exec rm {} \; 
	rm $(SQLITE)
	rm $(DEPLOY_TEST_FILE)
