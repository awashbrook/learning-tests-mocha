'use strict';

var
  chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  q = require('q');

chai.use(sinonChai);

var log = console;

describe('promises basics', function () {

  describe.only('test inheritance patterns', function () {
    it("should simpy create an object using Object.create() instead of 'new'", function () {
      //http://ericleads.com/2013/02/fluent-javascript-three-different-kinds-of-prototypal-oo/
      var proto = {
        name: 'Nobody',
        hello: function hello() {
          return 'Hello, my name is ' + this.name;
        },
        setName: function (name) {
          this.name = name;
          return this;
        }
      };

      var george = Object.create(proto);
      expect(george.hello()).to.have.string('Nobody'); // AW

      george.name = 'George';
      expect(george.hello()).to.have.string('George');

      expect(george.setName('Andy').hello()).to.have.string('Andy');
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
            radius: getSetRadius, // privaliged method
            //diameter: diameter, // private method
            circumference: circumference // privaleged
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

  describe('test q', function () {
    var protoPerson = {
      //disposition: 'Anticipation',
      eat: function (food) {
        this.disposition = 'Satisified';
        log.info("\n\n" + this.name + "is eating delicious " + food);
      },
      beHungry: function (reason) {
        this.disposition = 'Starving';
        log.warn("\n\n" + this.name + "is hungry because: " + reason);
      }
    };

    var andy = Object.create(protoPerson);
    andy.name = 'Andy';
    andy.disposition = 'Anticipation';

    var closurePerson = function (name, disposition) {

      this.eat = function (food) {
        disposition = 'Satisified';
        log.info("\n\n" + name + "is eating delicious " + food);
      };
      this.beHungry = function (reason) {
        disposition = 'Starving';
        log.warn("\n\n" + name + "is hungry because: " + reason);
      };
      this.disposition = function () {
        return disposition;
      };
    };

    var funkyAndy = new closurePerson('Andy', "Anticipating...");

    it('should illustrate basic q usage', function (done) {
      var pizzaOrderFulfillment = q.defer()
      var pizzaDelivered = pizzaOrderFulfillment.promise;

      pizzaDelivered.then(andy.eat, andy.beHungry).done(done);
      pizzaOrderFulfillment.resolve('Pepperoni');

      expect(andy.disposition).to.equal('Satisfied');
    });

    var Restaurant = function () {
      var currentOrder;
      this.takeOrder = function (orderedItems) {
        currentOrder = {
          deferred: q.defer(),
          items: orderedItems
        };
        return currentOrder.deferred.promise;
      };
      this.deliverOrder = function () {
        currentOrder.deferred.resolve(currentOrder.items);
      };
      this.problemWithOrder = function (reason) {
        currentOrder.deferred.reject(reason)
      };
    };

    it.skip('should illustrate promise rejection', function (done) {
      var pizzaPit = new Restaurant();
      var pizzaDelivered = pizzaPit.takeOrder('Capricciosa');

      pizzaDelivered.then(andy.eat, andy.beHungry);

      pizzaPit.problemWithOrder('no Capricciosa, only Margherita');


    })
  })
});






















