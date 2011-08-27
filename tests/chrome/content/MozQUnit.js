/**
 * @const namespace for qunit for firefox addon.
 */
var MozQUnit = exports.QUnit;
MozQUnit.logStr = '';

for ( var prop in MozQUnit ) {
  if ( MozQUnit[prop] === undefined ) {
	delete window[prop];
  } else {
	window[prop] = MozQUnit[prop];
  }
}


MozQUnit.begin = function() {
  MozQUnit.logStr += '----------Moz Qunit:Begin.----------\n';
};
MozQUnit.done = function(context) {
  MozQUnit.logStr += '----------Moz Qunit:Done:' +
       ' failed: ' + context.failed +
       ' passed: ' + context.passed +
       ' total: ' + context.total +
       ' runtime: ' + context.runtime + '(msec) ----------\n';
  dump(MozQUnit.logStr);
};
MozQUnit.moduleStart = function(context) {
  MozQUnit.logStr +='Moz Qunit: module start ' + context.name + '\n';
};
MozQUnit.moduleDone = function(context) {
  MozQUnit.logStr += 'Moz Qunit: module done ' + context.name +
       ' failed: ' + context.failed +
       ' passed: ' + context.passed +
       ' total: ' + context.total + 
       '\n';
};
MozQUnit.testStart = function(context) {
  MozQUnit.logStr += 'Moz Qunit: test start: ' + context.name + '\n';
};
MozQUnit.testDone = function(context) {
  MozQUnit.logStr += 'Moz Qunit: test done: ' + context.name +
       ' failed: ' + context.failed +
       ' passed: ' + context.passed +
       ' total: ' + context.total + 
       '\n';
};
MozQUnit.log = function(context) {
  MozQUnit.logStr += 'Moz Qunit log: result:' + context.result +
       ' message: ' + (context.message ? context.message : '') +  '\n';
};

