/**
 * @fileOverview Plaintext File I/O Library for Firefox 3.5 or later
 * @author       ClearCode Inc.
 * @version      3
 *
 * @license
 *   The MIT License, Copyright (c) 2010 ClearCode Inc.
 *   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 * @url http://www.clear-code.com/repos/svn/js-codemodules/textIO.jsm
 * @url http://www.clear-code.com/repos/svn/js-codemodules/textIO.test.js
 */

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['textIO'];

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

var textIO;
(function() {
	const currentRevision = 3;

	var loadedRevision = 'textIO' in namespace ?
			namespace.textIO.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		textIO = namespace.textIO;
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	const IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);

	/**
	 * @class
	 *   The plaintext I/O service, provides features to read/write
	 *   plaintext files.
	 *
	 * @example
	 *   Components.utils.import('resource://my-modules/textIO.jsm');
	 *   var text = textIO.readFrom(nsIFile, 'UTF-8');
	 *   textIO.writeTo(text, nsIFile, 'Shift_JIS');
	 */
	textIO = {
		/** @private */
		revision : currentRevision,

		/**
		 * Reads the contents of the given text file, and returns the contents
		 * as a string.
		 *
		 * @param {(nsIFile|nsIURI)} aFileOrURI
		 *   The pointer to the plain text file.
		 * @param {string=} aEncoding (optional)
		 *   The encoding of the contents of the file. If no encoding is given,
		 *   this returns the contents of the file as is.
		 *
		 * @returns {string}
		 *   The contents of the given file. If an encoding is given, a decoded
		 *   string will be returned. Otherwise this returns a raw bytes array
		 *   as a string.
		 */
		readFrom : function(aFileOrURI, aEncoding)
		{
			var stream;
			try {
				aFileOrURI = aFileOrURI.QueryInterface(Ci.nsIURI);
				var channel = IOService.newChannelFromURI(aFileOrURI);
				stream = channel.open();
			}
			catch(e) {
				aFileOrURI = aFileOrURI.QueryInterface(Ci.nsILocalFile)
				stream = Cc['@mozilla.org/network/file-input-stream;1']
							.createInstance(Ci.nsIFileInputStream);
				try {
					stream.init(aFileOrURI, 1, 0, false); // open as "read only"
				}
				catch(ex) {
					return null;
				}
			}

			var fileContents = null;
			try {
				if (aEncoding) {
					var converterStream = Cc['@mozilla.org/intl/converter-input-stream;1']
							.createInstance(Ci.nsIConverterInputStream);
					var buffer = stream.available();
					converterStream.init(stream, aEncoding, buffer,
						converterStream.DEFAULT_REPLACEMENT_CHARACTER);
					var out = { value : null };
					converterStream.readString(stream.available(), out);
					converterStream.close();
					fileContents = out.value;
				}
				else {
					var scriptableStream = Cc['@mozilla.org/scriptableinputstream;1']
							.createInstance(Ci.nsIScriptableInputStream);
					scriptableStream.init(stream);
					fileContents = scriptableStream.read(scriptableStream.available());
					scriptableStream.close();
				}
			}
			finally {
				stream.close();
			}

			return fileContents;
		},

		/**
		 * Outputs the given string to a file, as a plain text file.
		 *
		 * @param {string} aContents
		 *   The string you want to output. It should be a Unicode string (UCS2).
		 * @param {nsIFile} aFile
		 *   The pointer to the plain text file. If the file exists, it will be
		 *   overwritten. If there are some missing directories, then they are
		 *   automatically created.
		 * @param {string=} aEncoding (optional)
		 *   The encoding of the contents of the file. This encodes the given
		 *   string by the encoding before output. If no encoding is given,
		 *   this outputs the given string to the file as is.
		 *
		 * @returns {nsIFile}
		 *   The given file itself.
		 */
		writeTo : function(aContent, aFile, aEncoding)
		{
			// create directories
			(function(aDir) {
				try {
					if (aDir.parent) arguments.callee(aDir.parent);
					if (aDir.exists()) return;
					aDir.create(aDir.DIRECTORY_TYPE, 0755);
				}
				catch(e) {
				}
			})(aFile.parent);

			if (aFile.exists()) aFile.remove(true);
			aFile.create(aFile.NORMAL_FILE_TYPE, 0666);

			var stream = Cc['@mozilla.org/network/file-output-stream;1']
					.createInstance(Ci.nsIFileOutputStream);
			stream.init(aFile, 2, 0x200, false); // open as "write only"

			if (aEncoding) {
				var converterStream = Cc['@mozilla.org/intl/converter-output-stream;1']
						.createInstance(Ci.nsIConverterOutputStream);
				var buffer = aContent.length;
				converterStream.init(stream, aEncoding, buffer, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
				converterStream.writeString(aContent);
				converterStream.close();
			}
			else {
				stream.write(aContent, aContent.length);
			}

			stream.close();

			return aFile;
		}
	};

	namespace.textIO = textIO;
})();
