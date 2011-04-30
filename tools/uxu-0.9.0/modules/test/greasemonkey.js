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
	this.EXPORTED_SYMBOLS = ['GreasemonkeyUtils'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/jstimer.jsm', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);

function GreasemonkeyUtils(aSuite)
{
	this._suite = aSuite;
	this.frame = this.frameInTestRunner;
	this.testWindow = null;
	this.commands = [];
	this.logs = [];
	this.storage = {};
	this.listeners = [];
	this.sandboxes = {};
	this.emulateXMLHTTPRequest = true;
}

GreasemonkeyUtils.prototype = {

	get frameInTestRunner() {
		return this._suite.testFrame;
	},

	destroy : function()
	{
		this.testWindow = null;
		this.commands = null;
		this.logs = null;
		this.storage = null;
		this.listeners = null;
		this.sandboxes = null;
	},

	load : function(aURI, aOptions)
	{
		this.listeners = [];
		this.sandboxes = {};
		return this._suite.loadURIInTestFrame(aURI, aOptions);
	},

	unload : function(aOptions)
	{
		this.listeners = [];
		this.sandboxes = {};
		return this._suite.loadURIInTestFrame('about:blank', aOptions);
	},

	open : function(aURI, aOptions)
	{
		aURI = this._suite.fixupIncompleteURI(aURI)
		this.listeners = [];
		this.sandboxes = {};
		var loadedFlag = { value : false, window : null, tab : null };

		var self = this;
		var postProcess = function() {
			self._suite.wait(tempFlag);

			self.testWindow = self._suite.getTestWindow(aOptions);
			loadedFlag.window = self.testWindow;

			var b = loadedFlag.window.gBrowser;
			if (b) {
				loadedFlag.tab = self._suite.addTab(aURI).tab;
				self.frame = loadedFlag.tab.linkedBrowser;
				b.removeAllTabsBut(loadedFlag.tab);
				loadedFlag.value = true;
			}
			else {
				loadedFlag.value = true;
			}
		};

		var tempFlag = this._suite.setUpTestWindow(null, aOptions);
		if (!aOptions || !aOptions.async) {
			this._suite.wait(tempFlag);
			postProcess();
		}
		else {
			ns.setTimeout(postProcess, 0);
		}

		return loadedFlag;
	},

	close : function()
	{
		if (!this.testWindow) return;
		this.listeners = [];
		this.sandboxes = {};
		this.frame = this.frameInTestRunner;
		this.testWindow.close();
		this.testWindow = null;
	},


	getSandboxFor : function(aURI)
	{
		aURI = this._suite.fixupIncompleteURI(aURI);
		if (aURI in this.sandboxes) return this.sandboxes[aURI];

		var self = this;
		var win = (this.frame || this.frameInTestRunner).contentWindow;
		var headers = [];
		var sandbox = {
			get window() {
				return self.frame.contentWindow;
			},
			get unsafeWindow() {
				return self.frame.contentWindow.wrappedJSObject;
			},
			get document() {
				return self.frame.contentDocument;
			},
			XPathResult : Ci.nsIDOMXPathResult,
			GM_log                 : ns.utils.bind(this.GM_log, self),
			GM_getValue            : ns.utils.bind(this.GM_getValue, self),
			GM_setValue            : ns.utils.bind(this.GM_setValue, self),
			GM_registerMenuCommand : ns.utils.bind(this.GM_registerMenuCommand, self),
			GM_xmlhttpRequest      : ns.utils.bind(this.GM_xmlhttpRequest, self),
			GM_addStyle            : ns.utils.bind(this.GM_addStyle, self),
			GM_getResourceURL      : function(aKey) { return self.GM_getResourceURL.call(self, aKey, headers); },
			GM_getResourceText     : function(aKey) { return self.GM_getResourceText.call(self, aKey, headers); },
			GM_openInTab           : ns.utils.bind(this.GM_openInTab, self),
			console : {
				log : ns.utils.bind(this.GM_log, self)
			},
			get GM_headers() {
				return headers;
			}
		};
		sandbox.__proto__ = win; // set this later to avoid "redeclaration of const document" error
		this.sandboxes[aURI] = sandbox;
		return sandbox;
	},
	getSandBoxFor : function(aURI)
	{
		return this.getSandboxFor(aURI);
	},

	kHEADER_START : /==UserScript==/i,
	kHEADER_END   : /==\/UserScript==/i,
	kHEADER_LINE  : /^[^\@]*(\@[^\s]+)\s+(.*)$/,

	loadScript : function(aURI, aEncoding)
	{
		var sandbox = this.getSandboxFor(aURI);
		var script;
		try {
			script = this._suite.include(aURI, sandbox, aEncoding);
		}
		catch(e) {
			throw new Error('Error: GMUtils::loadScript() failed to read specified script.\n'+e);
		}
		var headers = sandbox.GM_headers;
		if (this.kHEADER_START.test(script) && this.kHEADER_END.test(script)) {
			script.split(this.kHEADER_START)[1].split(this.kHEADER_END)[0]
				.split(/[\n\r]+/)
				.forEach(function(aLine) {
					var match = aLine.match(this.kHEADER_LINE);
					if (!match) return;
					headers.push({
						name  : match[1],
						value : match[2]
					});
				}, this);
		}
		return sandbox;
	},



	fireEvent : function(aEvent)
	{
		Array.slice(this.listeners).forEach(function(aListener) {
			if (aListener && 'handleEvent' in aListener)
				aListener.handleEvent(aEvent);
			if (aListener && 'on'+aEvent.type in aListener)
				aListener['on'+aEvent.type](aEvent);
		});
	},

	addListener : function(aListener)
	{
		if (this.listeners.indexOf(aListener) > -1) return;
		this.listeners.push(aListener);
	},
	removeListener : function(aListener)
	{
		var index = this.listeners.indexOf(aListener);
		if (index > -1) return;
		this.listeners.splice(index, 1);
	},


	doAndWaitLoad : function(aFunction, aScope)
	{
		var _this = this;
		var loadedFlag = { value : false };
		var listener = {
				handleEvent : function(aEvent)
				{
					switch (aEvent.type)
					{
						case 'GM_xmlhttpRequestLoad':
						case 'GM_xmlhttpRequestError':
							loadedFlag.value = true;
							_this.removeListener(this);
							break;
					}
				}
			};
		this.addListener(listener);
		if (aFunction) aFunction.call(aScope);
		return loadedFlag;
	},




	GM_log : function(aMessage)
	{
		aMessage = String(aMessage);
		this.fireEvent({ type : 'GM_logCall', message : aMessage });
		var ConsoleService = Cc['@mozilla.org/consoleservice;1']
				.getService(Ci.nsIConsoleService);
		ConsoleService.logStringMessage(aMessage);
		this.logs.push(aMessage);
	},


	GM_getValue : function(aKey, aDefault)
	{
		this.fireEvent({ type : 'GM_getValueCall', key : aKey });
		return (aKey in this.storage) ? this.storage[aKey] : aDefault ;
	},

	GM_setValue : function(aKey, aValue)
	{
		this.fireEvent({ type : 'GM_setValueCall', key : aKey, value : aValue });
		this.storage[aKey] = aValue;
	},


	GM_registerMenuCommand : function(aName, aFunction, aAccelKey, aAccelModifiers, aAccessKey)
	{
		this.fireEvent({ type : 'GM_registerMenuCommandCall',
			name     : aName,
			function : aFunction,
			accelKey : aAccelKey,
			accelModifiers : aAccelModifiers,
			accessKey : aAccessKey
		});
		var command = this.frameInTestRunner.ownerDocument.createElement('menuitem');
		command.setAttribute('label', aName);
		command.oncommand = aFunction;
		if (aAccelKey) {
			var modifiers = '';
			if (aAccelModifiers) {
				modifiers = [];
				var isMac = ns.utils.XULAppInfo.OS.toLowerCase().indexOf('darwin') > -1;
				if (!isMac && /ctrl|control|accel/i.test(aAccelModifiers))
					modifiers.push('Ctrl');
				if (isMac && /ctrl|control/i.test(aAccelModifiers))
					modifiers.push('Control');
				if (/alt/i.test(aAccelModifiers))
					modifiers.push('Alt');
				if (!isMac && /meta/i.test(aAccelModifiers))
					modifiers.push('Meta');
				if (isMac && /meta|accel/i.test(aAccelModifiers))
					modifiers.push('Command');
				if (/shift/i.test(aAccelModifiers))
					modifiers.push('Shift');
				modifiers = modifiers.join('+');
				if (modifiers) modifiers += '+';
			}
			command.setAttribute('acceltext', modifiers+aAccelKey.toUpperCase());
		}
		if (aAccessKey) {
			command.setAttribute('accesskey', aAccessKey);
		}
		this.commands.push(command);
	},


	GM_xmlhttpRequest : function(aDetails)
	{
		this.fireEvent({ type : 'GM_xmlhttpRequestCall', detail : aDetails });

		if (!this.emulateXMLHTTPRequest)
			return;

		var uri = aDetails.url;
		if (typeof uri != 'string')
			throw new Error('Invalid url: url must be of type string');
		if (!/^(http|https|ftp):\/\//.test(uri))
			throw new Error('Invalid url: '+uri);

		var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
				.createInstance(Ci.nsIXMLHttpRequest)
				.QueryInterface(Ci.nsIDOMEventTarget);
		var _this = this;
		var listener = {
				request : request,
				handleEvent : function(aEvent)
				{
					var state = {
						responseText : this.request.responseText,
						readyState : this.request.readyState,
						responseHeaders : (
							this.request.readyState == 4 ?
								this.request.getAllResponseHeaders() :
								''
						),
						status : (
							this.request.readyState == 4 ?
								this.request.status :
								''
						),
						statusText : (
							this.request.readyState == 4 ?
								this.request.statusText :
								''
						),
						finalUrl : (
							this.request.readyState == 4 ?
								this.request.channel.URI.spec :
								''
						),
						handled : false // extended spec of UxU
					};

					var eventType = aEvent.type.charAt(0).toUpperCase()+aEvent.type.substring(1);
					var event = {
							type    : 'GM_xmlhttpRequestBefore'+eventType,
							state   : state,
							handled : false
						};
					_this.fireEvent(event);

					event.type = 'GM_xmlhttpRequest'+eventType;
					if ('on'+aEvent.type in this) {
						state.handled = event.handled = true;
						var func = this['on'+aEvent.type];
						this.frame.contentWindow.setTimeout(function(aState) {
							func(aState);
							_this.fireEvent(event);
						}, 0, state);
						return;
					}
					_this.fireEvent(event);
				},
				frame : this.frame
			};

		if (aDetails.onload) listener.onload = aDetails.onload;
		if (aDetails.onerror) listener.onerror = aDetails.onerror;
		if (aDetails.onreadystatechange) listener.onreadystatechange = aDetails.onreadystatechange;

		request.addEventListener('load', listener, false);
		request.addEventListener('error', listener, false);
		request.addEventListener('readystatechange', listener, false);

		request.open(aDetails.method, uri);

		if (aDetails.overrideMimeType)
			request.overrideMimeType(aDetails.overrideMimeType);

		if (aDetails.headers)
			for (var i in aDetails.headers)
			{
				request.setRequestHeader(i, aDetails.headers[i]);
			}

		request.send(aDetails.data || null);
	},


	GM_addStyle : function(aDocument, aStyle)
	{
		this.fireEvent({ type : 'GM_addStyleCall', document : aDocument, style : aStyle });
		var head = aDocument.getElementsByTagName('head')[0];
		if (!head) return;
		var style = aDocument.createElement('style');
		style.setAttribute('type', 'text/css');
		style.appendChild(aDocument.createTextNode(aStyle));
		head.appendChild(style);
	},

	kRESOURCE : /^([^\s]+)\s+(.+)$/,

	_getResourceURI : function(aKey, aHeaders)
	{
		if (!aKey || !aHeaders) return null;
		var match;
		for (var i in aHeaders)
		{
			if (aHeaders[i].name.toLowerCase() != '@resource' ||
				!(match = aHeaders[i].value.match(this.kRESOURCE)))
				continue;
			if (match[1] == aKey) return match[2];
		}
		return null;
	},

	_getResponse : function(aURI, aMethod)
	{
		var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
				.createInstance(Ci.nsIXMLHttpRequest)
				.QueryInterface(Ci.nsIDOMEventTarget);
		try {
			request.open(aMethod || 'GET', aURI, false);
			request.send(null);
		}
		catch(e) {
		}
		return request;
	},

	GM_getResourceText : function(aKey, aHeaders)
	{
		this.fireEvent({ type : 'GM_getResourceTextCall', key : aKey });
		var uri = this._getResourceURI(aKey, aHeaders);
		if (uri) {
			return this._getResponse(uri).responseText;
		}
		return '';
	},

	GM_getResourceURL : function(aKey, aHeaders)
	{
		this.fireEvent({ type : 'GM_getResourceURLCall', key : aKey });
		var uri = this._getResourceURI(aKey, aHeaders);
		if (uri) {
			var response = this._getResponse(uri, 'HEAD');
			var mimeType = response.getResponseHeader('Content-Type');
			if (!mimeType) {
				var mimeService = Cc['@mozilla.org/mime;1']
						.getService(Ci.nsIMIMEService);
				if (uri.substring(0, 5) == 'file:') {
					mimeType = mimeService.getTypeFromFile(this._suite.getFileFromURLSpec(uri));
				}
				else {
					try {
						mimeType = mimeService.getTypeFromURI(this._suite.makeURIFromSpec(uri));
					}
					catch(e) {
					}
				}
			}
			var channel = Cc['@mozilla.org/network/io-service;1']
						.getService(Ci.nsIIOService)
						.newChannelFromURI(this._suite.makeURIFromSpec(uri));
			var stream = channel.open();
			var binaryStream = Cc['@mozilla.org/binaryinputstream;1']
						.createInstance(Ci.nsIBinaryInputStream);
			binaryStream.setInputStream(stream);
			var data = binaryStream.readBytes(binaryStream.available());
			return 'data:'+mimeType+';base64,'+encodeURIComponent(btoa(data));
		}
		return '';
	},

	GM_openInTab : function(aURI)
	{
		this.fireEvent({ type : 'GM_openInTabCall', uri : aURI });
		if (this.testWindow &&
			this.testWindow.gBrowser)
			this.testWindow.gBrowser.addTab(aURI);
	},


	export : function(aNamespace, aForce)
	{
		var self = this;
		var prototype = GreasemonkeyUtils.prototype;

		if (aForce || !(aNamespace.__lookupGetter__('greasemonkey') || 'greasemonkey' in aNamespace)) {
			aNamespace.__defineGetter__('greasemonkey', function(aValue) {
				return self;
			});
			aNamespace.__defineSetter__('greasemonkey', function(aValue) {
				return aValue;
			});
		}

		for (var aMethod in prototype)
		{
			if (
				!prototype.hasOwnProperty(aMethod) ||
				aMethod.charAt(0) == '_' ||
				/^(export)$/.test(aMethod)
				)
				continue;

			(function(aMethod, aPrefix) {
				var alias = aMethod.indexOf('GM_') == 0 ?
						aMethod :
						aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1) ;
				if (!aForce && (aNamespace.__lookupGetter__(alias) || alias in aNamespace))
					return;

				if (prototype.__lookupGetter__(aMethod) || (typeof prototype[aMethod] != 'function')){
						aNamespace.__defineGetter__(alias, function() {
							return self[aMethod];
						});
				}
				else {
					aNamespace[alias] = ns.utils.bind(prototype[aMethod], self);
				}
			})(aMethod, 'greasemonkey');
		}
	}
};
