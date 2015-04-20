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






















