/**
 * @fileOverview Command Line Handlers Helper for Firefox 3.5 or later
 * @author       ClearCode Inc.
 * @version      2
 *
 * @license
 *   The MIT License, Copyright (c) 2010 ClearCode Inc.
 *   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 * @url http://www.clear-code.com/repos/svn/js-codemodules/CLHHelper.jsm
 * @url http://www.clear-code.com/repos/svn/js-codemodules/CLHHelper.test.js
 */

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['CLHHelper'];

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

var CLHHelper;
(function() {
	const currentRevision = 2;

	var loadedRevision = 'CLHHelper' in namespace ?
			namespace.CLHHelper.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		CLHHelper = namespace.CLHHelper;
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	/**
	 * @class The helper service, provides features to implement nsICommandHandler components.
	 */
	CLHHelper = {
		/** @private */
		revision : currentRevision,

		/** @private */
		_getValue : function(aOption, aCommandLine, aDefaultValue) 
		{
			if (aDefaultValue === void(0)) aDefaultValue = '';
			try {
				var value = aCommandLine.handleFlagWithParam(aOption.replace(/^-/, ''), false);
				return value === null ? aDefaultValue : value ;
			}
			catch(e) {
			}
			return aDefaultValue;
		},
	 
		/**
		 * Checks whether the command line option is given or not.
		 *
		 * @example
		 *   // > firefox.exe -my-option
		 *   CLHHelper.getBooleanValue('my-option', aCommandLine);
		 *   // => true
		 *
		 * @param {string} aOption
		 *   The name of the option.
		 * @param {nsICommandLine} aCommandLine
		 *   The command line object given to nsICommandLineHandler::handle.
		 *
		 * @returns {boolean}
		 *   If the option is given, <code>true</code> will be returned.
		 *   Otherwise <code>false</code>.
		 */
		getBooleanValue : function(aOption, aCommandLine) 
		{
			try {
				if (aCommandLine.handleFlag(aOption.replace(/^-/, ''), false))
					return true;
			}
			catch(e) {
			}
			return false;
		},
 
		/**
		 * Gets the value of the command line option as a number.
		 *
		 * @example
		 *   // > firefox.exe -my-option "200"
		 *   CLHHelper.getNumericValue('my-option', aCommandLine);
		 *   // => 200
		 *
		 * @param {string} aOption
		 *   The name of the option.
		 * @param {nsICommandLine} aCommandLine
		 *   The command line object given to nsICommandLineHandler::handle.
		 * @param {number=} aDefaultValue (optional)
		 *   The default value which is used when the option is not given.
		 *   This is <code>0</code> by default.
		 *
		 * @returns {number}
		 *   A numeric value specified by the option. If the option is not
		 *   given, or it is not a number, then this returns the aDefaultValue
		 *   as is.
		 */
		getNumericValue : function(aOption, aCommandLine, aDefaultValue) 
		{
			if (!aDefaultValue) aDefaultValue = 0;
			var value = this._getValue(aOption, aCommandLine, aDefaultValue);
			if (!value) return aDefaultValue;
			value = Number(value);
			return isNaN(value) ? aDefaultValue : value ;
		},
 
		/**
		 * Gets the value of the command line option as a string.
		 *
		 * @example
		 *   // > firefox.exe -my-option "my-value"
		 *   CLHHelper.getStringValue('my-option', aCommandLine);
		 *   // => "my-value"
		 *
		 * @param {string} aOption
		 *   The name of the option.
		 * @param {nsICommandLine} aCommandLine
		 *   The command line object given to nsICommandLineHandler::handle.
		 * @param {string=} aDefaultValue (optional)
		 *   The default value which is used when the option is not given.
		 *   This is "" (blank string) by default.
		 *
		 * @returns {string}
		 *   A string value specified by the option. If the option is not
		 *   given, then this returns the aDefaultValue as is.
		 */
		getStringValue : function(aOption, aCommandLine, aDefaultValue) 
		{
			return this._getValue(aOption, aCommandLine, aDefaultValue);
		},

		/**
		 * Gets a full path or an absolute file URL from a related path
		 * string specified by a command line option.
		 *
		 * @example
		 *   // > firefox.exe -my-option "../../file.txt"
		 *   CLHHelper.getFullPath('my-option', aCommandLine);
		 *   // => "file:///C:/.../file.txt"
		 *
		 * @param {string} aOption
		 *   The name of the option.
		 * @param {nsICommandLine} aCommandLine
		 *   The command line object given to nsICommandLineHandler::handle.
		 * @param {string=} aDefaultValue (optional)
		 *   The default value which is used when the option is not given.
		 *   This is "" (blank string) by default.
		 *
		 * @returns {string}
		 *   A full path or an absolute file URL. If the option is not
		 *   given, then this returns the aDefaultValue as is.
		 */
		getFullPath : function(aOption, aCommandLine, aDefaultValue) 
		{
			if (!aDefaultValue) aDefaultValue = '';
			var value = this._getValue(aOption, aCommandLine, aDefaultValue);
			if (!value) return aDefaultValue;
			if (value.indexOf('/') < 0) {
				value = aCommandLine.resolveFile(value);
				return value.path;
			}
			else {
				value = aCommandLine.resolveURI(value);
				return value.spec;
			}
		},

		/**
		 * Creates a formatted text for nsICommandLineHandler::helpInfo, from
		 * a hash.
		 *
		 * @example
		 *   MyCommandLineHandler.prototype.__defineGetter__(
		 *     'helpInfo',
		 *     function() {
		 *       return CLHHelper.formatHelpInfo({
		 *         '-boolean-option'     : 'It is a boolean option.',
		 *         '-path-option <path>' : 'It is a path option.'
		 *       });
		 *     }
		 *  );
		 *
		 * @param {Object.<string, string>} aDescriptions
		 *   A hash which have items for each command line option: the key is
		 *   the name of the option, and the value is the description.
		 *
		 * @returns {string}
		 *   An UTF-8 string which is formatted by: wrapped at 76 columns, and
		 *   they have 23 cols for the name, rest for the description.
		 */
		formatHelpInfo : function(aDescriptions)
		{
			var lines = [];
			var indent = '                       ';
			for (var i in aDescriptions)
			{
				let option = (i.indexOf('-') == 0) ? i : '-' + i ;
				let description = aDescriptions[i].replace(/^\s+|\s+$/g, '');

				option = '  '+option;
				if (option.length > 22) {
					lines.push(option);
					description = indent + description;
				}
				else {
					while (option.length < 23)
					{
						option += ' ';
					}
					description = option + description;
				}

				while (true)
				{
					lines.push(description.substring(0, 75).replace(/\s+$/, ''));
					if (description.length < 75)
						break;
					description = indent + description.substring(75).replace(/^\s+/, '');
				}
			}
			return this._UCS2ToUTF8(lines.join('\n'))+'\n';
		},

		/**
		 * @private
		 * Converts an Unicode string (UCS-2) to an UTF-8 string.
		 *
		 * @param {string} aInput
		 *   The input string.
		 *
		 * @returns {string}
		 *   The UTF-8 converted version of the given string.
		 */
		_UCS2ToUTF8 : function(aInput)
		{
			return unescape(encodeURIComponent(aInput));
		}
	};

	namespace.CLHHelper = CLHHelper;
})();
