/**
 * @fileOverview Hash Generator Library for Firefox 3.5 or later
 * @author       ClearCode Inc.
 * @version      1
 *
 * @license
 *   The MIT License, Copyright (c) 2010 ClearCode Inc.
 *   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 * @url http://www.clear-code.com/repos/svn/js-codemodules/hash.jsm
 * @url http://www.clear-code.com/repos/svn/js-codemodules/hash.test.js
 */

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['hash'];

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

var hash;
(function() {
	const currentRevision = 1;

	var loadedRevision = 'hash' in namespace ?
			namespace.hash.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		hash = namespace.hash;
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	/**
	 * @class
	 *   The hasher service, provides features to calculate hash strings from
	 *   strings or files.
	 *
	 * @example
	 *   Components.utils.import('resource://my-modules/hash.jsm');
	 *   hash.export(this);
	 */
	hash = {
		/** @private */
		revision : currentRevision,

		/** @private */
		get Hasher()
		{
			delete this.Hasher;
			return this.Hasher = Cc['@mozilla.org/security/hash;1'].createInstance(Ci.nsICryptoHash);
		},

		/**
		 * Calculates a hash string from the given data, with the specified
		 * algorithm.
		 *
		 * @param {(nsIFile|string)} aData
		 *   The source to calculate a hash. If it is a file, the hash of the
		 *   file contents will be returned. Otherwise the hash string of the
		 *   given value (converted to a string) will be returned.
		 * @param {string} aHashAlgorithm
		 *   The name of the hash algorithm you wish to use. Available
		 *   algorithms are: MD2, MD5, SHA-1, SHA-256, SHA-384 and SHA-512.
		 *
		 * @returns {string} The calculated hash string.
		 *
		 * @throws Error If Gecko doesn't support the specified hash algorithm.
		 */
		computeHash : function(aData, aHashAlgorithm) 
		{
			var algorithm = String(aHashAlgorithm).toUpperCase().replace('-', '');
			if (algorithm in this.Hasher) {
				this.Hasher.init(this.Hasher[algorithm])
			}
			else {
				throw new Error('unknown hash algorithm: '+aHashAlgorithm);
			}

			if (aData instanceof Ci.nsIFile) {
				var stream = Cc['@mozilla.org/network/file-input-stream;1']
								.createInstance(Ci.nsIFileInputStream);
				stream.init(aData, 0x01, 0444, 0);
				const PR_UINT32_MAX = 0xffffffff;
				this.Hasher.updateFromStream(stream, PR_UINT32_MAX);
			}
			else {
				var array = String(aData).split('').map(function(aChar) {
								return aChar.charCodeAt(0);
							});
				this.Hasher.update(array, array.length);
			}
			return this.Hasher.finish(false)
				.split('')
				.map(function(aChar) {
					return ('0' + aChar.charCodeAt(0).toString(16)).slice(-2);
				}).join('').toUpperCase();
		},

		/**
		 * Calculates MD2 hash from the given data (a file or a string).
		 * This is just a shorthand for <code>computeHash</code>.
		 *
		 * @param {(nsIFile|string)} aData The source to calculate a hash.
		 * @returns {string} The calculated hash string.
		 * @see hash.computeHash
		 */
		md2 : function(aData) { return this.computeHash(aData, 'md2'); },

		/**
		 * Calculates MD25 hash from the given data (a file or a string).
		 * This is just a shorthand for <code>computeHash</code>.
		 *
		 * @param {(nsIFile|string)} aData The source to calculate a hash.
		 * @returns {string} The calculated hash string.
		 * @see hash.computeHash
		 */
		md5 : function(aData) { return this.computeHash(aData, 'md5'); },

		/**
		 * Calculates SHA-1 hash from the given data (a file or a string).
		 * This is just a shorthand for <code>computeHash</code>.
		 *
		 * @param {(nsIFile|string)} aData The source to calculate a hash.
		 * @returns {string} The calculated hash string.
		 * @see hash.computeHash
		 */
		sha1 : function(aData) { return this.computeHash(aData, 'sha1'); },

		/**
		 * Calculates SHA-256 hash from the given data (a file or a string).
		 * This is just a shorthand for <code>computeHash</code>.
		 *
		 * @param {(nsIFile|string)} aData The source to calculate a hash.
		 * @returns {string} The calculated hash string.
		 * @see hash.computeHash
		 */
		sha256 : function(aData) { return this.computeHash(aData, 'sha256'); },

		/**
		 * Calculates SHA-384 hash from the given data (a file or a string).
		 * This is just a shorthand for <code>computeHash</code>.
		 *
		 * @param {(nsIFile|string)} aData The source to calculate a hash.
		 * @returns {string} The calculated hash string.
		 * @see hash.computeHash
		 */
		sha384 : function(aData) { return this.computeHash(aData, 'sha384'); },

		/**
		 * Calculates SHA-512 hash from the given data (a file or a string).
		 * This is just a shorthand for <code>computeHash</code>.
		 *
		 * @param {(nsIFile|string)} aData The source to calculate a hash.
		 * @returns {string} The calculated hash string.
		 * @see hash.computeHash
		 */
		sha512 : function(aData) { return this.computeHash(aData, 'sha512'); },

		/**
		  * Exports features of this class to the specified namespace.
		  * The "export" method itself and "computeHash" method won't be
		  * exported.
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
			'md2,md5,sha1,sha256,sha384,sha512'
				.split(',')
				.forEach(function(aSymbol) {
					aNamespace[aSymbol] = function() {
						return self[aSymbol].apply(self, arguments);
					};
				});
		}
	};

	namespace.hash = hash;
})();
