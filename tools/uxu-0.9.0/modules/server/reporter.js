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
	this.EXPORTED_SYMBOLS = ['Reporter'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/color.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);

var utils = ns.utils;
var Color = ns.Color;

var statusOrder = [
		ns.TestCase.prototype.RESULT_SUCCESS,
		ns.TestCase.prototype.RESULT_FAILURE,
		ns.TestCase.prototype.RESULT_ERROR
	];

function Reporter(aOptions)
{
	this.allTests     = [];
	this.nAssertions  = 0;
	this.nFailures    = 0;
	this.nErrors      = 0;
	this.finished     = false;
	this.result       = '';
	this.resultStatus = ns.TestCase.prototype.RESULT_SUCCESS;
	this.badResults   = [];

	aOptions = aOptions || {};
	this.useColor = aOptions.useColor;
	this._onAbort = aOptions.onAbort;

	this._initializeColor();
}

Reporter.prototype = {

	addListener : function(aListener)
	{
		this.listeners.push(aListener);
	},

	handleEvent : function(aEvent)
	{
		try {
			switch (aEvent.type)
			{
				case 'Start':
					this.onStart(aEvent);
					break;

				case 'TestCaseStart':
					this.doneReports = { count : 0 };
					break;

				case 'TestCaseTestFinish':
					this.onTestFinish(aEvent);
					break;

				case 'TestCaseRemoteTestFinish':
					this.onRemoteTestFinish(aEvent);
					break;

				case 'Finish':
					this.onFinish(aEvent);
					break;

				case 'Error':
					this.onError(aEvent);
					break;

				case 'Abort':
					this.onAbort(aEvent);
					break;
			}
		}
		catch (e) {
			dump(utils.formatError(utils.normalizeError(e)));
		}
	},

	isFinished : function()
	{
		return this.finished;
	},

	abort : function()
	{
		if (this._onAbort && typeof this._onAbort == 'function')
			this._onAbort();
	},

	onStart : function(aEvent)
	{
		this.finished = false;
	},

	onFinish : function(aEvent)
	{
		this.result += "\n\n";
		this._reportBadResults();
		this._reportSummary();

		this.finished = true;

		aEvent.target.removeListener(this);
	},

	onAbort : function(aEvent)
	{
		this.result += "\n\naborted!";
		this.onFinish(aEvent);
	},

	handleTopic : function(aTopic, aTestCase)
	{
		var testId = 'testcase-report-line-'+
					encodeURIComponent(aTestCase.title)+'-'+
					encodeURIComponent(aTestCase.source)+'-'+
					aTopic.index;
		var id = testId + '-'+encodeURIComponent(aTopic.description);
		if (id in this.doneReports)
			return;

		switch (aTopic.result)
		{
		    case ns.TestCase.prototype.RESULT_SKIPPED:
				return;
			case ns.TestCase.prototype.RESULT_SUCCESS:
				this.result += this._colorize('.', this.successColor);
				break;
			case ns.TestCase.prototype.RESULT_FAILURE:
				this.result += this._colorize('F', this.failureColor);
				this.nFailures++;
				break;
			case ns.TestCase.prototype.RESULT_ERROR:
				this._handleError(aTopic, false);
				break;
			default:
				this.result += '?';
				break;
		}
		if (this._isMoreImportantStatus(aTopic.result))
			this.resultStatus = aTopic.result;

		if (this.allTests.indexOf(testId) < 0)
			this.allTests.push(testId);

		if (aTopic.exception)
			this.badResults.push(aTopic);

		this.doneReports[id] = true;
		this.doneReports.count++;
	},

	onTestFinish : function(aEvent)
	{
		aEvent.data.data.topics
				.forEach(function(aTopic) {
					this.handleTopic(aTopic, aEvent.data.testCase);
				}, this);
	},

	onRemoteTestFinish : function(aEvent)
	{
		aEvent.data.data.forEach(function(aReport) {
			aReport.topics
				.slice(this.doneTopicsCount)
				.forEach(function(aTopic) {
					this.handleTopic(aTopic, aEvent.data.testCase);
				}, this);
		}, this);
	},

	onError : function(aEvent)
	{
		var error = aEvent.data;
		var topic = {
			result      : ns.TestCase.prototype.RESULT_ERROR,
			description : "unknown",
			exception   : error
		};
		this._handleError(topic, true);
	},

	_handleError : function(aTopic, aRegisterBadResults)
	{
		this.result += this._colorize('E', this.errorColor);
		if (aRegisterBadResults)
			this.badResults.push(aTopic);
		this.nErrors++;
	},

	_reportBadResults : function()
	{
		var _this = this;

		this.badResults.forEach(function(aTopic, aIndex) {
			if (!aTopic.stack && aTopic.stackTrace)
				aTopic.stack = aTopic.stackTrace.join('\n');

			var formattedIndex, summary, detail, exception;

			formattedIndex = _this._formatIndex(aIndex + 1, _this.badResults.length);
			formattedIndex = " " + formattedIndex + ") ";
			detail = _this._colorize([aTopic.result,
									  aTopic.description].join(': '),
									 _this._statusColor(aTopic.result));
			detail = formattedIndex + detail + '\n';

			exception = aTopic.exception;
			if (aTopic.result == ns.TestCase.prototype.RESULT_FAILURE) {
				if (exception.message) {
					detail += exception.message.replace(/(^[\s\n]+|[\s\n]+$)/, '');
					detail += "\n";
				}
				if (exception.expected)
					detail += " expected: " + exception.expected + "\n";
				if (exception.actual)
					detail += "   actual: " + exception.actual + "\n";
				if (exception.diff)
					detail += "\ndiff:\n" + exception.diff + "\n";
				if (exception.foldedDiff)
					detail += "\nfolded diff:\n" + exception.foldedDiff + "\n";
				detail += _this._formatStackTrace(exception);
			} else {
				detail += _this._formatError(exception);
			}
			_this.result += utils.UCS2ToUTF8(detail);
		});
	},

	_reportSummary : function()
	{
		var resultColor, summary, successRate;

		resultColor = this._statusColor(this.resultStatus);

		summary = [this.allTests.length + " test(s)",
				   // this.nAssertions + " assertion(s)",
				   this.nFailures + " failure(s)",
				   this.nErrors + " error(s)"].join(', ');
		this.result += this._colorize(summary, resultColor);
		this.result += "\n";

		if (this.allTests.length > 0)
			successRate = Math.floor((this.allTests.length - this.badResults.length) * 100 / this.allTests.length);
		else
			successRate = 0;
		this.result += this._colorize(successRate + '% passed.', resultColor);
		this.result += "\n";
	},

	_log10 : function(aNumber)
	{
		return Math.log(aNumber) / Math.log(10);
	},

	_formatIndex : function(aIndex, aMax)
	{
		var result = "";
		var width, maxWidth;
		var i;

		width = Math.floor(this._log10(aIndex)) + 1;
		maxWidth = Math.floor(this._log10(aMax)) + 1;

		for (i = maxWidth - width; i > 0; i--) {
			result += " ";
		}
		result += aIndex;

		return result;
	},

	_formatError : function(aError)
	{
		return aError.toString() + "\n" + this._formatStackTrace(aError);
	},

	_formatStackTrace : function(aError)
	{
		var result = "";
		var options = {
		  onlyFile: true,
		  onlyExternal: true,
		  onlyTraceLine: true
		};
		var stackTrace = utils.formatStackTrace(aError, options);
		stackTrace.split("\n").forEach(function (aLine) {
			var matchData = /^(.*?)@(.+):(\d+)$/.exec(aLine);
			if (matchData) {
				var info = matchData[1];
				var file = matchData[2];
				var line = matchData[3];

				file = utils.getFilePathFromURLSpec(file);
				result += file + ":" + line + ": " + info + "\n";
			} else {
				result += aLine + "\n";
			}
		});

		return result;
	},

	_initializeColor : function()
	{
		this.resetColor = new Color("reset");
		this.successColor = new Color("green", {bold: true});
		this.failureColor = new Color("red", {bold: true});
		this.pendingColor = new Color("magenta", {bold: true});
		this.omissionColor = new Color("blue", {bold: true});
		this.notificationColor = new Color("cyan", {bold: true});
		this.errorColor = new Color("yellow", {bold: true});
	},

	_colorize : function(aText, aColor)
	{
		if (!this.useColor)
			return aText;

		if (!aColor)
			return aText;

		return aColor.escapeSequence() + aText + this.resetColor.escapeSequence();
	},

	_isMoreImportantStatus : function(aStatus)
	{
		return statusOrder.indexOf(aStatus) > statusOrder.indexOf(this.resultStatus);
	},

	_statusColor : function(aStatus)
	{
		return this[aStatus + "Color"];
	}
};
