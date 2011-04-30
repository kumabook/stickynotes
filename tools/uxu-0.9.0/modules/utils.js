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

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['utils', 'Utils'];
	
const Cc = Components.classes; 
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/lib/prefs.js', ns);
Components.utils.import('resource://uxu-modules/lib/encoding.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/textIO.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/primitive.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/ejs.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/hash.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/registry.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/extensions.js', ns);
Components.utils.import('resource://uxu-modules/lib/jstimer.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/jsdeferred.js', ns);

var prefread = {};
Components.utils.import('resource://uxu-modules/prefread.js', prefread);
prefread = prefread.prefread;

var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

const IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);

var Application = '@mozilla.org/fuel/application;1' in Cc ?
			Cc['@mozilla.org/fuel/application;1'].getService(Ci.fuelIApplication) :
		'@mozilla.org/steel/application;1' in Cc ?
			Cc['@mozilla.org/steel/application;1'].getService(Ci.steelIApplication) :
			null ;

var PermissionManager = '@mozilla.org/permissionmanager;1' in Cc ?
		Cc['@mozilla.org/permissionmanager;1'].getService(Ci.nsIPermissionManager) :
		null ;

const isThreadManagerAvailable = '@mozilla.org/thread-manager;1' in Cc;

var _db = null;
 
