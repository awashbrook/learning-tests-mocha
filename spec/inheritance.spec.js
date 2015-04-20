'use strict';

var
  chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe.skip('test inheritance patterns', function () {

  describe('object oriented patterns', function () {
    //http://ericleads.com/2013/02/fluent-javascript-three-different-kinds-of-prototypal-oo/
    var proto = { // No constructor function
      _name: 'Nobody', // Pseudo-private members only
      hello: function hello() {
        return 'Hello, my name is ' + this._name;
      },
      setName: function (name) {
        this._name = name;
        return this;
      }
    };
    it("should simpy create an object using Object.create() instead of 'new'", function () {
      var george = Object.create(proto);
      expect(george.hello()).to.have.string('Nobody');

      george._name = 'George';  // Exuse the intrusion!!
      expect(george.hello()).to.have.string('George');

      expect(george.setName('Andy').hello()).to.have.string('Andy');
    });
    it("should show such objects have 'this' set appropriately for callbacks", function (done) {
      var george = Object.create(proto);
      expect(george.hello()).to.have.string('Nobody');

      // TODO interferes with other timer based tests when we run alongside promise tests
      setInterval(function () {
        console.log(george.setName('George'));
        expect(george.hello()).to.have.string('George');
        done();
      }, 10);
    });

  });


  describe("Closure based private state using Functional Inheritance", function () {
    it.skip("should show functional inheritance ala Crockford", function () {
      // http://javascript.crockford.com/private.html
      function Container(param) {
        function dec() {
          if (secret > 0) {
            secret -= 1;
            return true;
          } else {
            return false;
          }
        }
        function getStash() {
          return stash;
        }
        //this.member = param; // this stuff doesn't work?!
        var stash = param;
        var secret = 3;
        var that = this;
      }
      var container = Container({ stuff: 'myStash'});
      expect(container).to.exist; // Why...TODO
      expect(container.dec()).to.be.truthy;
    });
    it("should show functional inheritance as per tddjs.com pg 147", function () {
      function circle(radius) {
        function getSetRadius() {
          if (arguments.length > 0) {
            if (arguments[0] < 0) {
              throw new TypeError('Radius must be positive');
            } else {
              radius = arguments[0];
            }
          }
          return radius;
        }
        function diameter() {
          return radius * 2;
        }
        function circumference() {
          return diameter() * Math.PI;
        }
        return {
          radius: getSetRadius, // privileged method
          //diameter: diameter, // private method
          circumference: circumference // privileged
        }
      }

      var circ = circle(6);
      expect(circ.radius()).to.equal(6);
      circ.radius(12);
      expect(circ.radius()).to.equal(12);
      expect(circ.diameter).not.to.exist;
      expect(circ.circumference).to.exist;
      expect(circ.circumference).to.be.a('function');
      expect(circ.circumference()).to.equal(24 * Math.PI);
    });

  });
});






















