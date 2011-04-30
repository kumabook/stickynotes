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
	this.EXPORTED_SYMBOLS = ['Message'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var TransportService = Cc['@mozilla.org/network/socket-transport-service;1'] 
		.getService(Ci.nsISocketTransportService);

function Message(aMessage, aHost, aPort, aListener) 
{
	if (!aHost) aHost = 'localhost';

	this._message = (aMessage || '')+'\n';
	this._listener = aListener;
	this._buffer = '';

	var transport = TransportService.createTransport(null, 0, aHost, aPort, null);
	this._output = transport.openOutputStream(0, 0, 0);
	this._input = transport.openInputStream(0, 0, 0);
	this._scriptableInput = Cc['@mozilla.org/scriptableinputstream;1']
				.createInstance(Ci.nsIScriptableInputStream);
	this._scriptableInput.init(this._input);

	this._output.write(this._message, this._message.length);

	this.__defineGetter__('message', function() {
		return this._message;
	});
}

Message.prototype = {
	send : function()
	{
		var pump = Cc['@mozilla.org/network/input-stream-pump;1']
				.createInstance(Ci.nsIInputStreamPump);
		pump.init(this._input, -1, -1, 0, 0, false);
		pump.asyncRead(this, null);
	},

	onStartRequest : function(aRequest, aContext)
	{
	},

	onStopRequest : function(aRequest, aContext, aStatus)
	{
		this.destroy();
	},

	onDataAvailable : function(aRequest, aContext, aInputStream, aOffset, aCount)
	{
		var chunk = this._scriptableInput.read(aCount);
		if (/[\r\n]+$/.test(chunk)) {
			if (this._remoteResultBuffer) {
				chunk = this._buffer + chunk;
				this._buffer = '';
			}
			if (this._listener && this._listener.onResponse) {
				this._listener.onResponse(chunk.replace(/[\r\n]+$/, ''));
			}
		}
		else {
			this._buffer += chunk;
		}
	},

	destroy : function()
	{
		this._scriptableInput.close();
		this._input.close();
		this._output.close();
	}
};
