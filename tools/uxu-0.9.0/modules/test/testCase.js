/* 
 * Copyright (C) 2006 by Massimiliano Mirra
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301 USA
 *
 * Author: Massimiliano Mirra, <bard [at] hyperstruct [dot] net>
 *
 */

// Modified by SHIMODA Hiroshi <shimoda@clear-code.com>
 
if (typeof window == 'undefined') 
	this.EXPORTED_SYMBOLS = ['TestCase'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/lib/jstimer.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/jsdeferred.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/test/assertions.js', ns);
Components.utils.import('resource://uxu-modules/test/report.js', ns);
Components.utils.import('resource://uxu-modules/server/server.js', ns);
Components.utils.import('resource://uxu-modules/server/utils.js', ns);

var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

var ObserverService = Cc['@mozilla.org/observer-service;1']
					.getService(Ci.nsIObserverService);
 
function _initDB() 
{
	var SCHEME_VERSION_HASH = 1;
	var CURRENT_SCHEME = SCHEME_VERSION_HASH;
	var tableDefinitionSQL = <![CDATA[
		  CREATE TABLE result_history
		    (name        TEXT PRIMARY KEY,
		     description TEXT,
		     result      TEXT,
		     date        DATETIME,
		     hash        TEXT)
		]]>.toString();
	var db = ns.utils.getDB();
	if (!db.tableExists('result_history')) {
		db.executeSimpleSQL(tableDefinitionSQL);
		db.schemaVersion = CURRENT_SCHEME;
	}
	else { // possibly old version, so we have to migrate.
		var currentVersion = 'schemaVersion' in db ? db.schemaVersion : 0 ;
		if (currentVersion < SCHEME_VERSION_HASH) {
			db.executeSimpleSQL('ALTER TABLE result_history ADD hash TEXT');
			db.schemaVersion = SCHEME_VERSION_HASH;
		}
	}
}
try {
	_initDB();
}
catch(e) {
}
 
/**
 * Invocation: 
 *     var case = new TestCase('Widget tests');
 *
 * Alias:
 *     var spec = new Specification();
 *
 */
 
function TestCase(aTitle, aOptions) 
{
	if (!aOptions) aOptions = {};

	this._utils = { __proto__ : ns.utils };

	this.initListeners();

	this._initSource(aOptions);
	this._initRemote(aOptions);

	this._tests = [];
	this._registeredTests = [];
	this._suite           = null;

	this.title          = aTitle;
	this.masterPriority = aOptions.priority || null;
	this.shouldSkip     = aOptions.shouldSkip || false;
	this.context        = aOptions.context;
	this.targetProduct  = aOptions.targetProduct || null;
	this.mapping        = aOptions.mapping || aOptions.redirect || null;

	this.done = false;
	this.aborted = false;
	this.notifications = [];
	this.addListener(this);
}
TestCase.prototype = {
	__proto__ : ns.EventTarget.prototype,
	
	REMOTE_PROFILE_PREFIX : 'uxu-test-profile', 
	TESTCASE_STARTED      : '/* uxu-testcase-started */',
	TESTCASE_FINISED      : '/* uxu-testcase-finished */',
	TESTCASE_ABORTED      : '/* uxu-testcase-aborted */',
	ALL_TESTS_FINISHED    : '/* uxu-all-testcases-finished */',
	PING                  : ' ',
	PING_INTERVAL         : 3000,

	RESULT_SUCCESS : 'success', 
	RESULT_FAILURE : 'failure',
	RESULT_ERROR   : 'error',
	RESULT_SKIPPED : 'skip',

	ERROR_NOT_INITIALIZED : 'test suite is not specified.', 
	ERROR_INVALID_SUITE   : 'test suite must be a TestSuite.',
	ERROR_NO_TEST         : 'there is no test.',
 
	randomOrder : true,
 
	set tests(aHash) {
		this.setTests(aHash);
		return aHash;
	},
	get tests() {
		return this._tests;
	},
	set stateThat(aHash) {
		this.setTests(aHash);
		return aHash;
	},

	get neverRun() {
		return this._equalsToNever(this.masterPriority);
	},

	set suite(aSuite) {
		if (!aSuite) throw new Error(this.ERROR_INVALID_SUITE);
		this._suite = aSuite;
		return aSuite;
	},
	get suite() {
		return this._suite;
	},
 
	set context(aContext) {
		this._context = aContext || {};
		return this._context;
	},
	get context() {
		return this._context;
	},
 
	_initSource : function(aOptions) 
	{
		var source = aOptions.source;
		if (!source || typeof source != 'string') {
			var path;
			var stack = Components.stack;
			while (stack)
			{
				path = stack.filename || '';
				if (path.indexOf('chrome://uxu/content/lib/subScriptRunner.js?') != 0) {
					stack = stack.caller
					continue;
				}
				/.+includeSource=([^;]+)/.test(path);
				source = decodeURIComponent(RegExp.$1);
				break;
			}
		}
		this._source = source;

		this._utils.baseURL = source.replace(/[^\/]*$/, '');
	},

	get source() {
		return this._source;
	},
 
	_initRemote : function(aOptions) 
	{
		var runningProfile = this._utils.getURLSpecFromFile(this._utils.getFileFromKeyword('ProfD'));
		runningProfile = runningProfile.replace(/([^\/])$/, '$1/');
		this._runningProfile = this._utils.getFileFromURLSpec(runningProfile);

		this._profile = null;
		this._application = null;
		this._options = [];

		this.profile = aOptions.profile;
		this.application = aOptions.application;
		this.options = aOptions.options;
	},

	set profile(aValue) {
		this._profile = aValue ? this._utils.normalizeToFile(aValue) : null ;
		if (
			!this._profile ||
			!this._profile.exists() ||
			!this._profile.isDirectory()
			)
			this._profile = null;
		return this._profile;
	},
	get profile() {
		return this._profile;
	},
	get shouldRunInRemote() {
		var tmp = this._utils.getFileFromKeyword('TmpD');
		return this._profile &&
			this._profile.path != this._runningProfile.path &&
			!this._runningProfile.parent.equals(tmp);
	},

	set application(aValue) {
		this._application = aValue ? this._utils.normalizeToFile(aValue) : null ;
		if (
			!this._application ||
			!this._application.exists() ||
			this._application.isDirectory()
			)
			this._application = null;
		return this._application;
	},
	get application() {
		return this._application;
	},

	set options(aValue) {
		this._options = aValue || [];
		if (!this._utils.isArray(aValue)) {
			this._options = [];
		}
		return this._options;
	},
	get options() {
		return this._options;
	},
 
	get done() {
		return this._done;
	},
	set done(aValue) {
		if (!aValue) {
			this._tests.forEach(function(aTest) {
				delete aTest._computedSkip;
			});
			this.aborted = false;
		}
		this._done = aValue;
		return aValue;
	},
	_done : false,
 
	onStart : function() 
	{
		this.addListener(this._suite);
		this._suite.addListener(this);
		if (this.mapping) {
			if (
				!('{3d04c1d0-4e6c-11de-8a39-0800200c9a66}' in Components.classesByID) ||
				(Cc['@mozilla.org/network/protocol;1?name=http'].getService() !=
				 Components.classesByID['{3d04c1d0-4e6c-11de-8a39-0800200c9a66}'].getService()) ||
				!('{b81efa50-4e7d-11de-8a39-0800200c9a66}' in Components.classesByID) ||
				(Cc['@mozilla.org/network/protocol;1?name=https'].getService() !=
				 Components.classesByID['{b81efa50-4e7d-11de-8a39-0800200c9a66}'].getService())
				) {
				this.fireEvent('Error', bundle.getString('error_proxy_disabled_conflict'));
			}
			else {
				ObserverService.addObserver(this , 'uxu-mapping-check', false);
				this._mappingObserverRegistered = true;
			}
		}
	},
 
	onFinish : function() 
	{
		if (this._mappingObserverRegistered) {
			ObserverService.removeObserver(this , 'uxu-mapping-check');
			this._mappingObserverRegistered = false;
		}
		this._suite.removeListener(this);
		this.removeAllListeners();
	},
 
	onAbort : function(aEvent) 
	{
		this.onFinish();
	},
 
	onNotify : function(aEvent) 
	{
		this.notifications.push({
			type    : 'notification',
			message : aEvent.data,
			stack   : this._utils.getStackTrace()
		});
	},
	onWarning : function(aEvent)
	{
		this.notifications.push({
			type    : 'warning',
			message : aEvent.data,
			stack   : this._utils.getStackTrace()
		});
	},
 
// nsIObserver 
	observe : function(aSubject, aTopic, aData)
	{
		if (
			aTopic != 'uxu-mapping-check' ||
			!this.mapping
			)
			return;

		aSubject = aSubject.QueryInterface(Ci.nsISupportsString);

		var currentURI = aSubject.data;
		var newURI = this._utils.mapURI(currentURI, this.mapping);
		if (newURI && newURI != currentURI)
			aSubject.data = newURI;
	},
 
/**
 * Define test cases, optionally with setup and teardown. 
 *
 *     var case = new TestCase();
 *     case.tests = {
 *         setUp: function() {
 *             this.plusFactor = 4;
 *         },
 *
 *         testOperation: function() {
 *             assert.equals(8, 2+2+this.plusFactor);
 *         },
 *
 *         tearDown: function() {
 *             // release resources if necessary
 *         }
 *     }
 *
 * Every test is run in a context created ex-novo and accessible from
 * the test itself via the 'this' identifier.
 *
 * Aliases: setTests(), 'stateThat'.  'setUp' is also aliased to
 * 'given'.  'stateThat' and 'given' allow a more Behaviour-Driven
 * Development style.
 *
 *     var spec = new Specification();
 *     spec.stateThat = {
 *         given: function() {
 *             this.plusFactor = 4;
 *         },
 *
 *         'Adding two and two and plus factor yields eight': function() {
 *             assert.equals(8, 2+2+this.plusFactor);
 *         },
 *
 *         tearDown: function() {
 *             // release resources if necessary
 *         }
 *     }
 */
	
	setTests : function(aHash) 
	{
		this.context = aHash;
		for (var desc in aHash)
		{
			if (typeof aHash[desc] != 'function') continue;
			switch (desc.toLowerCase())
			{
				case 'startup':
				case 'warmup':
					this.registerStartUp(aHash[desc]);
					break;
				case 'shutdown':
				case 'cooldown':
				case 'warmdown':
					this.registerShutDown(aHash[desc]);
					break;
				case 'setup':
				case 'given':
					this.registerSetUp(aHash[desc]);
					break;
				case 'teardown':
					this.registerTearDown(aHash[desc]);
					break;
				default:
					aHash[desc].description = desc;
					this.registerTest(aHash[desc]);
					break;
			}
		}
	},
 
// for UxU declaration style syntax 
	
	registerStartUp : function(aFunction) 
	{
		if (typeof aFunction != 'function') return;
		this._startUp = aFunction;
	},
	// for backward compatibility
	registerWarmUp : function(aFunction) { this.registerStartUp(aFunction); },
 
	registerShutDown : function(aFunction) 
	{
		if (typeof aFunction != 'function') return;
		this._shutDown = aFunction;
	},
	// for backward compatibility
	registerCoolDown : function(aFunction) { this.registerShutDown(aFunction); },
	registerWarmDown : function(aFunction) { this.registerShutDown(aFunction); },
 
	registerSetUp : function(aFunction) 
	{
		if (typeof aFunction != 'function') return;
		this._setUp = aFunction;
	},
 
	registerTearDown : function(aFunction) 
	{
		if (typeof aFunction != 'function') return;
		this._tearDown = aFunction;
	},
 
	registerTest : function(aFunction) 
	{
		if (typeof aFunction != 'function' ||
			this._registeredTests.indexOf(aFunction) > -1)
			return;

		this._normalizeTest(aFunction);

		var parameters = aFunction.parameters;
		if (!parameters) {
			this._registerSingleTest(aFunction);
			return;
		}

		switch (typeof parameters)
		{
			case 'number':
			case 'boolean':
			case 'string':
				parameters = [parameters];
				break;
		}

		if (this._utils.isArray(parameters)) {
			parameters.forEach(function(aParameter, aIndex) {
				this._registerSingleTest(this._createNewTestWithParameter(
					aFunction,
					aParameter,
					' ('+(aIndex+1)+')'
				));
			}, this);
			this._registeredTests.push(aFunction);
		}
		else {
			for (let i in parameters)
			{
				this._registerSingleTest(this._createNewTestWithParameter(
					aFunction,
					parameters[i],
					' ('+i+')'
				));
			}
			this._registeredTests.push(aFunction);
		}
	},
	
	_normalizeTest : function(aFunction) 
	{
		var desc = aFunction.description;
		if (!desc) {
			var source = aFunction.toSource();
			if (source.match(/\(?function\s*([^\(]+)\s*\(/))
				desc = RegExp.$1;
			else
				desc = source.substring(0, 30);
		}
		aFunction.description = desc;

		var privSetUp;
		var privTearDown;
		var shouldSkip;
		for (let i in aFunction)
		{
			if (
				!privSetUp &&
				/^set[uU]p/.test(i) &&
				typeof aFunction[i] == 'function'
				) {
				privSetUp = aFunction[i];
			}
			else if (
				!privTearDown &&
				/^tear[dD]own/.test(i) &&
				typeof aFunction[i] == 'function'
				) {
				privTearDown = aFunction[i];
			}
			else if (
				!shouldSkip &&
				/^should[sS]kip/.test(i)
				) {
				shouldSkip = aFunction[i];
			}
			if (privSetUp && privTearDown && shouldSkip) break;
		}

		aFunction.setUp = privSetUp;
		aFunction.tearDown = privTearDown;
		aFunction.shouldSkip = shouldSkip;

		aFunction.priority = (
				(aFunction.priority === null ||
				 aFunction.priority === void(0) ||
				 typeof aFunction.priority == 'number') ?
					aFunction.priority :
					(String(aFunction.priority || '').toLowerCase() || null)
			);

		aFunction.assertions = aFunction.assertions || aFunction.assertionsCount;
		aFunction.minAssertions = aFunction.minAssertions || aFunction.minAssertionsCount;
		aFunction.maxAssertions = aFunction.maxAssertions || aFunction.maxAssertionsCount;

		aFunction.parameters = aFunction.parameters || aFunction.params;

		return aFunction;
	},
 
	_createNewTestWithParameter : function(aFunction, aParameter, aSuffix) 
	{
		var test = function() {
				return aFunction.call(this, aParameter);
			};

		for (let i in aFunction)
		{
			test[i] = aFunction[i];
		}
		test.description = aFunction.description + aSuffix;
		test.__uxu__original = aFunction;

		var setUp = aFunction.setUp;
		if (setUp) {
			test.setUp = function() {
				return setUp.call(this, aParameter);
			};
			test.setUp.__uxu__original = setUp;
		}

		var tearDown = aFunction.tearDown;
		if (tearDown) {
			test.tearDown = function() {
				return tearDown.call(this, aParameter);
			};
			test.tearDown.__uxu__original = tearDown;
		}

		test.parameter = this._utils.inspect(aParameter);
		test.formattedParameter = this._utils.inspect(aParameter, '  ');

		return test;
	},
 
	_registerSingleTest : function(aFunction) 
	{
		if (this._registeredTests.indexOf(aFunction) > -1)
			return;

		this._registeredTests.push(aFunction);

		var desc = aFunction.description;

		var test = {
			id          : 'test-'+Date.now()+'-'+parseInt(Math.random() * 65000),
			description : desc,
			title       : desc,
			parameter   : aFunction.parameter,
			formattedParameter : aFunction.formattedParameter,

			code          : aFunction,
			priority      : aFunction.priority,
			shouldSkip    : aFunction.shouldSkip,
			targetProduct : aFunction.targetProduct,
			setUp         : aFunction.setUp,
			tearDown      : aFunction.tearDown,
			assertions    : aFunction.assertions,
			minAssertions : aFunction.minAssertions,
			maxAssertions : aFunction.maxAssertions,

			report : null
		};

		var sources = [];

		sources.push(desc);

		if (test.parameter)
			sources.push('parameter:'+test.parameter);

		if (test.setUp)
			sources.push((test.setUp.__uxu__original || test.setUp).toSource());

		sources.push((aFunction.__uxu__original || aFunction).toSource());

		if (test.tearDown)
			sources.push((test.tearDown.__uxu__original || test.tearDown).toSource());

		sources.push('assertions:'+test.assertions);
		sources.push('minAssertions:'+test.minAssertions);

		test.hash = this._utils.computeHash(sources.join('\n'), 'MD5');
		test.name = this._source + '::' + this.title + '::' + (desc || test.hash);

		var db, statement;
		try {
			db = this._utils.getDB();
			statement = db.createStatement(
				  'SELECT result, hash FROM result_history WHERE name = ?1'
				);
			statement.bindStringParameter(0, test.name);
			while (statement.executeStep())
			{
				test.lastResult = statement.getString(0);
				test.lastHash   = statement.getString(1);
			}
		}
		finally {
			statement.reset();
		}

		if (this._equalsToNever(test.priority))
			test.shouldSkip = true;

		this._tests.push(test);
	},
 
	_shuffleTests : function()
	{
		var tests = [];
		while (this._tests.length)
		{
			let index = Math.floor(Math.random() * this._tests.length);
			tests.push(this._tests.splice(index, 1)[0]);
		}
		this._tests = tests;
	},
   
/**
 * Alternative style for defining setup. 
 *
 */
	
	setUp : function(aFunction) 
	{
		this.registerSetUp(aFunction);
	},
 
	tearDown : function(aFunction) 
	{
		this.registerTearDown(aFunction);
	},
 
	test : function(aDescription, aCode) 
	{
		if (typeof aCode != 'function') return;
		aCode.description = aDescription;
		this.registerTest(aCode);
	},
  
// BDD-style alias 
	
/**
 * BDD-alias for setUp(). 
 *
 */
	given : function(aFunction)
	{
		this.setUp(aFunction);
	},
 
/**
 * BDD-style alias for test(). 
 *
 */
	states : function(aDescription, aFunction)
	{
		this.test(aDescription, aFunction);
	},
 
/**
 * BDD-style alias for run(). 
 *
 *    var spec = new Specification();
 *    spec.stateThat = { ... };
 *    spec.verify();
 *
 */
	verify : function()
	{
		this.run();
	},
   
/**
 * Runs tests with strategy defined at construction time. 
 *
 *    var case = new TestCase();
 *    case.tests = { ... };
 *    case.run();
 *
 */
	run : function()
	{
		var stopper = function() {
				stopper.called = true;
			};
		this._stopper = stopper;

		try {
			if (!this.suite) {
				this.done = true;
				throw new Error(this.ERROR_NOT_INITIALIZED);
			}

			if (!this._tests.length) {
				this.done = true;
				throw new Error(this.ERROR_NO_TEST);
			}

			this.done = false;
			this.aborted = false;

			if (this.shouldRunInRemote)
				this._runByRemote();
			else
				this._run();
		}
		catch(e) {
			var report = new ns.Report();
			report.testCase = this;
			report.addTopic({
				result      : this.RESULT_ERROR,
				description : bundle.getString('report_fatal_error'),
				exception   : this._utils.normalizeError(e)
			});
			report.onFinish();
			this.fireEvent('Finish', report);
		}

		return this._stopper;
	},
	_run : function()
	{
		if (
			(
				this.targetProduct &&
				String(this.targetProduct).toLowerCase() != this._utils.product.toLowerCase()
			) ||
			(
				this.shouldSkip &&
				(
					typeof this.shouldSkip != 'function' ||
					this.shouldSkip.call(this.context)
				)
			)
			) {
			this.masterPriority = 'never';
		}

		var testsToBeSkipped = this._tests.filter(function(aTest) {
				if (aTest.targetProduct &&
					String(aTest.targetProduct).toLowerCase() != this._utils.product.toLowerCase())
					return aTest._computedSkip = true;

				if (typeof aTest.shouldSkip == 'function')
					return false;

				if (aTest.shouldSkip)
					return aTest._computedSkip = true;

				return aTest._computedSkip = !this._computeDoOrSkip(aTest);
			}, this);
		var allTestsToBeSkipped = testsToBeSkipped.length == this._tests.length;

		if (this.randomOrder && !allTestsToBeSkipped)
			this._shuffleTests();

		var testIndex = 0;
		var current;
		var testReport;
		var testCaseReport;

		var self = this;
		var states = {
			start : function() {
				self.fireEvent('Start');
				return 'doStartUp';
			},
			doStartUp : function() {
	 			testCaseReport = new ns.Report();
				return allTestsToBeSkipped ? 'prepareTest' :
					self._doSetUpTearDown(
						self._startUp,
						bundle.getFormattedString('report_description_startup', [self.title]),
						testCaseReport,
						'prepareTest'
					);
			},
			prepareTest : function() {
				current = self._tests[testIndex];
				self.fireEvent('TestStart', current);

				self._suite.mockManager.clear();
				self.notifications = [];

				testReport = new ns.Report();
				testReport.id                 = current.name;
				testReport.testCase           = self
				testReport.test               = current;
				testReport.index              = testIndex;
				testReport.description        = current.description;
				testReport.parameter          = current.parameter;
				testReport.formattedParameter = current.formattedParameter;

				var shouldSkip = current.shouldSkip;
				if (typeof shouldSkip == 'function') {
					try {
						shouldSkip = shouldSkip.call(self.context) ||
						             !self._computeDoOrSkip(current);
					}
					catch(e) {
						testReport.addTopic({
							result      : self.RESULT_ERROR,
							description : bundle.getFormattedString('report_description_check_to_skip', [current.description]),
							exception   : self._utils.normalizeError(e)
						});
						shouldSkip = true;
					}
				}
				else {
					shouldSkip = false;
				}
				if (shouldSkip || current._computedSkip) {
					if (!testReport.hasTopic()) {
						testReport.addTopic({
							result      : self.RESULT_SKIPPED,
							description : current.description
						});
					}
					return 'doReport';
				}

				return 'doSetUp';
			},
			doSetUp : function() {
				return self._doSetUpTearDown(
					self._setUp,
					bundle.getFormattedString('report_description_setup', [current.description]),
					testReport,
					'doPrivSetUp',
					'doPrivTearDown'
				);
			},
			doPrivSetUp : function() {
				return !current.setUp ? 'doTest' :
					self._doSetUpTearDown(
						current.setUp,
						bundle.getFormattedString('report_description_priv_setup', [current.description]),
						testReport,
						'doTest',
						'doPrivTearDown'
					);
			},
			doTest : function() {
				ns.Assertions.prototype.resetSuccessCount.call(self.suite.assert._source);
				return self._doTest(current, testReport, 'assertSurelySuccess');
			},
			assertSurelySuccess : function() {
				var next = 'doPrivTearDown';
				if (testReport.lastResult != self.RESULT_SUCCESS)
					return next;

				try {
					self._suite.mockManager.assertAll();
				}
				catch(e) {
					let multiplex = e.name == 'MultiplexError';
					(multiplex ? e.errors : [e] ).forEach(function(e, aIndex) {
						var description = bundle.getFormattedString('report_description_mock', [current.description]);
						if (multiplex)
							description = bundle.getFormattedString('report_description_multiplex', [description, aIndex+1]);
						testReport.addTopic({
							result      : (e.name == 'AssertionFailed') ? self.RESULT_FAILURE : self.RESULT_ERROR,
							description : description,
							exception   : self._utils.normalizeError(e)
						});
					});
					return next;
				}

				try {
					ns.Assertions.prototype.validSuccessCount.call(
						self.suite.assert._source,
						current.assertions,
						current.minAssertions,
						current.maxAssertions
					);
				}
				catch(e) {
					testReport.addTopic({
						result      : (e.name == 'AssertionFailed') ? self.RESULT_FAILURE : self.RESULT_ERROR,
						description : bundle.getFormattedString('report_description_check_success_count', [current.description]),
						exception   : self._utils.normalizeError(e)
					});
					return next;
				}

				return next;
			},
			doPrivTearDown : function() {
				return !current.tearDown ? 'doTearDown' :
					self._doSetUpTearDown(
						current.tearDown,
						bundle.getFormattedString('report_description_priv_teardown', [current.description]),
						testReport,
						'doTearDown'
					);
			},
			doTearDown : function() {
				return self._doSetUpTearDown(
					self._tearDown,
					bundle.getFormattedString('report_description_teardown', [current.description]),
					testReport,
					'doReport'
				);
			},
			doReport : function() {
				current.report = testReport;
				self._saveResult(current, testReport.lastResult);
				testReport.notifications = self.notifications;
				self.notifications = [];
				self.fireEvent('TestFinish', testReport);
				return 'nextTest';
			},
			nextTest : function() {
				if (self._stopper.called) {
					self.aborted = true;
					self.fireEvent('Abort');
				}
				return !self.aborted && self._tests[++testIndex] ?
						'prepareTest' :
						'doShutDown' ;
			},
			doShutDown : function() {
				return allTestsToBeSkipped ? 'finished' :
					self._doSetUpTearDown(
						self._shutDown,
						bundle.getFormattedString('report_description_shutdown', [self.title]),
						testCaseReport,
						'finished'
					);
			},
			finished : function() {
				if (!allTestsToBeSkipped &&
					ns.ServerUtils.prototype.isHttpServerRunning.call(self.suite.serverUtils))
					self._utils.wait(ns.ServerUtils.prototype.tearDownAllHttpServers.call(self.suite.serverUtils));

				if (!self.aborted) {
					self.done = true;
					self.fireEvent('Finish', testCaseReport);
				}
			}
		};

		var iterator = (function(aStates, aCurrent) {
				var interval = this._utils.getPref('dom.max_chrome_script_run_time') * 1000 / 5;
				var start = Date.now();
				while (aCurrent)
				{
					let next = aCurrent();
					if (typeof next == 'function') {
						// wait until the continuation function is called
						while (!next.next)
						{
							yield;
						}
						next = next.next;
					}
					if (!next)
						break;

					// split the loop to prevent "Warning: Unresponsive script" dialog
					let now = Date.now();
					if (now - start >= interval) {
						start = now;
						yield;
					}

					aCurrent = aStates[next];
				}
				// all states are done!
			}).call(this, states, states.start);

		try {
			iterator.next();
			var timer = ns.setInterval(function() {
					try {
						iterator.next();
					}
					catch(e if e instanceof StopIteration) {
						ns.clearInterval(timer);
					}
				}, 1);
		}
		catch(e if e instanceof StopIteration) {
			// finished
		}
	},
	
	_runByRemote : function() 
	{
		if (
			!this._profile ||
			!this._profile.exists() ||
			this.neverRun
			)
			return false;

		if (this.targetProduct &&
			String(this.targetProduct).toLowerCase() != this._utils.product.toLowerCase() &&
			!this._application) {
			var application = this._utils.getInstalledLocationOfProduct(this.targetProduct);
			if (application) {
				this._application = application;
			}
			else {
				return false;
			}
		}

		this.fireEvent('Start');

		var profile = this._utils.getFileFromKeyword('TmpD');
		profile.append(this.REMOTE_PROFILE_PREFIX);
		profile.createUnique(profile.DIRECTORY_TYPE, 0777);
	//	this._profile.copyTo(profile.parent, profile.leafName);
		profile.remove(true);
		this._utils.cosmeticClone(this._profile, profile.parent, profile.leafName);

		// 実行時の優先度計算のために必要
		this._utils.dbFile.copyTo(profile, this._utils.dbFile.leafName);

		if (!this._utils.getPref('extensions.uxu.global')) {
			var extensions = profile.clone();
			extensions.append('extensions');
			if (!extensions.exists()) extensions.create(extensions.DIRECTORY_TYPE, 0777);
			this._utils.installedUXU.copyTo(extensions, this._utils.installedUXU.leafName);
		}

		ObserverService.notifyObservers(profile, 'uxu-profile-setup', null);

		this._remoteResultBuffer = '';
		this._lastRemoteResponse = Date.now();
		this._remoteReady = false;

		var server = new ns.Server();
		server.addListener(this);
		this.addListener(server);
		server.start();

		var args = [
				'-no-remote',
				'-profile',
				profile.path,
				'-uxu-testcase',
				this._source,
				'-uxu-output-host',
				'localhost',
				'-uxu-output-port',
				server.port,
				'-uxu-hidden'
			];
		if (this.masterPriority) {
			args = args.concat(['-uxu-priority', this.masterPriority]);
		}
		args = args.concat(this.options);

		var process = Cc['@mozilla.org/process/util;1']
					.createInstance(Ci.nsIProcess);
		process.init(this._application || this._utils.productExecutable);
		process.run(false, args, args.length);

		var self = this;
		var beforeReadyTimeout = Math.max(0, this._utils.getPref('extensions.uxu.run.timeout.application'));
		var beforeReadyInterval = 500;
		var afterReadyTimeout = this.PING_INTERVAL + Math.max(0, this._utils.getPref('extensions.uxu.run.timeout'));
		var afterReadyInterval = 50;
		var report = new ns.Report();
		this._utils.doIteration(
			function() {
				var last = Date.now();
				var current;
				var timeout;
				var interval;
				while (!self.done)
				{
					timeout = self._remoteReady ? afterReadyTimeout : beforeReadyTimeout ;
					interval = self._remoteReady ? afterReadyInterval : beforeReadyInterval ;
					if (!self.aborted && self._stopper.called) {
						self.aborted = true;
					}
					if (Date.now() - self._lastRemoteResponse > timeout) {
						throw new Error(bundle.getFormattedString('error_remote_timeout', [parseInt(timeout / 1000)]));
					}
					yield interval;
				}
			},
			{
				onEnd : function(e) {
					report.addTopic({
						result : self.RESULT_SUCCESS
					});
					report.onFinish();
					self._onFinishRemoteResult(report);

					server.destroy();
					server = null;
					self._utils.scheduleToRemove(profile);
				},
				onError : function(e) {
					report.addTopic({
						result      : self.RESULT_ERROR,
						description : bundle.getFormattedString('report_description_remote', [self.title]),
						exception   : e
					});
					report.onFinish();
					self._onFinishRemoteResult(report);

					server.destroy();
					server = null;
					self._utils.scheduleToRemove(profile);
				}
			}
		);

		return true;
	},
	
	onServerInput : function(aEvent) 
	{
		this._lastRemoteResponse = Date.now();
		var input = aEvent.data;
		var responseId = '/* '+Date.now()+'-'+parseInt(Math.random() * 65000)+' */';
		if (/[\r\n]+$/.test(input)) {
			if (this._remoteResultBuffer) {
				input = this._remoteResultBuffer + input;
				this._remoteResultBuffer = '';
			}
			input = input.replace(/[\r\n]+$/, '');
		}
		else {
			this._remoteResultBuffer += input;
			return;
		}
		if (this.aborted) {
			this.fireEvent('ResponseRequest', this.TESTCASE_ABORTED+responseId+'\n');
			this.fireEvent('Abort');
			return;
		}
		if (input.indexOf(this.TESTCASE_STARTED) == 0) {
			this._remoteReady = true;
			this.fireEvent('ResponseRequest', responseId+'\n');
			return;
		}
		if (input.indexOf(this.TESTCASE_FINISED) == 0) {
			this.done = true;
			this.fireEvent('ResponseRequest', responseId+'\n');
			return;
		}
		this._onReceiveRemoteResult(input);
		this.fireEvent('ResponseRequest', responseId+'\n');
	},
 
	_onReceiveRemoteResult : function(aResult) 
	{
		var result;
		try {
			result = this._utils.evalInSandbox(aResult);
			result[result.length-1].topics.forEach(function(aTopic) {
				if (aTopic.test)
					this._saveResult(aTopic.test, aTopic.result);
			}, this);
		}
		catch(e) {
			result = [];
		}
		this.fireEvent('RemoteTestFinish', result);
	},
 
	_onFinishRemoteResult : function(aReport) 
	{
		this.done = true;
		if (!this.aborted) {
			this.fireEvent('Finish', aReport);
		}
	},
  
	_doTest : function(aTest, aReport, aNext) 
	{
		aReport.onDetailedStart();
		if (this._stopper.called) {
			aReport.addTopic({
				result : this.RESULT_SKIPPED
			});
			aReport.onDetailedFinish();
			return aNext;
		}

		var self = this;
		var onSuccess = function() {
				aReport.addTopic({
					result      : self.RESULT_SUCCESS,
					description : aTest.description
				});
				self._saveResult(aTest, aReport.result);
			};
		var onError = function(e) {
				var multiplex = e.name == 'MultiplexError';
				(multiplex ? e.errors : [e] ).forEach(function(e, aIndex) {
					var description = aTest.description;
					if (multiplex)
						description = bundle.getFormattedString('report_description_multiplex', [description, aIndex+1]);
					aReport.addTopic({
						result      : (e.name == 'AssertionFailed') ? self.RESULT_FAILURE : self.RESULT_ERROR,
						description : description,
						exception   : self._utils.normalizeError(e)
					});
				});
				self._saveResult(aTest, aReport.result);
			};

		try {
			var result = aTest.code.call(this.context);
			if (this._utils.isGeneratedIterator(result)) {
				var continuation = function() {
						continuation.next = aNext;
					};
				ns.Deferred.next(function() {
					self._utils.doIteration(result, {
						onEnd : function(e) {
							aReport.onDetailedFinish();
							onSuccess();
							continuation();
						},
						onError : function(e) {
							aReport.onDetailedFinish();
							onError(e);
							continuation();
						}
					});
				});
				return continuation;
			}
			onSuccess();
		}
		catch(e) {
			onError(e);
		}

		aReport.onDetailedFinish();
		return aNext;
	},
 
	_doSetUpTearDown : function(aFunction, aDescription, aReport, aSuccess, aFailed) 
	{
		if (!aFailed)
			aFailed = aSuccess;

		if (!aFunction || this.neverRun) {
			aReport.onFinish();
			return aSuccess;
		}

		try {
			var useContinuation = aFunction.arity > 0;
			var continuation = function(aResult) {
					continuation.next = aResult == 'ok' ? aSuccess : aFailed ;
				};
			var result = useContinuation ?
					aFunction.call(this.context, continuation) :
					aFunction.call(this.context);
			if (this._utils.isGeneratedIterator(result)) {
				let self = this;
				this._utils.doIteration(result, {
					onEnd : function(e) {
						aReport.onFinish();
						if (!useContinuation)
							continuation.next = aSuccess;
					},
					onError : function(e) {
						aReport.addTopic({
							result      : self.RESULT_ERROR,
							description : aDescription,
							exception   : self._utils.normalizeError(e)
						});
						aReport.onFinish();
						continuation.next = aFailed;
					}
				});
				return continuation;
			}
			aReport.onFinish();
			return useContinuation ? continuation : aSuccess ;
		}
		catch(e) {
			let multiplex = e.name == 'MultiplexError';
			(multiplex ? e.errors : [e] ).forEach(function(e, aIndex) {
				var description = aDescription;
				if (multiplex)
					description = bundle.getFormattedString('report_description_multiplex', [description, aIndex+1]);
				aReport.addTopic({
					result      : (e.name == 'AssertionFailed') ? this.RESULT_FAILURE : this.RESULT_ERROR,
					description : description,
					exception   : this._utils.normalizeError(e)
				});
			}, this);
			aReport.onFinish();
			return aFailed;
		}
	},
 
	_computeDoOrSkip : function(aTest) 
	{
		var priority = 0.5;
		var forceNever = this._equalsToNever(aTest.priority) || this._equalsToNever(this.masterPriority);
		if (forceNever) {
			priority = 'never';
		}
		else {
			if (this.masterPriority !== null && this.masterPriority !== void(0))
				priority = this.masterPriority;
			if (aTest.priority !== null && aTest.priority !== void(0))
				priority = aTest.priority;
		}

		if (typeof priority == 'number') {
			priority = Math.min(1, Math.max(0, priority));
			switch (priority)
			{
				case 1:
					shouldDo = true;
					break;
				case 0:
					shouldDo = false;
					break;
				default:
					shouldDo = (Math.random() <= priority);
					break;
			}
		}
		else {
			priority = priority.toLowerCase();
			switch (priority)
			{
				case 'must':
					shouldDo = true;
					break;
				case 'never':
					shouldDo = false;
					break;
				default:
					priority = Number(this._utils.getPref('extensions.uxu.priority.'+priority));
					priority = Math.min(1, Math.max(0, priority));
					shouldDo = (Math.random() <= priority);
					break;
			}
		}
		if (
			!shouldDo &&
			!forceNever &&
			(
				(aTest.lastHash != aTest.hash) ||
				(
					aTest.lastResult != this.RESULT_SUCCESS &&
					aTest.lastResult != this.RESULT_SKIPPED
				)
			)
			) {
			shouldDo = true;
		}
		return shouldDo;
	},
	_equalsToNever : function(aPriority)
	{
		return (
			(aPriority == 'never') ||
			(typeof aPriority == 'number' && Math.max(0, aPriority) == 0)
		);
	},
 
	_saveResult : function(aTest, aResult) 
	{
		var db, statement;
		try {
			db = this._utils.getDB();
			statement = db.createStatement(<![CDATA[
			  INSERT OR REPLACE INTO result_history
			          (name, description, result, date, hash)
			    VALUES(?1, ?2, ?3, ?4, ?5)
			]]>.toString());
		}
		catch(e) {
			return;
		}

		try {
			statement.bindStringParameter(0, aTest.name);
			statement.bindStringParameter(1, aTest.description);
			statement.bindStringParameter(2, aResult);
			statement.bindDoubleParameter(3, Date.now());
			statement.bindStringParameter(4, aTest.hash);
			while (statement.executeStep()) {}
		}
		finally {
			statement.reset();
		}

		var days = this._utils.getPref('extensions.uxu.run.history.expire.days');
		if (days < 0) return;

		var cleanUpStatement = db.createStatement('DELETE FROM result_history WHERE date < ?1');
		try {
			cleanUpStatement.bindDoubleParameter(0, Date.now() - (1000 * 60 * 60 * 24 * days));
			while (cleanUpStatement.executeStep()) {}
		}
		finally {
			cleanUpStatement.reset();
		}
	}
   
}; 
 
