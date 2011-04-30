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
	this.EXPORTED_SYMBOLS = ['Context'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/action.js', ns);
Components.utils.import('resource://uxu-modules/test/runner.js', ns);
Components.utils.import('resource://uxu-modules/server/reporter.js', ns);
Components.utils.import('resource://uxu-modules/lib/ijs.js', ns);

var utils = ns.utils;
var action = new ns.Action({ __proto__ : utils, utils : utils });

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);

function Context(aEnvironment)
{
	this.initListeners();

	this.environment = aEnvironment;
	this.environment.__proto__ = this;

	this._buffer = '';
	this._lastEvaluatedScript = '';
}

Context.prototype = {
	__proto__ : ns.EventTarget.prototype,

	RETURNABLE_SYNTAX_ERROR : 'returnable syntax error',
	QUIT_MESSAGE : '\u001A__QUIT__',

	quit : function()
	{
		this.puts(this.QUIT_MESSAGE);
		this.fireEvent('QuitRequest');
	},

	exit : function()
	{
		this.quit();
	},

	inspect : function(aObject)
	{
		return utils.inspect(aObject);
	},

	inspectDOMNode : function(aNode)
	{
		return utils.inspectDOMNode(aNode);
	},

	print : function()
	{
		var message = Array.slice(arguments).join('');
		this.fireEvent('ResponseRequest', message);
	},

	puts : function()
	{
		var message = Array.slice(arguments).join('\n');
		if (!/\n$/.test(message)) message += '\n';
		this.fireEvent('ResponseRequest', message);
	},

	p : function()
	{
		var i;
		for (i = 0; i < arguments.length; i++) {
			this.puts(utils.inspect(arguments[i]));
		}
	},

	error : function(aException)
	{
		this.print(this.formatError(aException));
	},

	load : function(aURI, aContext)
	{
		var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
			.getService(Ci.mozIJSSubScriptLoader);
		return loader.loadSubScript(aURI, aContext || this.environment);
	},

	evaluate : function(aCode)
	{
		try {
			this._lastEvaluatedScript = aCode;
			return this.load('chrome://uxu/content/lib/subScriptRunner.js?code='+encodeURIComponent(aCode));
		}
		catch(e) {
			let parser;
			try {
				parser = new ns.Parser(aCode);
				parser.parse();
			}
			catch(e) {
				if (parser.token === ns.Lexer.EOS && e === ns.Parser.SYNTAX)
					throw new Error(this.RETURNABLE_SYNTAX_ERROR);
			}
			return utils.formatError(utils.normalizeError(e));
		}
	},

	quitApplication : function(aForceQuit)
	{
		utils.quitApplication(aForceQuit);
	},

	closeMainWindows : function()
	{
		var targets = WindowManager.getEnumerator('navigator:browser');
		while (targets.hasMoreElements())
		{
			var target;
			target = targets.getNext().QueryInterface(Ci.nsIDOMWindowInternal);
			target.close();
		}
	},


	onServerInput : function(aEvent) {
		var code = aEvent.data;
		if (/[\r\n]+$/.test(code)) {
			if (this._buffer) {
				code = this._buffer + code;
				this._buffer = '';
			}
		}
		else {
			this._buffer += code;
			return;
		}
		try {
			var result = this.evaluate(code);
			if (result !== undefined)
				this.puts(result);
		}
		catch(e) {
			if (e.message == this.RETURNABLE_SYNTAX_ERROR)
				this._buffer = code;
		}
	}
};
