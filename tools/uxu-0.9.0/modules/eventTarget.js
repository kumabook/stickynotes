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
	this.EXPORTED_SYMBOLS = ['EventTarget'];

function EventTarget()
{
	this.initListeners();
}

EventTarget.prototype = {

initListeners : function()
{
	this._listeners = [];
},
 
inheritListeners : function(aOriginal) 
{
	this._ensureHasOwnListeners();
	aOriginal._ensureHasOwnListeners();
	aOriginal._listeners.forEach(function(aListener) {
		this.addListener(aListener);
		if (aListener._listeners.indexOf(aOriginal) > -1 &&
			'addListener' in aListener)
			aListener.addListener(this);
	}, this);
},

_ensureHasOwnListeners : function()
{
	if (this.hasOwnProperty('_listeners')) return;
	this.initListeners();
},

addListener : function(aListener) 
{
	this._ensureHasOwnListeners();
	if (this._listeners.indexOf(aListener) < 0)
		this._listeners.push(aListener);
},
 
removeListener : function(aListener) 
{
	this._ensureHasOwnListeners();
	var index = this._listeners.indexOf(aListener);
	if (index > -1)
		this._listeners.splice(index, 1);
},
 
removeAllListeners : function() 
{
	this._ensureHasOwnListeners();
	this._listeners.forEach(function(aListener) {
		if ('removeListener' in aListener)
			aListener.removeListener(this);
	}, this);
	this._listeners = [];
},
 
fireEvent : function(aType, aData) 
{
//	this._ensureHasOwnListeners();
	var event = {
			type   : aType,
			target : this,
			data   : aData
		};
	// We have to clone array before dispatch event, because
	// it will be stopped unexpectedly if some listener is
	// dynamically removed.
	Array.slice(this._listeners).forEach(function(aListener) {
		if (!aListener) return;
		try {
			if (typeof aListener == 'function')
				aListener(event);
			else if ('handleEvent' in aListener &&
					typeof aListener.handleEvent == 'function')
				aListener.handleEvent(event);
			else if ('on'+aType in aListener &&
					typeof aListener['on'+aType] == 'function')
				aListener['on'+aType](event);
		}
		catch(e) {
		}
	});
}

};
