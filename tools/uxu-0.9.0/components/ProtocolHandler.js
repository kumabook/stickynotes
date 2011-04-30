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

// default "@mozilla.org/network/protocol;1?name=http" class id
const DEFAULT_HTTP_PROTOCOL_HANDLER = Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'];
// const DEFAULT_HTTPS_PROTOCOL_HANDLER = Components.classesByID['{dccbe7e4-7750-466b-a557-5ea36c8ff24e}'];

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);
const Pref = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2);
const IOService = Cc['@mozilla.org/network/io-service;1']
			.getService(Ci.nsIIOService);
 
var URIMappingResolver = { 
	
	get available() { 
		return Pref.getBoolPref('extensions.uxu.running');
	},
 
	defaultHttpProtocolHandler : DEFAULT_HTTP_PROTOCOL_HANDLER 
				.getService(Ci.nsIHttpProtocolHandler)
				.QueryInterface(Ci.nsIProtocolHandler)
				.QueryInterface(Ci.nsIProxiedProtocolHandler)
				.QueryInterface(Ci.nsIObserver)
				.QueryInterface(Ci.nsISupportsWeakReference),
//	defaultHttpsProtocolHandler : DEFAULT_HTTPS_PROTOCOL_HANDLER
//				.getService(Ci.nsIHttpProtocolHandler)
//				.QueryInterface(Ci.nsIProtocolHandler)
//				.QueryInterface(Ci.nsIProxiedProtocolHandler)
//				.QueryInterface(Ci.nsISupportsWeakReference),
 
	resolve : function(aURISpec) 
	{
		var uri = aURISpec;
		var finalURI;
		do {
			finalURI = uri;
			uri = this.resolveInternal(uri);
		}
		while (uri);

		if (finalURI == aURISpec)
			return null;

		var schemer = finalURI.split(':')[0];
		var handler = this.getNativeProtocolHandler(schemer);
		switch (schemer)
		{
			case 'file':
				var tempLocalFile = handler
						.QueryInterface(Ci.nsIFileProtocolHandler)
						.getFileFromURLSpec(finalURI);
				return IOService.newFileURI(tempLocalFile);

			default:
				return IOService.newURI(finalURI, null, null);
		}
	},
	
	resolveInternal : function(aURISpec) 
	{
		var uri = Cc['@mozilla.org/supports-string;1']
					.createInstance(Ci.nsISupportsString);
		uri.data = aURISpec;
		ObserverService.notifyObservers(uri, 'uxu-mapping-check', null);
		uri = uri.data;
		return (uri != aURISpec) ? uri : null ;
	},
  
	getNativeProtocolHandler : function(aSchemer) 
	{
		switch (aSchemer)
		{
			case 'http':
				return this.defaultHttpProtocolHandler
						.QueryInterface(Ci.nsIHttpProtocolHandler);

			case 'https':
//				return this.defaultHttpsProtocolHandler
				return this.defaultHttpProtocolHandler
						.QueryInterface(Ci.nsIHttpProtocolHandler);

			case 'file':
				return IOService.getProtocolHandler('file')
						.QueryInterface(Ci.nsIFileProtocolHandler);

			default:
				return IOService.getProtocolHandler(aSchemer)
						.QueryInterface(Ci.nsIProtocolHandler);
		}
	}
 
}; 
  
// HTTP Protocol Handler Proxy 
	
var PrefObserver = { 
	
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'nsPref:changed':
				this.onPrefChange(aData)
				return;
		}
	},
 
	onPrefChange : function(aPrefName) 
	{
		if (aPrefName.indexOf('general.useragent.') > -1) {
			this.timer = Cc['@mozilla.org/timer;1']
							.createInstance(Ci.nsITimer);
			this.timer.init({
				self : this,
				observe : function() {
					ProtocolHandlerProxy.prototype.initProperties();
					this.self.timer.cancel();
					this.self.timer = null;
				}
			}, 100, Ci.nsITimer.TYPE_ONE_SHOT);
		}
	}
 
}; 
Pref.addObserver('general.useragent', PrefObserver, false);
  
