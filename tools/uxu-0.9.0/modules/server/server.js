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
	this.EXPORTED_SYMBOLS = ['Server'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/server/handler.js', ns);

var utils = ns.utils;

function Server(aPort)
{
	this.initListeners();

	this._port  = (typeof aPort == 'number') ? aPort : -1 ;
	this._allowAccessesFromRemote = utils.getPref('extensions.uxu.allowAccessesFromRemote');

	this.socket = null;
	this._handlers = [];
}

Server.prototype = {
	__proto__ : ns.EventTarget.prototype,

	get port() {
		return this.socket ? this.socket.port : this._port ;
	},

	start : function()
	{
		this.socket = Cc['@mozilla.org/network/server-socket;1']
			.createInstance(Ci.nsIServerSocket);

		try {
			this.socket.init(this._port, !this._allowAccessesFromRemote, -1);
			this.socket.asyncListen(this);
		}
		catch (e) {
			// already bound
			this.socket = null;
		}
	},

	stop : function()
	{
		this._handlers.forEach(function (aHandler) {
			this.removeListener(aHandler);
			aHandler.removeListener(this);
			aHandler.destroy();
		}, this);
		this._handlers = [];
		this.removeAllListeners();
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	},

	destroy : function()
	{
		this.stop();
	},


	// from listener to handler
	onResponseRequest : function(aEvent)
	{
		this.fireEvent('OutputRequest', aEvent.data);
	},

	// from handler to listener
	onHandlerInput : function(aEvent)
	{
		this.fireEvent('ServerInput', aEvent.data);
	},

	onQuitRequest : function(aEvent)
	{
		this.fireEvent('QuitRequest', aEvent.data);
	},


	// nsIServerSocketListener

	onSocketAccepted : function(aSocket, aTransport)
	{
		aTransport = aTransport.QueryInterface(Ci.nsISocketTransport);
		try {
			if (this._allowAccessesFromRemote) {
				var host = aTransport.host;
				var list = utils.getPref('extensions.uxu.allowAccessesFromRemote.allowedList');
				if (!list.split(/[,;\s]+/).some(function(aHost) {
						aHost = new RegExp('^'+aHost.replace(/\./g, '\\.').replace(/\*/g, '.*')+'$', 'i');
						return aHost.test(host);
					})) {
					aTransport.close(Components.results.NS_ERROR_UNKNOWN_HOST);
					dump('Access from <'+host+'> is rejected by UxU.\n');
					return;
				}
				dump('Access from <'+host+'> is accepted by UxU.\n');
			}

			var input  = aTransport.openInputStream(0, 0, 0);
			var output = aTransport.openOutputStream(0, 0, 0);
			var handler = new ns.Handler(input, output);
			handler.addListener(this);
			this.addListener(handler);
			this._handlers.push(handler);
		}
		catch (e) {
			aTransport.close(Components.results.NS_ERROR_UNEXPECTED);
			dump('UxU: Error: ' + utils.formatError(utils.normalizeError(e)) + '\n');
		}
	},

	onStopListening : function(aSocket, aStatus)
	{
		this.stop();
	}
};
