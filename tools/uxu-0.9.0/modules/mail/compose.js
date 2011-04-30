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
	this.EXPORTED_SYMBOLS = ['Compose'];

var Cc = Components.classes;
var Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/action.js', ns);
var utils = ns.utils;

const ADDRESS_TYPE_FRAGMENT = '//*[@id="addressingWidget"]/descendant::*[local-name()="menulist" and starts-with(@value, "addr_")]';
	
function Compose(aMailUtils, aSuite) 
{
	this._utils = aMailUtils;
	this._suite = aSuite;
	this.action = new ns.Action(aSuite);
}
Compose.prototype = {
	ERROR_NO_COMPOSE_WINDOW : 'no compose window',

	ADDRESS_TYPE : ADDRESS_TYPE_FRAGMENT,
	ADDRESS_FIELD : ADDRESS_TYPE_FRAGMENT+'/ancestor::*[local-name()="listitem"]/descendant::*[local-name()="textbox"]',
	DUMMY_ROW : '//*[@id="addressingWidget"]/descendant::*[@class="dummy-row"]',
	
	get window() { return this._getWindow(); }, 
	get windows() { return this._getWindows(); },

	get recipients() { return this._getRecipients(); },
	set recipients(aValue) { return this._setRecipients(aValue); },

	get subject() { return this._getSubject(); },
	set subject(aValue) { return this._setSubject(aValue); },

	get body() { return this._getBodyContents(); },
	set body(aValue) { return this.setBodyContents(aValue); },

	get attachments() { return this._getAttachments(); },
	set attachments(aValue) { return this._setAttachments(aValue); },

	get addressFields() { return this._getAddressFields(); },
	get firstAddressField() { return this._getFirstAddressField(); },
	get lastAddressField() { return this._getLastAddressField(); },

	get blankAddressFields() { return this._getBlankAddressFields(); },
	get firstBlankAddressField() { return this._getFirstBlankAddressField(); },
	get lastBlankAddressField() { return this._getLastBlankAddressField(); },

	get addressTypes() { return this._getAddressTypes(); },
	get firstAddressType() { return this._getFirstAddressType(); },
	get lastAddressType() { return this._getLastAddressType(); },

	get dummyRows() { return this._getDummyRows(); },
	get firstDummyRow() { return this._getFirstDummyRow(); },
 
	destroy : function() 
	{
		delete this._utils;
		delete this._suite;
	},
 
// compose window 
	
	_getWindows : function() 
	{
		var composeWindows = [];
		this._suite.getChromeWindows({ type : 'msgcompose' })
			.forEach(function(aWindow) {
				if (this._isWindowReady(aWindow)) {
					composeWindows.push(aWindow);
				}
			}, this);
		return composeWindows;
	},
	
	_getWindow : function() 
	{
		var composeWindows = this._getWindows();
		return composeWindows.length ? composeWindows[0] : null ;
	},
  
	_isWindowReady : function(aComposeWindow) 
	{
		var textboxes = this._getAddressFields(aComposeWindow);
		return (
				!aComposeWindow.closed &&
				(
					textboxes.length > 1 ||
					(
						textboxes.length > 0 &&
						this._getLastAddressField(aComposeWindow) &&
						this._getFirstDummyRow(aComposeWindow)
					)
				)
			);
	},
 
	_ensureWindowReady : function(aComposeWindow) 
	{
		if (!aComposeWindow) {
			aComposeWindow = this._getWindow();
		}
		if (!aComposeWindow) {
			throw new Error(this.ERROR_NO_COMPOSE_WINDOW);
		}
		return aComposeWindow;
	},
  
// window operation 
	
	setUp : function() 
	{
		return utils.doIteration((function(aSelf) {
			yield aSelf._suite.setUpTestWindow();

			var mainWindow = aSelf._suite.getTestWindow();
			yield (function() {
					return 'MsgNewMessage' in mainWindow;
				});

			yield 500; // wait for initializing processes

			// 新規メッセージのウィンドウを開く
			mainWindow.MsgNewMessage(null);

			// ウィンドウが開かれるまで待つ
			yield (function() {
					return composeWindow = aSelf._getWindow();
				});
		})(this));
	},
 
	tearDown : function() 
	{
		if (this._close()) {
			this._suite.tearDownTestWindow();
		}
	},
	
	_close : function(aWindow) 
	{
		var composeWindow = aWindow || this._getWindow();
		if (composeWindow) {
			composeWindow.SetContentAndBodyAsUnmodified();
			composeWindow.MsgComposeCloseWindow(true);
			return true;
		}
		return false;
	},
  
	tearDownAll : function() 
	{
		if (this._closeAll()) {
			this._suite.tearDownTestWindow();
		}
	},
	
	_closeAll : function() 
	{
		var closed = true;
		var composeWindows = this._getWindows();
		for (let i in composeWindows)
		{
			if (!this._close(composeWindows[i])) {
				closed = false;
			}
		}
		return closed;
	},
   
// get input fields 
	
	_getAddressFields : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		return utils.$X(this.ADDRESS_FIELD, aComposeWindow.document);
	},
	_getFirstAddressField : function(aComposeWindow)
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		var fields = this._getAddressFields(aComposeWindow);
		return fields.length ? fields[0] : null ;
	},
	_getLastAddressField : function(aComposeWindow)
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		var fields = this._getAddressFields(aComposeWindow);
		return fields.length ? fields[fields.length-1] : null ;
	},
 
	_getBlankAddressFields : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		var fields = this._getAddressFields(aComposeWindow);
		var blank = [];
		for (let i in fields)
		{
			if (!fields[i].value) blank.push(fields[i]);
		}
		return blank;
	},
	_getFirstBlankAddressField : function(aComposeWindow)
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		var blank = this._getBlankAddressFields(aComposeWindow);
		return blank.length ? blank[0] : null ;
	},
	_getLastBlankAddressField : function(aComposeWindow)
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		var blank = this._getBlankAddressFields(aComposeWindow);
		return blank.length ? blank[blank.length-1] : null ;
	},
 
	_getAddressTypes : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		return utils.$X(this.ADDRESS_TYPE, aComposeWindow.document);
	},
	_getFirstAddressType : function(aComposeWindow)
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		var types = this._getAddressTypes(aComposeWindow);
		return types.length ? types[0] : null ;
	},
	_getLastAddressType : function(aComposeWindow)
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		var types = this._getAddressTypes(aComposeWindow);
		return types.length ? types[types.length-1] : null ;
	},
 
	getAddressTypeForField : function(aField, aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		return utils.$X('ancestor::*[local-name()="listitem"]/descendant::*[local-name()="menulist"]', aField, Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE);
	},
 
	_getDummyRows : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		return utils.$X(this.DUMMY_ROW, aComposeWindow.document);
	},
	_getFirstDummyRow : function(aComposeWindow)
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		return utils.$X(this.DUMMY_ROW, aComposeWindow.document, Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE);
	},
 
	_getBodyFrame : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		return aComposeWindow.document.getElementById('content-frame');
	},
  
