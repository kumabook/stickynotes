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
	this.EXPORTED_SYMBOLS = ['Action'];

var ns = {};
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/lib/action.jsm', ns);
 
function Action(aSuite) 
{
	this._suite = aSuite;
	this._readiedActionListener = null;
}
 
Action.prototype = { 
	
destroy : function() 
{
	this.cancelReadiedActions();
	delete this._suite;
},
 
/* ダイアログ操作の予約 */ 
COMMON_DIALOG_URL : 'chrome://global/content/commonDialog.xul',
SELECT_DIALOG_URL : 'chrome://global/content/selectDialog.xul',
	
_getWindowWatcherListener : function()
{
	if (this._readiedActionListener)
		return this._readiedActionListener;

	var self = this;
	var listener = function(aWindow) {
			var index = -1;
			listener.listeners.some(function(aListener, aIndex) {
				if (aListener.call(null, aWindow)) {
					index = aIndex;
					return true;
				}
				return false;
			});
			if (index > -1)
				self._removeWindowWatcherListener(listener.listeners[index]);
		};
	listener.listeners = [];
	this._suite.addWindowWatcher(listener, 'load');
	return this._readiedActionListener = listener;
},
 
_addWindowWatcherListener : function(aListener)
{
	this._getWindowWatcherListener().listeners.push(aListener);
},
 
_removeWindowWatcherListener : function(aListener)
{
	if (!this._readiedActionListener)
		return;

	var listener = this._getWindowWatcherListener();
	listener.listeners =
		listener.listeners
			.filter(function(aRegisteredListener) {
				return aRegisteredListener != aListener;
			});
	if (!listener.listeners.length) {
		this._suite.removeWindowWatcher(this._readiedActionListener);
		this._readiedActionListener = null;
	}
},
 
readyToOK : function(aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (
				aWindow.location.href != self.COMMON_DIALOG_URL ||
				(!aWindow.gCommonDialogParam && !aWindow.gArgs) ||
				aWindow.__uxu__willBeClosed
				)
				return false;

			var buttonsCount, title, message;
			if (aWindow.gCommonDialogParam) { // -Firefox 3.6
				let params = aWindow.gCommonDialogParam;
				buttonsCount = params.GetInt(2);
				title = params.GetString(12);
				message = params.GetString(0);
			}
			else { // Firefox 4.0-
				let params = aWindow.gArgs;
				buttonsCount = aWindow.numButtons;
				title = params.getProperty('title');
				message = params.getProperty('text');
			}

			if (
				(buttonsCount != 1) ||
				('title' in aOptions && aOptions.title != title) ||
				('message' in aOptions && aOptions.message != message)
				)
				return false;

			aWindow.__uxu__willBeClosed = true;

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick(checkbox);
				}

				doc.documentElement.getButton('accept').doCommand();
			}, 0);

			return true;
		};
	this._addWindowWatcherListener(listener);
	return listener;
},
readyToOk : function(aOptions) { return this.readyToOK(aOptions); },
 
readyToConfirm : function(aYes, aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (
				aWindow.location.href != self.COMMON_DIALOG_URL ||
				(!aWindow.gCommonDialogParam && !aWindow.gArgs) ||
				aWindow.__uxu__willBeClosed
				)
				return false;

			var buttonsCount, title, message;
			if (aWindow.gCommonDialogParam) { // -Firefox 3.6
				let params = aWindow.gCommonDialogParam;
				buttonsCount = params.GetInt(2);
				title = params.GetString(12);
				message = params.GetString(0);
			}
			else { // Firefox 4.0-
				let params = aWindow.gArgs;
				buttonsCount = aWindow.numButtons;
				title = params.getProperty('title');
				message = params.getProperty('text');
			}

			if (
				(buttonsCount != 2 && buttonsCount != 3) ||
				('title' in aOptions && aOptions.title != title) ||
				('message' in aOptions && aOptions.message != message)
				)
				return false;

			aWindow.__uxu__willBeClosed = true;

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick(checkbox);
				}

				var button = (typeof aYes == 'number') ?
						aYes :
						(aYes ? 0 : 1 ) ;
				button = Math.min(button, buttonsCount-1);
				var buttonType;
				switch (button)
				{
					default:
					case 0: buttonType = 'accept'; break;
					case 1: buttonType = 'cancel'; break;
					case 2: buttonType = 'extra1'; break;
				}

				doc.documentElement.getButton(buttonType).doCommand();
			}, 0);

			return true;
		};
	this._addWindowWatcherListener(listener);
	return listener;
},
 
