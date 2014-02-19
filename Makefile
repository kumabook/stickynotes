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
	FIREFOX_ROOT=/Applications/Firefox.app/Contents/MacOS/
	COMMAND=$(FIREFOX_ROOT)/firefox 
	PROFILE=~/Library/Application\ Support/Firefox/Profiles/stickynotes_dev
	TEST_PROFILE=~/Library/Application\ Support/Firefox/Profiles/stickynotes_test
else 
	PROFILE="C:\Users\hiroki\AppData\Roaming\Mozilla\Firefox\Profiles\nabkjmj3.stickysnotes\"
endif
DEPLOY_FILE = ${PROFILE}/extensions/sticky@filenamezero.dip.jp.xpi
DEPLOY_TEST_FILE = ${TEST_PROFILE}/extensions/stickynotes-test@kumabook.com.xpi

SQLITE = ${PROFILE}/stickynotes.sqlite

LOG_DIR = log/

UNIT_DIR = tests/unit/

UNIT_LOG = unittest.log
UNIT_LOG_SJIS = unittest_sjis.log
LOG_FILES = $(UNIT_LOG)
FF_OPTION = --no-remote -p stickynotes 

JSDOC = tools/jsdoc-toolkit

run: deploy
	${COMMAND} -P stickynotes_dev
createProfile:
	$(COMMAND) -ProfileManager
deploy: compile
	cp $(TARGET) $(DEPLOY_FILE)


compile : $(SRC) $(RS) Makefile
#	cd src ; zip -r ../dist/stickynotes.xpi chrome chrome.manifest install.rdf 
	cd src ; zip -r ../dist/stickynotes.xpi chrome/locale chrome.manifest install.rdf chrome/content/*.js chrome/content/*.xul chrome/content/*.png
fixstyle:
	fixjsstyle src/chrome/content/*
	find tests/chrome/content/ -name "*.js" -and ! -name qunit.js | xargs fixjsstyle ;
doc: $(SRC)
	java -jar $(JSDOC)/jsrun.jar $(JSDOC)/app/run.js  --template=$(JSDOC)/templates/jsdoc --directory=doc src/chrome/content/*.js
test: compile
	cp $(TARGET) ${TEST_PROFILE}/extensions/sticky@filenamezero.dip.jp.xpi
	cd tests ; zip -r ../$(TARGET_TEST) chrome.manifest install.rdf chrome/content/*.js chrome/content/*.xul chrome/qunit
	cp $(TARGET_TEST) $(DEPLOY_TEST_FILE)
	${COMMAND} -P stickynotes_test
#rm $(DEPLOY_TEST_FILE)
clean:
	find . -name \*~ -exec rm {} \; 
	rm $(SQLITE)
	rm $(DEPLOY_FILE)
clean_test: 
	rm $(DEPLOY_TEST_FILE)
