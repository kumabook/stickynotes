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
	this.EXPORTED_SYMBOLS = ['MailComposeProxy'];

var Cc = Components.classes;
var Ci = Components.interfaces;

var ns = {}; 
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/mail/utils.js', ns);

var utils = ns.utils;
var mailUtils = new ns.MailUtils({ __proto__ : utils, utils : utils });

function MailComposeProxy(aReal)
{
	this._real = aReal;

	properties
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\s*\/\/.+$/mg, '')
		.split(/\s+/)
		.forEach(function(aProp) {
			if (aProp in this || !(aProp in this._real)) return;
			this.__defineGetter__(aProp, function() {
				return this._real[aProp];
			});
			this.__defineSetter__(aProp, function(aValue) {
				return this._real[aProp] = aValue;
			});
		}, this);
	(readOnlyProperties+methods)
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\s*\/\/.+$/mg, '')
		.split(/\s+/)
		.forEach(function(aProp) {
			if (aProp in this || !(aProp in this._real)) return;
			this.__defineGetter__(aProp, function() {
				return this._real[aProp];
			});
		}, this);


	this.DEBUG = false;
}

MailComposeProxy.prototype = {


SendMsg : function(aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress)
{
	if (this.DEBUG ||
		utils.getPref('extensions.uxu.running')) {
		this._fakeSendMsg.apply(this, arguments);
	}
	else {
		return this._real.SendMsg.apply(this._real, arguments);
	}
},

_fakeSendMsg : function(aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress)
{
	var compFields = this._real.compFields;
	try {
		if (compFields instanceof Ci.nsIMsgCompFields) {
			var contentType = null;
			// nsMsgCompose::SendMsgの実装の部分移植。
			// プレーンテキストメールしか送信できない。HTMLメールはどうしたらいいのやら……
			if (!this._real.composeHTML) {
				contentType = 'text/plain';
				if (this._real.editor) {
					/* http://mxr.mozilla.org/mozilla1.8/source/content/base/public/nsIDocumentEncoder.h */
					var flags = 2    /* nsIDocumentEncoder::OutputFormatted */ |
								512  /* nsIDocumentEncoder::OutputCRLineBreak */ |
								1024 /* nsIDocumentEncoder::OutputLFLineBreak */;
					if (mailUtils.useFormatFlowed(compFields.characterSet))
						flags |= 64; /* nsIDocumentEncoder::OutputFormatFlowed */
					compFields.body = '';
					compFields.body = this._real.editor.outputToString('text/plain', flags);
				}
			}
			if (compFields.body) {
				var info = {};
				try {
					info = mailUtils.saveAsCharset(contentType, compFields.characterSet, compFields.body);
					if (compFields.forceMsgEncoding) {
						info.isAsciiOnly = false;
					}
				}
				catch(e) {
					if (compFields.needToCheckCharset) {
						info.output = utils.UnicodeToX(compFields.body, 'UTF-8');
					}
				}
				if (info.fallbackCharset) {
					compFields.characterSet = info.fallbackCharset;
				}
				compFields.bodyIsAsciiOnly = info.isAsciiOnly || false;
				if (info.output) {
					compFields.body = info.output;
				}
			}
			else {
				compFields.body = utils.UnicodeToX(compFields.body, 'ASCII');
			}
		}

		mailUtils.emulateSendMessage(aMsgWindow, compFields);

		var progress = this._real.progress;
		var compFields = this._real.compFields;
		var win = this._real.domWindow;
		if (compFields.fcc) {
			if (compFields.fcc.toLowerCase() == 'nocopy://') {
				if (progress) {
					progress.unregisterListener(this._real);
		//			progress.closeProgressDialog(false);
				}
				if (win) this._real.CloseWindow(true);
			}
		}
		else {
			if (progress) {
				progress.unregisterListener(this._real);
		//		progress.closeProgressDialog(false);
			}
			if (win) this._real.CloseWindow(true);
		}
		if (this._real.deleteDraft) this._real.removeCurrentDraftMessage(this._real, false);
	}
	catch(e) {
		if (!this.DEBUG) throw e;
	}
},

/*
abort : function()
{
},
*/

// fallback
__noSuchMethod__ : function(aName, aArgs)
{
	if (!(aName in this._real)) {
		throw 'MailComposeProxy: the property "'+aName+'" is undefined.';
	}
	return this._real[aName].apply(this._real, aArgs);
}

};


var properties = <![CDATA[
		type
		bodyModified
		savedFolderURI
		recyclingListener
		recycledWindow
		deleteDraft
		insertingQuotedContent
	]]>.toString();
var readOnlyProperties = <![CDATA[
		messageSend
		editor
		domWindow
		compFields
		composeHTML
		wrapLength
		progress
		originalMsgURI
	]]>.toString();
var methods = <![CDATA[
		Initialize 
		SetDocumentCharset
		RegisterStateListener
		UnregisterStateListener
		SendMsg
		CloseWindow
		abort
		quoteMessage
		AttachmentPrettyName
		checkAndPopulateRecipients
		CheckAndPopulateRecipients
		bodyConvertible
		SetSignature
		checkCharsetConversion
		initEditor
		addMsgSendListener
		removeMsgSendListener

		onStartSending
		onProgress
		onStatus
		onStopSending
		onGetDraftFolderURI
		onSendNotPerformed
	]]>.toString();