function Utils() 
{
	this.tempFiles = [];
	this.backupPrefs = {};
	this.backupPermissions = {};
}
Utils.prototype = {
	
evalInSandbox : function(aCode, aOwner) 
{
	try {
		var sandbox = new Components.utils.Sandbox(aOwner || 'about:blank');
		return Components.utils.evalInSandbox(aCode, sandbox);
	}
	catch(e) {
	}
	return void(0);
},
 
// DOMノード取得 
	
_getDocument : function(aOwner) 
{
	var doc = !aOwner ?
				null :
			aOwner instanceof Ci.nsIDOMDocument ?
				aOwner :
			aOwner instanceof Ci.nsIDOMNode ?
				aOwner.ownerDocument :
			aOwner instanceof Ci.nsIDOMWindow ?
				aOwner.document :
				null;
	if (!doc) throw new Error(bundle.getFormattedString('error_utils_invalid_owner', [aOwner]));
	return doc;
},
 
$ : function(aNodeOrID, aOwner) 
{
	if (typeof aNodeOrID == 'string') {
		var doc = this._getDocument(aOwner);
		return doc.getElementById(aNodeOrID);
	}
	return aNodeOrID;
},
 
// http://lowreal.net/logs/2006/03/16/1
$X : function() 
{
	if (!arguments || !arguments.length)
		throw new Error(bundle.getString('error_utils_no_xpath_expression'));

	var expression = null,
		context    = null,
		resolver   = null,
		type       = null;
	arguments = Array.slice(arguments);
	switch (arguments.length)
	{
		case 1:
			[expression] = arguments;
			break;
		case 2:
			[expression, context] = arguments;
			break;
		case 3:
			[expression, context, type] = arguments;
			break;
		default:
			[expression, context, resolver, type] = arguments;
			break;
	}

	if (!expression) throw new Error(bundle.getString('error_utils_no_xpath_expression'));

	var doc = this._getDocument(context);
	if (!context) context = doc;

	var result = doc.evaluate(
			expression,
			context,
			resolver,
			type || Ci.nsIDOMXPathResult.ANY_TYPE,
			null
		);
	switch (type || result.resultType)
	{
		case Ci.nsIDOMXPathResult.STRING_TYPE:
			return result.stringValue;
		case Ci.nsIDOMXPathResult.NUMBER_TYPE:
			return result.numberValue;
		case Ci.nsIDOMXPathResult.BOOLEAN_TYPE:
			return result.booleanValue;
		case Ci.nsIDOMXPathResult.UNORDERED_NODE_ITERATOR_TYPE:
		case Ci.nsIDOMXPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
		case Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE:
			result = doc.evaluate(
				expression,
				context,
				resolver,
				Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
		case Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
			var nodes = [];
			for (let i = 0, maxi = result.snapshotLength; i < maxi; i++)
			{
				nodes.push(result.snapshotItem(i));
			}
			return nodes;
		case Ci.nsIDOMXPathResult.ANY_UNORDERED_NODE_TYPE:
		case Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE:
			return result.singleNodeValue;
	}
	return null;
},
 
exportToDocument : function(aDOMDocument) 
{
	var self = this;
	aDOMDocument.defaultView.$ = function(aNodeOrID, aOwner) {
		return self.$(aNodeOrID, aOwner || aDOMDocument);
	};
	aDOMDocument.defaultView.$X = function() {
		var args = Array.slice(arguments);
		if (args.every(function(aArg) {
				try {
					return !self._getDocument(aArg)
				}
				catch(e) {
					return true;
				}
			}))
			args.splice(1, 0, aDOMDocument);
		return self.$X.apply(self, args);
	};
},
  
// タイマー操作 
	
// http://d.hatena.ne.jp/fls/20090224/p1
sleep : function(aWait) 
{
	if (!isThreadManagerAvailable)
		throw new Error(bundle.getString('error_utils_sleep_is_not_available'));
	this.wait(aWait);
},
 
wait : function(aWaitCondition) 
{
	if (!isThreadManagerAvailable)
		throw new Error(bundle.getString('error_utils_wait_is_not_available'));

	if (
		arguments.length > 1 &&
		Array.slice(arguments).some(function(aArg) {
			return aArg instanceof Ci.nsIDOMEventTarget;
		})
		)
		return this.waitDOMEvent.apply(this, arguments);

	if (!aWaitCondition) aWaitCondition = 0;

	var finished = { value : false };
	switch (typeof aWaitCondition)
	{
		default:
			aWaitCondition = Number(aWaitCondition);
			if (isNaN(aWaitCondition))
				aWaitCondition = 0;

		case 'number':
			if (aWaitCondition < 0)
				throw new Error(bundle.getFormattedString('error_utils_wait_unknown_condition', [String(aWaitCondition)]));

			var timer = ns.setTimeout(function() {
					finished.value = true;
					ns.clearTimeout(timer);
				}, aWaitCondition);
			break;

		case 'function':
			var retVal = aWaitCondition();
			if (this.isGeneratedIterator(retVal)) {
				finished = this.doIteration(retVal);
			}
			else if (retVal) {
				finished.value = true;
			}
			else {
				let timer = ns.setInterval(function() {
						finished.value = aWaitCondition();
						if (finished.value)
							ns.clearInterval(timer);
					}, 10);
			}
			break;

		case 'object':
			if (this.isGeneratedIterator(aWaitCondition)) {
				finished = this.doIteration(aWaitCondition);
			}
			else if (this.isDeferred(aWaitCondition)) {
				if (aWaitCondition.fired)
					return;
				aWaitCondition
					.next(function() {
						finished.value = true;
					})
					.error(function() {
						finished.value = true;
					});
			}
			else {
				if (!aWaitCondition || !('value' in aWaitCondition))
					throw new Error(bundle.getFormattedString('error_utils_wait_unknown_condition', [String(aWaitCondition)]));
				finished = aWaitCondition;
			}
			break;
	}

	var lastRun = Date.now();
	var timeout = Math.max(0, this.getPref('extensions.uxu.run.timeout'));
	var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
	while (!finished.value)
	{
		thread.processNextEvent(true);
		if (Date.now() - lastRun >= timeout)
			throw new Error(bundle.getFormattedString('error_utils_wait_timeout', [parseInt(timeout / 1000)]));
	}
},
 
waitDOMEvent : function() 
{
	var args = Array.slice(arguments);
	var callbacks = [];
	var timeout = 10 * 1000;
	args = args.filter(function(aArg) {
			switch (typeof aArg)
			{
				case 'function':
					callbacks.push(aArg);
					return false;
				case 'number':
					timeout = aArg;
					return false;
				default:
					return true;
			}
		});

	var definitions = [];
	for (let i = 0, count = args.length; i < count; i += 2)
	{
		let [target, conditions] = [args[i], args[i+1]];
		if (conditions instanceof Ci.nsIDOMEventTarget)
			[target, conditions] = [conditions, target];
		let definition = { target : target };

		if (typeof conditions == 'object' &&
			'type' in conditions &&
			typeof conditions.type == 'string') {
			definition.type = conditions.type;
			definition.conditions = conditions;
		}
		else if (typeof conditions == 'string') {
			definition.type = conditions;
		}

		if (!definition.type)
			continue;

		definitions.push(definition);
	}

	var TIMEOUT = 'UxUWaitDOMEventTimeout';

	var fired = { value : false };
	var listener = function(aEvent) {
			if (
				aEvent.type != TIMEOUT &&
				!definitions.some(function(aDefinition) {
					if (aDefinition.conditions) {
						for (let i in aDefinition.conditions)
						{
							if (i != 'capture' &&
								aEvent[i] != aDefinition.conditions[i])
								return false;
						}
						return true;
					}
					else {
						return aDefinition.type == aEvent.type;
					}
				})
				)
				return;

			if (timer) ns.clearTimeout(timer);

			definitions.forEach(function(aDefinition) {
				aDefinition.target.removeEventListener(aDefinition.type, listener, aDefinition.capture || false);
			});
			fired.event = aEvent;
			fired.value = true;

			if (callbacks.length)
				callbacks.forEach(function(aCallback) {
					aCallback(aEvent);
				});
		};

	definitions.forEach(function(aDefinition) {
		aDefinition.target.addEventListener(aDefinition.type, listener, aDefinition.capture || false);
	});

	var timer = ns.setTimeout(function() {
			timer = null;
			listener({
				type           : TIMEOUT,
				timeout        : timeout,
				target         : null,
				originalTarget : null
			});
		}, timeout);

	if (!callbacks.length)
		this.wait(fired);

	return fired;
},
waitDOMEvents : function() { return this.waitDOMEvent.apply(this, arguments); },
  
// ファイル操作 
	
normalizeToFile : function(aFile) 
{
	if (typeof aFile == 'string') {
		aFile = this.fixupIncompleteURI(aFile);
		if (aFile.match(/^\w+:\/\//))
			aFile = this.makeURIFromSpec(aFile);
		else
			aFile = this.makeFileWithPath(aFile);
	}
	try {
		aFile = aFile.QueryInterface(Ci.nsILocalFile)
	}
	catch(e) {
		aFile = aFile.QueryInterface(Ci.nsIURI);
		aFile = this.getFileFromURLSpec(aFile.spec);
	}
	return aFile;
},
 
// URI文字列からnsIURIのオブジェクトを生成 
makeURIFromSpec : function(aURI)
{
	try {
		var newURI;
		aURI = aURI || '';
		if (aURI && aURI.match(/^file:/)) {
			var fileHandler = IOService.getProtocolHandler('file')
								.QueryInterface(Ci.nsIFileProtocolHandler);
			var tempLocalFile = fileHandler.getFileFromURLSpec(aURI);

			newURI = IOService.newFileURI(tempLocalFile);
		}
		else {
			newURI = IOService.newURI(aURI, null, null);
		}

		return newURI;
	}
	catch(e){
	}
	return null;
},
 
getRealURL : function(aURI) 
{
	if (typeof aURI == 'string')
		aURI = this.makeURIFromSpec(aURI);
	if (aURI.schemeIs('chrome')) {
		return Cc['@mozilla.org/chrome/chrome-registry;1']
				.getService(Ci.nsIChromeRegistry)
				.convertChromeURL(aURI);
	}
	return null;
},
 
getRealURLSpec : function(aURI) 
{
	var url = this.getRealURL(aURI);
	return url ? url.spec : '' ;
},
 
makeFileWithPath : function(aPath) 
{
	var newFile = Cc['@mozilla.org/file/local;1']
					.createInstance(Ci.nsILocalFile);
	newFile.initWithPath(aPath);
	return newFile;
},
getFileFromPath : function(aPath) // alias
{
	return this.makeFileWithPath(aPath);
},
 
// URL→ファイル 
	
getFileFromURL : function(aURI) 
{
	return this.getFileFromURLSpec(aURI.spec);
},
 
getFileFromURLSpec : function(aURI) 
{
	if (!aURI)
		aURI = '';

	if (aURI.indexOf('chrome://') == 0)
		aURI = this.getRealURLSpec(aURI);

	if (aURI.indexOf('file://') != 0) return null;

	var fileHandler = IOService.getProtocolHandler('file')
						.QueryInterface(Ci.nsIFileProtocolHandler);
	return fileHandler.getFileFromURLSpec(aURI);
},
 
getFilePathFromURL : function(aURI) 
{
	return this.getFileFromURLSpec(aURI.spec).path;
},
 
getFilePathFromURLSpec : function(aURI) 
{
	return this.getFileFromURLSpec(aURI).path;
},
  
// キーワード→ファイル 
	
getFileFromKeyword : function(aKeyword) 
{
	try {
		const DirectoryService = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties);
		return DirectoryService.get(aKeyword, Ci.nsIFile);
	}
	catch(e) {
	}
	return null;
},
 
getFilePathFromKeyword : function(aKeyword) 
{
	var file = this.getFileFromKeyword(aKeyword);
	return file ? file.path : null ;
},
  
// ファイル→URL 
	
getURLFromFile : function(aFile) 
{
	return IOService.newFileURI(aFile);
},
 
getURLFromFilePath : function(aPath) 
{
	var tempLocalFile = this.makeFileWithPath(aPath);
	return this.getURLFromFile(tempLocalFile);
},
 
getURLSpecFromFile : function(aFile) 
{
	return IOService.newFileURI(aFile).spec;
},
 
getURLSpecFromFilePath : function(aPath) 
{
	return this.getURLFromFilePath(aPath).spec;
},
  
// ファイルまたはURIで示された先のリソースを読み込み、文字列として返す 
readFrom : function(aTarget, aEncoding)
{
	var target = aTarget;
	if (!target || !(target instanceof Ci.nsIURI)) {
		target = this.normalizeToFile(target);
		if (!target)
			throw new Error(bundle.getFormattedString('error_utils_read_from', [aTarget]));
	}
	return ns.textIO.readFrom(target, aEncoding);
},
 
// ファイルパスまたはURLで示された先のテキストファイルに文字列を書き出す 
writeTo : function(aContent, aTarget, aEncoding)
{
	target = this.normalizeToFile(aTarget);
	if (!target)
		throw new Error(bundle.getFormattedString('error_utils_write_to', [aTarget]));

	// create directories
	(function(aDir) {
		try {
			if (aDir.parent) arguments.callee(aDir.parent);
			if (aDir.exists()) return;
			aDir.create(aDir.DIRECTORY_TYPE, 0755);
		}
		catch(e) {
		}
	})(target.parent);

	var tempFile = this.getFileFromKeyword('TmpD');
	tempFile.append(target.localName+'.writing');
	tempFile.createUnique(tempFile.NORMAL_FILE_TYPE, 0666);

	ns.textIO.writeTo(aContent, tempFile, aEncoding);

	if (target.exists()) target.remove(true);
	tempFile.moveTo(target.parent, target.leafName);

	return target;
},
 
readCSV : function(aTarget, aEncoding, aScope, aDelimiter) 
{
	var input = this.readFrom(aTarget, aEncoding || this.getPref('extensions.uxu.defaultEncoding'));
	if (aScope) input = this.processTemplate(input, aScope);
	return this.parseCSV(input, aDelimiter);
},
 
readTSV : function(aTarget, aEncoding, aScope) 
{
	return this.readCSV(aTarget, aEncoding, aScope, '\t');
},
 
readParametersFromCSV : function(aTarget, aEncoding, aScope) 
{
	return this._parseParametersFrom2DArray(this.readCSV(aTarget, aEncoding, aScope));
},
readParameterFromCSV : function() { return this.readParametersFromCSV.apply(this, arguments); },
readParamsFromCSV : function() { return this.readParametersFromCSV.apply(this, arguments); },
readParamFromCSV : function() { return this.readParametersFromCSV.apply(this, arguments); },
 
readParametersFromTSV : function(aTarget, aEncoding, aScope) 
{
	return this._parseParametersFrom2DArray(this.readTSV(aTarget, aEncoding, aScope));
},
readParameterFromTSV : function() { return this.readParametersFromTSV.apply(this, arguments); },
readParamsFromTSV : function() { return this.readParametersFromTSV.apply(this, arguments); },
readParamFromTSV : function() { return this.readParametersFromTSV.apply(this, arguments); },
 
readJSON : function(aTarget, aEncoding, aScope) 
{
	var input = this.readFrom(aTarget, aEncoding || this.getPref('extensions.uxu.defaultEncoding'));
	if (aScope) input = this.processTemplate(input, aScope);
	try {
		input = this.evalInSandbox('('+input+')');
	}
	catch(e) {
		throw new Error(bundle.getFormattedString('error_utils_readJSON_error', [e]));
	}
	return input;
},
 
// Subversionが作る不可視のファイルなどを除外して、普通に目に見えるファイルだけを複製する 
cosmeticClone : function(aOriginal, aDest, aName, aInternalCall)
{
	var orig = this.normalizeToFile(aOriginal);
	var dest = this.normalizeToFile(aDest);

	if (!orig)
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_no_original', [aOriginal]));
	if (!orig.exists())
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_original_not_exists', [orig.path]));
	if (orig.isHidden() || orig.leafName.indexOf('.') == 0) {
		if (!aInternalCall)
			throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_original_hidden', [orig.path]));
		return;
	}

	if (!dest)
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_no_dest', [aDest]));
	if (!dest.exists())
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_dest_not_exist', [dest.path]));
	if (!dest.isDirectory())
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_dest_not_folder', [dest.path]));

	if (!aName) aName = orig.leafName;

	var destFile = dest.clone();
	destFile.append(aName);
	if (destFile.exists())
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_duplicate', [destFile.path]));

	if (orig.isDirectory()) {
		destFile.create(destFile.DIRECTORY_TYPE, 0777);

		var files = orig.directoryEntries;
		var file;
		while (files.hasMoreElements())
		{
			file = files.getNext().QueryInterface(Ci.nsILocalFile);
			arguments.callee.call(this, file, destFile, file.leafName, true);
		}
		return destFile;
	}
	else {
		orig.copyTo(dest, aName);
		return destFile;
	}
},
 
// 遅延削除 
	
scheduleToRemove : function(aFile) 
{
	if (!this.scheduledFiles) this.scheduledFiles = {};
	aFile = this.normalizeToFile(aFile);
	if (aFile.path in this.scheduledFiles) return;

	this.scheduledFiles[aFile.path] = {
		file     : aFile,
		count    : 0
	};

	if (!this.scheduledRemoveTimer)
		this.startScheduledRemove(this);
},
 
startScheduledRemove : function(aSelf) 
{
	if (!aSelf) aSelf = this;
	if (aSelf.scheduledRemoveTimer) aSelf.stopScheduledRemove();
	aSelf.scheduledRemoveTimer = ns.setTimeout(function(aSelf) {
		if (aSelf.scheduledFiles) {
			var incomplete = false;
			var incompleted = {};
			for (var i in aSelf.scheduledFiles)
			{
				schedule = aSelf.scheduledFiles[i];
				try {
					if (schedule.count < 100)
						schedule.file.remove(true);
				}
				catch(e) {
					incomplete = true;
					incompleted[i] = schedule;
					schedule.count++;
				}
			}
			if (incomplete) {
				aSelf.scheduledFiles = incompleted;
				aSelf.scheduledRemoveTimer = ns.setTimeout(arguments.callee, 500, aSelf)
				return;
			}
			aSelf.scheduledFiles = {};
		}
		aSelf.stopScheduledRemove();
		// aSelf.scheduledRemoveTimer = ns.setTimeout(arguments.callee, 5000, aSelf)
	}, 5000, aSelf);
},
 
stopScheduledRemove : function() 
{
	if (!this.scheduledRemoveTimer) return;
	ns.clearTimeout(this.scheduledRemoveTimer);
	this.scheduledRemoveTimer = null;
},
  
include : function(aSource, aEncoding, aScope) 
{
	var allowOverrideConstants = false;

	if (aSource &&
		aEncoding === void(0) &&
		aScope === void(0) &&
		typeof aSource == 'object') { // hash style options
		let options = aSource;
		aSource = options.source || options.uri || options.url ;
		aEncoding = options.encoding || options.charset;
		aScope = options.scope || options.namespace || options.ns;
		allowOverrideConstants = options.allowOverrideConstants;
	}
	else if (typeof aEncoding == 'object') { // for backward compatibility
		let scope = aEncoding;
		aEncoding = aScope;
		aScope = scope;
	}

	aSource = this.fixupIncompleteURI(aSource);
	var encoding = aEncoding || this.getDocumentEncoding(aSource) || this.getPref('extensions.uxu.defaultEncoding');
	var script;
	try {
		script = this.readFrom(aSource, encoding) || '';
		if (allowOverrideConstants)
			script = script.replace(/^\bconst\s+/gm, 'var ');
	}
	catch(e) {
		throw new Error(bundle.getFormattedString('error_utils_include', [e]));
	}
	aScope = aScope || {};
	aScope._lastEvaluatedScript = script;
	Cc['@mozilla.org/moz/jssubscript-loader;1']
		.getService(Ci.mozIJSSubScriptLoader)
		.loadSubScript(
			'chrome://uxu/content/lib/subScriptRunner.js?includeSource='+
				encodeURIComponent(aSource)+
				';encoding='+encoding,
			aScope
		);
	return script;
},
 
// for JavaScript code modules
import : function(aSource, aScope) 
{
	var global = {};
	this.include(aSource, global);
	if (aScope && 'EXPORTED_SYMBOLS' in global) {
		for (var i in global.EXPORTED_SYMBOLS)
		{
			aScope[i] = global[i];
		}
	}
	return global;
},
 
// テンポラリファイル 
	
makeTempFile : function(aOriginal, aCosmetic) 
{
	var temp = this.getFileFromKeyword('TmpD');
	if (aOriginal) {
		if (typeof aOriginal == 'string') {
			try {
				var resolved = this.fixupIncompleteURI(aOriginal);
				if (resolved.match(/^\w+:\/\//))
					aOriginal = this.makeURIFromSpec(resolved);
				else
					aOriginal = this.makeFileWithPath(resolved);
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_invalid_original_file', [aOriginal]));
			}
		}
		try {
			aOriginal = aOriginal.QueryInterface(Ci.nsILocalFile)
		}
		catch(e) {
			try {
				aOriginal = this.getFileFromURLSpec(aOriginal.spec);
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_invalid_original_file', [aOriginal]));
			}
		}
		temp.append(aOriginal.leafName + '.tmp');
		temp.createUnique(
			(aOriginal.isDirectory() ? temp.DIRECTORY_TYPE : temp.NORMAL_FILE_TYPE ),
			(aOriginal.isDirectory() ? 0777 : 0666)
		);
		temp.remove(true);

		if (aCosmetic)
			this.cosmeticClone(aOriginal, temp.parent, temp.leafName);
		else
			aOriginal.copyTo(temp.parent, temp.leafName);

		this.tempFiles.push(temp);
		return temp;
	}
	else {
		temp.append('uxu.tmp');
		temp.createUnique(temp.NORMAL_FILE_TYPE, 0666);
		this.tempFiles.push(temp);
		return temp;
	}
},
createTempFile : function() { return this.makeTempFile.apply(this, arguments); },
 
makeTempFolder : function(aOriginal, aCosmetic) 
{
	if (aOriginal)
		return this.makeTempFile(aOriginal, aCosmetic);

	var temp = this.getFileFromKeyword('TmpD');
	temp.append('uxu.tmp_dir');
	temp.createUnique(temp.DIRECTORY_TYPE, 0777);
	this.tempFiles.push(temp);
	return temp;
},
makeTempDir : function() { return this.makeTempFolder.apply(this, arguments); },
makeTempDirectory : function() { return this.makeTempFolder.apply(this, arguments); },
createTempDir : function() { return this.makeTempFolder.apply(this, arguments); },
createTempDirectory : function() { return this.makeTempFolder.apply(this, arguments); },
createTempFolder : function() { return this.makeTempFolder.apply(this, arguments); },
 
cleanUpTempFiles : function(aDelayed) 
{
	this._cleanUpTempFiles(aDelayed, null, this);
},
_cleanUpTempFiles : function(aDelayed, aTempFiles, aSelf)
{
	if (!aSelf) aSelf = this;
	if (!aTempFiles) {
		aTempFiles = Array.slice(aSelf.tempFiles);
		aSelf.tempFiles.splice(0, aSelf.tempFiles.length);
	}
	if (aDelayed) {
		ns.setTimeout(arguments.callee, 1000, false, aTempFiles, aSelf);
		return;
	}
	aTempFiles.forEach(function(aFile) {
		try {
			if (aFile.exists()) aFile.remove(true);
			return;
		}
		catch(e) {
			var message = 'failed to remove temporary file:\n'+aFile.path+'\n'+e;
			if (Application)
				Application.console.log(message);
			else
				dump(message+'\n');

			aSelf.scheduleToRemove(aFile);
		}
	});
},
  
runScriptInFrame : function(aScript, aFrame, aVersion) 
{
	if (!aVersion) aVersion = '1.7';
	var script = aFrame.document.createElementNS('http://www.w3.org/1999/xhtml', 'script');
	script.setAttribute('type', 'application/javascript; version='+aVersion);
	script.appendChild(aFrame.document.createTextNode(aScript));
	aFrame.document.documentElement.appendChild(script);
},
  
// エラー・スタックトレース整形 
	
normalizeError : function(e) 
{
	switch (typeof e)
	{
		case 'number':
			var msg = bundle.getFormattedString('unknown_exception', [e]);
			for (let i in Components.results)
			{
				if (Components.results[i] != e) continue;
				msg = i+' ('+e+')';
				break;
			}
			e = new Error(msg);
			e.stack = this.getStackTrace();
			break;

		case 'string':
		case 'boolean':
			var msg = bundle.getFormattedString('unknown_exception', [e]);
			e = new Error(msg);
			e.stack = this.getStackTrace();
			break;

		case 'object':
			if (e.name == 'MultiplexError')
				e.errors = e.errors.map(function(aError) {
					return this.normalizeError(aError);
				}, this);
			break;
	}
	return e;
},
 
formatError : function(e) 
{
	var lines = this.formatStackTrace(e, { onlyFile : true, onlyExternal : true, onlyTraceLine : true });
	if (!lines || this.getPref('extensions.uxu.showInternalStacks'))
		lines = this.formatStackTrace(e, { onlyFile : true, onlyTraceLine : true });
	var formatted = e.toString();
	if ('result' in e) {
		let name = this.getErrorNameFromNSExceptionCode(e.result);
		if (name)
			formatted += '\n'+e.result+' ('+name+')';
	}
	formatted += '\n'+this.inspect(e);
	formatted += '\n' + lines;
	return formatted;
},
 
hasStackTrace : function(aException) 
{
	return aException.stack ||
		(aException.location && this.JSFrameLocationRegExp.test(aException.location));
},
 
formatStackTraceForDisplay : function(aException) 
{
	var lines = this.formatStackTrace(aException, { onlyTraceLine : true, onlyExternal : true }).split('\n');
	if (!lines.length ||
		(lines.length == 1 && !lines[0]) ||
		this.getPref('extensions.uxu.showInternalStacks'))
		lines = this.formatStackTrace(aException, { onlyTraceLine : true }).split('\n');
	lines = lines.filter(function(aLine) {
		return aLine;
	});
	return lines;
},
 
lineRegExp : /@\w+:.+:\d+/, 
JSFrameLocationRegExp : /JS frame :: (.+) :: .+ :: line (\d+)/,
subScriptRegExp : /@chrome:\/\/uxu\/content\/lib\/subScriptRunner\.js(?:\?includeSource=([^;,:]+)(?:;encoding=[^;,:]+)?|\?code=([^;,:]+))?:(\d+)$/i,
 
formatStackTrace : function(aException, aOptions) 
{
	if (!aOptions) aOptions = {};

	var trace = '';
	var stackLines = [];

	if (aException.name == "SyntaxError") {
		var exceptionPosition;
		exceptionPosition = "@" + aException.fileName;
		exceptionPosition += ":" + aException.lineNumber;

		if (exceptionPosition.match(this.subScriptRegExp)) {
			var i;
			var lines = (aException.stack || "").split("\n");

			for (i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.match(/^eval\("(.*)"\)@:0$/)) {
					var source, errorLine;

					source = eval('"\\\"' + RegExp.$1 + '\\\""');
					errorLine = source.split("\n")[aException.lineNumber - 1];
					exceptionPosition = errorLine + exceptionPosition;
					break;
				}
			}

			stackLines.push(exceptionPosition);
		}
	}

	if (aException.stack) {
		stackLines = stackLines.concat(String(aException.stack).split('\n'));
	}
	if (aException.location && this.JSFrameLocationRegExp.test(aException.location)) {
		stackLines = stackLines.concat(['()@' + RegExp.$1 + ':' + RegExp.$2]);
	}

	stackLines.forEach(function(aLine) {
		if (!aLine.length) return;

		aLine = String(aLine).replace(/\\n/g, '\n');

		if ('maxLength' in aOptions &&
			aLine.length > aOptions.maxLength)
			aLine = aLine.substr(0, aOptions.maxLength) + '[...]\n';

		if (aLine.match(this.subScriptRegExp)) {
			var lineNum = RegExp.$3;
			if (RegExp.$1) {
				var includeSource = decodeURIComponent(RegExp.$1);
				aLine = aLine.replace(this.subScriptRegExp, '@'+includeSource+':'+lineNum);
			}
			else if (RegExp.$2) {
				if (aOptions.onlyFile) return;
				var code = decodeURIComponent(RegExp.$2);
				aLine = '(eval):' +
					aLine.replace(this.subScriptRegExp, '') +
					lineNum + ':' + code;
			}
		}
		if (
			(aOptions.onlyExternal && this._comesFromFramework(aLine)) ||
			(aOptions.onlyTraceLine && !this.lineRegExp.test(aLine))
			)
			return;
		trace += aLine + '\n';
	}, this);

	return trace;
},
	
_comesFromFramework : function(aLine) 
{
	return (/@chrome:\/\/uxu\/content\//.test(aLine) ||
			/file:.+\/uxu@clear-code\.com\/modules\//.test(aLine) || // -Firefox 3.6
			/resource:\/\/uxu-modules\//.test(aLine) || // Firefox 4.0-
			// Following is VERY kludgy
			/\(function \(aExitResult\) \{if \(aEventHandlers/.test(aLine))
},
 
makeStackLine : function(aStack) 
{
	if (typeof aStack == 'string') return aStack;
	return '()@' + aStack.filename + ':' + aStack.lineNumber + '\n';
},
 
getStackTrace : function() 
{
	var callerStack = '';
	var caller = Components.stack;
	while (caller)
	{
		callerStack += this.makeStackLine(caller);
		caller = caller.caller;
	}
	return callerStack;
},
 
unformatStackLine : function(aLine) 
{
	/@(\w+:.*)?:(\d+)/.test(aLine);
	return {
		source : (RegExp.$1 || ''),
		line   : (RegExp.$2 || '')
	};
},
  
toHash : function(aObject, aProperties) 
{
	var obj = aObject;
	if (aObject && aObject instanceof Ci.nsIPropertyBag)
		return ns.primitive.toHash(aObject);

	var hash = {};
	if (!aProperties) {
		for (let p in obj)
		{
			if (!obj.hasOwnProperty(p))
				continue;

			hash[p] = obj[p];
			//if (hash[p] && typeof hash[p] == 'object')
			//	hash[p] = this.toHash(hash[p]);
		}
	}
	else {
		if (typeof aProperties == 'string')
			aProperties = aProperties.split(/[,\s]+/);
		aProperties.forEach(function(p) {
			hash[p] = obj[p];
			//if (hash[p] && typeof hash[p] == 'object')
			//	hash[p] = this.toHash(hash[p]);
		});
	}
	return hash;
},
  
// 設定読み書き 
	
getPref : function(aKey) 
{
	return ns.prefs.getPref(aKey);
},
 
setPref : function(aKey, aValue) 
{
	if (!(aKey in this.backupPrefs))
		this.backupPrefs[aKey] = this.getPref(aKey);
	return ns.prefs.setPref(aKey, aValue);
},
 
clearPref : function(aKey) 
{
	if (!(aKey in this.backupPrefs))
		this.backupPrefs[aKey] = this.getPref(aKey);
	ns.prefs.clearPref(aKey);
},
 
rollbackPrefs : function() 
{
	for (var i in this.backupPrefs)
	{
		if (this.backupPrefs[i] === null)
			this.clearPref(i);
		else
			this.setPref(i, this.backupPrefs[i]);
	}
	this.backupPrefs = {};
},
 
loadPrefs : function(aFile, aHash) 
{
	if (aHash && typeof aHash != 'object') aHash = null;

	var result = {};
	prefread(this.normalizeToFile(aFile)).forEach(
		(aHash ?
			function(aItem) {
				aHash[aItem.name] = aItem.value;
				result[aItem.name] = aItem.value;
			} :
			function(aItem) {
				this.setPref(aItem.name, aItem.value);
				result[aItem.name] = aItem.value;
			}),
		this
	);

	return result;
},
  
// Windowsレジストリ読み書き 
	
getWindowsRegistry : function(aKey) 
{
	try {
		return ns.registry.getValue(aKey);
	}
	catch(e) {
		if (e.message == ns.registry.ERROR_NOT_WINDOWS)
			throw new Error(bundle.getString('error_utils_platform_is_not_windows'));
		else
			throw e;
	}
},
 
setWindowsRegistry : function(aKey, aValue) 
{
	try {
		return ns.registry.setValue(aKey, aValue);
	}
	catch(e) {
		if (e.message == ns.registry.ERROR_WRITE_FAILED)
			throw new Error(bundle.getFormattedString('error_utils_failed_to_write_registry', [aKey, aValue]));
		else
			throw e;
	}
},
 
clearWindowsRegistry : function(aKey) 
{
	try {
		ns.registry.clear(aKey);
	}
	catch(e) {
		if (e.message == ns.registry.ERROR_CLEAR_FAILED)
			throw new Error(bundle.getFormattedString('error_utils_failed_to_clear_registry', [aKey]));
		else
			throw e;
	}
},
  
// クリップボード 
	
getClipBoard : function() 
{
	return this._getClipBoard(false);
},
 
getSelectionClipBoard : function() 
{
	return this._getClipBoard(true);
},
 
_getClipBoard : function(aSelection) 
{
	var string = '';

	var trans = Cc['@mozilla.org/widget/transferable;1'].createInstance(Ci.nsITransferable);
	trans.addDataFlavor('text/unicode');
	try {
		const Clipboard = Cc['@mozilla.org/widget/clipboard;1'].getService(Ci.nsIClipboard);
		if (aSelection)
			Clipboard.getData(trans, Clipboard.kSelectionClipboard);
		else
			Clipboard.getData(trans, Clipboard.kGlobalClipboard);
	}
	catch(ex) {
		return string;
	}

	var data       = {},
		dataLength = {};
	trans.getTransferData('text/unicode', data, dataLength);

	if (!data) return string;

	data = data.value.QueryInterface(Ci.nsISupportsString);
	string = data.data.substring(0, dataLength.value / 2);

	return string;
},
 
setClipBoard : function(aString) 
{
	Cc['@mozilla.org/widget/clipboardhelper;1']
		.getService(Ci.nsIClipboardHelper)
		.copyString(aString);
},
  
fixupIncompleteURI : function(aURIOrPart) 
{
	if (!this.baseURL)
		return aURIOrPart;

	var match = aURIOrPart.match(/^([^:]+):/);
	if (match && match[1] != 'file')
		return aURIOrPart;

	var uri = aURIOrPart;

	try {
		if (/^file:\/\//.test(uri))
			this.getFileFromURLSpec(uri);
		if (/^\w+:\/\//.test(uri))
			this.makeURIFromSpec(uri);
		else
			this.getURLSpecFromFilePath(uri);
	}
	catch(e) {
		uri = this.baseURL + uri;
		try {
			this.getFileFromURLSpec(uri);
		}
		catch(e) {
			throw new Error(bundle.getFormattedString('error_utils_failed_to_fixup_incomplete_uri', [aURIOrPart]));
		}
	}
	return uri;
},
 
// イテレータ操作 
	
isGeneratedIterator : function(aObject) 
{
	try {
		return (
			aObject &&
			'next' in aObject &&
			'send' in aObject &&
			'throw' in aObject &&
			'close' in aObject &&
			aObject == '[object Generator]'
		);
	}
	catch(e) {
	}
	return false;
},
 
doIteration : function(aGenerator, aCallbacks) 
{
	if (!aGenerator)
		throw new Error(bundle.getString('error_utils_no_generator'));

	var iterator = aGenerator;
	if (typeof aGenerator == 'function')
		iterator = aGenerator();
	if (!this.isGeneratedIterator(iterator))
		throw new Error(bundle.getFormattedString('error_utils_invalid_generator', [aGenerator]));

	var callerStack = this.getStackTrace();

	var retVal = { value : false };
	var lastRun = Date.now();
	var timeout = Math.max(0, this.getPref('extensions.uxu.run.timeout'));
	var self = this;
	(function(aObject) {
		var loop = arguments.callee;
		try {
			if (Date.now() - lastRun >= timeout)
				throw new Error(bundle.getFormattedString('error_generator_timeout', [parseInt(timeout / 1000)]));

			if (aObject !== void(0)) {
				var continueAfterDelay = false;
				if (aObject instanceof Error) {
					throw aObject;
				}
				else if (typeof aObject == 'number') {
					// TraceMonkeyのバグなのかなんなのか、指定時間経つ前にタイマーが発動することがあるようだ……
					continueAfterDelay = (Date.now() - lastRun < aObject);
				}
				else if (aObject && typeof aObject == 'object') {
					if (self.isGeneratedIterator(aObject)) {
						return ns.Deferred.next(function() { loop(self.doIteration(aObject)); });
					}
					else if (self.isDeferred(aObject)) {
						let finished = { value : false };
						if (aObject.fired) {
							finished.value = true;
						}
						else {
							aObject
								.next(function() {
									finished.value = true;
								})
								.error(function() {
									finished.value = true;
								});
						}
						return ns.Deferred.next(function() { loop(finished); });
					}
					else if ('error' in aObject && aObject.error instanceof Error) {
						throw aObject.error;
					}
					else if (!aObject.value) {
						continueAfterDelay = true;
					}
				}
				else if (typeof aObject == 'function') {
					var val;
					try {
						val = aObject();
					}
					catch(e) {
						e.stack += callerStack;
						throw e;
					}
					if (!val)
						continueAfterDelay = true;
					else if (val instanceof Error)
						throw val;
					else if (self.isGeneratedIterator(val))
						return ns.Deferred.next(function() { loop(self.doIteration(val)); });
				}
				if (continueAfterDelay)
					return ns.setTimeout(loop, 10, aObject);
			}

			var returnedValue = iterator.next();
			lastRun = Date.now();

			if (!returnedValue) returnedValue = 0;
			switch (typeof returnedValue)
			{
				default:
					returnedValue = Number(returnedValue);
					if (isNaN(returnedValue))
						returnedValue = 0;

				case 'number':
					if (returnedValue >= 0) {
						ns.setTimeout(loop, returnedValue, returnedValue);
						return;
					}
					throw new Error(bundle.getFormattedString('error_yield_unknown_condition', [String(returnedValue)]));

				case 'object':
					if (returnedValue) {
						if ('value' in returnedValue || self.isGeneratedIterator(returnedValue)) {
							ns.setTimeout(loop, 10, returnedValue);
							return;
						}
						else if (self.isDeferred(returnedValue)) {
							if (returnedValue.fired) {
								ns.Deferred.next(function() { loop(); });
							}
							else {
								returnedValue
									.next(function(aReturnedValue) { loop(); })
									.error(function(aException) { loop(); });
							}
							return;
						}
					}
					throw new Error(bundle.getFormattedString('error_yield_unknown_condition', [String(returnedValue)]));

				case 'function':
					ns.setTimeout(loop, 10, returnedValue);
					return;
			}
		}
		catch(e if e instanceof StopIteration) {
			try {
				e.stack += callerStack;
			}
			catch(e) {
			}
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			try {
				if (aCallbacks.onEnd)
					aCallbacks.onEnd(e);
			}
			catch(e) {
				retVal.error = e;
			}
		}
		catch(e if e.name == 'AssertionFailed') {
			try {
				e.stack += callerStack;
			}
			catch(e) {
			}
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			try {
				if (aCallbacks.onFail)
					aCallbacks.onFail(e);
				else if (aCallbacks.onError)
					aCallbacks.onError(e);
				else if (aCallbacks.onEnd)
					aCallbacks.onEnd(e);
			}
			catch(e) {
				retVal.error = e;
			}
		}
		catch(e) {
			e = self.normalizeError(e);
			try {
				e.stack += callerStack;
			}
			catch(e) {
			}
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			try {
				if (aCallbacks.onError)
					aCallbacks.onError(e);
				else if (aCallbacks.onEnd)
					aCallbacks.onEnd(e);
			}
			catch(e) {
				retVal.error = e;
			}
		}
	})(null);

	return retVal;
},
 
Do : function(aObject) 
{
	if (!aObject)
		return aObject;
	if (this.isGeneratedIterator(aObject))
		return this.doIteration(aObject);
	if (typeof aObject != 'function')
		return aObject;

	var retVal = aObject();
	return (this.isGeneratedIterator(retVal)) ?
				this.doIteration(retVal) :
				retVal;
},
  
// データベース操作 
	
get dbFile() { 
	if (!this._dbFile) {
		this._dbFile = this.getFileFromKeyword('ProfD');
		this._dbFile.append('uxu.sqlite');
	}
	return this._dbFile;
},
_dbFile : null,
 
getDB : function() 
{
	if (_db) return _db;
	_db = this.openDatabase(this.dbFile);
	return _db;
},
 
openDatabase : function(aFile) 
{
	aFile = this.normalizeToFile(aFile);
	const StorageService = Cc['@mozilla.org/storage/service;1']
		.getService(Ci.mozIStorageService);
	return StorageService.openDatabase(aFile);
},
 
createDatabase : function() 
{
	var file = this.makeTempFile();

	return this.openDatabase(file);
},
 
createDatabaseFromSQL : function(aSQL) 
{
	var connection = this.createDatabase();
	if (aSQL) {
		if (connection.transactionInProgress)
			connection.commitTransaction();
		if (!connection.transactionInProgress)
			connection.beginTransaction();
		connection.executeSimpleSQL(aSQL);
		if (connection.transactionInProgress)
			connection.commitTransaction();
	}
	return connection;
},
 
createDatabaseFromSQLFile : function(aSQLFile, aEncoding, aScope) 
{
	aSQLFile = this.normalizeToFile(aSQLFile);
	var sql;
	try {
		sql = this.readFrom(aSQLFile, aEncoding || this.getPref('extensions.uxu.defaultEncoding'));
	}
	catch(e) {
		throw new Error(bundle.getFormattedString('error_utils_cannot_read_sql_file', [aSQLFile, e]));
	}
	if (aScope) input = this.processTemplate(sql, aScope);
	return this.createDatabaseFromSQL(sql);
},
  
// 解析 
	
inspect : function(aObject, aIndent) 
{
	var inspectedObjects = [];
	var inspectedResults = {};
	var inaccessible = {
			objects    : [],
			properties : [],
			values     : [],
			count      : 0
		};

	var self = this;
	function _inspect(aTarget, aIndent)
	{
		var index;

		if (aTarget === null)
			return 'null';
		if (aTarget === undefined)
			return 'undefined';

		index = inspectedObjects.indexOf(aTarget);
		if (index != -1)
			return inspectedResults[index];

		if (!aTarget.__proto__)
			return aTarget.toString();

		if (self.isArray(aTarget)) {
			index = inspectedObjects.length;
			inspectedObjects.push(aTarget);
			inspectedResults[index] = aTarget.toString();

			var values = aTarget.map(function(aObject) {
							return _inspect(aObject, aIndent);
						});
			if (aIndent) {
				inspectedResults[index] = "[\n" +
						values
							.map(function(aElement) {
								return aElement.replace(/^/gm, aIndent);
							})
							.join(",\n") +
						"\n]";
			}
			else {
				inspectedResults[index] = "[" + values.join(", ") + "]";
			}
			return inspectedResults[index];
		}
		else if (self.isString(aTarget)) {
			return '"' + aTarget.replace(/\"/g, '\\"') + '"';
		}
		else if (aTarget.toString == (function(aTarget) {
						return aTarget.__proto__ ? arguments.callee(aTarget.__proto__) : aTarget ;
					})(aTarget).toString) {
			index = inspectedObjects.length;
			inspectedObjects.push(aTarget);
			inspectedResults[index] = aTarget.toString();

			var names = [];
			for (var name in aTarget) {
				names.push(name);
			}
			var values = names.sort().map(function(aName) {
					var value;
					try {
						value = _inspect(aTarget[aName], aIndent);
					}
					catch(e) {
						var objIndex = inaccessible.objects.indexOf(aTarget);
						if (objIndex < 0) {
							inaccessible.objects.push(aTarget);
							inaccessible.properties.push([]);
							inaccessible.values.push([]);
							objIndex++;
						}
						var props = inaccessible.properties[objIndex];
						var propIndex = props.indexOf(aName);
						if (propIndex < 0) {
							props.push(aName);
							value = '(INACCESSIBLE #'+(++inaccessible.count)+', REASON: '+e+')';
							inaccessible.values[objIndex].push(value);
						}
						else {
							value = inaccessible.values[objIndex][propIndex];
						}
					}
					return aName.quote() + ': ' + value;
				});
			if (aIndent) {
				inspectedResults[index] = "{\n" +
						values
							.map(function(aElement) {
								return aElement.replace(/^/gm, aIndent);
							})
							.join(",\n") +
						"\n}";
			}
			else {
				inspectedResults[index] = "{" + values.join(", ") + "}";
			}
			return inspectedResults[index];
		}
		else {
			return aTarget.toString();
		}
	}

	return _inspect(aObject, aIndent);
},
 
inspectType : function(aObject) 
{
	var type = typeof aObject;

	if (type != "object")
		return type;

	var objectType = Object.prototype.toString.apply(aObject);
	return objectType.substring("[object ".length,
								objectType.length - "]".length);
},
 
inspectDOMNode : function(aNode) 
{
	var self = arguments.callee;
	var result;
	switch (aNode.nodeType)
	{
		case Ci.nsIDOMNode.ELEMENT_NODE:
		case Ci.nsIDOMNode.DOCUMENT_NODE:
		case Ci.nsIDOMNode.DOCUMENT_FRAGMENT_NODE:
			result = Array.slice(aNode.childNodes).map(function(aNode) {
					return self(aNode);
				}).join('');
			break;

		case Ci.nsIDOMNode.TEXT_NODE:
			result = aNode.nodeValue
						.replace(/&/g, '&ampt;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;');
			break;

		case Ci.nsIDOMNode.CDATA_SECTION_NODE:
			result = '<![CDATA['+aNode.nodeValue+']]>';
			break;

		case Ci.nsIDOMNode.COMMENT_NODE:
			result = '<!--'+aNode.nodeValue+'-->';
			break;

		case Ci.nsIDOMNode.ATTRIBUTE_NODE:
			result = aNode.name+'="'+
						aNode.value
							.replace(/&/g, '&ampt;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/"/g, '&quot;')+
						'"';
			break;

		case Ci.nsIDOMNode.PROCESSING_INSTRUCTION_NODE:
			result = '<?'+aNode.target+' '+aNode.data+'?>';
			break;

		case Ci.nsIDOMNode.DOCUMENT_TYPE_NODE:
			result = '<!DOCTYPE'+aNode.name+
						(aNode.publicId ? ' '+aNode.publicId : '' )+
						(aNode.systemId ? ' '+aNode.systemId : '' )+
						'>';
			break;

		case Ci.nsIDOMNode.ENTITY_NODE:
		case Ci.nsIDOMNode.ENTITY_REFERENCE_NODE:
		case Ci.nsIDOMNode.NOTATION_NODE:
		default:
			return '';
	}

	if (aNode.nodeType == Ci.nsIDOMNode.ELEMENT_NODE) {
		result = '<'+
			aNode.localName+
			(aNode.namespaceURI ? ' xmlns="'+aNode.namespaceURI+'"' : '' )+
			Array.slice(aNode.attributes).map(function(aAttr) {
				return ' '+self(aAttr);
			}).sort().join('')+
			(result ? '>' : '/>' )+
			(result ? result+'</'+aNode.localName+'>' : '' );
	}
	return result;
},
 
p : function() 
{
	for (var i = 0; i < arguments.length; i++) {
		var inspected = this.inspect(arguments[i]);
		if (!/\n$/.test(inspected))
			inspected += "\n";
		this.dump(inspected);
	}
},
 
isString : function(aObject) 
{
	if (typeof aObject == 'string')
		return true;

	return (
		aObject &&
		typeof aObject == 'object' &&
		aObject.constructor &&
		aObject.constructor.toSource().indexOf('function String()') == 0
	);
},
 
isArray : function(aObject) 
{
	return (
		aObject &&
		typeof aObject == 'object' &&
		aObject.constructor &&
		aObject.constructor.toSource().indexOf('function Array()') == 0
	);
},
 
isDate : function(aObject) 
{
	return (
		aObject &&
		typeof aObject == 'object' &&
		aObject.constructor &&
		aObject.constructor.toSource().indexOf('function Date()') == 0
	);
},
 
isRegExp : function(aObject) 
{
	return (
		aObject &&
		typeof aObject == 'object' &&
		aObject.constructor &&
		aObject.constructor.toSource().indexOf('function RegExp()') == 0
	);
},
 
isObject : function(aObject) 
{
	return typeof aObject == 'object';
},
 
isDeferred : function(aObject) 
{
	return aObject && aObject.__proto__ == ns.Deferred.prototype;
},
  
// 比較 
	
equals : function(aObject1, aObject2) 
{
	return this._equals(function (aObj1, aObj2) {return aObj1 == aObj2},
				        aObject1, aObject2,
				        false);
},
 
strictlyEquals : function(aObject1, aObject2) 
{
	return this._equals(function (aObj1, aObj2) {return aObj1 === aObj2},
				        aObject1, aObject2,
				        true);
},
 
_equals : function(aCompare, aObject1, aObject2, aStrict, aAltTable) 
{
	if (aCompare(aObject1, aObject2))
		return true;

	aAltTable = this._createAltTable(aAltTable);
	aObject1 = this._getAltTextForCircularReference(aObject1, aStrict, aAltTable);
	aObject2 = this._getAltTextForCircularReference(aObject2, aStrict, aAltTable);

	if (this.isArray(aObject1) && this.isArray(aObject2)) {
		var length = aObject1.length;
		if (length != aObject2.length)
			return false;
		for (var i = 0; i < length; i++) {
			if (!this._equals(aCompare, aObject1[i], aObject2[i], aStrict, aAltTable))
				return false;
		}
		return true;
	}

	if (this.isDate(aObject1) && this.isDate(aObject2)) {
		return this._equals(aCompare, aObject1.getTime(), aObject2.getTime(), aStrict, aAltTable);
	}

	if (this.isObject(aObject1) && this.isObject(aObject2)) {
		return this._equalObject(aCompare, aObject1, aObject2, aStrict, aAltTable);
	}

	return false;
},
 
_equalObject : function(aCompare, aObject1, aObject2, aStrict, aAltTable) 
{
	if (!aCompare(aObject1.__proto__, aObject2.__proto__))

	aAltTable = this._createAltTable(aAltTable);
	aObject1 = this._getAltTextForCircularReference(aObject1, aStrict, aAltTable);
	aObject2 = this._getAltTextForCircularReference(aObject2, aStrict, aAltTable);
	if (typeof aObject1 == 'string' || typeof aObject2 == 'string') {
		return this._equals(aCompare, aObject1, aObject2, aStrict, aAltTable);
	}

	var name;
	var names1 = [], names2 = [];
	for (name in aObject1) {
		names1.push(name);
		if (!(name in aObject2))
			return false;
		if (!this._equals(aCompare, aObject1[name], aObject2[name], aStrict, aAltTable))
			return false;
	}
	for (name in aObject2) {
		names2.push(name);
	}
	names1.sort();
	names2.sort();
	return this._equals(aCompare, names1, names2, aStrict, aAltTable);
},
 
_createAltTable : function(aAltTable) 
{
	return aAltTable || { objects : [], alt : [], count : [] };
},
 
CIRCULAR_REFERENCE_MAX_COUNT : 500, 
 
_getAltTextForCircularReference : function(aObject, aStrict, aAltTable) 
{
	if (this.CIRCULAR_REFERENCE_MAX_COUNT < 0 ||
		typeof aObject != 'object') {
		return aObject;
	}

	var index = aAltTable.objects.indexOf(aObject);
	if (index < 0) {
		aAltTable.objects.push(aObject);
		aAltTable.alt.push(
			aStrict ?
				String(aObject)+'(#'+(aAltTable.alt.length+1)+')' :
				this.inspect(aObject)
		);
		aAltTable.count.push(0);
	}
	else if (aAltTable.count[index]++ > this.CIRCULAR_REFERENCE_MAX_COUNT) {
		aObject = aAltTable.alt[index];
	}
	return aObject;
},
  
// DOMノード調査 
	
isTargetInRange : function(aTarget, aRange) 
{
	var targetRangeCreated = false;
	if (aTarget instanceof Ci.nsIDOMNode) {
		try {
			var range = aTarget.ownerDocument.createRange();
			range.selectNode(aTarget);
			aTarget = range;
			targetRangeCreated = true;
		}
		catch(e) {
		}
	}
	if (aTarget instanceof Ci.nsIDOMRange) {
		try {
			var inRange = (
					aTarget.compareBoundaryPoints(Ci.nsIDOMRange.START_TO_START, aRange) >= 0 &&
					aTarget.compareBoundaryPoints(Ci.nsIDOMRange.END_TO_END, aRange) <= 0
				);
			if (targetRangeCreated) aTarget.detach();
			return inRange;
		}
		catch(e) {
		}
		return false;
	}
	return aRange.toString().indexOf(aTarget.toString()) > -1;
},
 
isTargetInSelection : function(aTarget, aSelection) 
{
	for (var i = 0, maxi = aSelection.rangeCount; i < maxi; i++)
	{
		if (this.isTargetInRange(aTarget, aSelection.getRangeAt(i)))
			return true;
	}
	return false;
},
 
isTargetInSubTree : function(aTarget, aNode) 
{
	try {
		var range = aNode.ownerDocument.createRange();
		range.selectNode(aNode);
		var result = this.isTargetInRange(aTarget, range);
		range.detach();
		return result;
	}
	catch(e) {
	}
	return false;
},
  
// 文字列処理 
	
// for backward compatibility 
processTemplate : function(aCode, aScope) {
	return ns.EJS.result(aCode, aScope);
},
parseTemplate : function() { return this.processTemplate.apply(this, arguments); },
 
computeHash : function(aData, aHashAlgorithm) 
{
	try {
		return ns.hash.computeHash(aData, aHashAlgorithm);
	}
	catch(e) {
		if (e.message.indexOf('unknown hash algorithm: ') == 0)
			throw new Error(bundle.getFormattedString('error_utils_unknown_hash_algorithm', [aHashAlgorithm]));
		else
			throw e;
	}
},
 
computeHashFromFile : function(aFile, aHashAlgorithm) 
{
	var file = this.normalizeToFile(aFile);
	if (!file)
		throw new Error(bundle.getFormattedString('error_utils_compute_hash_from_file_null', [aFile]));
	if (!file.exists())
		throw new Error(bundle.getFormattedString('error_utils_compute_hash_from_file_not_exists', [aFile]));
	if (file.isDirectory())
		throw new Error(bundle.getFormattedString('error_utils_compute_hash_from_file_directory', [aFile]));

	return this.computeHash(file, aHashAlgorithm);
},
 
md2FromFile : function(aFile) { return this.computeHashFromFile(this.normalizeToFile(aFile), 'md2'); }, 
md5FromFile : function(aFile) { return this.computeHashFromFile(this.normalizeToFile(aFile), 'md5'); },
sha1FromFile : function(aFile) { return this.computeHashFromFile(this.normalizeToFile(aFile), 'sha1'); },
sha256FromFile : function(aFile) { return this.computeHashFromFile(this.normalizeToFile(aFile), 'sha256'); },
sha384FromFile : function(aFile) { return this.computeHashFromFile(this.normalizeToFile(aFile), 'sha384'); },
sha512FromFile : function(aFile) { return this.computeHashFromFile(this.normalizeToFile(aFile), 'sha512'); },
 
mapURI : function(aURI, aMappingDefinition) 
{
	if (!aMappingDefinition) return aURI;

	var newURI;

	if (typeof aMappingDefinition == 'function')
		return aMappingDefinition(this.makeURIFromSpec(aURI));

	var matchers = [];
	var targets  = [];
	if (this.isArray(aMappingDefinition)) {
		if (aMappingDefinition.length % 2)
			throw new Error(bundle.getString('error_utils_invalid_mapping_definition'));

		for (var i = 0, maxi = aMappingDefinition.length; i < maxi; i = i+2)
		{
			matchers.push(aMappingDefinition[i]);
			targets.push(aMappingDefinition[i+1]);
		}
	}
	else {
		for (var prop in aMappingDefinition)
		{
			matchers.push(prop);
			targets.push(aMappingDefinition[prop]);
		}
	}
	var regexp = new RegExp();
	matchers.some(function(aMatcher, aIndex) {
		var matcher = utils.isRegExp(aMatcher) ?
				aMatcher :
				regexp.compile(
					'^'+
					String(aMatcher).replace(/([^*?\w])/g, '\\$1')
						.replace(/\?/g, '(.)')
						.replace(/\*/g, '(.*)')+
					'$'
				);
		if (matcher.test(aURI)) {
			newURI = aURI.replace(matcher, targets[aIndex]);
			return true;
		}
		return false;
	});
	return newURI || aURI;
},
redirectURI : function(aURI, aMappingDefinition)
{
	return this.mapURI.call(this, aURI, aMappingDefinition)
},
 
escapeHTML : function(aString)
{
	return String(aString)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
},
 
// http://liosk.blog103.fc2.com/blog-entry-75.html
// CSV parser based on RFC4180
parseCSV : function(aInput, aDelimiter) 
{
	var delimiter = aDelimiter || ',';
	var tokenizer = new RegExp(
			delimiter+'|\r?\n|[^'+delimiter+'"\r\n][^'+delimiter+'\r\n]*|"(?:[^"]|"")*"',
			'g'
		);
	var record = 0,
		field = 0,
		data = [['']],
		qq = /""/g,
		longest = 0;
	var self = this;
	aInput.replace(/\r?\n$/, '')
		.replace(tokenizer, function(aToken) {
			switch (aToken) {
				case delimiter:
					data[record][field] = self._normalizeCSVField(data[record][field]);
					data[record][++field] = '';
					if (field > longest) longest = field;
					break;

				case '\n':
				case '\r\n':
					data[record][field] = self._normalizeCSVField(data[record][field]);
					data[++record] = [''];
					field = 0;
					break;

				default:
					data[record][field] = (aToken.charAt(0) != '"') ?
						aToken :
						aToken.slice(1, -1).replace(qq, '"') ;
			}
		});
	data[record][field] = this._normalizeCSVField(data[record][field]);

	data.forEach(function(aRecord) {
		while (aRecord.length <= longest)
		{
			aRecord.push('');
		}
	});
	return data;
},
_normalizeCSVField : function(aSource)
{
	return aSource.replace(/\r\n/g, '\n');
},
parseTSV : function(aInput)
{
	return this.parseCSV(aInput, '\t');
},
 
_parseParametersFrom2DArray : function(aArray) 
{
	var data = this.evalInSandbox(aArray.toSource()); // duplicate object for safe
	var parameters;
	var columns = data.shift();
	var isHash = !columns[0];

	var types = [];
	if (isHash) columns.splice(0, 1);

	var typePattern = /.(\s*\[([^\]]+)\]\s*)$/i;
	var columnNames = {};
	columns = columns.map(function(aColumn) {
		let match = aColumn.match(typePattern);
		if (match) {
			aColumn = aColumn.replace(match[1], '');
			types.push(match[2].toLowerCase());
		}
		else {
			types.push('auto');
		}
		return this._ensureUniquieName(aColumn, columnNames);
	}, this);

	if (isHash) {
		var parameters = {};
		var names = {};
		data.forEach(function(aRecord) {
			let name = aRecord.shift();
			let record = {};
			aRecord.forEach(function(aField, aIndex) {
				record[columns[aIndex]] = this._convertParameterType(aField, types[aIndex]);
			}, this);
			name = this._ensureUniquieName(name, names);
			parameters[name] = record;
		}, this);
		return parameters;
	}
	else {
		return data.map(function(aRecord) {
			let record = {};
			aRecord.forEach(function(aField, aIndex) {
				record[columns[aIndex]] = this._convertParameterType(aField, types[aIndex]);
			}, this);
			return record;
		}, this);
	}
},
_ensureUniquieName : function(aName, aDatabase)
{
	if (aName in aDatabase) {
		aName = aName+'('+(++aDatabase[aName])+')';
		return arguments.callee(aName, aDatabase);
	}
	else {
		aDatabase[aName] = 1;
		return aName;
	}
},
_convertParameterType : function(aInput, aType)
{
	var source = aInput;
	aType = String(aType || '').toLowerCase();

	switch (aType)
	{
		case 'auto':
		default:
			if (/^[\-\+]?[0-9]+(\.[0-9]+)$/.test(source)) {
				aType = 'number';
			}
			else if (/^(true|false)$/i.test(source)) {
				aType = 'boolean';
				source = source.toLowerCase();
			}
			else {
				aType = 'string';
			}
			break;

		case 'number':
		case 'int':
		case 'float':
		case 'double':

		case 'boolean':
		case 'bool':

		case 'string':
		case 'char':

		case 'object':
		case 'json':
			break;
	}

	var data;
	switch (aType)
	{
		case 'number':
		case 'int':
		case 'float':
		case 'double':
			data = Number(source);
			if (isNaN(data))
				throw new Error(bundle.getFormattedString('error_utils_parameters_from_CSV_invalid_number', [aInput]));
			if (aType == 'int') data = parseInt(data);
			break;
		case 'boolean':
		case 'bool':
			try {
				data = this.evalInSandbox('!!('+(source || '""')+')');
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_parameters_from_CSV_invalid_boolean', [aInput]));
			}
			break;
		case 'object':
		case 'json':
			try {
				data = this.evalInSandbox('('+(source || '""')+')');
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_parameters_from_CSV_invalid_object', [aInput]));
			}
			break;
		case 'string':
		case 'char':
		default:
			data = source;
			break;
	}
	return data;
},
 
getErrorNameFromNSExceptionCode : function(aCode) 

{
	if (typeof aCode != 'number')
		return null;

	for (let i in Components.results)
	{
		if (Components.results[i] == aCode) {
			return i;
		}
	}
	return null;
},
 
getDocumentEncoding : function(aSource) 
{
	return null;

	if (
		!this.internalLoader ||
		!aSource ||
		!/^(jar:)?(file|chrome|resource):/.test(aSource) // only for local resources
		)
		return null;

	var loader = this.internalLoader;

	var completed = { value : null };
	var listener = function() {
			loader.removeEventListener('load', listener, true);
			loader.removeEventListener('error', listener, true);
			loader.stop();

			completed.value = loader.contentDocument.characterSet;
		};
	loader.addEventListener('load', listener, true);
	loader.addEventListener('error', listener, true);

	try {
		// add "view-source:" to ignore loading of external resources
		loader.loadURI('view-source:'+aSource);
		this.wait(completed);
	}
	catch(e) {
		loader.removeEventListener('load', listener, true);
		loader.removeEventListener('error', listener, true);
		return null;
	}

	return completed.value;
},
 
get internalLoader() 
{
	return Utils.internalLoader;
},
 
allowRemoteXUL : function(aHost)
{
	this.setPermission(aHost, 'allowXULXBL', 1);
},
allowRemoteXul : function() { return this.allowRemoteXUL(); },
 
setPermission : function(aHost, aType, aPermission)
{
	if (!PermissionManager) return;

	if (!aHost) aHost = '<file>';
	if (!(/^\w+:/).test(aHost))
		aHost = 'http://'+aHost;

	try {
		var uri = this.makeURIFromSpec(aHost);
		var key = aType+'\n'+uri.spec;
		var current = PermissionManager.testPermission(uri, aType);

		if (!(key in this.backupPermissions))
			this.backupPermissions[key] = current || 0;

		if (current != aPermission)
			PermissionManager.remove(this.UCS2ToUTF8(uri.host), aType);
		if (aPermission)
			PermissionManager.add(uri, aType, aPermission);
	}
	catch(e) {
	}
},
 
rollbackPermissions : function()
{
	if (!PermissionManager) return;

	for (var i in this.backupPermissions)
	{
		let [type, uri] = i.split('\n');
		let original = this.backupPermissions[i];
		uri = this.makeURIFromSpec(uri);
		PermissionManager.remove(this.UCS2ToUTF8(uri.host), type);
		if (original)
			PermissionManager.add(uri, type, original);
	}
	this.backupPermissions = {};
},
  
// アプリケーション 
	
get XULAppInfo() { 
	if (!this._XULAppInfo)
		this._XULAppInfo = Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULAppInfo).QueryInterface(Ci.nsIXULRuntime);
	return this._XULAppInfo;
},
 
get product() { 
	if (this._product)
		return this._product;

	switch (this.XULAppInfo.ID)
	{
		case '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}':
			this._product = 'Firefox';
			break;
		case '{3550f703-e582-4d05-9a08-453d09bdfdc6}':
			this._product = 'Thunderbird';
			break;
		case '{86c18b42-e466-45a9-ae7a-9b95ba6f5640}':
			this._product = 'Mozilla'; // Application Suite
			break;
		case '{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}':
			this._product = 'Seamonkey';
			break;
		case '{718e30fb-e89b-41dd-9da7-e25a45638b28}':
			this._product = 'Sunbird';
			break;
		case '{a23983c0-fd0e-11dc-95ff-0800200c9a66}':
			this._product = 'Fennec';
			break;
		default:
			this._product = '';
			break;
	}
	return this._product;
},
_product : null,
 
get productExecutable() { 
	if (!this._productExecutable)
		this._productExecutable = this.getFileFromKeyword('XREExeF');
	return this._productExecutable;
},
_productExecutable : null,
 
get productVersion() { 
	if (!this._productVersion)
		this._productVersion = this.XULAppInfo.version;
	return this._productVersion;
},
_productVersion : null,
 
get platformVersion() { 
	if (!this._platformVersion)
		this._platformVersion = this.XULAppInfo.platformVersion;
	return this._platformVersion;
},
_platformVersion : null,
 
restartApplication : function(aForce) 
{
	this._quitApplication(aForce, Ci.nsIAppStartup.eRestart);
},
 
quitApplication : function(aForce) 
{
	this._quitApplication(aForce);
},
 
_quitApplication : function(aForce, aOption) 
{
	var quitSeverity;
	if (aForce) {
		quitSeverity = Ci.nsIAppStartup.eForceQuit;
	}
	else {
		var cancelQuit = Cc['@mozilla.org/supports-PRBool;1']
					.createInstance(Ci.nsISupportsPRBool);
		this.notify(cancelQuit, 'quit-application-requested', null);

		if (!cancelQuit.data) {
			this.notify(null, 'quit-application-granted', null);
			var windows = Cc['@mozilla.org/appshell/window-mediator;1']
						.getService(Ci.nsIWindowMediator)
						.getEnumerator(null);
			while (windows.hasMoreElements())
			{
				var target = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
				if (('tryToClose' in target) && !target.tryToClose()) {
					return;
				}
			}
		}
		quitSeverity = Ci.nsIAppStartup.eAttemptQuit;
	}

	if (aOption) quitSeverity |= aOption;

	const startup = Cc['@mozilla.org/toolkit/app-startup;1']
					.getService(Ci.nsIAppStartup);
	startup.quit(quitSeverity);
},
 
get installedUXU() { 
	if (!this._installedUXU)
		this._installedUXU = ns.extensions.getInstalledLocation('uxu@clear-code.com');
	return this._installedUXU;
},
 
getInstalledLocationOfProduct : function(aProduct) 
{
	if (!aProduct || this.XULAppInfo.OS.toLowerCase().indexOf('win') < 0)
		return null;

	aProduct = String(aProduct).toLowerCase();

	var file = this.getPref('extensions.uxu.product.'+aProduct);
	if (file) {
		file = this.makeFileWithPath(file);
		if (file.exists()) return file;
	}

	switch (aProduct)
	{
		case 'firefox':
			return this._getInstalledLocationOfMozillaProduct('Firefox') ||
					this._getInstalledLocationOfMozillaProduct('Minefield');
		case 'thunderbird':
			return this._getInstalledLocationOfMozillaProduct('Thunderbird') ||
					this._getInstalledLocationOfMozillaProduct('Shredder');
		default:
			return this._getInstalledLocationOfMozillaProduct(aProduct);
	}
},
	
_getInstalledLocationOfMozillaProduct : function(aProduct) 
{
	if (!aProduct || this.XULAppInfo.OS.toLowerCase().indexOf('win') < 0)
		return null;

	var key;
	switch (String(aProduct).toLowerCase())
	{
		case 'firefox':
			key = 'Mozilla\\Mozilla Firefox';
			break;
		case 'thunderbird':
			key = 'Mozilla\\Mozilla Thunderbird';
			break;
		case 'minefield':
			key = 'Mozilla\\Minefield';
			break;
		case 'shredder':
			key = 'Mozilla\\Shredder';
			break;
		case 'mozilla':
			key = 'mozilla.org\\Mozilla';
			break;
		case 'seamonkey':
			key = 'mozilla.org\\SeaMonkey';
			break;
		case 'sunbird':
			key = 'Mozilla\\Mozilla Sunbird';
			break;
		case 'fennec':
		default:
			return null;
	}

	try {
		var productKey = Cc['@mozilla.org/windows-registry-key;1']
				.createInstance(Ci.nsIWindowsRegKey);
		productKey.open(
			productKey.ROOT_KEY_LOCAL_MACHINE,
			'SOFTWARE\\'+key,
			productKey.ACCESS_READ
		);
		var version = productKey.readStringValue('CurrentVersion');
		var curVerKey = productKey.openChild(version+'\\Main', productKey.ACCESS_READ);
		var path = curVerKey.readStringValue('PathToExe');
		curVerKey.close();
		productKey.close();

		return this.makeFileWithPath(path);
	}
	catch(e) {
	}
	return null;
},
   
// バージョン比較 
	
compareVersions : function() 
{
	var aA, aB, aOperator;
	const Comparator = Cc['@mozilla.org/xpcom/version-comparator;1'].getService(Ci.nsIVersionComparator);
	switch (arguments.length)
	{
		case 3:
			aA = arguments[0];
			aB = arguments[2];
			aOperator = arguments[1];
			var result;
			try {
				result = Comparator.compare(aA, aB);
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_compareVersions_failed_to_compare', [aA, aB, e]));
			}
			switch (aOperator)
			{
				case '<':
					return result < 0;
				case '=<':
				case '<=':
					return result <= 0;
				case '>':
					return result > 0;
				case '=>':
				case '>=':
					return result >= 0;
				case '=':
				case '==':
				case '===':
					return result == 0;
				case '!=':
				case '!==':
					return result != 0;
				default:
					throw new Error(bundle.getFormattedString('error_utils_compareVersions_invalid_operator', [aA, aB, aOperator]));
			}
			break;

		case 2:
			aA = arguments[0];
			aB = arguments[1];
			try {
				return Comparator.compare(aA, aB);
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_compareVersions_failed_to_compare', [aA, aB, e]));
			}

		default:
			throw new Error(bundle.getFormattedString('error_utils_compareVersions_invalid_arguments', [Array.slice(arguments).join(', ')]));
	}
},
 
checkProductVersion : function(aVersion) 
{
	return this.compareVersions(this.XULAppInfo.version, aVersion);
},
checkAppVersion : function(aVersion) // obsolete, for backward compatibility
{
	return this.checkProductVersion(aVersion);
},
checkApplicationVersion : function(aVersion) // obsolete, for backward compatibility
{
	return this.checkProductVersion(aVersion);
},
 
checkPlatformVersion : function(aVersion) 
{
	return this.compareVersions(this.XULAppInfo.platformVersion, aVersion);
},
  
// デバッグ 
	
log : function() 
{
	var message = Array.slice(arguments).join('\n');
	const Console = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);
	Console.logStringMessage(message);
},
 
dump : function() 
{
	this.log.apply(this, arguments);
},
  
notify : function(aSubject, aTopic, aData) 
{
	const ObserverService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
	ObserverService.notifyObservers(aSubject, aTopic, aData);
},
 
export : function(aNamespace, aForce, aSelf, aSource) 
{
	if (!aNamespace) return;

	if (!aSelf) aSource = null;

	aSelf = aSelf || this;
	aSource = aSource || this.__proto__;
	var self = this;
	for (var i in aSource)
	{
		if (
			!aSource.hasOwnProperty(i) ||
			i.indexOf('_') == 0 ||
			(
				!aForce &&
				(
					aNamespace.__lookupGetter__(i) ||
					i in aNamespace
				)
			)
			)
			continue;

		if (
			aSource.__lookupGetter__(i) ||
			(typeof aSource[i] != 'function')
			) {
			(function(aProperty) {
				aNamespace.__defineGetter__(aProperty, function() {
					return aSelf[aProperty];
				});
				aNamespace.__defineSetter__(aProperty, function(aValue) {
					// return aSelf[aProperty] = aValue;
					// just ignore operation
					return aValue;
				});
			})(i);
		}
		else {
			(function(aMethod) {
				aNamespace[aMethod] = self.bind(aSource[aMethod], aSelf);
			})(i);
		}
	}
},
 
bind : function(aFunction, aThis) 
{
	if (typeof aFunction != 'function' && typeof aThis == 'function')
		[aThis, aFunction] = [aFunction, aThis];

	var wrapped = function() {
			if (this instanceof arguments.callee) { // called as a constructor
				let retVal = aFunction.apply(this, arguments);
				return (retVal === void(0)) ? this : retVal ;
			}
			else { // called as a function
				return aFunction.apply(aThis, arguments);
			}
		};
	wrapped.prototype = aFunction.prototype;
	this.export(wrapped, true, aFunction, aFunction);

	return wrapped;
}
 
}; 
ns.encoding.export(Utils.prototype);
ns.hash.export(Utils.prototype);
ns.primitive.export(Utils.prototype);

ns.extensions.getInstalledLocation('uxu@clear-code.com', function(aLocation) {
	Utils.prototype._installedUXU = aLocation;
});

var utils = new Utils();
   
