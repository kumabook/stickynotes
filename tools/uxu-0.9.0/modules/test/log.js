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
	this.EXPORTED_SYMBOLS = ['TestLog'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);

var utils = ns.utils;
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

function TestLog()
{
	this.clear();
}

TestLog.prototype = {
	FORMAT_RAW  : (1 << 0),
	FORMAT_TEXT : (1 << 1),
	FORMAT_HTML : (1 << 2),
	FORMAT_CSV  : (1 << 3),
	FORMAT_TSV  : (1 << 4),
	FORMAT_JSON : (1 << 5),

	IGNORE_SKIPPED : (1 << 10),
	IGNORE_SUCCESS : (1 << 11),

	FORMAT_DEFAULT : (1 << 1) | (1 << 10),// | (1 << 11),

	MAX_PARAMETER_LENGTH_TEXT : 80,

	get items() {
		return this._items;
	},
	set items(aValue) {
		this._items = [];
		this.append(aValue);
		return aValue;
	},
	get lastItem() {
		return this._items[this._items.length-1];
	},

	toString : function(aFormat)
	{
		aFormat = aFormat || this.FORMAT_DEFAULT;
		if (aFormat instanceof Ci.nsIFile)
			aFormat = this._formatForFile(aFormat);

		if (aFormat & this.FORMAT_RAW)
			return this._items.toSource();

		if (aFormat & this.FORMAT_CSV)
			return this._toCSV(',');

		if (aFormat & this.FORMAT_TSV)
			return this._toCSV('\t');

		if (aFormat & this.FORMAT_HTML)
			return this._toHTML();

		if (aFormat & this.FORMAT_JSON)
			return this._toJSON();

		return this._toText(aFormat);
	},
	_formatForFile : function(aFile)
	{
		let name = aFile.leafName;
		return /\.te?xt$/i.test(name) ? this.FORMAT_TEXT :
			/\.csv$/i.test(name) ? this.FORMAT_CSV :
			/\.tsv$/i.test(name) ? this.FORMAT_TSV :
			/\.js(on)?$/i.test(name) ? this.FORMAT_JSON :
			/\.html?$/i.test(name) ? this.FORMAT_HTML :
			this.FORMAT_TEXT;
	},

	_toText : function(aFormat)
	{
		var result = [];
		var testCaseSeparator = bundle.getString('log_separator_testcase');
		var testSeparator = bundle.getString('log_separator_test');
		this._items.forEach(function(aLog) {
			result.push(testCaseSeparator);
			result.push(aLog.source);
			result.push(bundle.getFormattedString('log_start', [aLog.title, new Date(aLog.start)]));
			result.push(testCaseSeparator);
			var outputCount = 0;
			aLog.topics.forEach(function(aTopic, aIndex) {
				if (aFormat & this.IGNORE_SKIPPED &&
					aTopic.result == ns.TestCase.prototype.RESULT_SKIPPED)
					return;
				if (aFormat & this.IGNORE_SUCCESS &&
					aTopic.result == ns.TestCase.prototype.RESULT_SUCCESS)
					return;

				if (outputCount)
					result.push(testSeparator);
				outputCount++;

				result.push(bundle.getFormattedString('log_test_title', [aTopic.description]));
				if (aTopic.parameter) {
					let parameter = aTopic.parameter;
					if (parameter.length > this.MAX_PARAMETER_LENGTH_TEXT)
						parameter = parameter.substr(0, this.MAX_PARAMETER_LENGTH_TEXT)+'...';
					result.push(bundle.getFormattedString('log_test_parameter', [parameter]));
				}
				result.push(bundle.getFormattedString('log_test_step', [aTopic.step]));
				result.push(bundle.getFormattedString('log_test_timestamp', [new Date(aTopic.timestamp)]));
				result.push(bundle.getFormattedString('log_test_result', [bundle.getString('report_result_'+aTopic.result)]));
				result.push(this._getLogTimeStr(aTopic.time));
				if (aTopic.detailedTime && aTopic.time != aTopic.detailedTime)
					result.push(this._getLogTimeStr(aTopic.detailedTime, true));
				if (aTopic.message)
					result.push(aTopic.message);
				if (aTopic.expected)
					result.push(bundle.getFormattedString('log_test_expected', [aTopic.expected]));
				if (aTopic.actual)
					result.push(bundle.getFormattedString('log_test_actual', [aTopic.actual]));
				if (aTopic.diff)
					result.push(bundle.getFormattedString('log_test_diff', [aTopic.diff]));
				if (aTopic.stackTrace && aTopic.stackTrace.length) {
					result.push('');
					result.push(aTopic.stackTrace);
				}
				aTopic.notifications.forEach(function(aNotification) {
					if (!aNotification.description &&
						(!aNotification.stackTrace || !aNotification.stackTrace.length))
						return;
					result.push('');
					if (aNotification.description)
						result.push(aNotification.description);
					if (aNotification.stackTrace && aNotification.stackTrace.length)
						result.push(aNotification.stackTrace);
				}, this);
			}, this);
			result.push(testCaseSeparator);
			if (aLog.aborted)
				result.push(bundle.getFormattedString('log_abort_user', [new Date(aLog.finish)]));
			else
				result.push(bundle.getFormattedString('log_finish', [new Date(aLog.finish)]));
			result.push(this._getLogTimeStr(aLog.time));
			result.push(bundle.getFormattedString('log_result', [aLog.count.success, aLog.count.failure, aLog.count.error, aLog.count.skip]));
			result.push(testCaseSeparator);
			result.push('');
		}, this);
		if (result.length) {
			result.unshift('');
			result.unshift(this._getLogTimeStr(this.totalTime));
			let total = this.totalCount;
			result.unshift(bundle.getFormattedString('all_result_statistical', [total.total, total.success, total.failure, total.error, total.skip]));
			result.push('');
		}
		return result.join('\n');
	},
	_getLogTimeStr : function(aTime, aDetailed)
	{
		var key = aDetailed ? 'log_test_detailedTime' : 'log_test_time' ;
		return bundle.getFormattedString(key, [this._getLogTime(aTime, aDetailed)]);
	},
	_getLogTime : function(aTime, aDetailed)
	{
		var key = aDetailed ? 'log_test_detailedTime' : 'log_test_time' ;
		var formatted = aTime;
		if (aTime >= 1000)
			formatted += ' '+bundle.getFormattedString(key+'_long', [Math.round(aTime / 1000)]);
		return formatted;
	},

	_toCSV : function(aDelimiter)
	{
		var columns = 'source,title,index,description,parameter,timestamp,result,time,detailedTime,message,expected,actual,diff,stackTrace'.split(',');
		var rows = [
				columns.concat(['notifications'])
			];
		this._items.forEach(function(aLog) {
			aLog.topics.forEach(function(aTopic) {
				let row = [];
				columns.forEach(function(aColumn) {
					row.push(aColumn in aTopic ? String(aTopic[aColumn]) : '' );
				}, this);
				var notifications = [];
				if (aTopic.notifications && aTopic.notifications.length) {
					aTopic.notifications.forEach(function(aNotification) {
						if (!aNotification.description &&
							(!aNotification.stackTrace || !aNotification.stackTrace.length))
							return;
						if (aNotification.description)
							notifications.push(aNotification.description);
						if (aNotification.stackTrace && aNotification.stackTrace.length)
							notifications.push(aNotification.stackTrace.join(','));
					}, this);
				}
				row.push(notifications.join('\n'));
				rows.push(row);
			}, this);
		}, this);
		return rows.map(function(aRow) {
				return aRow.map(function(aCell) {
						return '"'+aCell.replace(/"/g, '""')+'"';
					}).join(aDelimiter);
			}).join('\n');
	},

	_toHTML : function()
	{
		var props = 'index,description,parameter,timestamp,result,time,detailedTime,error,message,expected,actual,diff,stackTrace'.split(',');
		var headerRow = bundle.getString('log_html_header_row');
		var rows = [];
		this._items.forEach(function(aLog) {
			var topicRows = [];
			aLog.topics.forEach(function(aTopic) {
				var base = bundle.getString(aTopic.exception ? 'log_html_topic_row_error' : 'log_html_topic_row' );
				props.forEach(function(aProp) {
					let string = !(aProp in aTopic) ? '' :
							aProp == 'result' ?
								bundle.getString('report_result_'+aTopic.result) :
							aProp == 'timestamp' ?
								new Date(aTopic.timestamp) :
							aProp == 'time' ?
								this._getLogTime(aTopic.time) :
							aProp == 'detailedTime' ?
								this._getLogTime(aTopic.detailedTime, true) :
							aProp == 'stackTrace' ?
								aTopic[aProp]/*.map(function(aLine) {
									return aLine.replace(/^.*@/, '')
								})*/.join('\n') :
								aTopic[aProp] ;
					base = base.replace('<<'+aProp+'>>', utils.escapeHTML(string))
								.replace('<<'+aProp+'-raw>>', aTopic[aProp]);
				}, this);

				var notifications = [];
				if (aTopic.notifications && aTopic.notifications.length) {
					aTopic.notifications.forEach(function(aNotification) {
						if (aNotification.description)
							notifications.push(aNotification.description);
					}, this);
				}
				base = base.replace('<<notifications>>', utils.escapeHTML(notifications.join('\n')));
				topicRows.push(base);
			}, this);

			var finish = new Date(aLog.finish);
			if (aLog.aborted)
				finish = bundle.getFormattedString('log_abort_user', [finish]);
			rows.push(
				bundle.getFormattedString('log_html_title_row', [
					utils.escapeHTML(aLog.title),
					utils.escapeHTML(aLog.source),
					utils.escapeHTML(new Date(aLog.start)),
					utils.escapeHTML(finish),
					utils.escapeHTML(this._getLogTime(aLog.time)),
					aLog.count.success,
					aLog.count.failure,
					aLog.count.error,
					aLog.count.skip
				])
			);
			rows.push(headerRow);

			rows = rows.concat(topicRows);
		}, this);
		var table = bundle.getFormattedString('log_html_table', [rows.join('')]);

		let total = this.totalCount;
		return utils.readFrom(utils.getRealURL('chrome://uxu/locale/log.html'), 'UTF-8')
				.replace(/<!--\s*success-count\s*-->/, total.success)
				.replace(/<!--\s*failure-count\s*-->/, total.failure)
				.replace(/<!--\s*error-count\s*-->/, total.error)
				.replace(/<!--\s*skip-count\s*-->/, total.skip)
				.replace(/<!--\s*total-time\s*-->/, this._getLogTime(this.totalTime))
				.replace(/<!--\s*result-table\s*-->/, table);
	},

	_toJSON : function()
	{
		return JSON.stringify(this._items);
	},

	append : function(aNewItems)
	{
		aNewItems.forEach(function(aOneNewItem) {
			if (this._items.some(function(aOneOldItem) {
					if (aOneOldItem.title == aOneNewItem.title &&
						aOneOldItem.source == aOneNewItem.source) {
						for (var i in aOneNewItem)
						{
							aOneOldItem[i] = aOneNewItem[i];
						}
						return true;
					}
					return false;
				}, this))
				return;
			this._items.push(aOneNewItem);
		}, this);
		this._totalTime = null;
		this._totalCount = null;
	},

	clear : function()
	{
		this._items = [];
		this._totalTime = null;
		this._totalCount = null;
	},

	get totalTime()
	{
		if (this._totalTime === null) {
			this._totalTime = 0;
			this._items.forEach(function(aItem) {
				this._totalTime += aItem.time;
			}, this);
		}
		return this._totalTime;
	},

	get totalCount()
	{
		if (!this._totalCount) {
			this._totalCount = this._createNewCount();
			this._items.forEach(function(aItem) {
				if (!aItem.count)
					return;
				for (var i in aItem.count)
				{
					if (!aItem.count.hasOwnProperty(i))
						continue;
					if (!(i in this._totalCount))
						this._totalCount[i] = 0;
					this._totalCount[i] += aItem.count[i];
				}
			}, this);
		}
		return this._totalCount;
	},

	onStart : function(aEvent)
	{
		this._items.push({
			start  : Date.now(),
			title  : aEvent.target.title,
			source : aEvent.target.source,
			topics : [],
			count  : this._createNewCount()
		});
	},
	_createNewCount : function()
	{
		return {
			total   : 0,
			success : 0,
			failure : 0,
			error   : 0,
			skip    : 0
		};
	},

	onTestFinish : function(aEvent)
	{
		var count = this.lastItem.count;
		if (!(aEvent.data.result in count))
			count[aEvent.data.result] = 0;
		count[aEvent.data.result]++;
		count.total++;

		this._totalTime = null;
		this._totalCount = null;

		this.lastItem.topics = this.lastItem.topics.concat(aEvent.data.topics);
	},

	onFinish : function(aEvent)
	{
		if (aEvent.data.result == ns.TestCase.prototype.RESULT_ERROR)
			this.onTestFinish(aEvent);

		this.lastItem.finish = Date.now();
		this.lastItem.time = aEvent.data.time;
	},

	onAbort : function(aEvent)
	{
		this.lastItem.aborted = true;
	}

};

TestLog.FORMAT_RAW     = TestLog.prototype.FORMAT_RAW;
TestLog.FORMAT_TEXT    = TestLog.prototype.FORMAT_TEXT;
TestLog.FORMAT_HTML    = TestLog.prototype.FORMAT_HTML;
TestLog.FORMAT_CSV     = TestLog.prototype.FORMAT_CSV;
TestLog.FORMAT_TSV     = TestLog.prototype.FORMAT_TSV;
TestLog.FORMAT_JSON    = TestLog.prototype.FORMAT_JSON;
TestLog.IGNORE_SKIPPED = TestLog.prototype.IGNORE_SKIPPED;
TestLog.IGNORE_SUCCESS = TestLog.prototype.IGNORE_SUCCESS;
TestLog.FORMAT_DEFAULT = TestLog.prototype.FORMAT_DEFAULT;
