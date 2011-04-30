// JavaScript version of
// http://mxr.mozilla.org/mozilla-central/source/modules/libpref/src/prefread.cpp

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
  * The Original Code is Mozilla.
  *
  * The Initial Developer of the Original Code is Darin Fisher.
  * Portions created by the Initial Developer are Copyright (C) 2003-2010
  * the Initial Developer. All Rights Reserved.
  *
  * Contributor(s):
  *   Darin Fisher <darin@meer.net>
  *   SHIMODA Hiroshi <shimoda@clear-code.com> (porting to JavaScript)
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
	this.EXPORTED_SYMBOLS = ['prefread'];

const Cc = Components.classes;
const Ci = Components.interfaces;

const ERROR_MALFORMED_PREF_FILE = 'malformed pref file';
const ERROR_NO_NAME             = 'invalid pref: no name';
const ERROR_INVALID_TYPE        = 'invalid pref: invalid type';

const PREF_PARSE_INIT                    = 0;
const PREF_PARSE_MATCH_STRING            = 1 << 0;
const PREF_PARSE_QUOTED_STRING           = 1 << 1;
const PREF_PARSE_UNTIL_NAME              = 1 << 2;
const PREF_PARSE_UNTIL_COMMA             = 1 << 3;
const PREF_PARSE_UNTIL_VALUE             = 1 << 4;
const PREF_PARSE_INT_VALUE               = 1 << 5;
const PREF_PARSE_COMMENT_MAYBE_START     = 1 << 6;
const PREF_PARSE_COMMENT_BLOCK           = 1 << 7;
const PREF_PARSE_COMMENT_BLOCK_MAYBE_END = 1 << 8;
const PREF_PARSE_ESC_SEQUENCE            = 1 << 9;
const PREF_PARSE_HEX_ESCAPE              = 1 << 10;
const PREF_PARSE_UTF16_LOW_SURROGATE     = 1 << 11;
const PREF_PARSE_UNTIL_OPEN_PAREN        = 1 << 12;
const PREF_PARSE_UNTIL_CLOSE_PAREN       = 1 << 13;
const PREF_PARSE_UNTIL_SEMICOLON         = 1 << 14;
const PREF_PARSE_UNTIL_EOL               = 1 << 15;

const UTF16_ESC_NUM_DIGITS = 4;
const HEX_ESC_NUM_DIGITS   = 2;
const BITS_PER_HEX_DIGIT   = 4;

const PREF_INVALID = 0;
const PREF_BOOL    = 1 << 0;
const PREF_INT     = 1 << 1;
const PREF_STRING  = 1 << 2;

const kUserPref = 'user_pref';
const kPref     = 'pref';
const kTrue     = 'true';
const kFalse    = 'false';

const IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);

