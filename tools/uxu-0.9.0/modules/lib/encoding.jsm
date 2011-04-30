/**
 * @fileOverview String Encoding Converter Library for Firefox 3.5 or later
 * @author       ClearCode Inc.
 * @version      1
 *
 * @license
 *   The MIT License, Copyright (c) 2010 ClearCode Inc.
 *   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 * @url http://www.clear-code.com/repos/svn/js-codemodules/encoding.jsm
 * @url http://www.clear-code.com/repos/svn/js-codemodules/encoding.test.js
 */

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['encoding'];

// var namespace;
if (typeof namespace == 'undefined') {
	// If namespace.jsm is available, export symbols to the shared namespace.
	// See: http://www.cozmixng.org/repos/piro/fx3-compatibility-lib/trunk/namespace.jsm
	try {
		let ns = {};
		Components.utils.import('resource://uxu-modules/lib/namespace.jsm', ns);
		namespace = ns.getNamespaceFor('clear-code.com');
	}
	catch(e) {
		namespace = (typeof window != 'undefined' ? window : null ) || {};
	}
}

var encoding;
(function() {
	const currentRevision = 1;

	var loadedRevision = 'encoding' in namespace ?
			namespace.encoding.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		encoding = namespace.encoding;
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	/**
	 * @class The encoding service, provides features to convert encoding of strings.
	 *
	 * @example
	 *   Components.utils.import('resource://my-modules/encoding.jsm');
	 *   var utf8 = encoding.UCS2ToUTF8('source string (Unicode, UCS-2');
	 *   var ucs2 = encoding.UTF8ToUCS2(utf8);
	 *   var sjis = encoding.UCS2ToX(ucs2, 'Shift_JIS');
	 *   var euc  = encoding.UCS2ToX(ucs2, 'EUC-JP');
	 *   ucs2     = encoding.XToUCS2(sjis, 'Shift_JIS');
	 *   encoding.export(this);
	 */
	encoding = {
		/** @private */
		revision : currentRevision,

		/** @private */
		get UCONV()
		{
			delete this.UCONV;
			return this.UCONV = Cc['@mozilla.org/intl/scriptableunicodeconverter'].getService(Ci.nsIScriptableUnicodeConverter);
		},

		/**
		 * Decodes a string from UTF-8 to Unicode (UCS2).
		 *
		 * @param {string} aInput A string to be converted.
		 * @returns {string} The result.
		 *
		 * @see encoding.UTF8ToUnicode (alias)
		 */
		UTF8ToUCS2 : function(aInput) 
		{
			return decodeURIComponent(escape(aInput));
		},
		/** @see encoding.UTF8ToUCS2 */
		UTF8ToUnicode : function(aInput) 
		{
			return this.UTF8ToUCS2(aInput);
		},
		  
		/**
		 * Encodes a string from Unicode (UCS2) to UTF-8.
		 *
		 * @param {string} aInput A string to be converted.
		 * @returns {string} The result.
		 *
		 * @see encoding.UnicodeToUTF8 (alias)
		 */
		UCS2ToUTF8 : function(aInput) 
		{
			return unescape(encodeURIComponent(aInput));
		},
		/** @see encoding.UCS2ToUTF8 */
		UnicodeToUTF8 : function(aInput) 
		{
			return this.UCS2ToUTF8(aInput);
		},
		  
		/**
		 * Decodes a string from the given encoding to Unicode (UCS2).
		 *
		 * @param {string} aInput A string to be converted.
		 * @param {string} aEncoding The name of encoding.
		 *
		 * @returns {string}
		 *   The result. If it cannot be decoded, then the original input
		 *   will be returned.
		 *
		 * @see encoding.XToUnicode (alias)
		 */
		XToUCS2 : function(aInput, aEncoding) 
		{
			if (aEncoding == 'UTF-8') return this.UTF8ToUnicode(aInput);
			try {
				this.UCONV.charset = aEncoding;
				return this.UCONV.ConvertToUnicode(aInput);
			}
			catch(e) {
			}
			return aInput;
		},
		/** @see encoding.XToUCS2 */
		XToUnicode : function(aInput, aEncoding) 
		{
			return this.XToUCS2(aInput, aEncoding);
		},
		  
		/**
		 * Encodes a string from Unicode (UCS2) to the given encoding.
		 *
		 * @param {string} aInput A string to be converted.
		 * @param {string} aEncoding The name of encoding.
		 *
		 * @returns {string}
		 *   The result. If it cannot be encoded, then the original input
		 *   will be returned.
		 *
		 * @see encoding.UnicodeToX (alias)
		 */
		UCS2ToX : function(aInput, aEncoding) 
		{
			if (aEncoding == 'UTF-8') return this.UnicodeToUTF8(aInput);

			try {
				this.UCONV.charset = aEncoding;
				return this.UCONV.ConvertFromUnicode(aInput);
			}
			catch(e) {
			}
			return aInput;
		},
		/** @see encoding.UCS2ToX */
		UnicodeToX : function(aInput, aEncoding) 
		{
			return this.UCS2ToX(aInput, aEncoding);
		},

		/**
		  * Exports features of this class to the specified namespace.
		  * The "export" method itself won't be exported.
		  *
		  * @param {Object} aNamespace
		  *   The object which methods are exported to.
		  */
		export : function(aNamespace)
		{
			if (!aNamespace)
				aNamespace = (function() { return this; })();
			if (!aNamespace)
				return;

			var self = this;
			'UTF8ToUCS2,UTF8ToUnicode,UCS2ToUTF8,UnicodeToUTF8,XToUCS2,XToUnicode,UCS2ToX,UnicodeToX'
				.split(',')
				.forEach(function(aSymbol) {
					aNamespace[aSymbol] = function() {
						return self[aSymbol].apply(self, arguments);
					};
				});
		}
	};

	namespace.encoding = encoding;
})();
