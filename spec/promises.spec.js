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
  describe('test q', function () {
    var protoPerson = {
      _disposition: 'Anticipation',
      eat: function (food) {
        this._disposition = 'Satisfied';
        log.info("\n\n" + this._name + "is eating delicious " + food);
      },
      beHungry: function (reason) {
        this._disposition = 'Starving';
        log.warn("\n\n" + this._name + "is hungry because: " + reason);
      },
      disposition: function () {
        return this._disposition;
      }
    };
    // TODO can't figure out how to bind this for promise callbacksinvocation of eat, this doesn't exist above?!

    function closurePerson(name, disposition) {
      disposition = disposition || 'Anticipation';
      function eat(food) {
        disposition = 'Satisfied';
        log.info("\n\n" + name + " is eating delicious " + food);
      }
      function beHungry(reason) {
        disposition = 'Starving';
        log.warn("\n\n" + name + " is hungry because: " + reason);
      }
      function getDisposition() {
        return disposition;
      }
      return { // privileged methods
        disposition: getDisposition,
        eat: eat,
        beHungry: beHungry
      };
    }

    function testPersonState(person) {
      expect(person.disposition).to.exist;
      expect(person.disposition).to.be.a('function');
      expect(person.disposition()).to.equal('Anticipation');

      expect(person.beHungry).to.exist;
      expect(person.beHungry).to.be.a('function');
      person.beHungry("Couldn't find take out menu!");
      expect(person.disposition()).to.equal('Starving');

      expect(person.eat).to.exist;
      expect(person.eat).to.be.a('function');
      person.eat('Bananas');
      expect(person.disposition()).to.equal('Satisfied');
    }

    it("should show our two person impls are identical in behaviour when called synchronously", function () {
      var andy;

      andy = closurePerson('Andy');
      testPersonState(andy);

      andy = Object.create(protoPerson);
      andy._name = 'Andy';
      testPersonState(andy);
    });

    it('should illustrate basic q usage', function (done) {
      expect(andy.disposition()).to.equal('Anticipation');

      var pizzaOrderFulfillment = q.defer();
      var pizzaDelivered = pizzaOrderFulfillment.promise;

      pizzaDelivered.then(andy.eat, andy.beHungry).done(done);
      pizzaOrderFulfillment.resolve('Pepperoni');

      expect(andy.disposition()).to.equal('Satisfied');
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
        currentOrder.deferred.reject(reason);
      };
    };

    it.skip('should illustrate promise rejection', function (done) {
      var pizzaPit = new Restaurant();
      var pizzaDelivered = pizzaPit.takeOrder('Capricciosa');

      pizzaDelivered.then(andy.eat, andy.beHungry);

      pizzaPit.problemWithOrder('no Capricciosa, only Margherita');
    });
  });
});






