function ProtocolHandlerProxy() { 
	this.initNonSecure();
}
ProtocolHandlerProxy.prototype = {
	
	get wrappedJSObject() { 
		return this;
	},
 
	QueryInterface : XPCOMUtils.generateQI([ 
		Ci.nsIHttpProtocolHandler,
		Ci.nsIProtocolHandler,
		Ci.nsIProxiedProtocolHandler,
		Ci.nsIObserver,
		Ci.nsISupportsWeakReference
	]),
 
	init : function() 
	{
		this.mProtocolHandler = URIMappingResolver.defaultHttpProtocolHandler;
	},
	
	initNonSecure : function() 
	{
		this.init();
	},
 
	initSecure : function() 
	{
		this.init();
//		this.mProtocolHandler = URIMappingResolver.defaultHttpsProtocolHandler;
	},
 
	initProperties : function() 
	{
		[
			// nsIHttpProtocolHandler
			'userAgent',
			'appName',
			'appVersion',
			'vendor',
			'vendorSub',
			'vendorComment',
			'product',
			'productSub',
			'productComment',
			'platform',
			'oscpu',
			'language',
			'misc',

			// nsIProtocolHandler
			'scheme',
			'defaultPort',
			'protocolFlags',
		].forEach(function(aProperty) {
			this[aProperty] = URIMappingResolver.defaultHttpProtocolHandler[aProperty];
		}, this);
	},
  
	// nsIProtocolHandler 
	allowPort : function(aPort, aScheme) { return this.mProtocolHandler.allowPort(aPort, aScheme); },
	newURI : function(aSpec, aCharset, aBaseURI) { return this.mProtocolHandler.newURI(aSpec, aCharset, aBaseURI); },
	newChannel: function(aURI)
	{
		if (URIMappingResolver.available) {
			var uri = URIMappingResolver.resolve(aURI.spec);
			if (uri)
				return URIMappingResolver.getNativeProtocolHandler(uri.scheme).newChannel(uri);
		}
		return this.mProtocolHandler.newChannel(aURI);
	},
 
	// nsIProxiedProtocolHandler 
	newProxiedChannel : function(aURI, aProxyInfo)
	{
		if (URIMappingResolver.available) {
			var uri = URIMappingResolver.resolve(aURI.spec);
			if (uri) {
				var handler = URIMappingResolver.getNativeProtocolHandler(uri.scheme);
				try {
					return handler.QueryInterface(Ci.nsIProxiedProtocolHandler)
									.newProxiedChannel(uri, aProxyInfo);
				}
				catch(e) {
					return handler.newChannel(uri);
				}
			}
		}
		return this.mProtocolHandler.newProxiedChannel(aURI, aProxyInfo);
	},
 
	// nsIObserver 
	observe : function(aSubject, aTopic, aData)
	{
		return this.mProtocolHandler.observe(aSubject, aTopic, aData);
	},
 
	// nsISupportsWeakReaference 
	GetWeakReference : function()
	{
		return this.mProtocolHandler.GetWeakReference();
	}
 
}; 
ProtocolHandlerProxy.prototype.initProperties();
  
function HttpProtocolHandlerProxy() { 
	this.initNonSecure();
}
HttpProtocolHandlerProxy.prototype = {
	
	classDescription : 'UxUHttpProtocolHandlerProxy', 
	contractID : '@mozilla.org/network/protocol;1?name=http',
	classID : Components.ID('{3d04c1d0-4e6c-11de-8a39-0800200c9a66}')
 
}; 
HttpProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
  
function HttpsProtocolHandlerProxy() { 
	this.initSecure();
}
HttpsProtocolHandlerProxy.prototype = {
	
	classDescription : 'UxUHttpsProtocolHandlerProxy', 
	contractID : '@mozilla.org/network/protocol;1?name=https',
	classID : Components.ID('{b81efa50-4e7d-11de-8a39-0800200c9a66}')
 
}; 
HttpsProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
   
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([HttpProtocolHandlerProxy, HttpsProtocolHandlerProxy]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([HttpProtocolHandlerProxy, HttpsProtocolHandlerProxy]);
 
