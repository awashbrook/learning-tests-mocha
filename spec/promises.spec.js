'use strict';

var
  chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  q = require('q');

chai.use(chaiAsPromised);
chai.use(sinonChai);

var log = console; // TODO log and print

describe('promises basics', function () {
  var protoPerson = {
    _disposition: 'Anticipation',
    eat: function (food) {
      this._disposition = 'Satisfied';log.info("\n\n" + this._name + " is eating delicious " + food);
    },
    beHungry: function (reason) {
      this._disposition = 'Starving';
      log.warn("\n\n" + this._name + " is hungry because: " + reason);
    },
    disposition: function () {
      return this._disposition;
    }
  };
  // TODO can't figure out how to bind this for async promise callbacks invocation of eat
  // You can't use .bind(this) on methods above as this does not existing in the object literal
  //this is not bound correctly when promise calls back: Cannot set property '_disposition' of undefined,

  function closurePerson(name, disposition) {
    disposition = disposition || 'Anticipation';
    function eat(food) {
      disposition = 'Satisfied';
      return log.info("\n\n" + name + " is eating delicious " + food);
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
    andy = closurePerson('Funky Andy');
    testPersonState(andy);
    andy = Object.create(protoPerson);
    andy._name = 'Object Andy';
    testPersonState(andy);
  });
  it("should show our two person impls are identical in behaviour when called asynchronously", function (done) {
    var funkyAndy = closurePerson('Funky Andy');
    setInterval(function () {
      testPersonState(funkyAndy);
      //done(); // Mocha Error: done() called multiple times
    }, 10);
    var objectAndy = Object.create(protoPerson);
    objectAndy._name = 'Object Andy';
    setInterval(function () {
      testPersonState(objectAndy);
      done();
    }, 10);
  });

  describe('test q', function () {
    describe("illustrate basic q usage with mocha and chai", function () {
      var cadey;
      beforeEach(function () {
        cadey = closurePerson('Cadey');
        //cadey = Object.create(protoPerson);
        //cadey._name = 'Cadey'; // this is not bound correctly when promise calls back: Cannot set property '_disposition' of undefined
      });
      it('should illustrate use terminating of promise chains with done - done for promise fulfillment', function (done) {
        expect(cadey.disposition()).to.equal('Anticipation');

        var pizzaOrderFulfillment = q.defer();
        var pizzaDelivered = pizzaOrderFulfillment.promise;

        //pizzaDelivered.then(cadey.eat, cadey.beHungry)
        //  .done(function () {
        //    console.log("Done Called...");
        //    done(); // double done's somehow from this test which is run twice by mocha!!
        //  });

        pizzaOrderFulfillment.resolve('Pepperoni');

        pizzaDelivered.then(cadey.eat, cadey.beHungry)
          .then(function (message) {
            console.log("Done Called...");
            expect(message).to.have.string('Satisfied');
          })
          .done(done);
        //expect(cadey.disposition()).to.equal('Satisfied'); // Cmd line quiting before this...
      });
      it('should illustrate returning our promises to mocha to await fulfillment', function () {
        expect(cadey.disposition()).to.equal('Anticipation');

        var pizzaOrderFulfillment = q.defer();
        var pizzaDelivered = pizzaOrderFulfillment.promise;

        pizzaOrderFulfillment.resolve('Pepperoni');

        return pizzaDelivered.then(cadey.eat, cadey.beHungry)
          .then(function(message) {
            expect(message).to.have.string('Satisfied');
          });
      });
      it('should illustrate use of chai-as-promised to notify of promise fulfillment', function (done) {
        expect(cadey.disposition()).to.equal('Anticipation');

        var pizzaOrderFulfillment = q.defer();
        var pizzaDelivered = pizzaOrderFulfillment.promise;

        pizzaOrderFulfillment.resolve('Pepperoni');

        expect(pizzaDelivered.then(cadey.eat, cadey.beHungry))
          .to.eventually.have.string('Satisfied')
          .notify(done);
      });
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

    it.skip('should illustrate promise rejection', function () {
      var pizzaPit = new Restaurant();
      var pizzaDelivered = pizzaPit.takeOrder('Capricciosa');

      pizzaDelivered.then(cadey.eat, cadey.beHungry);

      pizzaPit.problemWithOrder('no Capricciosa, only Margherita');
    });
  });
});






