function read(aFile)
{
	var result = [];

	var bytes = readBinaryFrom(aFile);

	var c;
	var code;
	var udigit;
	var state = PREF_PARSE_INIT,
		nextstate = PREF_PARSE_INIT;

	var smatch, sindex, quotechar;
	var esctmp;

	var spaceRegExp = /\s/;
	var digitRegExp = /[0-9]/;

	var buffer, name, value, type, isDefault;
	function pref_DoCallback()
	{
		if (!name) {
			throw new Error(ERROR_NO_NAME);
		}
		switch (type)
		{
			case PREF_INVALID:
				throw new Error(ERROR_INVALID_TYPE);
				return;

			case PREF_BOOL:
				value = (value == kTrue);
				break;

			case PREF_INT:
				value = parseInt(value);
				break;

			case PREF_STRING:
				break;
		}
		result.push({
			name      : name,
			value     : value,
			isDefault : isDefault
		});
	}

	for (var buf = 0, maxbuf = bytes.length; buf < maxbuf; buf++)
	{
		code = bytes[buf];
		c = String.fromCharCode(code);
		switch (state)
		{
			/* initial state */
			case PREF_PARSE_INIT:
				buffer = '';
				name = '';
				value = '';
				type = PREF_INVALID;
				isDefault = false;
				switch (c)
				{
					case '/':       /* begin comment block or line? */
						state = PREF_PARSE_COMMENT_MAYBE_START;
						break;
					case '#':       /* accept shell style comments */
						state = PREF_PARSE_UNTIL_EOL;
						break;
					case 'u':       /* indicating user_pref */
					case 'p':       /* indicating pref */
						smatch = (c == 'u' ? kUserPref : kPref );
						sindex = 1;
						nextstate = PREF_PARSE_UNTIL_OPEN_PAREN;
						state = PREF_PARSE_MATCH_STRING;
						break;
					/* else skip char */
				}
				break;

			/* string matching */
			case PREF_PARSE_MATCH_STRING:
				if (c == smatch[sindex++]) {
					/* if we've matched all characters, then move to next state. */
					if (sindex == smatch.length) {
						state = nextstate;
						nextstate = PREF_PARSE_INIT; /* reset next state */
					}
					/* else wait for next char */
				}
				else {
					throw new Error(ERROR_MALFORMED_PREF_FILE);
				}
				break;

			/* quoted string parsing */
			case PREF_PARSE_QUOTED_STRING:
				/* we assume that the initial quote has already been consumed */
				if (c == '\\') {
					state = PREF_PARSE_ESC_SEQUENCE;
				}
				else if (c == quotechar) {
					state = nextstate;
					nextstate = PREF_PARSE_INIT; /* reset next state */
				}
				else {
					buffer += c;
				}
				break;

			/* name parsing */
			case PREF_PARSE_UNTIL_NAME:
				if (c == '\"' || c == '\'') {
					isDefault = (smatch == kPref);
					quotechar = c;
					nextstate = PREF_PARSE_UNTIL_COMMA; /* return here when done */
					state = PREF_PARSE_QUOTED_STRING;
				}
				else if (c == '/') {       /* allow embedded comment */
					nextstate = state; /* return here when done with comment */
					state = PREF_PARSE_COMMENT_MAYBE_START;
				}
				else if (!spaceRegExp.test(c)) {
					throw new Error(ERROR_MALFORMED_PREF_FILE);
				}
				break;

			/* parse until we find a comma separating name and value */
			case PREF_PARSE_UNTIL_COMMA:
				if (c == ',') {
					name = buffer;
					buffer = '';
					state = PREF_PARSE_UNTIL_VALUE;
				}
				else if (c == '/') {       /* allow embedded comment */
					nextstate = state; /* return here when done with comment */
					state = PREF_PARSE_COMMENT_MAYBE_START;
				}
				else if (!spaceRegExp.test(c)) {
					throw new Error(ERROR_MALFORMED_PREF_FILE);
				}
				break;

			/* value parsing */
			case PREF_PARSE_UNTIL_VALUE:
				/* the pref value type is unknown.  so, we scan for the first
				 * character of the value, and determine the type from that. */
				if (c == '\"' || c == '\'') {
					type = PREF_STRING;
					quotechar = c;
					nextstate = PREF_PARSE_UNTIL_CLOSE_PAREN;
					state = PREF_PARSE_QUOTED_STRING;
				}
				else if (c == 't' || c == 'f') {
					buffer = (c == 't' ? kTrue : kFalse );
					type = PREF_BOOL;
					smatch = buffer;
					sindex = 1;
					nextstate = PREF_PARSE_UNTIL_CLOSE_PAREN;
					state = PREF_PARSE_MATCH_STRING;
				}
				else if (digitRegExp.test(c) || (c == '-') || (c == '+')) {
					type = PREF_INT;
					/* write c to line buffer... */
					buffer += c;
					state = PREF_PARSE_INT_VALUE;
				}
				else if (c == '/') {       /* allow embedded comment */
					nextstate = state; /* return here when done with comment */
					state = PREF_PARSE_COMMENT_MAYBE_START;
				}
				else if (!spaceRegExp.test(c)) {
					throw new Error(ERROR_MALFORMED_PREF_FILE);
				}
				break;
			case PREF_PARSE_INT_VALUE:
				if (digitRegExp.test(c)) {
					buffer += c;
				}
				else {
					value = buffer;
					buffer = '';
					if (c == ')') {
						state = PREF_PARSE_UNTIL_SEMICOLON;
					}
					else if (c == '/') { /* allow embedded comment */
						nextstate = PREF_PARSE_UNTIL_CLOSE_PAREN;
						state = PREF_PARSE_COMMENT_MAYBE_START;
					}
					else if (spaceRegExp.test(c)) {
						state = PREF_PARSE_UNTIL_CLOSE_PAREN;
					}
					else {
						throw new Error(ERROR_MALFORMED_PREF_FILE);
					}
				}
				break;

			/* comment parsing */
			case PREF_PARSE_COMMENT_MAYBE_START:
				switch (c)
				{
					case '*': /* comment block */
						state = PREF_PARSE_COMMENT_BLOCK;
						break;
					case '/': /* comment line */
						state = PREF_PARSE_UNTIL_EOL;
						break;
					default:
						/* pref file is malformed */
						throw new Error(ERROR_MALFORMED_PREF_FILE);
				}
				break;
			case PREF_PARSE_COMMENT_BLOCK:
				if (c == '*') {
					state = PREF_PARSE_COMMENT_BLOCK_MAYBE_END;
				}
				break;
			case PREF_PARSE_COMMENT_BLOCK_MAYBE_END:
				switch (c)
				{
					case '/':
						state = nextstate;
						nextstate = PREF_PARSE_INIT;
						break;
					case '*':       /* stay in this state */
						break;
					default:
						state = PREF_PARSE_COMMENT_BLOCK;
				}
				break;

			/* string escape sequence parsing */
			case PREF_PARSE_ESC_SEQUENCE:
				/* not necessary to resize buffer here since we should be writing
				 * only one character and the resize check would have been done
				 * for us in the previous state */
				switch (c)
				{
					case '\"':
					case '\'':
					case '\\':
						break;
					case 'r':
						c = '\r';
						break;
					case 'n':
						c = '\n';
						break;
					case 'x': /* hex escape -- always interpreted as Latin-1 */
					case 'u': /* UTF16 escape */
						esctmp = c;
						sindex = (c == 'x' ) ?
							HEX_ESC_NUM_DIGITS :
							UTF16_ESC_NUM_DIGITS ;
						state = PREF_PARSE_HEX_ESCAPE;
						continue;
					default:
						// throw new Error('preserving unexpected JS escape sequence');
						/* Invalid escape sequence so we do have to write more than
						 * one character. Grow line buffer if necessary... */
						buffer += '\\'; /* preserve the escape sequence */
						break;
				}
				buffer += c;
				state = PREF_PARSE_QUOTED_STRING;
				break;

			/* parsing a hex (\xHH) or utf16 escape (\uHHHH) */
			case PREF_PARSE_HEX_ESCAPE:
				if (c >= '0' && c <= '9') {
					udigit = code - '0'.charCodeAt(0);
				}
				else if (c >= 'A' && c <= 'F') {
					udigit = (code - 'A'.charCodeAt(0)) + 10;
				}
				else if (c >= 'a' && c <= 'f') {
					udigit = (code - 'a'.charCodeAt(0)) + 10;
				}
				else {
					/* bad escape sequence found, write out broken escape as-is */
					// throw new Error('preserving invalid or incomplete hex escape');
					buffer += '\\';  /* original escape slash */
					buffer += esctmp;
					/* push the non-hex character back for re-parsing. */
					/* (++buf at the top of the loop keeps this safe)  */
					--buf;
					state = PREF_PARSE_QUOTED_STRING;
					continue;
				}

				/* have a digit */
				esctmp += c; /* preserve it */
				sindex--;
				if (sindex == 0) {
					eval('buffer += "\\'+esctmp+'"');
					state = PREF_PARSE_QUOTED_STRING;
				}
				break;

			/* looking for beginning of utf16 low surrogate */
			case PREF_PARSE_UTF16_LOW_SURROGATE:
				if (sindex == 0 && c == '\\') {
					++sindex;
				}
				else if (sindex == 1 && c == 'u') {
					/* escape sequence is correct, now parse hex */
					sindex = UTF16_ESC_NUM_DIGITS;
					esctmp += 'u';
					state = PREF_PARSE_HEX_ESCAPE;
				}
				else {
					/* didn't find expected low surrogate. Ignore high surrogate
					 * (it would just get converted to nothing anyway) and start
					 * over with this character */
					--buf;
					if (sindex == 1) {
						state = PREF_PARSE_ESC_SEQUENCE;
					}
					else {
						state = PREF_PARSE_QUOTED_STRING;
					}
					continue;
				}
				break;

			/* function open and close parsing */
			case PREF_PARSE_UNTIL_OPEN_PAREN:
				/* tolerate only whitespace and embedded comments */
				if (c == '(') {
					state = PREF_PARSE_UNTIL_NAME;
				}
				else if (c == '/') {
					nextstate = state; /* return here when done with comment */
					state = PREF_PARSE_COMMENT_MAYBE_START;
				}
				else if (!spaceRegExp.test(c)) {
					throw new Error(ERROR_MALFORMED_PREF_FILE);
				}
				break;
			case PREF_PARSE_UNTIL_CLOSE_PAREN:
				/* tolerate only whitespace and embedded comments  */
				if (c == ')') {
					state = PREF_PARSE_UNTIL_SEMICOLON;
				}
				else if (c == '/') {
					nextstate = state; /* return here when done with comment */
					state = PREF_PARSE_COMMENT_MAYBE_START;
				}
				else if (!spaceRegExp.test(c)) {
					throw new Error(ERROR_MALFORMED_PREF_FILE);
				}
				break;

			/* function terminator ';' parsing */
			case PREF_PARSE_UNTIL_SEMICOLON:
				/* tolerate only whitespace and embedded comments */
				if (c == ';') {
					if (!value && buffer) {
						value = buffer;
						buffer = '';
					}
					pref_DoCallback();
					state = PREF_PARSE_INIT;
				}
				else if (c == '/') {
					nextstate = state; /* return here when done with comment */
					state = PREF_PARSE_COMMENT_MAYBE_START;
				}
				else if (!spaceRegExp.test(c)) {
					throw new Error(ERROR_MALFORMED_PREF_FILE);
				}
				break;

			/* eol parsing */
			case PREF_PARSE_UNTIL_EOL:
				/* need to handle mac, unix, or dos line endings.
				 * PREF_PARSE_INIT will eat the next \n in case
				 * we have \r\n. */
				if (c == '\r' || c == '\n' || c.charCodeAt(0) == 0x1A) {
					state = nextstate;
					nextstate = PREF_PARSE_INIT; /* reset next state */
				}
				break;
		}
	}

	return result;
}

function readBinaryFrom(aTarget)
{
	var stream;
	try {
		aTarget = aTarget.QueryInterface(Ci.nsIURI);
		var channel = IOService.newChannelFromURI(aTarget);
		stream = channel.open();
	}
	catch(e) {
		aTarget = aTarget.QueryInterface(Ci.nsILocalFile)
		stream = Cc['@mozilla.org/network/file-input-stream;1']
					.createInstance(Ci.nsIFileInputStream);
		try {
			stream.init(aTarget, 1, 0, false); // open as "read only"
		}
		catch(ex) {
			return null;
		}
	}

	var binaryStream = Components
			.classes['@mozilla.org/binaryinputstream;1']
			.createInstance(Components.interfaces.nsIBinaryInputStream);
	binaryStream.setInputStream(stream);
	var array = binaryStream.readByteArray(stream.available());
	binaryStream.close();
	stream.close();

	return array;
}

function prefread()
{
	return read.apply(this, arguments);
}