readyToPrompt : function(aInput, aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (
				aWindow.location.href != self.COMMON_DIALOG_URL ||
				(!aWindow.gCommonDialogParam && !aWindow.gArgs) ||
				aWindow.__uxu__willBeClosed
				)
				return false;

			var inputFieldsCount, passwordType, title, message;
			if (aWindow.gCommonDialogParam) { // -Firefox 3.6
				let params = aWindow.gCommonDialogParam;
				inputFieldsCount = params.GetInt(3);
				passwordType = params.GetInt(4) == 1;
				title = params.GetString(12);
				message = params.GetString(0);
			}
			else { // Firefox 4.0-
				let params = aWindow.gArgs;
				inputFieldsCount = 0;
				let loginShown = !aWindow.document.getElementById('loginContainer').hidden;
				let passwordShown = !aWindow.document.getElementById('password1Container').hidden;
				if (loginShown)
					inputFieldsCount++;
				if (passwordShown)
					inputFieldsCount++;
				passwordType = !loginShown && passwordShown;
				title = params.getProperty('title');
				message = params.getProperty('text');
			}

			if (
				(aOptions.inputFieldsType == 'both' ?
					(inputFieldsCount != 2) :
					(inputFieldsCount != 1)) ||
				(passwordType != (aOptions.inputFieldsType == 'password')) ||
				('title' in aOptions && aOptions.title != title) ||
				('message' in aOptions && aOptions.message != message)
				)
				return false;

			aWindow.__uxu__willBeClosed = true;

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick(checkbox);
				}

				var usernameField = doc.getElementById('loginTextbox');
				var password1Field = doc.getElementById('password1Textbox');

				switch (aOptions.inputFieldsType)
				{
					default:
						usernameField.value = aInput;
						break;

					case 'password':
						password1Field.value = aOptions.password;
						break;

					case 'both':
						usernameField.value = aOptions.username;
						password1Field.value = aOptions.password;
						break;
				}

				doc.documentElement.getButton('accept').doCommand();
			}, 0);

			return true;
		};
	this._addWindowWatcherListener(listener);
	return listener;
},
 
readyToPromptPassword : function(aPassword, aOptions) 
{
	this.readyToPrompt(
		null,
		{
			password : aPassword,
			inputFieldsType : 'password',
			__proto__ : aOptions
		}
	);
},
 
readyToPromptUsernameAndPassword : function(aUsername, aPassword, aOptions) 
{
	this.readyToPrompt(
		null,
		{
			username : aUsername,
			password : aPassword,
			inputFieldsType : 'both',
			__proto__ : aOptions
		}
	);
},
 
readyToSelect : function(aSelectedIndexes, aOptions) 
{

	aOptions = aOptions || {};
	if (typeof aSelectedIndexes == 'number')
		aSelectedIndexes = [aSelectedIndexes];

	var self = this;
	var listener = function(aWindow) {
			if (
				aWindow.location.href != self.SELECT_DIALOG_URL ||
				aWindow.__uxu__willBeClosed
				)
				return false;

			var params = aWindow.gArgs || aWindow.gCommonDialogParam;
			if (!params) {
				try {
					params = aWindow.arguments[0].QueryInterface(Ci.nsIDialogParamBlock);
				}
				catch(e) {
				}
				if (!params) return false;
			}

			var title, message;
			if (aWindow.gArgs) { // Firefox 4.0-
				title = params.getProperty('title');
				message = params.getProperty('text');
			}
			else { // -Firefox 3.6
				title = params.GetString(0);
				message = params.GetString(1);
			}

			if (
				('title' in aOptions && aOptions.title != title) ||
				('message' in aOptions && aOptions.message != message)
				)
				return false;

			aWindow.__uxu__willBeClosed = true;

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var list = doc.getElementById('list');
				aSelectedIndexes.forEach(function(aIndex) {
					var item = list.getItemAtIndex(aIndex);
					if (!item)
						return;

					if (list.selType == 'multiple')
						list.addItemToSelection(item);
					else
						list.selectedIndex = aIndex;
				});
				doc.documentElement.getButton('accept').doCommand();
			}, 0);

			return true;
		};
	this._addWindowWatcherListener(listener);
	return listener;
},
 
cancelReadiedActions : function() 
{
	if (!this._readiedActionListener)
		return;

	this._suite.removeWindowWatcher(this._readiedActionListener);
	this._readiedActionListener = null;
},
	
cancelReadiedAction : function(aListener) 
{
	this._removeWindowWatcherListener(aListener);
},
   
export : function(aNamespace, aForce) 
{
	var self = this;
	var prototype = Action.prototype;
	aNamespace.__defineGetter__('action', function() {
		return self;
	});
	aNamespace.__defineSetter__('action', function(aValue) {
		return aValue;
	});
	for (var aMethod in prototype)
	{
		if (
			!prototype.hasOwnProperty(aMethod) ||
			typeof prototype[aMethod] != 'function' ||
			aMethod.charAt(0) == '_' ||
			aMethod == 'export' ||
			(!aForce && (aNamespace.__lookupGetter__(aMethod) || aMethod in aNamespace))
			)
			continue;

		(function(aMethod, aPrefix) {
			var alias = aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1);
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
		})(aMethod, 'action');
	}
}
 
}; 

ns.action.export(Action.prototype);
  
