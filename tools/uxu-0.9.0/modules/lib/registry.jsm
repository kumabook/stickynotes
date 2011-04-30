/**
 * @fileOverview Windows Registry I/O Library for Firefox 3.5 or later
 * @author       ClearCode Inc.
 * @version      2
 *
 * @license
 *   The MIT License, Copyright (c) 2010 ClearCode Inc.
 *   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 * @url http://www.clear-code.com/repos/svn/js-codemodules/registry.jsm
 * @url http://www.clear-code.com/repos/svn/js-codemodules/registry.test.js
 */

if (typeof window == 'undefined' ||
	(window && typeof window.constructor == 'function'))
	this.EXPORTED_SYMBOLS = ['registry'];

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

var registry;
(function() {
	const currentRevision = 2;

	var loadedRevision = 'registry' in namespace ?
			namespace.registry.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		registry = namespace.registry;
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	/**
	 * @class
	 *   The registry I/O service, provides features to read/write the registry
	 *   database of Windows.
	 *
	 * @example
	 *   Components.utils.import('resource://my-modules/registry.jsm');
	 *   var type = registry.getValue('HKEY_CLASSES_ROOT\\.txt\\Content Type');
	 *   registry.setValue('HKCR\\.foobar\\Content Type', 'application/x-foobar');
	 *   registry.clear('HKCU\\Software\\ClearCode Inc.\\MyApp');
	 */
	registry = {
		/** @private */
		revision : currentRevision,

		/** @const */
		ERROR_NOT_WINDOWS  : 'The platform is not Windows!',
		/** @const */
		ERROR_WRITE_FAILED : 'Failed to write new value!',
		/** @const */
		ERROR_CLEAR_FAILED : 'Failed to clear a registry key!',

		/** @const */
		REASON_UNKNOWN        : 'unknown reason',
		/** @const */
		REASON_UNKNOWN_TYPE   : 'unknown type value',
		/** @const */
		REASON_NONE           : 'type is TYPE_NONE',
		/** @const */
		REASON_INVALID_BLOB   : 'blob contains invalid byte',
		/** @const */
		REASON_INVALID_NUMBER : 'given value is not a number',

		/**
		 * @private
		 * Parses the given path string of registry key and returns each part:
		 * the root (constant of Ci.nsIWindowsRegKey), the path, and the name.
		 * As the root, short-hands ("HKCR", "HKCU" and "HKLM") are available.
		 * They equal to full-spelled versions, like "HKEY_LOCAL_MACHINE".
		 *
		 * @param {string} aKey
		 *   A path string of a registry key.
		 *
		 * @returns {Array}
		 *   The parsed result. The array has 3 elements: [0] is the root,
		 *   [1] is the path, and [2] is the name (last part of the path).
		 *
		 * @throws ERROR_NOT_WINDOWS If the platform is not Windows.
		 */
		_splitKey : function(aKey) 
		{
			var root = -1, path = '', name = '';
			if (!('nsIWindowsRegKey' in Ci))
				throw new Error(this.ERROR_NOT_WINDOWS);

			path = aKey.replace(/\\([^\\]+)$/, '');
			name = RegExp.$1;

			path = path.replace(/^([^\\]+)\\/, '');
			root = RegExp.$1.toUpperCase();
			switch (root)
			{
				case 'HKEY_CLASSES_ROOT':
				case 'HKCR':
					root = Ci.nsIWindowsRegKey.ROOT_KEY_CLASSES_ROOT;
					break;

				case 'HKEY_CURRENT_USER':
				case 'HKCU':
					root = Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER;
					break;

				case 'HKEY_LOCAL_MACHINE':
				case 'HKLM':
					root = Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE;
					break;

				default:
					root = -1;
					break;
			}

			return [root, path, name];
		},
		 
		/**
		 * Returns the value of the registry key specified by the given path.
		 *
		 * @param {string} aKey
		 *   A path string of a registry key. You can start the path with
		 *   short-hands ("HKCR", "HKCU" and "HKLM").
		 *
		 * @returns {?*}
		 *   The value of the registry key. The type of the returned value is
		 *   automatically detected by the type of the registry key. It will be
		 *   mapped to number, string, boolean, or an array of bytes.
		 *   <code>null</code> will be returned if there is no existing value.
		 *
		 * @throws ERROR_NOT_WINDOWS If the platform is not Windows.
		 */
		getValue : function(aKey) 
		{
			var value = null;

			var root, path, name;
			[root, path, name] = this._splitKey(aKey);
			if (root < 0 || !path || !name)
				return value;

			var regKey = Cc['@mozilla.org/windows-registry-key;1']
							.createInstance(Ci.nsIWindowsRegKey);
			try {
				regKey.open(root, path, Ci.nsIWindowsRegKey.ACCESS_READ);
			}
			catch(e) {
				regKey.close();
				return value;
			}

			if (regKey.hasValue(name)) {
				switch (regKey.getValueType(name))
				{
					case Ci.nsIWindowsRegKey.TYPE_NONE:
						value = true;
						break;
					case Ci.nsIWindowsRegKey.TYPE_STRING:
						value = regKey.readStringValue(name);
						break;
					case Ci.nsIWindowsRegKey.TYPE_BINARY:
						value = regKey.readBinaryValue(name);
						value = value.split('').map(function(aChar) {
							return aChar.charCodeAt(0);
						});
						break;
					case Ci.nsIWindowsRegKey.TYPE_INT:
						value = regKey.readIntValue(name);
						break;
					case Ci.nsIWindowsRegKey.TYPE_INT64:
						value = regKey.readInt64Value(name);
						break;
				}
			}

			regKey.close();
			return value;
		},
		 
		/**
		 * Stores the given value to the specified registry key. If there is
		 * existing value, the given value will be converted to the type of the
		 * old value. Otherwise, strings are stored as is, boolean and number
		 * are stored as an integer, and an array of bytes will be a binary.
		 *
		 * @param {string} aKey
		 *   A path string of a registry key. You can start the path with
		 *   short-hands ("HKCR", "HKCU" and "HKLM").
		 * @param {*} aValue
		 *   A string, a number, a boolean, or an array of bytes.
		 *
		 * @returns {*}
		 *   The given value will be returned as is.
		 *
		 * @throws ERROR_NOT_WINDOWS If the platform is not Windows.
		 * @throws ERROR_WRITE_FAILED If the path is invalid or you don't have
		 *         permissions to write specified regisry key.
		 */
		setValue : function(aKey, aValue) 
		{
			var root, path, name;
			[root, path, name] = this._splitKey(aKey);
			if (root < 0 || !path || !name)
				throw new Error(this.ERROR_WRITE_FAILED);

			// create upper level items automatically
			var ancestors = [];
			var ancestor = path;
			do {
				ancestors.push(ancestor);
			}
			while (ancestor = ancestor.replace(/\\?[^\\]+$/, ''));
			ancestors.reverse().slice(1).forEach(function(aPath) {
				aPath = aPath.replace(/\\([^\\]+)$/, '');
				var name = RegExp.$1;
				var regKey = Cc['@mozilla.org/windows-registry-key;1']
								.createInstance(Ci.nsIWindowsRegKey);
				try {
					regKey.open(root, aPath, Ci.nsIWindowsRegKey.ACCESS_WRITE);
				}
				catch(e) {
					regKey.close();
					return;
				}
				try {
					if (!regKey.hasChild(name))
						regKey.createChild(name, Ci.nsIWindowsRegKey.ACCESS_WRITE);
				}
				catch(e) {
					regKey.close();
					throw e;
				}
				regKey.close();
			});

			var regKey = Cc['@mozilla.org/windows-registry-key;1']
							.createInstance(Ci.nsIWindowsRegKey);
			regKey.open(root, path, Ci.nsIWindowsRegKey.ACCESS_ALL);

			var self = this;
			function closeAndThrowError(aError)
			{
				regKey.close();
				var message = self.ERROR_WRITE_FAILED;
				if (!aError || typeof aError == 'string') {
					let reason = aError || self.REASON_UNKNOWN_TYPE;
					aError = new Error(message);
					aError.reason = reason;
				}
				aError.key    = aKey;
				aError.value  = aValue;
				throw aError || new Error(message);
			}

			try {
				var type;
				if (regKey.hasValue(name)) {
					type = regKey.getValueType(name);
				}
				else {
					switch (typeof aValue)
					{
						case 'string':
							type = Ci.nsIWindowsRegKey.TYPE_STRING;
							break;
						case 'boolean':
							type = Ci.nsIWindowsRegKey.TYPE_INT;
							break;
						case 'number':
							type = Ci.nsIWindowsRegKey.TYPE_INT;
							break;
						case 'object':
							if (aValue &&
								'length' in aValue &&
								'forEach' in aValue) {
								type = Ci.nsIWindowsRegKey.TYPE_BINARY;
							}
							else {
								closeAndThrowError(this.REASON_UNKNOWN);
							}
							break;
					}
				}

				switch (type)
				{
					case Ci.nsIWindowsRegKey.TYPE_NONE:
						closeAndThrowError(this.REASON_NONE);
						break;
					case Ci.nsIWindowsRegKey.TYPE_STRING:
						regKey.writeStringValue(name, String(aValue));
						break;
					case Ci.nsIWindowsRegKey.TYPE_BINARY:
						switch (typeof aValue)
						{
							case 'boolean':
								aValue = String.fromCharCode(aValue ? 1 : 0 );
								break;
							case 'string':
								aValue = unescape(encodeURIComponent(aValue));
								break;
							case 'number':
								aValue = String.fromCharCode(parseInt(aValue));
								break;
							case 'object':
								if (aValue &&
									'length' in aValue &&
									'forEach' in aValue) {
									aValue = aValue.map(function(aCode) {
										if (typeof aCode != 'number')
											closeAndThrowError(self.REASON_INVALID_BLOB);
										return String.fromCharCode(aCode);
									}).join('');
								}
								else {
									closeAndThrowError(this.REASON_UNKNOWN);
								}
								break;
						}
						regKey.writeBinaryValue(name, aValue);
						break;
					case Ci.nsIWindowsRegKey.TYPE_INT:
						switch (typeof aValue)
						{
							case 'boolean':
								aValue = aValue ? 1 : 0 ;
								break;
							case 'string':
							case 'number':
								aValue = parseInt(aValue);
								if (isNaN(aValue))
									closeAndThrowError(this.REASON_INVALID_NUMBER);
								break;
							case 'object':
								closeAndThrowError(this.REASON_INVALID_NUMBER);
								break;
						}
						regKey.writeIntValue(name, aValue);
						break;
					case Ci.nsIWindowsRegKey.TYPE_INT64:
						switch (typeof aValue)
						{
							case 'boolean':
								aValue = aValue ? 1 : 0 ;
								break;
							case 'string':
							case 'number':
								aValue = parseInt(aValue);
								if (isNaN(aValue)) closeAndThrowError(this.REASON_INVALID_NUMBER);
								break;
							case 'object':
								closeAndThrowError(this.REASON_INVALID_NUMBER);
								break;
						}
						regKey.writeInt64Value(name, aValue);
						break;
				}
			}
			catch(e) {
				closeAndThrowError(e);
			}

			regKey.close();
			return aValue;
		},
		 
		/**
		 * Clears the registry key specified by the given path string. If the
		 * key has child keys, all of children are cleared recursively.
		 *
		 * @param {string} aKey
		 *   A path string of a registry key. You can start the path with
		 *   short-hands ("HKCR", "HKCU" and "HKLM").
		 *
		 * @throws ERROR_NOT_WINDOWS If the platform is not Windows.
		 * @throws ERROR_CLEAR_FAILED If the path is invalid.
		 */
		clear : function(aKey) 
		{
			var root, path, name;
			[root, path, name] = this._splitKey(aKey);
			if (root < 0 || !path || !name)
				throw new Error(this.ERROR_CLEAR_FAILED);

			this._clear(root, path+'\\'+name);
		},
		_clear : function(aRoot, aPath)
		{
			try {
				var regKey = Cc['@mozilla.org/windows-registry-key;1']
								.createInstance(Ci.nsIWindowsRegKey);
				regKey.open(aRoot, aPath, Ci.nsIWindowsRegKey.ACCESS_ALL);
				try {
					let values = [];
					for (let i = 0, maxi = regKey.valueCount; i < maxi; i++)
					{
						values.push(regKey.getValueName(i));
					}
					values.forEach(function(aName) {
						regKey.removeValue(aName);
					});
				}
				catch(e) {
				}
				try {
					let children = [];
					for (let i = 0, maxi = regKey.childCount; i < maxi; i++)
					{
						children.push(regKey.getChildName(i));
					}
					children.forEach(function(aName) {
						this._clear(aRoot, aPath+'\\'+aName);
					}, this);
				}
				catch(e) {
				}
				regKey.close();
			}
			catch(e) {
			}

			aPath = aPath.replace(/\\([^\\]+)$/, '');
			var name = RegExp.$1;
			var parentRegKey = Cc['@mozilla.org/windows-registry-key;1']
							.createInstance(Ci.nsIWindowsRegKey);
			try {
				parentRegKey.open(aRoot, aPath, Ci.nsIWindowsRegKey.ACCESS_ALL);
				try {
					if (parentRegKey.hasValue(name))
						parentRegKey.removeValue(name);
					if (parentRegKey.hasChild(name))
						parentRegKey.removeChild(name);
				}
				catch(e) {
					parentRegKey.close();
					throw e;
				}
				finally {
					parentRegKey.close();
				}
			}
			catch(e) {
			}
		}
	};

	namespace.registry = registry;
})();
