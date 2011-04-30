// -*- indent-tabs-mode: t -*- 
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
 * The Initial Developer of the Original Code is SHIMODA Hiroshi.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): SHIMODA Hiroshi <shimoda@clear-code.com>
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

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const kUXU_TEST_RUNNING   = 'extensions.uxu.running';

const kSKIP_INITIALIZE_FILE_NAME = '.uxu-skip-restart';

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);

var WindowWatcher;
var WindowManager;
 
function GlobalService() { 
}
GlobalService.prototype = {
	
	classDescription : 'UxUGlobalService', 
	contractID : '@clear-code.com/uxu/startup;1',
	classID : Components.ID('{dd385d40-9e6f-11dd-ad8b-0800200c9a66}'),

	_xpcom_categories : [
		{ category : 'app-startup', service : true }, // -Firefox 3.6
		{ category : 'command-line-handler', entry : 'm-uxu' }
	],

	QueryInterface : XPCOMUtils.generateQI([
		Ci.nsIObserver,
		Ci.nsICommandLineHandler
	]),

	get wrappedJSObject() {
		return this;
	},
 
	get utils() {
		if (!this._utils) {
			let ns = {};
			Components.utils.import('resource://uxu-modules/utils.js', ns);
			this._utils = ns.utils;
		}
		return this._utils;
	},
	_utils : null,
 
	get prefs() {
		if (!this._prefs) {
			let ns = {};
			Components.utils.import('resource://uxu-modules/lib/prefs.js', ns);
			this._prefs = ns.prefs;
		}
		return this._prefs;
	},
	_prefs : null,
 
	get bundle() {
		if (!this._bundle) {
			let ns = {};
			Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
			this._bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');
		}
		return this._bundle;
	},
	_bundle : null,
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				if (!this.listeningProfileAfterChange) {
					ObserverService.addObserver(this, 'profile-after-change', false);
					this.listeningProfileAfterChange = true;
				}
				return;

			case 'profile-after-change':
				if (this.listeningProfileAfterChange) {
					ObserverService.removeObserver(this, 'profile-after-change');
					this.listeningProfileAfterChange = false;
				}
				WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
								.getService(Ci.nsIWindowWatcher);
				WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
								.getService(Ci.nsIWindowMediator);
				Components.utils.import('resource://uxu-modules/lib/CLHHelper.jsm');
				ObserverService.addObserver(this, 'final-ui-startup', false);
				this.upgradePrefs();
				return;

			case 'final-ui-startup':
				ObserverService.removeObserver(this, 'final-ui-startup');
				this.init();
				return;

			case 'uxu-profile-setup':
				this.setUpUXUPrefs(aSubject.QueryInterface(Ci.nsILocalFile));
				return;

			case 'uxu-start-runner-request':
			case 'uxu-start-server-request':
				this.startRunner(aSubject, this.utils.evalInSandbox(aData));
				return;

			case 'uxu-open-config-request':
				this.openConfig(aSubject);
				return;
		}
	},
 
	init : function() 
	{
		this.prefs.setPref(kUXU_TEST_RUNNING, false);

		ObserverService.addObserver(this, 'uxu-profile-setup', false);
		ObserverService.addObserver(this, 'uxu-start-runner-request', false);
		ObserverService.addObserver(this, 'uxu-start-server-request', false);
		ObserverService.addObserver(this, 'uxu-open-config-request', false);

		this.autoStart();
	},
 
	autoStart : function() 
	{
		if (WindowManager.getMostRecentWindow('uxu:runner'))
			return;
		var onetime = this.prefs.getPref('extensions.uxu.runner.autoStart.oneTime.enabled') &&
						this.prefs.getPref('extensions.uxu.runner.autoStart.oneTime');
		if (this.prefs.getPref('extensions.uxu.runner.autoStart') || onetime) {
			let server = onetime ? this.prefs.getPref('extensions.uxu.runner.autoStart.oneTime.server') : false ;
			let port = onetime ? this.prefs.getPref('extensions.uxu.runner.autoStart.oneTime.port') : 0 ;
			this.prefs.setPref('extensions.uxu.runner.autoStart.oneTime', false);
			this.prefs.setPref('extensions.uxu.runner.autoStart.oneTime.server', false);
			this.prefs.setPref('extensions.uxu.runner.autoStart.oneTime.port', 0);
			this.startRunner(null, { server : server, serverPort : port });
		}
	},
 
	restart : function() 
	{
		const startup = Cc['@mozilla.org/toolkit/app-startup;1']
						.getService(Ci.nsIAppStartup);
		startup.quit(startup.eRestart | startup.eAttemptQuit);
	},
 
	confirmRestartToApplyChange : function() 
	{
		PromptService = Cc['@mozilla.org/embedcomp/prompt-service;1']
				.getService(Ci.nsIPromptService);
		if (PromptService.confirmEx(
				null,
				this.bundle.getString('confirm_changePref_restart_title'),
				this.bundle.getString('confirm_changePref_restart_text'),
				Ci.nsIPromptService.BUTTON_TITLE_YES * Ci.nsIPromptService.BUTTON_POS_0 +
				Ci.nsIPromptService.BUTTON_TITLE_NO * Ci.nsIPromptService.BUTTON_POS_1,
				null, null, null, null, {}
			) == 0)
			this.restart();
	},
 
	setUpUXUPrefs : function(aProfile) 
	{
		var skipInitialize = aProfile.clone(true);
		skipInitialize.append(kSKIP_INITIALIZE_FILE_NAME);
		skipInitialize.create(skipInitialize.NORMAL_FILE_TYPE, 0644);

		var userJSFile = aProfile.clone(true);
		userJSFile.append('user.js');
		var userJSContents = '';
		if (userJSFile.exists())
			userJSContents = this.utils.readFrom(userJSFile);

		var lines = [];
		var prefs = <![CDATA[
				bool extensions.uxu.profile.enableDebugOptions
				bool extensions.uxu.profile.disableAutoUpdate
				bool extensions.uxu.profile.disableExitWarning
				bool extensions.uxu.profile.disableCheckDefaultWarning
				int  extensions.uxu.run.timeout
				int  extensions.uxu.run.timeout.application
				int  extensions.uxu.run.history.expire.days
				char extensions.uxu.defaultEncoding
				bool extensions.uxu.showInternalStacks
				char extensions.uxu.priority.important
				char extensions.uxu.priority.high
				char extensions.uxu.priority.normal
				char extensions.uxu.priority.low
				bool extensions.uxu.warnOnNoAssertion
				char extensions.uxu.runner.runMode
				bool extensions.uxu.runner.runParallel
				bool extensions.uxu.runner.autoShowContent
				bool extensions.uxu.runner.coloredDiff
				int  extensions.uxu.port
				bool extensions.uxu.allowAccessesFromRemote
				char extensions.uxu.allowAccessesFromRemote.allowedList
			]]>.toString()
				.replace(/^\s+|\s+$/g, '')
				.split(/\s+/);
		for (var i = 0, maxi = prefs.length; i < maxi; i += 2)
		{
			switch (prefs[i])
			{
				case 'bool':
					lines.push('user_pref("'+prefs[i+1]+'", '+this.prefs.getPref(prefs[i+1])+');');
					break;
				case 'int':
					lines.push('user_pref("'+prefs[i+1]+'", '+this.prefs.getPref(prefs[i+1])+');');
					break;
				case 'char':
					lines.push('user_pref("'+prefs[i+1]+'", "'+this.prefs.getPref(prefs[i+1])+'");');
					break;
			}
		}

		if (this.prefs.getPref('extensions.uxu.profile.enableDebugOptions')) {
			lines.push('user_pref("browser.dom.window.dump.enabled", true);');
			lines.push('user_pref("javascript.options.showInConsole", true);');
		}
		if (this.prefs.getPref('extensions.uxu.profile.disableAutoUpdate')) {
			lines.push('user_pref("app.update.enabled", false);');
			lines.push('user_pref("extensions.update.enabled", false);');
			lines.push('user_pref("browser.search.update", false);');
		}
		if (this.prefs.getPref('extensions.uxu.profile.disableExitWarning')) {
			// Firefox
			lines.push('user_pref("browser.warnOnQuit", false);');
			lines.push('user_pref("browser.warnOnRestart", false);');
		}
		if (this.prefs.getPref('extensions.uxu.profile.disableCheckDefaultWarning')) {
			// Firefox
			lines.push('user_pref("browser.shell.checkDefaultBrowser", false);');
			// Thunderbird
			lines.push('user_pref("mail.shell.checkDefaultClient", false);');
			lines.push('user_pref("mail.shell.checkDefaultMail", false);');
		}

		this.utils.writeTo(userJSContents+'\n'+lines.join('\n')+'\n', userJSFile)
	},
	
	get skipInitializeFile() 
	{
		if (!this._skipInitializeFile) {
			this._skipInitializeFile = this.utils.getFileFromKeyword('ProfDS');
			this._skipInitializeFile.append(kSKIP_INITIALIZE_FILE_NAME);
		}
		return this._skipInitializeFile;
	},
	_skipInitializeFile : null,
  
	openWindow : function(aOwner, aType, aURI, aFeatures, aOptions) 
	{
		var target = WindowManager.getMostRecentWindow(aType);
		if (target) {
			target.focus();
			if ('handleOptions' in target) {
				target.arguments = [aOptions];
				target.handleOptions();
			}
			return;
		}

		if (aOwner) {
			aOwner = aOwner.QueryInterface(Ci.nsIDOMWindow)
						.QueryInterface(Ci.nsIDOMWindowInternal);
			aOwner.openDialog(aURI, '_blank', aFeatures, aOptions);
		}
		else {
			WindowWatcher.openWindow(null, aURI, '_blank', aFeatures, this.utils.toPropertyBag(aOptions));
		}
	},
 
	startRunner : function(aOwner, aOptions) 
	{
		this.openWindow(
			aOwner,
			'uxu:runner',
			'chrome://uxu/content/ui/runner.xul',
			'chrome,all,dialog=no,resizable=yes',
			aOptions
		);
	},
 
	openConfig : function(aOwner) 
	{
		this.openWindow(
			aOwner,
			'uxu:config',
			'chrome://uxu/content/ui/config.xul',
			'chrome,titlebar,toolbar,centerscreen' +
				(this.prefs.getPref('browser.preferences.instantApply') ?
					',dialog=no' :
					',modal'
				),
			null
		);
	},
 
	/* nsICommandLineHandler */ 
	
	handle : function(aCommandLine) 
	{
		var arg = {
				server     : CLHHelper.getBooleanValue('uxu-server', aCommandLine) ||
				             CLHHelper.getBooleanValue('uxu-start-server', aCommandLine),
				serverPort : CLHHelper.getNumericValue('uxu-port', aCommandLine, 0) ||
				             CLHHelper.getNumericValue('uxu-listen-port', aCommandLine, 0),
				testcase   : CLHHelper.getFullPath('uxu-testcase', aCommandLine, '') ||
				             CLHHelper.getFullPath('uxu-test', aCommandLine, '') ||
				             CLHHelper.getFullPath('uxu-run', aCommandLine, ''),
				priority   : CLHHelper.getStringValue('uxu-priority', aCommandLine, null),
				log        : CLHHelper.getFullPath('uxu-log', aCommandLine, ''),
				rawLog     : CLHHelper.getFullPath('uxu-rawlog', aCommandLine, ''),
				hidden     : CLHHelper.getBooleanValue('uxu-hidden', aCommandLine),
				autoQuit   : CLHHelper.getBooleanValue('uxu-autoquit', aCommandLine),
				outputHost : CLHHelper.getStringValue('uxu-output-host', aCommandLine, ''),
				outputPort : CLHHelper.getNumericValue('uxu-output-port', aCommandLine, 0)
			};

		if (
			arg.testcase ||
			arg.server ||
			arg.outputHost ||
			arg.outputPort
			) {
			aCommandLine.preventDefault = true;

			if (arg.testcase &&
				(arg.hidden || arg.log || arg.rawLog)) {
				arg.autoClose = true;
				arg.autoQuit = !WindowManager.getMostRecentWindow(null);
			}

			if (arg.autoQuit &&
				CLHHelper.getBooleanValue('uxu-do-not-quit', aCommandLine))
				arg.autoQuit = false;

			this.startRunner(null, arg);
		}

		if (CLHHelper.getBooleanValue('uxu-quit', aCommandLine)) {
			aCommandLine.preventDefault = true;
			this.utils.quitApplication(true);
		}
	},
 
	get helpInfo() 
	{
		if (!this._helpInfo)
			this._helpInfo =CLHHelper.formatHelpInfo({
				'uxu-server'              : 'Starts UnitTest.XUL Server instead of Firefox.',
				'uxu-start-server'        : 'Aliast for -uxu-server.',
				'uxu-port <port>'         : 'Listening port of UnitTest.XUL Server.',
				'uxu-listen-port <port>'  : 'Alias for -uxu-listen-port.',
				'uxu-output-host <host>'  : 'Output the result of the testcase to the host in raw format.',
				'uxu-output-port <port>'  : 'Listening port of the host specified by the "-uxu-output-host" option.',
				'uxu-testcase <url>'      : 'Run the testcase in UnitTest.XUL.',
				'uxu-test <url>'          : 'Alias for -uxu-testcase.',
				'uxu-run <url>'           : 'Alias for -uxu-testcase.',
				'uxu-priority <priority>' : 'Run all tests in the testcase with the priority.',
				'uxu-log <url>'           : 'Output the result of the testcase.',
				'uxu-rawlog <url>'        : 'Output the result of the testcase in raw format.'
			});
		return this._helpInfo;
	},
	_helpInfo : null,
  
	/* backward compatibility */ 
	
	upgradePrefs : function() 
	{
		this.upgradePrefsInternal(
			'extensions.uxu.mozunit.',
			'extensions.uxu.runner.'
		);
	},
 
	upgradePrefsInternal : function(aOldBase, aNewBase) 
	{
		this.prefs.getDescendant(aOldBase).forEach(function(aPref) {
			var newPref = aPref.replace(aOldBase, aNewBase);
			this.prefs.setPref(newPref, this.prefs.getPref(aPref));
			this.prefs.clearPref(aPref);
		}, this);
	}
  
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([GlobalService]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([GlobalService]);
 
