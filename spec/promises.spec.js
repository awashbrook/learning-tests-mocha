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
    var Person = function(name, log) {
      this.eat = function(food) {
        log.info("\n\n" + name + "is eating delicious " + food);
      };
      this.beHungry = function(reason) {
        log.warn("\n\n" + name + "is hungry because: " + reason);
      };
    };

    var andy = new Person('Andy', log);

    it('should illustrate basic q usage', function (done) {
      var pizzaOrderFulfillment = q.defer()
      var pizzaDelivered = pizzaOrderFulfillment.promise;

      pizzaDelivered.then(andy.eat, andy.beHungry).done(done);
      ///tick?
      pizzaOrderFulfillment.resolve('Pepperoni');

      expect(undefined).to.be.undefined;
    });
  })
});






