// commands 
	
	setRecipients : function(aAddresses, aComposeWindow) 
	{
		return this._setRecipients(aAddresses, false, aComposeWindow)
	},
	appendRecipients : function(aAddresses, aComposeWindow)
	{
		return this._setRecipients(aAddresses, true, aComposeWindow)
	},
	 
	setBodyContents : function(aContents, aComposeWindow) 
	{
		return this._setBodyContents(aContents, false, aComposeWindow);
	},
	appendBodyContents : function(aContents, aComposeWindow)
	{
		return this._setBodyContents(aContents, true, aComposeWindow);
	},
 
	attachFile : function(aFile, aComposeWindow) 
	{
		if (!aFile) return;
		aFile = this._suite.normalizeToFile(aFile);
		if (!aFile || !aFile.exists()) return;
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		if ('AddFileAttachment' in aComposeWindow) { // Thunderbird 3 or later
			aComposeWindow.AddFileAttachment(aFile);
		}
		else { // Thunderbird 2
			aComposeWindow.AttachFile(aFile);
		}
	},
 
	send : function(aAsync, aComposeWindow) 
	{
		this.sendByAPI(aAsync, aComposeWindow);
	},
	
	_send : function(aCommand, aAsync, aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		if (aAsync) {
			// このタイミングでダイアログ等が開かれるとメインスレッドの
			// 処理が止まってしまうため、タイマーを使って非同期で開く。
			aComposeWindow.setTimeout(aCommand, 0);
		}
		else {
			aCommand();
		}
	},
 
	sendByAPI : function(aAsync, aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		this._send(function() {
			aComposeWindow.SendMessage();
		}, aAsync);
	},
 
	sendByButtonClick : function(aAsync, aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		var action = this.action;
		this._send(function() {
			action.fireMouseEventOnElement(aComposeWindow.document.getElementById('button-send'));
		}, aAsync);
	},
   
