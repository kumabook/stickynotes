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
	this.EXPORTED_SYMBOLS = ['Color', 'MixColor'];

var NAMES = ["black", "red", "green", "yellow",
             "blue", "magenta", "cyan", "white"];

function Color(aName, aOptions)
{
    this.name = aName;
    if (!aOptions)
        aOptions = {};

    this.foreground = aOptions.foreground;
    if (this.foreground === undefined)
        this.foreground = true;
    this.intensity = aOptions.intensity;
    this.bold = aOptions.bold;
    this.italic = aOptions.italic;
    this.underline = aOptions.underline;
}

Color.prototype = {
    sequence: function ()
    {
        var _sequence = [];

        switch (this.name) {
            case "none":
                break;
            case "reset":
                _sequence.push("0");
                break;
            default:
                var foregroundParameter, color;
                foregroundParameter = this.foreground ? 3 : 4;
                if (this.intensity)
                    foregroundParameter += 6;
                color = NAMES.indexOf(this.name);
                _sequence.push("" + foregroundParameter + color);
                break;
        }

        if (this.bold)
            _sequence.push("1");
        if (this.italic)
            _sequence.push("3");
        if (this.underline)
            _sequence.push("4");

        return _sequence;
    },

    escapeSequence: function()
    {
        return "\u001b[" + this.sequence().join(";") + "m";
    },

    concat: function(/* aColor, ... */)
    {
        return new MixColor([this].concat(Array.slice(arguments)));
    }
};

function MixColor(aColors)
{
    this.colors = aColors;
}

MixColor.prototype = {
    sequence: function()
    {
        var result = [];

        this.colors.forEach(function (aColor) {
                result = result.concat(aColor.sequence());
            });

        return result;
    },

    escapeSequence: function()
    {
        return "\u001b[" + this.sequence().join(";") + "m";
    },

    concat: function(/* aColor, ... */)
    {
        return new MixColor([this].concat(Array.slice(arguments)));
    }
};
