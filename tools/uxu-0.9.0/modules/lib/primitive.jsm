/**
 * @fileOverview Primitive Values Converter for Firefox 3.5 or later
 * @author       ClearCode Inc.
 * @version      1
 *
 * @license
 *   The MIT License, Copyright (c) 2010 ClearCode Inc.
 *   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 * @url http://www.clear-code.com/repos/svn/js-codemodules/primitive.jsm
 * @url http://www.clear-code.com/repos/svn/js-codemodules/primitive.test.js
 */

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['primitive'];

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

var primitive;
(function() {
	const currentRevision = 1;

	var loadedRevision = 'primitive' in namespace ?
			namespace.primitive.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		primitive = namespace.primitive;
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	/**
	 * @class
	 *   The primitive values converter service, provides features to
	 *   convert JavaScript native objects to XPCOM objects.
	 *
	 * @example
	 *   Components.utils.import('resource://my-modules/primitive.jsm');
	 *   var array = primitive.toSupportsArray([...]);
	 */
	primitive = {
		/** @private */
		revision : currentRevision,

		/**
		 * Converts a JavaScript value to a nsIVariant.
		 *
		 * @param {*} aObject
		 *   A JavaScript value.
		 *
		 * @returns {nsISupports}
		 *   The converted result. If the given value is "null", "undefined",
		 *   or an object implements nsISupports, then the object will be
		 *   returned as is. Otherwise a nsIVariant will be returned.
		 */
		toVariant : function(aValue)
		{
			if (aValue === null ||
				aValue === void(0) ||
				aValue instanceof Ci.nsISupports)
				return aValue;

			var variant = Cc['@mozilla.org/variant;1']
							.createInstance(Ci.nsIVariant)
							.QueryInterface(Ci.nsIWritableVariant);
			variant.setFromVariant(aValue);
			return variant;
		},

		/**
		 * Converts a JavaScript array to a nsISupportsArray.
		 *
		 * @param {Array} aArray
		 *   A JavaScript array.
		 *
		 * @returns {nsISupportsArray}
		 *   The converted array which have nsIVariant/nsISupports items.
		 */
		toSupportsArray : function(aArray)
		{
			let array = Cc['@mozilla.org/supports-array;1']
						.createInstance(Ci.nsISupportsArray);
			aArray.forEach(function(aItem) {
				array.AppendElement(this.toVariant(aItem));
			}, this);
			return array;
		},

		/**
		 * Converts a JavaScript hash to a nsIPropertyBag.
		 *
		 * @param {Object} aHash
		 *   A JavaScript object.
		 *
		 * @returns {nsIPropertyBag}
		 *   The converted object which have all items of the given hash.
		 */
		toPropertyBag : function(aHash)
		{
			var bag = Cc['@mozilla.org/hash-property-bag;1']
						.createInstance(Ci.nsIWritablePropertyBag);
			for (var i in aHash)
			{
				if (aHash.hasOwnProperty(i))
					bag.setProperty(i, aHash[i]);
			}
			return bag;
		},

		/**
		 * Converts a nsIPropertyBag to a JavaScript hash.
		 *
		 * @param {nsIPropertyBag} aBag
		 *   A nsIPropertyBag.
		 *
		 * @returns {Object}
		 *   The converted hash which have all items of the given bag.
		 */
		toHash : function(aBag)
		{
			var hash = {};
			var enum = aBag.QueryInterface(Ci.nsIPropertyBag).enumerator;
			while (enum.hasMoreElements())
			{
				let item = enum.getNext().QueryInterface(Ci.nsIProperty);
				hash[item.name] = item.value;
			}
			return hash;
		},

		/**
		  * Exports features of this class to the specified namespace.
		  * The "export" method itself won't be exported. And this doesn't
		  * override existing functions.
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
			'toVariant,toSupportsArray,toPropertyBag,toHash'
				.split(',')
				.forEach(function(aSymbol) {
					if (!aSymbol || aSymbol in aNamespace)
						return;
					aNamespace[aSymbol] = function() {
						return self[aSymbol].apply(self, arguments);
					};
				});
		}
	};

	namespace.primitive = primitive;
})();
