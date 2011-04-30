// -*- indent-tabs-mode: t; tab-width: 4 -*- 
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is UxU - UnitTest.XUL.
 *
 * The Initial Developer of the Original Code is Kouhei Sutou.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): Kouhei Sutou <kou@clear-code.com>
 *                 SHIMODA Hiroshi <shimoda@clear-code.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['TestRunner'];

const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/lib/jstimer.jsm', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/test/suite.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);
Components.utils.import('resource://uxu-modules/test/log.js', ns);

var utils = ns.utils;
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

const RUNNING = 'extensions.uxu.running';
	
function TestRunner(aOptions/*, aFile, ...*/) 
{
	aOptions = aOptions || {};

	this.initListeners();

	this.runningCount = 0;

	this.files = Array.slice(arguments, 1);
	if (utils.isArray(this.files[0])) this.files = this.files[0];

	this._browser    = aOptions.browser;
	this._envCreator = aOptions.envCreator;
	this._filters = [];
	this._stoppers = [];
	this._log = new ns.TestLog();
}
TestRunner.prototype = {
	__proto__ : ns.EventTarget.prototype,
	
	run : function(aMasterPriority) 
	{
		utils.setPref(RUNNING, true);

		this.runningCount = 0;

		var suites = [];
		this.files.forEach(function(aFile) {
			suites = suites.concat(this.load(aFile));
		}, this);

		var tests = this._collectTestCases(suites);
		if (aMasterPriority !== void(0)) {
			tests.forEach(function(aTest) {
				if (!aTest.neverRun)
					aTest.masterPriority = aMasterPriority;
			});
		}

		this._isProcessing = true;
		this.fireEvent('Start');
		this._runTests(tests);
		this._isProcessing = false;
		if (!tests.length) {
			utils.setPref(RUNNING, false);
			this.fireEvent('Finish');
		}
	},
	
	_collectTestCases : function(aSuites) 
	{
		var tests,
			allTests = [];
		aSuites.forEach(function(suite, aIndex) {
			if (!suite) return;
			try {
				tests = this._getTestsFromSuite(suite);
				if (!tests.length)
					throw new Error(bundle.getFormattedString('error_test_not_found', [suite.fileURL]));

				this._filters.forEach(function(aFilter) {
					tests = tests.filter(aFilter);
				});
				allTests = allTests.concat(tests);
			}
			catch(e) {
				this.fireEvent('Error', utils.normalizeError(e));
			}
		}, this);

		return allTests;
	},
	
	_getTestsFromSuite : function(aSuite) 
	{
		var tests = [];
		var testObjects = { tests : [] };
		var obj;

		var name;
		var env = aSuite.environment;
		for (var i in env)
		{
			if (!env.hasOwnProperty(i) || env.__lookupGetter__(i))
				continue;

			obj = env[i];
			if (!obj)
				continue;

			if (obj.__proto__ == ns.TestCase.prototype) {
				obj.suite = aSuite;
				tests.push(obj);
				continue;
			}

			if (typeof obj != 'function')
				continue;

			// declaration style
			if (/^(start|warm)[uU]p$/.test(i) || obj.isStartUp || obj.isWarmUp)
				testObjects.startUp = obj;
			else if (/^(shut|warm|cool)[dD]own$/.test(i) ||
				obj.isShutDown || obj.isCoolDown || obj.isWarmDown)
				testObjects.shutDown = obj;
			else if (/^set[uU]p$/.test(i) || obj.isSetUp)
				testObjects.setUp = obj;
			else if (/^tear[dD]own$/.test(i) || obj.isTearDown)
				testObjects.tearDown = obj;
			else if (/^test/.test(i) ||
				obj.isTest || obj.description)
				testObjects.tests.push(obj);
		}

		if (testObjects.tests.length) {
			var newTestCase = new ns.TestCase(
					env.description || String(env.fileURL.match(/[^\/]+$/)),
					{
						source        : env.fileURL,
						profile       : env.profile,
						application   : env.application,
						options       : env.options,
						priority      : env.priority,
						shouldSkip    : env.shouldSkip,
						context       : env.testContext,
						targetProduct : env.targetProduct,
						mapping       : env.mapping || env.redirect
					}
				);

			if (testObjects.startUp)
				newTestCase.registerStartUp(testObjects.startUp);
			if (testObjects.shutDown)
				newTestCase.registerShutDown(testObjects.shutDown);
			if (testObjects.setUp)
				newTestCase.registerSetUp(testObjects.setUp);
			if (testObjects.tearDown)
				newTestCase.registerTearDown(testObjects.tearDown);

			testObjects.tests.forEach(function(aTest) {
				newTestCase.registerTest(aTest);
			});

			newTestCase.context = env;
			newTestCase.suite = aSuite;
			tests.push(newTestCase);
		}

		return tests;
	},
  
	_runTests : function(aTests) 
	{
		this._shouldAbort = false;
		this._current     = 0;
		this._testsCount  = aTests.length;

		var self = this;
		this._stoppers = [];
		var runTest = function(aTest) {
				if (self._shouldAbort)
					return true;

				self._current++;
				self.fireEvent('Progress',
					parseInt(((self._current) / (self._testsCount + 1)) * 100));
				try {
					aTest.addListener(self);
					let stopper = aTest.run();
					self._stoppers.push(stopper);
				}
				catch(e) {
					self.fireEvent('Error', utils.normalizeError(e));
				}
				return false;
			};

		if (utils.getPref('extensions.uxu.runner.runParallel')) {
			if (aTests.some(runTest)) {
				this.abort(); // to stop running tests
				this.fireEvent('Abort');
			}
		}
		else {
			var test;
			ns.setTimeout(function() {
				let aborted = false;
				if ((!test || test.done || test.aborted) && aTests.length) {
					test = aTests.shift();
					if (test)
						aborted = runTest(test);
				}
				if (aborted || self._shouldAbort) {
					self.abort(); // to stop running tests
					self.fireEvent('Abort');
				}
				else if (aTests.length) {
					ns.setTimeout(arguments.callee, 100);
				}
			}, 100);
		}
	},
  
	abort : function() 
	{
		this._stoppers.forEach(function(aStopper) {
			if (aStopper && typeof aStopper == 'function')
				aStopper();
		});
		this._shouldAbort = true;
	},
	
	stop : function() 
	{
		this.abort();
	},
  
	isRunning : function() 
	{
		return this.runningCount > 0;
	},
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'Start':
				this.runningCount++;
				this._log.onStart(aEvent);
				this._onTestCaseEvent(aEvent);
				break;

			case 'TestStart':
				this._onTestCaseEvent(aEvent);
				break;

			case 'TestFinish':
				this._log.onTestFinish(aEvent);
				this._onTestCaseEvent(aEvent);
				break;

			case 'RemoteTestFinish':
				this._log.append(aEvent.data);
				this._onTestCaseEvent(aEvent);
				break;

			case 'Finish':
				this._log.onFinish(aEvent);
				this.runningCount--;
				this._onTestCaseEvent(aEvent);
				this._cleanUpModifications(aEvent.target);
				aEvent.target.removeListener(this);
				if (this._current == this._testsCount) {
					utils.setPref(RUNNING, false);
					this.fireEvent('Finish');
				}
				break;

			case 'Abort':
				aEvent.target.removeListener(this);
			case 'Error':
				this._onTestCaseEvent(aEvent);
				utils.setPref(RUNNING, false);
				this.fireEvent(aEvent.type, aEvent.data);
				break;
		}
	},
	_onTestCaseEvent : function(aEvent)
	{
		this.fireEvent('TestCase'+aEvent.type, {
			testCase : aEvent.target,
			data     : aEvent.data,
			log      : this._log
		});
	},
	
	_cleanUpModifications : function(aTestCase) 
	{
		aTestCase.suite.rollbackPrefs();
		aTestCase.suite.rollbackPermissions();
		aTestCase.suite.cleanUpTempFiles(true);
	},
  
	addTestFilter : function(aFilter) 
	{
		if (this._filters.indexOf(aFilter) < 0)
			this._filters.push(aFilter);
	},
 
	removeTestFilter : function(aFilter) 
	{
		var index = this._filters.indexOf(aFilter);
		if (index > -1)
			this._filters.splice(index, 1);
	},
 
	load : function(aFilePath) 
	{
		var file = utils.makeFileWithPath(aFilePath);

		if (file.isDirectory())
			return this.loadFolder(file);
		else
			return [this.loadFile(file)];
	},
	
	loadFolder : function(aFolder) 
	{
		var self = this;
		var filesMayBeTest = this._getTestFiles(aFolder);
		return filesMayBeTest.map(function(aFile) {
				return self.loadFile(aFile);
			});
	},
	
	_getTestFiles : function(aFolder, aIgnoreHiddenFiles) 
	{
		var filesMayBeTest = this._getTestFilesInternal(aFolder, aIgnoreHiddenFiles);
		var nameList = filesMayBeTest.map(function(aFile) {
				return aFile.leafName;
			}).join('\n');
		if (this.testFileNamePattern.test(nameList))
			filesMayBeTest = filesMayBeTest.filter(function(aFile) {
				return this.testFileNamePattern.test(aFile.leafName);
			}, this);
		return filesMayBeTest;
	},
	testFileNamePattern : /\.test\.js$/im,
	unitTestPattern : /\bunit/i,
	functionalTestPattern : /\bfunctional/i,
	integrationTestPattern : /\bintegration/i,
	_getTestFilesInternal : function(aFolder, aIgnoreHiddenFiles)
	{
		var files = aFolder.directoryEntries;
		var file;
		var filesMayBeTest = [];
		if (aIgnoreHiddenFiles === void(0))
			aIgnoreHiddenFiles = utils.getPref('extensions.uxu.run.ignoreHiddenFiles');

		var tests = [];
		var unitTests = [];
		var functionalTests = [];
		var integrationTests = [];
		while (files.hasMoreElements())
		{
			file = files.getNext().QueryInterface(Ci.nsILocalFile);
			if (aIgnoreHiddenFiles &&
				(file.isHidden() || file.leafName.indexOf('.') == 0)) {
				continue;
			}
			if (file.isDirectory()) {
				if (this.unitTestPattern.test(file.leafName)) {
					unitTests.push(file);
					continue;
				}
				else if (this.functionalTestPattern.test(file.leafName)) {
					functionalTests.push(file);
					continue;
				}
				else if (this.integrationTestPattern.test(file.leafName)) {
					integrationTests.push(file);
					continue;
				}
			}
			tests.push(file);
		}

		[
			tests,
			unitTests,
			functionalTests,
			integrationTests
		].forEach(function(aTests) {
			aTests.sort(function(aA, aB) {
				return aA.leafName - aB.leafName;
			});
		});
		tests = tests
				.concat(unitTests)
				.concat(functionalTests)
				.concat(integrationTests);

		tests.forEach(function(aFile) {
			if (aFile.isDirectory()) {
				filesMayBeTest = filesMayBeTest.concat(this._getTestFilesInternal(aFile));
			}
			else if (/\.js$/i.test(aFile.leafName)) {
				filesMayBeTest.push(aFile);
			}
		}, this);
		return filesMayBeTest;
	},
  
	loadFile : function(aFile) 
	{
		var url = utils.getURLSpecFromFilePath(aFile.path);

		try {
			var suite = this._createTestSuite(url);
		}
		catch(e) {
			if (/\.(js|jsm)$/i.test(aFile.leafName))
				this.fireEvent('Error', utils.normalizeError(e));
			suite = null;
		}
		return suite;
	},
	
	_createTestSuite : function(aURL) 
	{
		var suite = new ns.TestSuite({
				envCreator : this._envCreator,
				uri        : aURL,
				browser    : this._browser
			});
		suite.include(suite.fileURL, suite.environment);
		return suite;
	}
   
}; 
   