// user input emulation 
	
	_getSubject : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		return utils.$('msgSubject', aComposeWindow).value;
	},
 
	_setSubject : function(aSubject, aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		this.action.inputTextToField(utils.$('msgSubject', aComposeWindow), aSubject);
	},
 
	_getRecipients : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);

		var types = this._getAddressTypes(aComposeWindow);
		var textboxes = this._getAddressFields(aComposeWindow);
		var array = [];
		textboxes.forEach(function(aTextbox, aIndex) {
			let value = aTextbox.value;
			if (!value) return;
			let type = types[aIndex].value.replace('addr_', '');
			switch (type)
			{
				case 'reply':
					type = 'reply-to';
					break;
				case 'followup':
					type = 'followup-to';
					break;
			}
			array.push({
				type    : type,
				address : value
			});
		}, this);
		return array;
	},
 
	_setRecipients : function(aAddresses, aAppend, aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);

		const ENTER_KEY = { type : 'keypress', keyCode : Ci.nsIDOMKeyEvent.DOM_VK_RETURN };

		if (!aAppend) {
			var types = this._getAddressTypes(aComposeWindow)
			this._getAddressFields(aComposeWindow).forEach(function(aField, aIndex) {
				types[aIndex].value = 'addr_to';
				aField.focus();
				aField.value = '';
			}, this);
		}

		if (!utils.isArray(aAddresses)) aAddresses = [aAddresses];
		aAddresses = aAddresses
						.map(function(aAddress) {
							if (typeof aAddress == 'string') {
								aAddress = { address : aAddress, type : 'to' };
							}

							let type = aAddress.type.toLowerCase();
							switch (type)
							{
								case 'reply-to':
									type = 'reply';
									break;
								case 'followup-to':
									type = 'followup';
									break;
							}
							return {
								type      : aAddress.type,
								typeValue : 'addr_'+type,
								address   : aAddress.address
							};
						})
						.filter(function(aAddress) {
							return aAddress.address;
						});

		var listbox = utils.$('addressingWidget', aComposeWindow);
		aAddresses.forEach(function(aAddress) {
			let field = this._getFirstBlankAddressField(aComposeWindow);
			this.getAddressTypeForField(field, aComposeWindow).value = aAddress.typeValue;
			listbox.ensureElementIsVisible(utils.$X('ancestor::*[local-name()="listitem"]', field, Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE));
			field.focus();
			this.action.inputTextToField(field, aAddress.address);

			if (utils.isSleepAvailable) {
				utils.sleep(100);
				let next;
				do {
					field = this._getLastAddressField(aComposeWindow);
					field.focus();
					this.action.fireKeyEventOnElement(field, ENTER_KEY);
					utils.sleep(100);
					next = this._getFirstBlankAddressField(aComposeWindow);
				}
				while (!next);
			}
			else {
				next = this._getFirstBlankAddressField(aComposeWindow);
				if (!next) {
					aComposeWindow.awAppendNewRow(true);
				}
			}
		}, this);
		return aAddresses;
	},
 
	_getBodyContents : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		return this._getBodyFrame(aComposeWindow).contentDocument.body;
	},
 
	_setBodyContents : function(aContents, aAppend, aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);

		var frame = this._getBodyFrame(aComposeWindow);
		var doc = frame.contentDocument;

		var range = doc.createRange();
		range.selectNodeContents(doc.body);
		if (!aAppend) {
			range.deleteContents();
		}
		range.collapse(false);
		if (aContents instanceof Ci.nsIDOMDocumentFragment ||
			aContents instanceof Ci.nsIDOMNode) {
			aContents = doc.importNode(aContents, true);
			range.insertNode(aContents);
		}
		else {
			var fragment = doc.createDocumentFragment();
			var lines = String(aContents).split(/[\r\n]+/);
			lines.forEach(function(aLine, aIndex) {
				fragment.appendChild(doc.createTextNode(aLine));
				if (aIndex < lines.length-1) {
					fragment.appendChild(doc.createElement('br'));
				}
			});
			range.insertNode(fragment);
		}
		range.detach();

		return aContents;
	},
 
	_getAttachments : function(aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);

		var bucket = aComposeWindow.document.getElementById('attachmentBucket');
		var files = [];
		for (let i = 0, maxi = bucket.getRowCount(); i < maxi; i++)
		{
			let attachment = bucket.getItemAtIndex(i).attachment;
			if (attachment) {
				attachment = this._suite.normalizeToFile(attachment.url);
				if (attachment) {
					files.push(attachment);
				}
			}
		}
		return files;
	},
 
	_setAttachments : function(aFiles, aComposeWindow) 
	{
		aComposeWindow = this._ensureWindowReady(aComposeWindow);
		if (!utils.isArray(aFiles)) {
			aFiles = [aFiles];
		}
		aComposeWindow.RemoveAllAttachments();
		aFiles.forEach(function(aFile) {
			this.attachFile(aFile, aComposeWindow);
		}, this);
	}
  
}; 
   
