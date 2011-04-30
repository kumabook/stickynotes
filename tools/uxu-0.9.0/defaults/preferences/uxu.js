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

pref("extensions.uxu.running", false);
pref("extensions.uxu.global", false);

pref("extensions.uxu.profile.enableDebugOptions", true);
pref("extensions.uxu.profile.disableAutoUpdate", true);
pref("extensions.uxu.profile.disableExitWarning", true);
pref("extensions.uxu.profile.disableCheckDefaultWarning", true);

pref("extensions.uxu.run.ignoreHiddenFiles", true);
pref("extensions.uxu.run.timeout", 30000);
pref("extensions.uxu.run.timeout.application", 300000);
pref("extensions.uxu.run.history.expire.days", 30); // days
pref("extensions.uxu.defaultEncoding", "UTF-8");
pref("extensions.uxu.showInternalStacks", false);
pref("extensions.uxu.priority.important", "0.9");
pref("extensions.uxu.priority.high",      "0.7");
pref("extensions.uxu.priority.normal",    "0.5");
pref("extensions.uxu.priority.low",       "0.25");
pref("extensions.uxu.warnOnNoAssertion",  true);
pref("extensions.uxu.httpd.noCache",      false);

pref("extensions.uxu.runner.runMode", 0); // 0 = run by priority, 1 = run all
pref("extensions.uxu.runner.runParallel", false);
pref("extensions.uxu.runner.editor", "/usr/bin/gedit +%L %F");
pref("extensions.uxu.runner.editor.defaultOptions.hidemaru.exe", "/j%L,%C \"%F\"");
pref("extensions.uxu.runner.editor.defaultOptions.terapad.exe", "/j=%L \"%F\"");
pref("extensions.uxu.runner.editor.defaultOptions.sakura.exe", "\"%F\" -X=%C -Y=%L");
pref("extensions.uxu.runner.editor.defaultOptions.emeditor.exe", "/l %L /cl %C \"%F\"");
pref("extensions.uxu.runner.editor.defaultOptions.xyzzycli.exe", "-l \"%F\" -g %L -c %C");
pref("extensions.uxu.runner.editor.defaultOptions.moe.exe", "\"%F\" -m %L,%C");
pref("extensions.uxu.runner.editor.defaultOptions.gedit", "+%L %F");
pref("extensions.uxu.runner.editor.defaultOptions.vim", "+%L \"%F\"");
pref("extensions.uxu.runner.editor.defaultOptions.gnuclient", "+%L \"%F\""); // Emacs
pref("extensions.uxu.runner.alwaysRaised", false);
pref("extensions.uxu.runner.autoShowContent", true);
pref("extensions.uxu.runner.autoExpandWindow.sourceViewer", true);
pref("extensions.uxu.runner.autoStart", false);
pref("extensions.uxu.runner.autoStart.server", false);
pref("extensions.uxu.runner.autoStart.oneTime.enabled", true);
pref("extensions.uxu.runner.autoStart.oneTime", false);
pref("extensions.uxu.runner.autoStart.oneTime.server", false);
pref("extensions.uxu.runner.autoStart.oneTime.port", 0);
pref("extensions.uxu.runner.autoExit", false);
pref("extensions.uxu.runner.lastPath", "");
pref("extensions.uxu.runner.lastLog", "");
pref("extensions.uxu.runner.lastResults", "");
pref("extensions.uxu.runner.coloredDiff", true);

pref("extensions.uxu.port",       4444);
pref("extensions.uxu.allowAccessesFromRemote", false);
pref("extensions.uxu.allowAccessesFromRemote.allowedList", "127.0.0.1,localhost,192.168.*.*");

pref("extensions.uxu@clear-code.com.name", "chrome://uxu/locale/uxu.properties") ;
pref("extensions.uxu@clear-code.com.description", "chrome://uxu/locale/uxu.properties") ;
