'use strict';

// bind() introduced in ecma script 5, not supported by older browsers
// including PhantomJS https://github.com/ariya/phantomjs/issues/10522
// the MDN polyfill covers my use case http://devdocs.io/javascript/global_objects/function/bind
/*jshint -W014 */
/*jshint -W055 */

if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP    = function() {},
      fBound  = function() {
        return fToBind.apply(this instanceof fNOP && oThis
            ? this
            : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// Object.is is a proposed addition to the ECMA-262 standard, want to be able to test for NaN equal NaN in tests!
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
if (!Object.is) {
  Object.is = function(v1, v2) {
    if (v1 === 0 && v2 === 0) {
      return 1 / v1 === 1 / v2;
    }
    if (v1 !== v1) {
      return v2 !== v2;
    }
    return v1 === v2;
  };
}
