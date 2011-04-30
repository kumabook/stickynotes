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
	this.EXPORTED_SYMBOLS = ['Observer'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);

function Observer()
{
	this.clear();
}

Observer.prototype = {
	get lastSubject() {
		return this.subjects.length ? this.subjects[this.subjects.length-1] : null ;
	},
	get lastTopic() {
		return this.topics.length ? this.topics[this.topics.length-1] : null ;
	},
	get lastData() {
		return this.data.length ? this.data[this.data.length-1] : null ;
	},
	get count() {
		return this.subjects.length;
	},

	observe : function(aSubject, aTopic, aData)
	{
		this.subjects.push(aSubject);
		this.topics.push(aTopic);
		this.data.push(aData);
	},

	startObserve : function(aTopic)
	{
		ObserverService.addObserver(this, aTopic, false);
	},

	endObserve : function(aTopic)
	{
		ObserverService.removeObserver(this, aTopic);
	},

	stopObserve : function(aTopic)
	{
		this.endObserve(aTopic);
	},

	clear : function()
	{
		this.subjects = [];
		this.topics = [];
		this.data = [];
	}
};

