/**
 * @fileOverview User Action Emulator for Firefox 3.5 or later 
 * @author       ClearCode Inc.
 * @version      2
 *
 * @example
 *   Components.utils.import('resource://my-modules/action.jsm');
 *   action.clickOn(someDOMElement);
 *   // See: http://www.clear-code.com/software/uxu/helpers.html.en#actions
 *   // (ja: http://www.clear-code.com/software/uxu/helpers.html#actions )
 *
 * @license
 *   The MIT License, Copyright (c) 2010 ClearCode Inc.
 *   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 * @url http://www.clear-code.com/repos/svn/js-codemodules/action.jsm
 * @url http://www.clear-code.com/repos/svn/js-codemodules/action_tests/
 */
 
if (typeof window == 'undefined') 
	this.EXPORTED_SYMBOLS = ['action'];

// This depends on boxObject.js
// http://www.cozmixng.org/repos/piro/fx3-compatibility-lib/trunk/boxObject.js
const BOX_OBJECT_MODULE = 'resource://uxu-modules/lib/boxObject.js';

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
 
var action; 
(function() {
	const currentRevision = 2;

	var loadedRevision = 'action' in namespace ?
			namespace.action.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		action = namespace.action;
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;
	
	/**
	 * @class The action service, provides features to emulate user operations.
	 */
	action = { 
	
		/** @private */
		revision : currentRevision, 
 
		get _Prefs() 
		{
			delete this._Prefs;
			return this._Prefs = Cc['@mozilla.org/preferences;1']
									.getService(Ci.nsIPrefBranch)
									.QueryInterface(Ci.nsIPrefBranch2);
		},
 
		get _WindowMediator() 
		{
			delete this._WindowMediator;
			return this._WindowMediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
		},
 
		/** @private */
		getBoxObjectFor : function(aNode) 
		{
			return ('getBoxObjectFor' in aNode.ownerDocument) ?
					aNode.ownerDocument.getBoxObjectFor(aNode) :
					this._boxObject.getBoxObjectFor(aNode) ;
		},
	
		get _boxObject() 
		{
			delete this.boxObject;
			var ns = {};
			Components.utils.import(BOX_OBJECT_MODULE, ns);
			return this.boxObject = ns.boxObject;
		},
  
/* zoom */ 
	
		/**
		 * Returns whether the full zoom feature is enabled or not.
		 *
		 * @returns {Boolean}
		 *   Availability of full zoom.
		 */
		isFullZoom : function() 
		{
			try {
				return this._Prefs.getBoolPref('browser.zoom.full');
			}
			catch(e) {
			}
			return false;
		},
 
		/**
		 * Returns the factor of full zoom.
		 *
		 * @param {nsIDOMWindow} aFrame
		 *   The frame you want to know the zoom factor.
		 *
		 * @returns {number}
		 *   The zoom factor of the frame. 0 means 0%, 1 means 100%.
		 *
		 * @throws {Error} If no frame is given.
		 */
		getZoom : function(aFrame) 
		{
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action.getZoom::['+aFrame+'] is not a frame!');
			var markupDocumentViewer = aFrame.top
					.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIWebNavigation)
					.QueryInterface(Ci.nsIDocShell)
					.contentViewer
					.QueryInterface(Ci.nsIMarkupDocumentViewer);
			return markupDocumentViewer.fullZoom;
		},
  
/* mouse event */ 
	
// utils 
	
		/**
		 * Returns given options as a normalized hash for fireMouseEvent and
		 * fireMouseEventOnElement.
		 *
		 * @param {string} aType
		 *   The event type of the mouse event.
		 * @param {number} aButton
		 *   The button related to the mouse event. 0=left, 1=middle, 2=right.
		 * @param {Array=} aArguments (optional)
		 *   An array of options for _getMouseOptionsFromArguments.
		 *
		 * @returns {{type: string,
		 *           button: number,
		 *           altKey: boolean,
		 *           ctrlKey: boolean,
		 *           metaKey: boolean,
		 *           shiftKey: boolean,
		 *           x: number,
		 *           y: number,
		 *           screenX: number,
		 *           screenY: number,
		 *           window: ?nsIDOMWindow,
		 *           element: ?nsIDOMElement}}
		 *   Options normalized to a hash. "x" and "y" will be relative
		 *   coordinates from the window edge, if no frame is given and there
		 *   is a frame on the given coordinates on the screen.
		 *
		 * @see action.fireMouseEvent
		 * @see action.fireMouseEventOnElement
		 */
		_getMouseOptionsFor : function(aType, aButton, aArguments) 
		{
			var options = this._getMouseOptionsFromArguments.apply(this, aArguments);
			var returnOptions = {
				type : aType,
				button : aButton,
				altKey : options.modifiers.altKey,
				ctrlKey : options.modifiers.ctrlKey,
				metaKey : options.modifiers.metaKey,
				shiftKey : options.modifiers.shiftKey
			};
			if (options.element) {
				returnOptions.element = options.element;
			}
			if (options.window) {
				returnOptions.window = options.window;
				returnOptions.screenX = options.screenX;
				returnOptions.screenY = options.screenY;
				returnOptions.x = options.x;
				returnOptions.y = options.y;
			}
			return returnOptions;
		},
 
		/**
		 * Extracts options from the given arguments array and returns them
		 * as a normalized hash for fireMouseEvent and
		 * fireMouseEventOnElement. Options can be in random order.
		 *
		 * @param {number=} aScreenX (optional)
		 *   The X coordinate on the screen.
		 * @param {number=} aScreenY (optional)
		 *   The Y coordinate on the screen.
		 * @param {nsIDOMWindow=} aRootFrame (optional)
		 *   The root frame (maybe a chrome window) which you want to find
		 *   the target frame from. If you didn't specify this option, this
		 *   finds frames from the topmost window on the specified coordinates.
		 * @param {nsIDOMElement=} aElement (optional)
		 *   The target element which you want to send created event.
		 * @param {{alt: boolean, altKey: boolean,
		 *          ctrl: boolean, ctrlKey: boolean,
		 *          control: boolean, controlKey: boolean,
		 *          meta: boolean, metaKey: boolean,
		 *          cmd: boolean, cmdKey: boolean,
		 *          command: boolean, commandKey: boolean,
		 *          shift: boolean, shiftKey: boolean}=} (optional)
		 *   A hash of modifier keys. Default value of each key is
		 *   <code>false</code>.
		 *
		 * @returns {{x: number,
		 *           y: number,
		 *           screenX: number,
		 *           screenY: number,
		 *           window: ?nsIDOMWindow,
		 *           element: ?nsIDOMElement,
		 *           modifiers: {altKey: boolean,
		 *                       ctrlKey: boolean,
		 *                       metaKey: boolean,
		 *                       shiftKey: boolean}}}
		 *   Options normalized to a hash. "x" and "y" will be relative
		 *   coordinates from the window edge, if no frame is given and there
		 *   is a frame on the given coordinates on the screen.
		 *
		 * @see action.fireMouseEvent
		 * @see action.fireMouseEventOnElement
		 */
		_getMouseOptionsFromArguments : function() 
		{
			var modifierNames = 'alt,ctrl,control,shift,meta,cmd,command'
									.replace(/([^,]+)/g, '$1,$1Key')
									.split(',');
			var x, y, w, modifiers, element;
			Array.slice(arguments).some(function(aArg) {
				if (typeof aArg == 'number') {
					if (x === void(0))
						x = aArg;
					else if (y === void(0))
						y = aArg;
				}
				else if (aArg) {
					if (aArg instanceof Ci.nsIDOMWindow)
						w = aArg;
					else if (aArg instanceof Ci.nsIDOMElement)
						element = aArg;
					else if (modifierNames.some(function(aName) {
							return aName in aArg;
						}))
						modifiers = aArg;
				}
				return (x && y && w && modifiers && element);
			}, this);

			let screenX, screenY;
			if (!w && x !== void(0) && y !== void(0)) {
				w = this._getWindowAt(x, y);
				w = this.getFrameAt(w, x, y);
				let root = this.getBoxObjectFor(w.document.documentElement);
				screenX = x;
				screenY = y;
				x = x - root.screenX - w.scrollX;
				y = y - root.screenY - w.scrollY;
			}

			if (modifiers) {
				modifiers.altKey = modifiers.altKey || modifiers.alt;
				modifiers.ctrlKey = modifiers.ctrlKey || modifiers.ctrl ||
									modifiers.controlKey || modifiers.control;
				modifiers.shiftKey = modifiers.shiftKey || modifiers.shift;
				modifiers.metaKey = modifiers.metaKey || modifiers.meta ||
									modifiers.cmdKey || modifiers.cmd ||
									modifiers.commandKey || modifiers.command;
			}

			return {
				x : x,
				y : y,
				screenX : screenX,
				screenY : screenY,
				window : w,
				element : element,
				modifiers : modifiers || {}
			};
		},
  
// click on element 
	
		/**
		 * Emulates a single left click on a element. Options can be in
		 * random order.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send created event.
		 * @param {{altKey: boolean,
		 *          ctrlKey: boolean,
		 *          metaKey: boolean,
		 *          shiftKey: boolean}=} aModifiers (optional)
		 *   A hash of modifier keys. Default value of each key is
		 *   <code>false</code>.
		 *
		 * @throws {Error} If no element is given.
		 *
		 * @see action.leftClickOn (alias)
		 */
		clickOn : function() 
		{
			var options = this._getMouseOptionsFor('click', 0, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.clickOn */
		leftClickOn : function() { return this.clickOn.apply(this, arguments); },
 
		/**
		 * Emulates a single middle click on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 */
		middleClickOn : function() 
		{
			var options = this._getMouseOptionsFor('click', 1, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
 
		/**
		 * Emulates a single right click on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 */
		rightClickOn : function() 
		{
			var options = this._getMouseOptionsFor('click', 2, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
  
// dblclick on element 
	
		/**
		 * Emulates a double left click on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.doubleclickOn (alias)
		 * @see action.dblClickOn (alias)
		 * @see action.dblclickOn (alias)
		 * @see action.leftDoubleclickOn (alias)
		 * @see action.leftDoubleClickOn (alias)
		 * @see action.leftDblClickOn (alias)
		 * @see action.leftDblclickOn (alias)
		 */
		doubleClickOn : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 0, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.doubleClickOn */
		doubleclickOn : function() { return this.doubleClickOn.apply(this, arguments); },
		/** @see action.doubleClickOn */
		dblClickOn : function() { return this.doubleClickOn.apply(this, arguments); },
		/** @see action.doubleClickOn */
		dblclickOn : function() { return this.doubleClickOn.apply(this, arguments); },
		/** @see action.doubleClickOn */
		leftDoubleclickOn : function() { return this.doubleClickOn.apply(this, arguments); },
		/** @see action.doubleClickOn */
		leftDoubleClickOn : function() { return this.doubleClickOn.apply(this, arguments); },
		/** @see action.doubleClickOn */
		leftDblClickOn : function() { return this.doubleClickOn.apply(this, arguments); },
		/** @see action.doubleClickOn */
		leftDblclickOn : function() { return this.doubleClickOn.apply(this, arguments); },
 
		/**
		 * Emulates a double middle click on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.middleDoubleclickOn (alias)
		 * @see action.middleDblClickOn (alias)
		 * @see action.middleDblclickOn (alias)
		 */
		middleDoubleClickOn : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 1, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.middleDoubleClickOn */
		middleDoubleclickOn : function() { return this.middleDoubleClickOn.apply(this, arguments); },
		/** @see action.middleDoubleClickOn */
		middleDblClickOn : function() { return this.middleDoubleClickOn.apply(this, arguments); },
		/** @see action.middleDoubleClickOn */
		middleDblclickOn : function() { return this.middleDoubleClickOn.apply(this, arguments); },
 
		/**
		 * Emulates a double right click on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.rightDoubleclickOn (alias)
		 * @see action.rightDblClickOn (alias)
		 * @see action.rightDblclickOn (alias)
		 */
		rightDoubleClickOn : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 2, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.rightDoubleClickOn */
		rightDoubleclickOn : function() { return this.rightDoubleClickOn.apply(this, arguments); },
		/** @see action.rightDoubleClickOn */
		rightDblClickOn : function() { return this.rightDoubleClickOn.apply(this, arguments); },
		/** @see action.rightDoubleClickOn */
		rightDblclickOn : function() { return this.rightDoubleClickOn.apply(this, arguments); },
  
// mousedown/mouseup on element 
	
		/**
		 * Emulates a single left mouse down on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.mousedownOn (alias)
		 * @see action.leftMouseDownOn (alias)
		 * @see action.leftMousedownOn (alias)
		 */
		mouseDownOn : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 0, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.mouseDownOn */
		mousedownOn : function() { return this.mouseDownOn.apply(this, arguments); },
		/** @see action.mouseDownOn */
		leftMouseDownOn : function() { return this.mouseDownOn.apply(this, arguments); },
		/** @see action.mouseDownOn */
		leftMousedownOn : function() { return this.mouseDownOn.apply(this, arguments); },
 
		/**
		 * Emulates a single middle mouse down on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.middleMousedownOn (alias)
		 */
		middleMouseDownOn : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 1, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.middleMouseDownOn */
		middleMousedownOn : function() { return this.middleMouseDownOn.apply(this, arguments); },
 
		/**
		 * Emulates a single right mouse down on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.rightMousedownOn (alias)
		 */
		rightMouseDownOn : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 2, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.rightMouseDownOn */
		rightMousedownOn : function() { return this.rightMouseDownOn.apply(this, arguments); },
 
		/**
		 * Emulates a single left mouse up on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.mouseupOn (alias)
		 * @see action.leftMouseUpOn (alias)
		 * @see action.leftMouseupOn (alias)
		 */
		mouseUpOn : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 0, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.mouseUpOn */
		mouseupOn : function() { return this.mouseUpOn.apply(this, arguments); },
		/** @see action.mouseUpOn */
		leftMouseUpOn : function() { return this.mouseUpOn.apply(this, arguments); },
		/** @see action.mouseUpOn */
		leftMouseupOn : function() { return this.mouseUpOn.apply(this, arguments); },
 
		/**
		 * Emulates a single middle mouse up on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.middleMouseupOn (alias)
		 */
		middleMouseUpOn : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 1, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.middleMouseUpOn */
		middleMouseupOn : function() { return this.middleMouseUpOn.apply(this, arguments); },
 
		/**
		 * Emulates a single right mouse up on a element. Options are just
		 * same to action.clickOn.
		 *
		 * @see action.clickOn
		 * @see action.rightMouseupOn (alias)
		 */
		rightMouseUpOn : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 2, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		/** @see action.rightMouseUpOn */
		rightMouseupOn : function() { return this.rightMouseUpOn.apply(this, arguments); },
  
// click at position 
	
		/**
		 * Emulates a single left click at the coordinates on the screen.
		 * Options can be in random order.
		 *
		 * @param {number} aScreenX
		 *   The X coordinate on the screen.
		 * @param {number} aScreenY
		 *   The Y coordinate on the screen.
		 * @param {nsIDOMWindow=} aRootFrame (optional)
		 *   The root frame (maybe a chrome window) which you want to find
		 *   the target frame from. If you didn't specify this option, this
		 *   finds frames from the topmost window on the specified coordinates.
		 * @param {{altKey: boolean,
		 *          ctrlKey: boolean,
		 *          metaKey: boolean,
		 *          shiftKey: boolean}=} (optional)
		 *   A hash of modifier keys. Default value of each key is
		 *   <code>false</code>.
		 *
		 * @throws {Error} If no element is found on the specified point.
		 *
		 * @see action.leftClickAt (alias)
		 */
		clickAt : function() 
		{
			var options = this._getMouseOptionsFor('click', 0, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.clickAt */
		leftClickAt : function() { return this.clickAt.apply(this, arguments); },
 
		/**
		 * Emulates a single middle click at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 */
		middleClickAt : function() 
		{
			var options = this._getMouseOptionsFor('click', 1, arguments);
			this.fireMouseEvent(options.window, options);
		},
 
		/**
		 * Emulates a single right click at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 */
		rightClickAt : function() 
		{
			var options = this._getMouseOptionsFor('click', 2, arguments);
			this.fireMouseEvent(options.window, options);
		},
  
// dblclick at position 
	
		/**
		 * Emulates a double left click at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.doubleclickAt (alias)
		 * @see action.dblClickAt (alias)
		 * @see action.dblclickAt (alias)
		 * @see action.leftDoubleClickAt (alias)
		 * @see action.leftDoubleclickAt (alias)
		 * @see action.leftDblClickAt (alias)
		 * @see action.leftDblclickAt (alias)
		 */
		doubleClickAt : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 0, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.doubleClickAt */
		doubleclickAt : function() { return this.doubleClickAt.apply(this, arguments); },
		/** @see action.doubleClickAt */
		dblClickAt : function() { return this.doubleClickAt.apply(this, arguments); },
		/** @see action.doubleClickAt */
		dblclickAt : function() { return this.doubleClickAt.apply(this, arguments); },
		/** @see action.doubleClickAt */
		leftDoubleClickAt : function() { return this.doubleClickAt.apply(this, arguments); },
		/** @see action.doubleClickAt */
		leftDoubleclickAt : function() { return this.doubleClickAt.apply(this, arguments); },
		/** @see action.doubleClickAt */
		leftDblClickAt : function() { return this.doubleClickAt.apply(this, arguments); },
		/** @see action.doubleClickAt */
		leftDblclickAt : function() { return this.doubleClickAt.apply(this, arguments); },
 
		/**
		 * Emulates a double middle click at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.middleDoubleclickAt (alias)
		 * @see action.middleDblClickAt (alias)
		 * @see action.middleDblclickAt (alias)
		 */
		middleDoubleClickAt : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 1, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.middleDoubleClickAt */
		middleDoubleclickAt : function() { return this.middleDoubleClickAt.apply(this, arguments); },
		/** @see action.middleDoubleClickAt */
		middleDblClickAt : function() { return this.middleDoubleClickAt.apply(this, arguments); },
		/** @see action.middleDoubleClickAt */
		middleDblclickAt : function() { return this.middleDoubleClickAt.apply(this, arguments); },
 
		/**
		 * Emulates a double right click at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.rightDoubleclickAt (alias)
		 * @see action.rightDblClickAt (alias)
		 * @see action.rightDblclickAt (alias)
		 */
		rightDoubleClickAt : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 2, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.rightDoubleClickAt */
		rightDoubleclickAt : function() { return this.rightDoubleClickAt.apply(this, arguments); },
		/** @see action.rightDoubleClickAt */
		rightDblClickAt : function() { return this.rightDoubleClickAt.apply(this, arguments); },
		/** @see action.rightDoubleClickAt */
		rightDblclickAt : function() { return this.rightDoubleClickAt.apply(this, arguments); },
  
// mousedown/mouseup at position 
	
		/**
		 * Emulates a single left mouse down at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.mousedownAt (alias)
		 * @see action.leftMouseDownAt (alias)
		 * @see action.leftMousedownAt (alias)
		 */
		mouseDownAt : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 0, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.mouseDownAt */
		mousedownAt : function() { return this.mouseDownAt.apply(this, arguments); },
		/** @see action.mouseDownAt */
		leftMouseDownAt : function() { return this.mouseDownAt.apply(this, arguments); },
		/** @see action.mouseDownAt */
		leftMousedownAt : function() { return this.mouseDownAt.apply(this, arguments); },
 
		/**
		 * Emulates a single middle mouse down at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.middleMousedownAt (alias)
		 */
		middleMouseDownAt : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 1, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.middleMouseDownAt */
		middleMousedownAt : function() { return this.middleMouseDownAt.apply(this, arguments); },
 
		/**
		 * Emulates a single right mouse down at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.rightMousedownAt (alias)
		 */
		rightMouseDownAt : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 2, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.rightMouseDownAt */
		rightMousedownAt : function() { return this.rightMouseDownAt.apply(this, arguments); },
 
		/**
		 * Emulates a single left mouse up at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.mouseupAt (alias)
		 * @see action.leftMouseUpAt (alias)
		 * @see action.leftMouseupAt (alias)
		 */
		mouseUpAt : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 0, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.mouseUpAt */
		mouseupAt : function() { return this.mouseUpAt.apply(this, arguments); },
		/** @see action.mouseUpAt */
		leftMouseUpAt : function() { return this.mouseUpAt.apply(this, arguments); },
		/** @see action.mouseUpAt */
		leftMouseupAt : function() { return this.mouseUpAt.apply(this, arguments); },
 
		/**
		 * Emulates a single middle mouse up at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.middleMouseupAt (alias)
		 */
		middleMouseUpAt : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 1, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.middleMouseUpAt */
		middleMouseupAt : function() { return this.middleMouseUpAt.apply(this, arguments); },
 
		/**
		 * Emulates a single right mouse up at the coordinates on the screen.
		 * Options are just same to action.clickAt.
		 *
		 * @see action.clickAt
		 * @see action.rightMouseupAt (alias)
		 */
		rightMouseUpAt : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 2, arguments);
			this.fireMouseEvent(options.window, options);
		},
		/** @see action.rightMouseUpAt */
		rightMouseupAt : function() { return this.rightMouseUpAt.apply(this, arguments); },
  
// low level API 
	
		/**
		 * Emulates various mouse events at the specified coordinates on the
		 * screen.
		 *
		 * @param {nsIDOMWindow} aFrame
		 *   The target frame to send a mouse event.
		 * @param {{x: number,
		 *          y: number,
		 *          screenX: number,
		 *          screenY: number,
		 *          type: string,
		 *          button: number,
		 *          detail: number,
		 *          altKey: boolean, ctrlKey: boolean,
		 *          metaKey: boolean, shiftKey: boolean}=} aOptions (optional)
		 *   Details of the event to be emulated. The interface is based on
		 *   nsIDOMMouseEvent.
		 *
		 * @throws {Error} If there is no window on the specified point.
		 *
		 * @deprecated
		 *   This is retained mainly for backward compatibilities and internal
		 *   use. On actual cases, you should use each short-hand method named
		 *   <code><var>***</var>At</code>.
		 *
		 * @see action.clickAt
		 * @see action.middleClickAt
		 * @see action.rightClickAt
		 * @see action.doubleClickAt
		 * @see action.middleDoubleClickAt
		 * @see action.rightDoubleClickAt
		 * @see action.mouseDownAt
		 * @see action.middleMouseDownAt
		 * @see action.rightMouseDownAt
		 * @see action.mouseUpAt
		 * @see action.middleMouseUpAt
		 * @see action.rightMouseUpAt
		 */
		fireMouseEvent : function(aFrame, aOptions) 
		{
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action.fireMouseEvent::['+aFrame+'] is not a frame!');

			if (!aOptions) aOptions = {};

			aOptions = this._normalizeScreenAndClientPoint(aOptions, aFrame);
			var x = aOptions.x;
			var y = aOptions.y;
			var screenX = aOptions.screenX;
			var screenY = aOptions.screenY;

			var win = this.getFrameAt(aFrame, screenX, screenY);
			if (!win ||
				!(win instanceof Ci.nsIDOMWindow))
				throw new Error('action.fireMouseEvent::there is no frame at ['+screenX+', '+screenY+']!');

			var node = this.getElementFromScreenPoint(aFrame, screenX, screenY);

			if (!this._getOwnerPopup(node)) {
				var utils = this._getWindowUtils(win);

				const nsIDOMNSEvent = Ci.nsIDOMNSEvent;
				var flags = 0;
				if (aOptions.ctrlKey) flags |= nsIDOMNSEvent.CONTROL_MASK;
				if (aOptions.altKey) flags |= nsIDOMNSEvent.ALT_MASK;
				if (aOptions.shiftKey) flags |= nsIDOMNSEvent.SHIFT_MASK;
				if (aOptions.metaKey) flags |= nsIDOMNSEvent.META_MASK;

				var button = (aOptions.button || 0);
				var detail = (aOptions.detail || 1);
				if (aOptions.type == 'click' && detail == 2) aOptions.type = 'dblclick';
				if (aOptions.type == 'dblclick') detail = 1;
				switch (aOptions.type)
				{
					case 'mousemove':
					case 'mouseover':
						utils.sendMouseEvent(aOptions.type, x, y, button, detail, flags);
						break;
					case 'mousedown':
						utils.sendMouseEvent('mousedown', x, y, button, detail, flags);
						break;
					case 'mouseup':
						utils.sendMouseEvent('mouseup', x, y, button, detail, flags);
						break;
					case 'dblclick':
						utils.sendMouseEvent('mousedown', x, y, button, detail, flags);
						utils.sendMouseEvent('mouseup', x, y, button, detail, flags);
						detail = 2;
					case 'click':
					default:
						utils.sendMouseEvent('mousedown', x, y, button, detail, flags);
						utils.sendMouseEvent('mouseup', x, y, button, detail, flags);
						// this._emulateClickOnXULElement(node, aOptions);
						break;
				}
				return;
			}

			// DOMWindowUtils.sendMouseEvent() fails to send events in popups, so I emulate it manually.

			if (node) {
				this.fireMouseEventOnElement(node, aOptions);
				this._emulateClickOnXULElement(node, aOptions);
			}
			else {
				throw new Error('action.fireMouseEvent::there is no element at ['+x+','+y+']!');
			}
		},
	
		/**
		 * Emulate side-effects of a mouse operation on a XUL element.
		 *
		 * @param {nsIDOMElement} aElement
		 *   A XUL element.
		 * @param {Object=} aOptions (optional)
		 *   A hash, options for fireMouseEvent.
		 *
		 * @see action.fireMouseEvent
		 */
		_emulateClickOnXULElement : function(aElement, aOptions) 
		{
			if (!aOptions) aOptions = {};
			this._emulateActionOnXULElement(
				aElement,
				aOptions,
				aOptions.type == 'click' && aOptions.button == 0
			);
		},
 
		/**
		 * Finds the nearest parent popup from the given XUL element.
		 *
		 * @param {nsIDOMElement} aElement
		 *   A XUL element in a popup.
		 *
		 * @returns {?nsIDOMElement}
		 *   The found popup element (menupopup, popup, tooltip, or panel).
		 *   If the given element is not in a popup, <code>null</code> will be
		 *   returned.
		 */
		_getOwnerPopup : function(aElement) 
		{
			return aElement.ownerDocument.evaluate(
					'ancestor-or-self::*[contains(" menupopup popup tooltip panel ", concat(" ", local-name(), " "))]',
					aElement,
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;
		},
  
		/**
		 * Emulates various mouse events on a DOM element.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element to send a mouse event.
		 * @param {{type: string,
		 *          button: number,
		 *          detail: number,
		 *          altKey: boolean, ctrlKey: boolean,
		 *          metaKey: boolean, shiftKey: boolean}=} aOptions (optional)
		 *   Details of the event to be emulated. The interface is based on
		 *   nsIDOMMouseEvent.
		 *
		 * @throws {Error} If no element is given.
		 *
		 * @deprecated
		 *   This is retained mainly for backward compatibilities and internal
		 *   use. On actual cases, you should use each short-hand method named
		 *   <code><var>***</var>On</code>.
		 *
		 * @see action.clickOn
		 * @see action.middleClickOn
		 * @see action.rightClickOn
		 * @see action.doubleClickOn
		 * @see action.middleDoubleClickOn
		 * @see action.rightDoubleClickOn
		 * @see action.mouseDownOn
		 * @see action.middleMouseDownOn
		 * @see action.rightMouseDownOn
		 * @see action.mouseUpOn
		 * @see action.middleMouseUpOn
		 * @see action.rightMouseUpOn
		 */
		fireMouseEventOnElement : function(aElement, aOptions) 
		{
			if (!aElement ||
				!(aElement instanceof Ci.nsIDOMElement))
				throw new Error('action.fireMouseEventOnElement::['+aElement+'] is not an element!');

			var utils = this._getWindowUtils(aElement.ownerDocument.defaultView);
			if (!aOptions) aOptions = { type : 'click' };
			if (!this._getOwnerPopup(aElement)) {
				aOptions = this._calculateCoordinatesFromElement(aOptions, aElement);
				this.fireMouseEvent(aElement.ownerDocument.defaultView, aOptions);
				return;
			}

			// DOMWindowUtils.sendMouseEvent() fails to send events in popups, so I emulate it manually.

			var detail = 1;
			var options, event;
			switch (aOptions.type)
			{
				case 'mousedown':
				case 'mouseup':
					break;
				case 'dblclick':
					options = {
						type      : 'mousedown',
						detail    : detail,
						__proto__ : aOptions
					};
					this.fireMouseEventOnElement(aElement, options);
					options.type = 'mouseup';
					this.fireMouseEventOnElement(aElement, options);
					detail++;
				case 'click':
				default:
					options = {
						type      : 'mousedown',
						detail    : detail,
						__proto__ : aOptions
					};
					this.fireMouseEventOnElement(aElement, options);
					options.type = 'mouseup';
					this.fireMouseEventOnElement(aElement, options);
					break;
			}
			event = this._createMouseEventOnElement(aElement, aOptions);
			if (event && aElement)
				aElement.dispatchEvent(event);
			if (aOptions.type != 'mousedown' &&
				aOptions.type != 'mouseup' &&
				aOptions.type != 'dblclick')
				this._emulateClickOnXULElement(aElement, aOptions);
		},
	
		/**
		 * Creates a DOM mouse event from the given element and options.
		 *
		 * @param {nsIDOMElement} aElement
		 *   A DOM element which is used to create new event.
		 * @param {Object=} aOptions (optional)
		 *   A hash, options for fireMouseEvent and fireMouseEventOnElement.
		 *
		 * @returns {nsIDOMElement}
		 *   A DOM mouse event.
		 *
		 * @throws {Error} If no element is given.
		 *
		 * @see action.fireMouseEvent
		 * @see action.fireMouseEventOnElement
		 */
		_createMouseEventOnElement : function(aElement, aOptions) 
		{
			if (!aElement ||
				!(aElement instanceof Ci.nsIDOMElement))
				throw new Error('action._createMouseEventOnElement::['+aElement+'] is not an element!');

			if (!aOptions) aOptions = {};
			if (!aElement) return null;
			aOptions = this._calculateCoordinatesFromElement(aOptions, aElement);

			var event = aElement.ownerDocument.createEvent('MouseEvents');
			event.initMouseEvent(
				(aOptions.type || 'click'),
				('canBubble' in aOptions ? aOptions.canBubble : true ),
				('cancelable' in aOptions ? aOptions.cancelable : true ),
				aElement.ownerDocument.defaultView,
				('detail' in aOptions ? aOptions.detail : 1),
				aOptions.screenX,
				aOptions.screenY,
				aOptions.x,
				aOptions.y,
				('ctrlKey' in aOptions ? aOptions.ctrlKey : false ),
				('altKey' in aOptions ? aOptions.altKey : false ),
				('shiftKey' in aOptions ? aOptions.shiftKey : false ),
				('metaKey' in aOptions ? aOptions.metaKey : false ),
				('button' in aOptions ? aOptions.button : 0 ),
				null
			);
			return event;
		},
 
		/**
		 * Calculates coordinates on the screen for new DOM mouse event from
		 * a DOM element. "x", "y", "screenX" and "screenY" are set to the
		 * center of the given element. If the element is partially visible,
		 * then coordinates are calculated as the center of the visible area.
		 *
		 * @param {?Object} aOptions (optional)
		 *   A hash, options for fireMouseEventOnElement.
		 * @param {nsIDOMElement} aElement
		 *   A DOM element which is used to calculate coordinates.
		 *
		 * @returns {{x: number,
		 *           y: number,
		 *           screenX: number,
		 *           screenY: number}}
		 *   A hash, options for fireMouseEventOnElement. All of properties
		 *   except x, y, screenX and screenY are inherited from the given hash.
		 *
		 * @see action.fireMouseEventOnElement
		 */
		_calculateCoordinatesFromElement : function(aOptions, aElement) 
		{
			if (aElement.nodeType != aElement.ELEMENT_NODE) aElement = aElement.parentNode;
			if (!aOptions) aOptions = {};

			var doc = this._getDocumentFromEventTarget(aElement);
			var frame = doc.defaultView;
			var box = this.getBoxObjectFor(aElement);
			var root = doc.documentElement;
			var rootBox = this.getBoxObjectFor(root);

			var frameX = frame.scrollX + rootBox.screenX;
			var frameY = frame.scrollY + rootBox.screenY;
			var frameW = Math.min(rootBox.width, frame.innerWidth);
			var frameH = Math.min(rootBox.height, frame.innerHeight);

			if ( // out of screen
				box.screenX > frameX + frameW ||
				box.screenY > frameY + frameH ||
				box.screenX + box.width < frameX ||
				box.screenY + box.height < frameY
				) {
				aOptions.screenX = box.screenX + Math.floor(box.width / 2);
				aOptions.screenY = box.screenY + Math.floor(box.height / 2);
			}
			else { // inside of screen:
				var visibleX = box.screenX;
				var visibleW = box.width;
				if (box.screenX < frameX) {
					visibleX = frameX;
					visibleW -= (frameX - box.screenX);
				}
				else if (box.screenX + box.width > frameX + frameW) {
					visibleW -= ((box.screenX + box.width) - (frameX + frameW));
				}

				var visibleY = box.screenY;
				var visibleH = box.height;
				if (box.screenY < frameY) {
					visibleY = frameY;
					visibleH -= (frameY - box.screenY);
				}
				else if (box.screenY + box.height > frameY + frameH) {
					visibleH -= ((box.screenY + box.height) - (frameY + frameH));
				}

				aOptions.screenX = visibleX + Math.floor(visibleW / 2);
				aOptions.screenY = visibleY + Math.floor(visibleH / 2);
			}

			aOptions.x = aOptions.screenX - rootBox.screenX - frame.scrollX;
			aOptions.y = aOptions.screenY - rootBox.screenY - frame.scrollY;

			return aOptions;
		},
    
// drag and drop: under construction 
	
		/** @ignore */
		dragStart : function(aFrame, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.type = 'mousedown';
			this.fireMouseEvent(aFrame, aOptions);
		},
	
		/** @ignore */
		dragStartOnElement : function(aElement, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.type = 'mousedown';
			this.fireMouseEventOnElement(aElement, aOptions);
		},
  
		/** @ignore */
		dragEnd : function(aFrame, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.type = 'mouseup';
			this.fireMouseEvent(aFrame, aOptions);
		},
	
		/** @ignore */
		dragEndOnElement : function(aElement, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.type = 'mouseup';
			this.fireMouseEventOnElement(aElement, aOptions);
		},
  
		/** @ignore */
		dragMove : function(aFrame, aFromX, aFromY, aToX, aToY, aOptions) 
		{
			if (!aOptions) aOptions = {};
			var dragEndFlag = { value : false };

			var deltaX = aFromX == aToX ? 0 :
					aFromX > aToX ? -1 :
					1;
			var deltaY = aFromY == aToY ? 0 :
					aFromY > aToY ? -1 :
					1;
			if (!deltaX && !deltaY) {
				dragEndFlag.value = true;
				return dragEndFlag;
			}

			if (deltaX) deltaX = deltaX * parseInt(Math.abs(aFromX - aToX) / 20);
			if (deltaY) deltaY = deltaY * parseInt(Math.abs(aFromY - aToY) / 20);

			var _this = this;
			function Dragger()
			{
				var x = aFromX;
				var y = aFromY;
				while (true)
				{
					if (deltaX > 0)
						x = Math.min(aToX, x + deltaX);
					else
						x = Math.max(aToX, x + deltaX);
					if (deltaY > 0)
						y = Math.min(aToY, y + deltaY);
					else
						y = Math.max(aToY, y + deltaY);
					aOptions.type = 'mousemove';
					aOptions.screenX = x;
					aOptions.screenY = y;
					_this.fireMouseEvent(aFrame, aOptions);
					yield;
					if (x == aToX && y == aToY) break;
				}
			}
			var dragger = Dragger();
			aFrame.setTimeout(function() {
				try {
					dragger.next();
					aFrame.setTimeout(arguments.callee, 10);
				}
				catch(e) {
					dragEndFlag.value = true;
				}
			}, 0);
			return dragEndFlag;
		},
	
		/** @ignore */
		dragMove : function(aFromElement, aToElement, aOptions) 
		{
			if (aFromElement.nodeType != aFromElement.ELEMENT_NODE)
				aFromElement = aFromElement.parentNode;
			if (aToElement.nodeType != aToElement.ELEMENT_NODE)
				aToElement = aToElement.parentNode;

			var doc = aFromElement.ownerDocument;
			var win = doc.defaultView;
			var fromBox = this.getBoxObjectFor(aFromElement);
			var toBox = this.getBoxObjectFor(aToElement);
			return this.dragMove(
					win,
					fromBox.screenX + Math.floor(fromBox.width / 2),
					fromBox.screenY + Math.floor(fromBox.height / 2),
					toBox.screenX + Math.floor(toBox.width / 2),
					toBox.screenY + Math.floor(toBox.height / 2),
					aOptions
				);
		},
  
		/** @ignore */
		dragAndDrop : function(aFrame, aFromX, aFromY, aToX, aToY, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.screenX = aFromX;
			aOptions.screenY = aFromY;
			this.dragStart(aFrame, aOptions);
			var dragEndFlag = { value : false };
			var _this = this;
			aFrame.setTimeout(function() {
				var flag = aSelf.dragMove(aFrame, aFromX, aFromY, aToX, aToY, aOptions);
				var timer = aFrame.setInterval(function() {
					if (!flag.value) return;
					aFrame.clearInterval(timer);
					aOptions.screenX = aToX;
					aOptions.screenY = aToY;
					aSelf.dragEnd(aFrame, aOptions);
					dragEndFlag.value = true;
				}, 10, this);
			}, 0);
			return dragEndFlag;
		},
	
		/** @ignore */
		dragAndDropOnElement : function(aFromElement, aToElement, aOptions) 
		{
			if (aFromElement.nodeType != aFromElement.ELEMENT_NODE)
				aFromElement = aFromElement.parentNode;
			if (aToElement.nodeType != aToElement.ELEMENT_NODE)
				aToElement = aToElement.parentNode;

			var doc = aFromElement.ownerDocument;
			var win = doc.defaultView;
			var fromBox = this.getBoxObjectFor(aFromElement);
			var toBox = this.getBoxObjectFor(aToElement);
			return this.dragAndDrop(
					win,
					fromBox.screenX + Math.floor(fromBox.width / 2),
					fromBox.screenY + Math.floor(fromBox.height / 2),
					toBox.screenX + Math.floor(toBox.width / 2),
					toBox.screenY + Math.floor(toBox.height / 2),
					aOptions
				);
		},
   
/* key event */ 
	
// utils 
	
		/**
		 * Returns given options as a normalized hash for
		 * fireKeyEventOnElement. Options can be in random order.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send created event.
		 * @param {number=} aKeyCode (optional)
		 *   A keycode defined in nsIDOMKeyEvent.
		 * @param {string=} aCharOrKeyName (optional)
		 *   A single character to detect keyboard key ('a', 'B', '!', ' ', etc.)
		 *   or a name of special keys ('ENTER', 'DELETE', 'F1', etc.).
		 * @param {{alt: boolean, altKey: boolean,
		 *          ctrl: boolean, ctrlKey: boolean,
		 *          control: boolean, controlKey: boolean,
		 *          meta: boolean, metaKey: boolean,
		 *          cmd: boolean, cmdKey: boolean,
		 *          command: boolean, commandKey: boolean,
		 *          shift: boolean, shiftKey: boolean}=} (optional)
		 *   A hash of modifier keys. Default value of each key is
		 *   <code>false</code>.
		 *
		 * @returns {{keyCode: number,
		 *           charCode: number,
		 *           element: ?nsIDOMElement,
		 *           altKey: boolean,
		 *           ctrlKey: boolean,
		 *           metaKey: boolean,
		 *           shiftKey: boolean}}}
		 *
		 * @see action.fireKeyEventOnElement
		 */
		_getKeyOptionsFromArguments : function() 
		{
			var modifierNames = 'alt,ctrl,control,shift,meta,cmd,command'
									.replace(/([^,]+)/g, '$1,$1Key')
									.split(',');
			var keyCode = 0,
				charCode = 0,
				modifiers, element;
			Array.slice(arguments).some(function(aArg) {
				if (typeof aArg == 'number') {
					keyCode = aArg;
				}
				else if (typeof aArg == 'string') {
					if (aArg.length == 1) {
						charCode = aArg.charCodeAt(0);
					}
					else {
						var name = 'DOM_VK_'+aArg.toUpperCase();
						if (name in Ci.nsIDOMKeyEvent)
							keyCode = Ci.nsIDOMKeyEvent[name];
					}
				}
				else if (aArg) {
					if (aArg instanceof Ci.nsIDOMElement)
						element = aArg;
					else if (modifierNames.some(function(aName) {
							return aName in aArg;
						}))
						modifiers = aArg;
				}
				return ((keyCode || charCode) && modifiers && element);
			}, this);

			if (modifiers) {
				modifiers.altKey = modifiers.altKey || modifiers.alt;
				modifiers.ctrlKey = modifiers.ctrlKey || modifiers.ctrl ||
									modifiers.controlKey || modifiers.control;
				modifiers.shiftKey = modifiers.shiftKey || modifiers.shift;
				modifiers.metaKey = modifiers.metaKey || modifiers.meta ||
									modifiers.cmdKey || modifiers.cmd ||
									modifiers.commandKey || modifiers.command;
			}
			else {
				modifiers = {};
			}

			return {
				keyCode : keyCode,
				charCode : charCode,
				element : element,
				altKey : modifiers.altKey,
				ctrlKey : modifiers.ctrlKey,
				shiftKey : modifiers.shiftKey,
				metaKey : modifiers.metaKey
			};
		},
  
		/**
		 * Emulates a single key press on a element. Options can be in
		 * random order.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send created event.
		 * @param {number=} aKeyCode (optional)
		 *   A keycode defined in nsIDOMKeyEvent.
		 * @param {string=} aCharOrKeyName (optional)
		 *   A single character to detect keyboard key ('a', 'B', '!', ' ', etc.)
		 *   or a name of special keys ('ENTER', 'DELETE', 'F1', etc.).
		 * @param {{altKey: boolean,
		 *          ctrlKey: boolean,
		 *          metaKey: boolean,
		 *          shiftKey: boolean}=} aModifiers (optional)
		 *   A hash of modifier keys. Default value of each key is
		 *   <code>false</code>.
		 *
		 * @throws {Error} If no element is given.
		 *
		 * @see action.keypressOn (alias)
		 */
		keyPressOn : function() 
		{
			var options = this._getKeyOptionsFromArguments.apply(this, arguments);
			options.type = 'keypress';
			this.fireKeyEventOnElement(options.element, options);
		},
		/** @see action.keyPressOn */
		keypressOn : function() { return this.keyPressOn.apply(this, arguments); },
 
		/**
		 * Emulates a single key down on a element. Options are just
		 * same to action.keyPressOn.
		 *
		 * @see action.keyPressOn
		 * @see action.keydownOn (alias)
		 */
		keyDownOn : function() 
		{
			var options = this._getKeyOptionsFromArguments.apply(this, arguments);
			options.type = 'keydown';
			this.fireKeyEventOnElement(options.element, options);
		},
		/** @see action.keyDownOn */
		keydownOn : function() { return this.keyDownOn.apply(this, arguments); },
 
		/**
		 * Emulates a single key down on a element. Options are just
		 * same to action.keyPressOn.
		 *
		 * @see action.keyPressOn
		 * @see action.keyupOn (alias)
		 */
		keyUpOn : function() 
		{
			var options = this._getKeyOptionsFromArguments.apply(this, arguments);
			options.type = 'keyup';
			this.fireKeyEventOnElement(options.element, options);
		},
		/** @see action.keyUpOn */
		keyupOn : function() { return this.keyUpOn.apply(this, arguments); },
 
// low level API 
	
		/**
		 * Emulates various keyboard events on a DOM element.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send created event.
		 * @param {{type: string,
		 *          keyCode: number,
		 *          charCode: number,
		 *          altKey: boolean, ctrlKey: boolean,
		 *          metaKey: boolean, shiftKey: boolean}=} aOptions (optional)
		 *   Details of the event to be emulated. The interface is based on
		 *   nsIDOMKeyEvent.
		 *
		 * @throws {Error} If no element is given.
		 *
		 * @deprecated
		 *   This is retained mainly for backward compatibilities and internal
		 *   use. On actual cases, you should use each short-hand method named
		 *   <code>key<var>***</var>On</code>.
		 *
		 * @see action.keyPressOn
		 * @see action.keyDownOn
		 * @see action.keyUpOn
		 */
		fireKeyEventOnElement : function(aElement, aOptions) 
		{
			if (!aElement ||
				!(aElement instanceof Ci.nsIDOMElement))
				throw new Error('action.fireKeyEventOnElement::['+aElement+'] is not an element!');

			if (aElement instanceof Ci.nsIDOMXULElement) {
				let dispatcher = this._getXULKeyEventDispatcher(aElement);
				if (!dispatcher || dispatcher.getAttribute('disabled') == 'true')
					return;
			}

			if (!aOptions) aOptions = {};
			if (!aOptions.type) aOptions.type = 'keypress';

			if (aElement.localName == 'textbox' &&
				'inputField' in aElement &&
				aElement.inputField instanceof Ci.nsIDOMElement)
				aElement = aElement.inputField;

			var doc = this._getDocumentFromEventTarget(aElement);

		// nsIDOMWindowUtils.sendKeyEvent() doesn't emulate events fired by user's actual operations.
		// So, I don't use it, and I have to emulate events manually.

		//	var utils = this._getWindowUtils(doc.defaultView);
		//
		//	const nsIDOMNSEvent = Ci.nsIDOMNSEvent;
		//	var flags = 0;
		//	if (aOptions.ctrlKey) flags |= nsIDOMNSEvent.CONTROL_MASK;
		//	if (aOptions.altKey) flags |= nsIDOMNSEvent.ALT_MASK;
		//	if (aOptions.shiftKey) flags |= nsIDOMNSEvent.SHIFT_MASK;
		//	if (aOptions.metaKey) flags |= nsIDOMNSEvent.META_MASK;
		//
		//	var keyCode = ('keyCode' in aOptions ? aOptions.keyCode : 0 );
		//	var charCode = ('charCode' in aOptions ? aOptions.charCode : 0 );
		//	utils.focus(aElement);
		//	utils.sendKeyEvent(aOptions.type || 'keypress', keyCode, charCode, flags);

			switch (aOptions.type)
			{
				case 'keydown':
				case 'keyup':
					break;
				case 'keypress':
				default:
					var options = {
							type      : 'keydown',
							__proto__ : aOptions
						};
					this.fireKeyEventOnElement(aElement, options);
					options.type = 'keyup';
					this.fireKeyEventOnElement(aElement, options);
					break;
			}
			aElement.dispatchEvent(this._createKeyEventOnElement(aElement, aOptions));
			if (aOptions.type != 'keydown' &&
				aOptions.type != 'keyup')
				this._emulateEnterOnXULElement(aElement, aOptions);
		},
	
		/**
		 * Creates a DOM keyboard event from the given element and options.
		 *
		 * @param {nsIDOMElement} aElement
		 *   A DOM element which is used to create new event.
		 * @param {Object=} aOptions (optional)
		 *   A hash, options for fireKeyEventOnElement.
		 *
		 * @returns {nsIDOMElement}
		 *   A DOM keyboard event.
		 *
		 * @throws {Error} If no element is given.
		 *
		 * @see action.fireKeyEventOnElement
		 */
		_createKeyEventOnElement : function(aElement, aOptions) 
		{
			if (!aElement ||
				!(aElement instanceof Ci.nsIDOMElement))
				throw new Error('action._createKeyEventOnElement::['+aElement+'] is not an element!');

			if (!aOptions) aOptions = {};
			if (!aOptions.type) aOptions.type = 'keypress';

			if (aOptions.type != 'keypress' &&
				aOptions.charCode &&
				!aOptions.keyCode) {
				aOptions.keyCode = Ci.nsIDOMKeyEvent['DOM_VK_'+String.fromCharCode(aOptions.charCode).toUpperCase()];
				aOptions.charCode = 0;
			}

			var node = aElement;
			var doc = this._getDocumentFromEventTarget(node);
			var event = doc.createEvent('KeyEvents');
			event.initKeyEvent(
				(aOptions.type || 'keypress'),
				('canBubble' in aOptions ? aOptions.canBubble : true ),
				('cancelable' in aOptions ? aOptions.cancelable : true ),
				doc.defaultView,
				('ctrlKey' in aOptions ? aOptions.ctrlKey : false ),
				('altKey' in aOptions ? aOptions.altKey : false ),
				('shiftKey' in aOptions ? aOptions.shiftKey : false ),
				('metaKey' in aOptions ? aOptions.metaKey : false ),
				('keyCode' in aOptions ? aOptions.keyCode : 0 ),
				('charCode' in aOptions ? aOptions.charCode : 0 )
			);
			return event;
		},
 
		/**
		 * Emulate side-effects of a keyboard operation on a XUL element.
		 *
		 * @param {nsIDOMElement} aElement
		 *   A XUL element.
		 * @param {Object=} aOptions (optional)
		 *   A hash, options for fireKeyEventOnElement.
		 *
		 * @see action.fireKeyEventOnElement
		 */
		_emulateEnterOnXULElement : function(aElement, aOptions) 
		{
			if (!aOptions) aOptions = {};
			this._emulateActionOnXULElement(
				aElement,
				aOptions,
				aOptions.type == 'keypress' &&
				(
					aOptions.keyCode == Ci.nsIDOMKeyEvent.DOM_VK_RETURN ||
					aOptions.keyCode == Ci.nsIDOMKeyEvent.DOM_VK_ENTER
				)
			);
		},
    
/* XULCommand event */ 
	
		/**
		 * Dispatches a XULCommandEvent from a XUL element on the coordinates
		 * in the screen. This does nothing if the source event is not a single
		 * left click, if the target is not an element which can dispatch
		 * XULCommandEvent, or if the target is disabled.
		 *
		 * @param {nsIDOMWindow} aFrame
		 *   The target frame to send a XULCommandEvent event.
		 * @param {Object=} aOptions (optional)
		 *   A hash, options for fireMouseEvent.
		 *
		 * @returns {boolean}
		 *   A XULCommandEvent is fired or not.
		 *
		 * @throws {Error}
		 *   If no frame is given, or there is no element on the point.
		 *
		 * @see action.fireMouseEvent
		 */
		fireXULCommandEvent : function(aFrame, aOptions) 
		{
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action.fireXULCommandEvent::['+aFrame+'] is not a frame!');

			if (!aOptions) aOptions = {};
			aOptions = this._normalizeScreenAndClientPoint(aOptions, aFrame);
			var node = this.getElementFromScreenPoint(aFrame, aOptions.screenX, aOptions.screenY);
			if (!node)
				throw new Error('action.fireXULCommandEvent::there is no element at ['+aOptions.screenX+','+aOptions.screenY+']!');
			return this.fireXULCommandEventOnElement(node, aOptions);
		},
 
		/**
		 * Dispatches a XULCommandEvent from a XUL element on the coordinates
		 * in the screen. This does nothing if the source event is not a single
		 * left click or a keypress from the "Enter" key, if the target is not
		 * an element which can dispatch XULCommandEvent, or if the target is
		 * disabled.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element to send a XULCommandEvent event.
		 * @param {Object=} aOptions (optional)
		 *   A hash, options for fireMouseEventOnElement or
		 *   fireKeyEventOnElement.
		 *
		 * @returns {boolean}
		 *   A XULCommandEvent is fired or not.
		 *
		 * @throws {Error} If no element is given.
		 *
		 * @see action.fireMouseEventOnElement
		 * @see action.fireKeyEventOnElement
		 */
		fireXULCommandEventOnElement : function(aElement, aOptions) 
		{
			if (!aElement ||
				!(aElement instanceof Ci.nsIDOMElement))
				throw new Error('action.fireXULCommandEventOnElement:['+aElement+'] is not an element!');

			aElement = this._getXULCommandEventDispatcher(aElement);
			if (!aElement || aElement.getAttribute('disabled') == 'true')
				return false;

			var event = this._createMouseEventOnElement(aElement, aOptions);
			if (event) {
				aElement.dispatchEvent(this._createXULCommandEvent(event));
				if (aElement.localName == 'menuitem') {
					aElement.ownerDocument.defaultView.setTimeout(function(aSelf) {
						var popup = aElement;
						while (popup = aSelf._getOwnerPopup(popup))
						{
							popup.hidePopup();
							popup = popup.parentNode;
						}
					}, 1, this);
				}
				return true;
			}
			return false;
		},
	
		/**
		 * Creates a XULCommandEvent for a source event.
		 *
		 * @param {nsIDOMEvent} aSourceEvent
		 *   A source event which is a keyboard event or a mouse event.
		 *
		 * @returns {nsIDOMXULCommandEvent}
		 *   The created XULCommandEvent.
		 */
		_createXULCommandEvent : function(aSourceEvent) 
		{
			var event = aSourceEvent.view.document.createEvent('XULCommandEvents');
			event.initCommandEvent('command',
				true,
				true,
				aSourceEvent.view,
				0,
				false,
				false,
				false,
				false,
				aSourceEvent
			);
			return event;
		},
  
		/**
		 * Finds the nearest parent element which can dispatch XULCommandEvent
		 * from the given XUL element. XULCommandEvent is fired only from XUL
		 * elements: button, menuitem, checkbox, radio, tab, or toolbarbutton
		 * which is not "menu" type.
		 *
		 * @param {nsIDOMElement} aElement
		 *   A XUL element.
		 *
		 * @returns {?nsIDOMElement}
		 *   The found XUL element or <code>null</code>.
		 */
		_getXULCommandEventDispatcher : function(aElement) 
		{
			return aElement.ownerDocument.evaluate(
					'ancestor-or-self::*['+
						'contains(" button menuitem checkbox radio tab ", concat(" ", local-name(), " ")) or '+
						'(local-name() = "toolbarbutton" and (not(@type) or @type != "menu"))'+
					'][1]',
					aElement,
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;
		},
 
		/**
		 * Finds the nearest parent element which can dispatch keyboard events
		 * from the given XUL element. Keyboard event is fired only from XUL
		 * elements: button, menuitem, checkbox, radio, tab, textbox, or
		 * toolbarbutton which is not "menu" type.
		 *
		 * @param {nsIDOMElement} aElement
		 *   A XUL element.
		 *
		 * @returns {?nsIDOMElement}
		 *   The found XUL element or <code>null</code>.
		 */
		_getXULKeyEventDispatcher : function(aElement) 
		{
			return aElement.ownerDocument.evaluate(
					'ancestor-or-self::*['+
						'contains(" button menuitem checkbox radio tab textbox ", concat(" ", local-name(), " ")) or '+
						'(local-name() = "toolbarbutton" and (not(@type) or @type != "menu"))'+
					'][1]',
					aElement,
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;
		},
 
		/**
		 * Emulate side-effects of a keyboard operation or a mouse operation
		 * on a XUL element.
		 *
		 * @param {nsIDOMElement} aElement
		 *   A XUL element.
		 * @param {Object=} aOptions (optional)
		 *   A hash, options for fireMouseEvent, fireMouseEventOnElement, or
		 *   fireKeyEventOnElement.
		 * @param {boolean=} aIsSimpleGesture (optional)
		 *   Whether the source action possibly fires XULCommandEvent.
		 *   XULCommandEvent can be fired from single left clicks or keypress
		 *   from "Enter" key.
		 *
		 * @see action.fireMouseEvent
		 * @see action.fireMouseEventOnElement
		 * @see action.fireKeyEventOnElement
		 */
		_emulateActionOnXULElement : function(aElement, aOptions, aIsSimpleGesture) 
		{
			if (!aElement) return;

			var target = this._getXULCommandEventDispatcher(aElement);
			if (!target || target.getAttribute('disabled') == 'true') return;

			if (!aOptions) aOptions = {};
			var isSimpleAction = !(
					aOptions.altKey ||
					aOptions.ctrlKey ||
					aOptions.shiftKey ||
					aOptions.metaKey
				);
			var isSimpleGesture = aIsSimpleGesture && isSimpleAction;
			var shouldSendXULCommandEvent = false;

			switch (target.localName)
			{
				case 'menuitem':
					if (!isSimpleGesture) return;
					shouldSendXULCommandEvent = true;
					target.ownerDocument.defaultView.setTimeout(function(aSelf) {
						var popup = target;
						while (popup = aSelf._getOwnerPopup(popup))
						{
							popup.hidePopup();
							popup = popup.parentNode;
						}
					}, 1, this);
					break;

				case 'button':
				case 'checkbox':
				case 'radio':
				case 'tab':
					if (!isSimpleGesture) return;
					shouldSendXULCommandEvent = true;
					break;

				case 'toolbarbutton':
					if (target.localName == 'toolbarbutton' &&
						target.getAttribute('type') != 'menu') {
						if (!isSimpleGesture) return;
						shouldSendXULCommandEvent = true;
						break;
					}
				case 'colorpicker':
					if (target.localName == 'colorpicker' &&
						target.getAttribute('type') != 'button') {
						break;
					}
				case 'menu':
					var popupId;
					var expression = '';
					var isContext = false;
					switch (aOptions.button)
					{
						case 0:
							popupId = target.getAttribute('popup');
							expression += 'child::*[local-name()="menupopup" or local-name()="popup"] |';
							if (navigator.platform.toLowerCase().indexOf('mac') > -1 &&
								!aOptions.altKey &&
								aOptions.ctrlKey &&
								!aOptions.shiftKey &&
								!aOptions.metaKey) {
							}
							else {
								if (!isSimpleAction) return;
								break;
							}
						case 2:
							if (!isSimpleAction) return;
							popupId = target.getAttribute('context');
							isContext = true;
							break;
						default:
							return;
					}
					var popup = target.ownerDocument.evaluate(
							expression+'/descendant::menupopup[@id="'+popupId+'"]',
							target,
							null,
							Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
							null
						).singleNodeValue;

					if (!popup) return;
					if ('openPopup' in popup && isContext)
						popup.openPopup(target, 'after_pointer', -1, -1, true, true);
					else
						popup.showPopup();
					break;
			}

			if (!shouldSendXULCommandEvent) return;
			try {
				this.fireXULCommandEventOnElement(target, aOptions);
			}
			catch(e) {
				dump(e+'\n');
			}
		},
  
/* text input */ 
	
// utils 
	
		/**
		 * Returns given options as a normalized hash for
		 * inputTextToField. Options can be in random order.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send input event.
		 * @param {string=} aInput (optional)
		 *   A string to be input.
		 *
		 * @returns {{input: string,
		 *           element: nsIDOMElement}}}
		 *
		 * @see action.inputTextToField
		 */
		_getInputOptionsFromArguments : function() 
		{
			var input, element;
			Array.slice(arguments).some(function(aArg) {
				if (typeof aArg == 'string') {
					input = aArg;
				}
				else if (aArg) {
					if (aArg instanceof Ci.nsIDOMElement)
						element = aArg;
				}
				return (input !== void(0) && element);
			});
			return { input : input, element : element };
		},
  
		/**
		 * Emulates text input to an editable element. Existing contents are
		 * automatically cleared. Options can be in random order.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send input event.
		 * @param {string=} aInput (optional)
		 *   A string to be input.
		 *
		 * @throws {Error}
		 *   If no element is given, or the element is not editable.
		 */
		inputTo : function() 
		{
			var options = this._getInputOptionsFromArguments.apply(this, arguments);
			this.inputTextToField(options.element, options.input, false, false);
		},
 
		/**
		 * Emulates text input to an editable element. The given text will be
		 * input after existing contents. Options can be in random order.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send input event.
		 * @param {string=} aInput (optional)
		 *   A string to be input.
		 *
		 * @throws {Error}
		 *   If no element is given, or the element is not editable.
		 */
		appendTo : function() 
		{
			var options = this._getInputOptionsFromArguments.apply(this, arguments);
			this.inputTextToField(options.element, options.input, true, false);
		},
 
		/**
		 * Emulates text pasting to an editable element from the clipboard.
		 * Existing contents are automatically cleared. Options can be in
		 * random order.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send input event.
		 * @param {string=} aInput (optional)
		 *   A string to be pasted.
		 *
		 * @throws {Error}
		 *   If no element is given, or the element is not editable.
		 */
		pasteTo : function() 
		{
			var options = this._getInputOptionsFromArguments.apply(this, arguments);
			this.inputTextToField(options.element, options.input, false, true);
		},
 
		/**
		 * Emulates text pasting to an editable element from the clipboard.
		 * The given text will be pasted after existing contents. Options can
		 * be in random order.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send input event.
		 * @param {string=} aInput (optional)
		 *   A string to be pasted.
		 *
		 * @throws {Error}
		 *   If no element is given, or the element is not editable.
		 */
		additionallyPasteTo : function() 
		{
			var options = this._getInputOptionsFromArguments.apply(this, arguments);
			this.inputTextToField(options.element, options.input, true, true);
		},
 
// low level API 
	
		_withIMECharacters : '\u3040-\uA4CF\uF900-\uFAFF', 
		get _inputArrayPattern() {
			delete this._inputArrayPattern;
			return this._inputArrayPattern = new RegExp('[^'+this._withIMECharacters+']|['+this._withIMECharacters+']+', 'g');
		},
		get _directInputPattern() {
			delete this._directInputPattern;
			return this._directInputPattern = new RegExp('[^'+this._withIMECharacters+']');
		},
 
		/**
		 * Emulates text input to an editable element.
		 *
		 * @deprecated
		 *   This is retained mainly for backward compatibilities and internal
		 *   use. On actual cases, you should use each short-hand method.
		 *
		 * @param {nsIDOMElement} aElement
		 *   The target element which you want to send input event.
		 * @param {string=} aInput (optional)
		 *   A string to be input.
		 * @param {boolean=} aIsAppend (optional)
		 *   Whether the input should be appended or not. If <code>true</code>,
		 *   the input will be appended after the existing contents. Otherwise
		 *   this method clears the existing contents.
		 * @param {boolean=} aDontFireKeyEvents (optional)
		 *   Whether keyboard events should be emulated or not. If
		 *   <code>true</code>, this method doesn't fire key events for each
		 *   characters. Otherwise key events for each character will be
		 *   emulated.
		 *
		 * @throws {Error}
		 *   If no element is given, or the element is not editable.
		 *
		 * @see action.inputTo
		 * @see action.appendTo
		 * @see action.pasteTo
		 * @see action.additionallyPasteTo
		 */
		inputTextToField : function(aElement, aInput, aIsAppend, aDontFireKeyEvents) 
		{
			if (!aElement) {
				throw new Error('action.inputTextToField::no target!');
			}
			else if (aElement instanceof Ci.nsIDOMElement) {
				if (aElement.localName != 'textbox' &&
					!(aElement instanceof Ci.nsIDOMNSEditableElement))
					throw new Error('action.inputTextToField::['+aElement+'] is not an input field!');
			}
			else {
				throw new Error('action.inputTextToField::['+aElement+'] is not an input field!');
			}

			if (!aIsAppend) aElement.value = '';

			if (!aDontFireKeyEvents && aInput) {
				var input = aElement;
				if (input.localName == 'textbox') input = input.inputField;

				var array = String(aInput || '').match(this._inputArrayPattern);
				if (!array) array = String(aInput || '').split('');
				array.forEach(function(aChar) {
					if (this._directInputPattern.test(aChar)) {
						this.fireKeyEventOnElement(input, {
							type     : 'keypress',
							charCode : aChar.charCodeAt(0)
						});
					}
					else {
						this.fireKeyEventOnElement(input, {
							type    : 'keypress',
							keyCode : 0xE5
						});
						this.inputTextToField(input, aChar, true, true);
					}
				}, this);
			}
			else {
				aElement.value += (aInput || '');
			}

			var doc = this._getDocumentFromEventTarget(aElement);
			var event = doc.createEvent('UIEvents');
			event.initUIEvent('input', true, true, doc.defaultView, 0);
			aElement.dispatchEvent(event);
		},
   
/* Operations for coordinates */ 
	
		/**
		 * Finds the topmost window on the specified coordinates in the screen.
		 *
		 * @param {number} aScreenX (optional)
		 *   The X coordinate on the screen.
		 * @param {number} aScreenY (optional)
		 *   The Y coordinate on the screen.
		 *
		 * @throws {Error} If there is no window on the point.
		 *
		 * @returns {nsIDOMWindow}
		 *   The found window.
		 */
		_getWindowAt : function(aScreenX, aScreenY) 
		{
			var windows = this._WindowMediator.getZOrderDOMWindowEnumerator(null, true);
			if (windows.hasMoreElements()) {
				while (windows.hasMoreElements())
				{
					let w = windows.getNext().QueryInterface(Ci.nsIDOMWindowInternal);
					if (this._isInside({
							x      : w.screenX,
							y      : w.screenY,
							width  : w.outerWidth,
							height : w.outerHeight
						}, aScreenX, aScreenY))
						return w;
				}
				throw new Error('action._getWindowAt:: there is no window at '+aScreenX+', '+aScreenY+'!');
			}
			// By the bug 156333, we cannot find windows by their Z order on Linux.
			// https://bugzilla.mozilla.org/show_bug.cgi?id=156333
			// This is alternative way for failover.
			windows = this._WindowMediator.getEnumerator(null);
			var array = [];
			while (windows.hasMoreElements())
			{
				array.push(windows.getNext().QueryInterface(Ci.nsIDOMWindowInternal));
			}
			var youngest;
			array.reverse()
				.some(function(aFrame) {
					youngest = this._isInside({
								x      : aFrame.screenX,
								y      : aFrame.screenY,
								width  : aFrame.outerWidth,
								height : aFrame.outerHeight
							}, aScreenX, aScreenY) ?
								aFrame :
								null ;
					return youngest;
				}, this);
			if (youngest) return youngest;
			throw new Error('action._getWindowAt:: there is no window at '+aScreenX+', '+aScreenY+'!');
		},
		_getFrameAndScreenPointFromArguments : function()
		{
			var w, x, y;
			Array.slice(arguments).some(function(aArg) {
				if (typeof aArg == 'number') {
					if (x === void(0))
						x = aArg;
					else if (y === void(0))
						y = aArg;
				}
				else if (aArg) {
					if (aArg instanceof Ci.nsIDOMWindow)
						w = aArg;
				}
				return (x !== void(0) && y !== void(0));
			});
			if (!w)
				w = this._getWindowAt(x, y);
			return [w, x, y];
		},
 
		/**
		 * Finds a DOM element from specified coordinates on the screen.
		 *
		 * @param {number} aScreenX
		 *   The X coordinate on the screen.
		 * @param {number} aScreenY
		 *   The Y coordinate on the screen.
		 * @param {nsIDOMWindow=} aRootFrame (optional)
		 *   The root frame (maybe a chrome window) which you want to find
		 *   an element from. If you didn't specify this option, this finds
		 *   an element from the topmost window on the specified coordinates.
		 *
		 * @returns {?nsIDOMElement}
		 *   The found element. If there is no DOM element, <code>null</code>
		 *   will be returned.
		 *
		 * @throws {Error} If no frame is given.
		 *
		 * @see action.getElementFromScreenPoint (alias)
		 */
		getElementAt : function() 
		{
			var [aFrame, aScreenX, aScreenY] = this._getFrameAndScreenPointFromArguments.apply(this, arguments);
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action.getElementFromScreenPoint::['+aFrame+'] is not a frame!');

			var popup = this._getPopupElementAt(aFrame, aScreenX, aScreenY);
			if (popup) return popup;

			var clientPos = this._calculateClientPointFromScreenPoint(aFrame, aScreenX, aScreenY);

			var elem = aFrame.document.elementFromPoint(clientPos.x, clientPos.y);
			if (
				elem &&
				(
					/^(i?frame|browser)$/i.test(elem.localName) ||
					(elem.localName == 'tabbrowser' &&
					this._isInside(elem.mPanelContainer.boxObject, aScreenX, aScreenY))
				)
				) {
				var node = this.getElementFromScreenPoint(
						elem.contentWindow,
						aScreenX + aFrame.scrollX,
						aScreenY + aFrame.scrollY
					);
				return this._getOriginalTargetAt(node, aScreenX, aScreenY);
			}
			return this._getOriginalTargetAt(elem, aScreenX, aScreenY);
		},
		/**
		 * An alias for getElementAt. This is retained for backward compatibility.
		 *
		 * @see action.getElementAt
		 */
		getElementFromScreenPoint : function() { return this.getElementAt.apply(this, arguments); },
	
		/**
		 * Finds a showing popup element from specified coordinates on the
		 * screen.
		 *
		 * @param {nsIDOMWindow} aFrame
		 *   The root frame (maybe a chrome window) which you want to find
		 *   a popup from.
		 * @param {number} aScreenX
		 *   The X coordinate on the screen.
		 * @param {number} aScreenY
		 *   The Y coordinate on the screen.
		 *
		 * @returns {?nsIDOMElement}
		 *   The found popup element. If there is no popup, <code>null</code>
		 *   will be returned.
		 */
		_getPopupElementAt : function(aFrame, aScreenX, aScreenY) 
		{
			var doc = aFrame.document;
			var popups = doc.evaluate(
					'/descendant::*[contains(" menupopup popup tooltip panel ", concat(" ", local-name(), " "))]',
					doc,
					null,
					Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
					null
				);
			for (var i = 0, maxi = popups.snapshotLength; i < maxi; i++)
			{
				var popup = popups.snapshotItem(i);
				if (popup.state != 'open') continue;
				if (!this._isInside(popup.boxObject, aScreenX, aScreenY)) continue;

				var nodes = [];
				var walker = doc.createTreeWalker(popup, Ci.nsIDOMNodeFilter.SHOW_ELEMENT, this._elementFilter, false);
				for (var node = walker.firstChild(); node != null; node = walker.nextNode())
				{
					if (this._isInside(this.getBoxObjectFor(node), aScreenX, aScreenY))
						nodes.push(node);
				}
				if (!nodes.length) continue;
				return this._getOriginalTargetAt(nodes[nodes.length-1], aScreenX, aScreenY);
			}
			return null;
		},
 
		/**
		 * Finds the DOM element from specified coordinates on the screen.
		 * If there are anonymous contents, this scans them recursively.
		 *
		 * @param {?nsIDOMElement} aElement
		 *   The root element which you want to find a DOM element from.
		 * @param {number} aScreenX
		 *   The X coordinate on the screen.
		 * @param {number} aScreenY
		 *   The Y coordinate on the screen.
		 *
		 * @returns {?nsIDOMElement}
		 *   The found element. If there is no element, <code>null</code>
		 *   will be returned.
		 */
		_getOriginalTargetAt : function(aElement, aScreenX, aScreenY) 
		{
			return this._getOriginalTargetAtInternal(aElement, aScreenX, aScreenY) || aElement;
		},
	
		_getOriginalTargetAtInternal : function(aElement, aScreenX, aScreenY) 
		{
			if (!aElement) return null;
			var doc = aElement.ownerDocument;
			var nodes = 'getAnonymousNodes' in doc ? doc.getAnonymousNodes(aElement) : null ;
			if (!nodes || !nodes.length) nodes = aElement.childNodes;
			if (!nodes || !nodes.length) return null;
			for (var i = 0, maxi = nodes.length; i < maxi; i++)
			{
				if (nodes[i].nodeType != nodes[i].ELEMENT_NODE ||
					!this._isInside(this.getBoxObjectFor(nodes[i]), aScreenX, aScreenY))
					continue;
				var node = this._getOriginalTargetAtInternal(nodes[i], aScreenX, aScreenY);
				if (node) return node;
			}
			return null;
		},
  
		/**
		 * The filter for TreeWalker.
		 */
		_elementFilter : function(aNode) { 
			return Ci.nsIDOMNodeFilter.FILTER_ACCEPT;
		},
  
		/**
		 * Finds a frame from specified coordinates on the screen. You can
		 * specify aRootFrame before coordinates as:
		 * <code>getFrameAt(aRootFrame, aScreenX, aScreenY)</code>.
		 *
		 * @param {number} aScreenX
		 *   The X coordinate on the screen.
		 * @param {number} aScreenY
		 *   The Y coordinate on the screen.
		 * @param {nsIDOMWindow=} aRootFrame (optional)
		 *   The root frame (maybe a chrome window) which you want to find
		 *   a sub frame from. If you didn't specify this option, this finds
		 *   a frame from the topmost window on the specified coordinates.
		 *
		 * @returns {?nsIDOMWindow}
		 *   The found frame. If there is no frame, <code>null</code> will be
		 *   returned.
		 *
		 * @throws {Error} If no frame is given.
		 *
		 * @see action.getFrameFromScreenPoint (alias)
		 * @see action.getWindowFromScreenPoint (alias, deprecated)
		 */
		getFrameAt : function() 
		{
			var [aFrame, aScreenX, aScreenY] = this._getFrameAndScreenPointFromArguments.apply(this, arguments);
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action.getFrameAt::['+aFrame+'] is not a frame!');

			var elem = this.getElementAt(aFrame, aScreenX, aScreenY);
			return elem ? elem.ownerDocument.defaultView : null ;
		},
		/**
		 * An alias for getFrameAt. This is retained for backward compatibility.
		 *
		 * @see action.getFrameAt
		 */
		getFrameFromScreenPoint : function()
		{
			return this.getFrameAt.apply(this, arguments);
		},
		/**
		 * An alias for getFrameAt. This is retained for backward compatibility.
		 *
		 * @deprecated Use action.getFrameAt().
		 *
		 * @see action.getFrameAt
		 */
		getWindowFromScreenPoint : function()
		{
			return this.getFrameAt.apply(this, arguments);
		},
 
		/**
		 * Calculates relative coordinates based on a frame, from coordinates
		 * on the screen.
		 *
		 * @param {nsIDOMWindow} aFrame
		 *   The base to calculate relative coordinates.
		 * @param {number} aScreenX
		 *   The X coordinate on the screen.
		 * @param {number} aScreenY
		 *   The Y coordinate on the screen.
		 *
		 * @returns {{x: number, y: number}}
		 *   Relative coordinates based on the given frame.
		 *
		 * @throws {Error} If no frame is given.
		 */
		_calculateClientPointFromScreenPoint : function(aFrame, aScreenX, aScreenY) 
		{
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action._calculateClientPointFromScreenPoint::['+aFrame+'] is not a frame!');

			var box = this.getBoxObjectFor(aFrame.document.documentElement);
			return {
				x : aScreenX - box.screenX - aFrame.scrollX,
				y : aScreenY - box.screenY - aFrame.scrollY
			};
		},
 
		/**
		 * Calculates relative coordinates and screen coordinates, if one of
		 * them is not specified.
		 *
		 * @param {{x: number,
		 *          y: number,
		 *          screenX: number,
		 *          screenY: number}} aOptions
		 *   A hash which has relative coordinates or screen coordinates.
		 * @param {nsIDOMWindow} aFrame
		 *   The base to calculate relative coordinates.
		 *
		 * @returns {{x: number,
		 *           y: number,
		 *           screenX: number,
		 *           screenY: number}}
		 *   A hash. All of properties except x, y, screenX and screenY are
		 *   inherited from the given hash.
		 *
		 * @throws {Error} If no frame is given.
		 */
		_normalizeScreenAndClientPoint : function(aOptions, aFrame) 
		{
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action._normalizeScreenAndClientPoint::['+aFrame+'] is not a frame!');

			var zoom = this.isFullZoom() ? this.getZoom(aFrame) : 1 ;
			var box = this.getBoxObjectFor(aFrame.document.documentElement);

			var x = (aOptions.x !== void(0) ?
						aOptions.x :
					aOptions.screenX !== void(0) ?
						aOptions.screenX - box.screenX - aFrame.scrollX :
						0
					) * zoom;
			var y = (aOptions.y !== void(0) ?
						aOptions.y :
					aOptions.screenY !== void(0) ?
						aOptions.screenY - box.screenY - aFrame.scrollY :
						0
					) * zoom;
			var screenX = aOptions.screenX !== void(0) ?
					aOptions.screenX :
					box.screenX + x + aFrame.scrollX;
			var screenY = aOptions.screenY !== void(0) ?
					aOptions.screenY :
					box.screenY + y + aFrame.scrollY;

			aOptions.x = x;
			aOptions.y = y;
			aOptions.screenX = screenX;
			aOptions.screenY = screenY;

			return aOptions;
		},
 
		/**
		 * Judges whether the point specified by given coordinates is in the
		 * rectangle of the given box or not.
		 *
		 * @param {{screenX: number,
		 *          screenY: number,
		 *          width: number,
		 *          height: number}} aBox
		 *   The box which have properties same to nsIBoxObject.
		 * @param {number} aScreenX
		 *   The X coordinate on the screen.
		 * @param {number} aScreenY
		 *   The Y coordinate on the screen.
		 *
		 * @returns {boolean}
		 *   Whether the specified point is in the box or not.
		 */
		_isInside : function(aBox, aScreenX, aScreenY) 
		{
			var left   = aBox.screenX;
			var top    = aBox.screenY;
			var right  = left + aBox.width;
			var bottom = top + aBox.height;
			return !(
					left   > aScreenX ||
					right  < aScreenX ||
					top    > aScreenY ||
					bottom < aScreenY
				);
		},
  
/* utils */ 
	
		/**
		 * Returns a nsIDOMWindowUtils for the given frame.
		 *
		 * @param {nsIDOMWindow} aFrame
		 *   The target frame.
		 *
		 * @returns {nsIDOMWindowUtils}
		 *   The nsIDOMWindowUtils service for the frame.
		 */
		_getWindowUtils : function(aFrame) 
		{
			return aFrame
					.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIDOMWindowUtils);
		},
 
		/**
		 * Returns related nsIDOMDocument for the given DOM node.
		 *
		 * @param {nsIDOMNode} aNode
		 *   The base node to find document.
		 *
		 * @returns {nsIDOMDocument}
		 *   The document related to the node.
		 */
		_getDocumentFromEventTarget : function(aNode) 
		{
			return !aNode ? null :
				(aNode.document || aNode.ownerDocument || aNode );
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

			for (var i in this)
			{
				if (i == 'export' ||
					i.charAt(0) == '_' ||
					!this.hasOwnProperty(i) ||
					typeof this[i] != 'function')
					continue;

				(function(aSymbol, aSelf) {
					aNamespace[aSymbol] = function() {
						return aSelf[aSymbol].apply(aSelf, arguments);
					};
				})(i, this);
			}
		}
 
	}; 
	namespace.action = action;
  
})(); 
  
