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
	this.EXPORTED_SYMBOLS = ['Report'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);

var utils = ns.utils;
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

/**
 * @class Report for tests. One report is mapped to one context
 *        and multiple topics.
 */
function Report()
{
	this._description   = null;
	this._result        = null;
	this._topics        = [];
	this._notifications = [];
	this.testCase       = null;
	this.test           = null;
	this.id             = null;
	this.index          = -1;

	this._startAt = -1;
	this._finishAt = -1;

	this._startAtDetailed = -1;
	this._finishAtDetailed = -1;

	this.onStart();
}

Report.prototype = {

	/**
	 * The description for the context. If there is no specified value,
	 * this inherits the description of the last topic of the report itself.
	 */
	get description()
	{
		return this._description || this.lastDescription;
	},
	set description(aValue)
	{
		return this._description = aValue;
	},
	_description : null,

	/**
	 * The total result of the context. If there is any error except
	 * AssertionFailed, this is "error". If there is any AssertionFailed,
	 * this is "failure". Otherwise this inherits the last result.
	 */
	get result()
	{
		return !this.hasTopic() ? this._result :
				(this._result || this.lastResult);
	},
	_result : null,

	get step()
	{
		return (this.index+1) +
				'/' +
				(this.testCase ? this.testCase.tests.length : 0 );
	},

	get percentage()
	{
		return this.index > -1 && this.testCase ?
				Math.floor((this.index+1) * 100 / this.testCase.tests.length) :
				100 ;
	},

	/**
	 * Topics for the context.
	 */
	_topics : [],

	/**
	 * Formatted topics
	 */
	get topics()
	{
		return this._topics.map(this._formatTopic, this);
	},
	_formatTopic : function(aTopic)
	{
		if (aTopic._formatted)
			return aTopic;

		if (this.parameter)
			aTopic.parameter = this.parameter;
		if (this.formattedParameter)
			aTopic.formattedParameter = this.formattedParameter;

		aTopic.time          = this.time;
		aTopic.detailedTime  = this.detailedTime;
		aTopic.notifications = this.notifications;

		if (aTopic.exception) {
			let e = aTopic.exception;
			if (e.expected)
				aTopic.expected = e.expected;
			if (e.actual)
				aTopic.actual = e.actual;
			if (e.diff)
				aTopic.diff = e.foldedDiff || e.diff;
			if (e.encodedDiff)
				aTopic.encodedDiff = e.encodedDiff;
			aTopic.message = e.message.replace(/^\s+/, '');
			if (utils.hasStackTrace(e))
				aTopic.stackTrace = utils.formatStackTraceForDisplay(e);

			// replace with simple hash, for logging
			aTopic.exception = utils.toHash(e, 'name,message,expected,actual,diff,foldedDiff,encodedDiff,stack');
		}

		// replace with simple hash, for logging
		if (this.test) {
			aTopic.test = utils.toHash(this.test, 'name,description,hash,id');
		}
		if (this.testCase) {
			aTopic.testCase = utils.toHash(this.testCase, 'title,source');
			aTopic.title = aTopic.testCase.title;
			aTopic.source = aTopic.testCase.source;
		}

		aTopic.index = this.index === void(0) ? -1 : this.index ;
		aTopic.step = this.step;
		aTopic.percentage = this.percentage;

		aTopic._formatted = true;
		return aTopic;
	},

	/**
	 * @param {{result      : string,
	 *          description : string,
	 *          exception   : Error}} aTopic
	 */
	addTopic : function(aTopic)
	{
		if (!aTopic)
			return;

		if (!aTopic.description && this.description)
			aTopic.description = this.description;

		if (!aTopic.exception)
			aTopic.exception = null;

		if (!aTopic.timestamp)
			aTopic.timestamp = Date.now();

		if ((!this._result && aTopic.result == ns.TestCase.prototype.RESULT_ERROR) ||
			aTopic.result == ns.TestCase.prototype.RESULT_FAILURE)
			this._result = aTopic.result;

		this._topics.push(aTopic);
	},

	hasTopic : function()
	{
		return this._topics.length > 0;
	},

	get lastTopic()
	{
		return this.hasTopic() ? this._topics[this._topics.length-1] : null ;
	},

	get lastResult()
	{
		return this.hasTopic() ? this.lastTopic.result : null ;
	},

	get lastDescription()
	{
		return this.hasTopic() ? this.lastTopic.description : null ;
	},

	get notifications()
	{
		return this._notifications;
	},
	set notifications(aValue)
	{
		return this._notifications = aValue.map(function(aNotification) {
					var type = aNotification.type || 'notification';
					var description = bundle.getFormattedString(
										'notification_message_'+type,
										[aNotification.message]
									) ||
									aNotification.message;
					return {
						type        : type,
						description : description,
						stackTrace  : utils.formatStackTraceForDisplay(aNotification)
					};
				});
	},
	_notifications : [],

	get time() {
		return (this._startAt < 0 || this._finishAt < 0) ?
			0 :
			this._finishAt - this._startAt ;
	},
	get detailedTime() {
		return (this._startAtDetailed < 0 || this._finishAtDetailed < 0) ?
			0 :
			this._finishAtDetailed - this._startAtDetailed ;
	},

	onStart : function()
	{
		this._startAt = Date.now();
	},

	onFinish : function()
	{
		this._finishAt = Date.now();
	},

	onDetailedStart : function()
	{
		this._startAtDetailed = Date.now();
	},

	onDetailedFinish : function()
	{
		this._finishAtDetailed = Date.now();
	}
};
