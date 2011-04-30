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
	this.EXPORTED_SYMBOLS = ['Handler'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);

function Handler(aInput, aOutput)
{
	this.initListeners();

	var scriptableInput = Cc['@mozilla.org/scriptableinputstream;1']
			.createInstance(Ci.nsIScriptableInputStream);
	var pump = Cc['@mozilla.org/network/input-stream-pump;1']
			.createInstance(Ci.nsIInputStreamPump);

	scriptableInput.init(aInput);
	this._input = scriptableInput;
	this._output = aOutput;

	this._buffer = '';

	pump.init(aInput, -1, -1, 0, 0, false);
	pump.asyncRead(this, null);
}

Handler.prototype = {
	__proto__ : ns.EventTarget.prototype,

	destroy : function()
	{
		if (this._input) {
			this._input.close();
			this._input = null;
			this._buffer = '';
		}
		if (this._output) {
			this._output.close();
			this._output = null;
		}
		this.removeAllListeners();
	},

	onQuitRequest : function()
	{
		this.destroy();
	},

	onOutputRequest : function(aEvent)
	{
		if (this._output)
			this._output.write(aEvent.data, aEvent.data.length);
		else
			dump("QUITED: " + aEvent.data);
	},


	// nsIStreamListener

	onStartRequest : function(aRequest, aContext)
	{
	},

	onStopRequest : function(aRequest, aContext, aStatus)
	{
	},

	onDataAvailable : function(aRequest, aContext, aInputStream, aOffset, aCount)
	{
		if (!this._input) return;
		var input = this._input.read(aCount);
		if (input) this.fireEvent('HandlerInput', input);
	}
};
