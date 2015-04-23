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

var log = console; // TODO log and return?

describe('sample based on two alternative "object" approaches to inheritance', function () {

  var protoPerson = {
    _disposition: 'Anticipation',
    eat: function (food) {
      this._disposition = 'Satisfied';
      var str = ("\n\n" + this._name + " is eating delicious " + food);
      log.info(str);
      return str; // return q.resolve() or value
    },
    beHungry: function (reason) {
      this._disposition = 'Starving';
      var str = ("\n\n" + this._name + " is hungry because: " + reason);
      log.info(str);
      throw new Error(str); // return q.reject() or exception
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
      var str = ("\n\n" + name + " is eating delicious " + food);
      log.info(str);
      return str; // return q.resolve() or value
    }
    function beHungry(reason) {
      disposition = 'Starving';
      var str = ("\n\n" + name + " is hungry because: " + reason);
      log.info(str);
      throw new Error(str); // return q.reject() or exception
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
  describe("should show our two person impls are identical in behaviour", function () {
    function testPersonState(person) {
      expect(person.disposition).to.exist;
      expect(person.disposition).to.be.a('function');
      expect(person.disposition()).to.equal('Anticipation');

      expect(person.beHungry).to.exist;
      expect(person.beHungry).to.be.a('function');
      expect(function () {
        person.beHungry("Couldn't find take out menu!");
      }).to.throw(/menu/);
      expect(person.disposition()).to.equal('Starving');

      expect(person.eat).to.exist;
      expect(person.eat).to.be.a('function');
      person.eat('Bananas');
      expect(person.disposition()).to.equal('Satisfied');
    }
    var funkyAndy, objectAndy;
    beforeEach(function () {
      funkyAndy = closurePerson('Funky Andy');
      objectAndy = Object.create(protoPerson);
      objectAndy._name = 'Object Andy';
    });
    it("when called synchronously", function () {
      testPersonState(funkyAndy);
      testPersonState(objectAndy);
    });
    it.skip("when called asynchronously: this test interferes with other async tests", function (done) {
      // TODO - this test interferes with other async tests somebow (TBD) AssertionError: expected 'Satisfied' to equal 'Anticipation'
      setInterval(function () {
        testPersonState(funkyAndy);
        //done(); // Mocha Error: done() called multiple times
      }, 10);
      setInterval(function () {
        testPersonState(objectAndy);
        done();
      }, 10);
    });
    it.skip("when issues in parallel as promises: can't fairly keep this test as it will invokes done twice", function (done) {
      function setIntervalWithPromise(person) {
        return q.delay(10).then( function () {
          testPersonState(person);
        }).done(done);
      }
      setIntervalWithPromise(funkyAndy);
      setIntervalWithPromise(objectAndy);
    });
    it("when chained together as aggregated promises", function (done) {
      var personPromises = q.all([
        q.delay(10).then( function () { testPersonState(funkyAndy); }),
        q.delay(10).then( function () { testPersonState(objectAndy); })
      ]);
      personPromises.then( function () { console.log('Both completed ok, yay :)')}).done(done);
    });
  });
  describe.only("chained vs nested promises", function () {
    this.timeout(30 * 1000);
    var personPromises;
    beforeEach(function () {
      //personPromises = [ // Can't do this as they all fire in parallel when declared :)
      //  q.delay(1).then( function () { console.log('1 Millis OK') }),
      //  q.delay(5000).then( function () { console.log('Five Secs OK') }),
      //  q.delay(1000).then( function () { console.log('One Sec OK') }),
      //  q.delay(100).then( function () { console.log('100 Millis OK') }),
      //  q.delay(10).then( function () { console.log('10 Millis OK') })
      //];
    });
    it("shows lots of short promise chain tuples aggregated togther with all()", function (done) {
      q.all([
          q.delay(1).then( function () { console.log('1 Millis OK') }),
          //q.delay(5000).then( function () { console.log('Five Secs OK') }),
          q.delay(1000).then( function () { console.log('One Sec OK') }),
          q.delay(100).then( function () { console.log('100 Millis OK') }),
          q.delay(10).then( function () { console.log('10 Millis OK') })
      ]).then( function () { console.log('All completed in parallel, yay :)')}).done(done);
    });
    it("shows a chain stretching our tuples into single long hand chain each promise indented at same level (no nesting)", function (done) {
      q("Initial Value")
        .then(q.delay(100))
        .then( function () { console.log('\n100 Millis OK') })
        .then(q.delay(10))
        .then( function () { console.log('\n10 Millis OK') })
        .then( function () { console.log('...All completed in proper manner')})
        .done(done);
    });
    it("shows a short chain long hand, this is NOT the correct way to declared nested promises", function (done) {
      // the nested slide 16 may be leading me astray http://www.slideshare.net/ankitag9/avoiding-callback-hell?
      q("Initial Value")
        .then(q.delay(10) // First independently executing chain of promises
          .then( function () { console.log('10 Millis OK') }))
        .then(q.delay(1) // Second independenttly executing chain of promises
          .then( function () { console.log('1 Millis OK') }))
        .then( function () { console.log('Completes immediately!')})
        .done();
      q.delay(100) // Third independenttly executing chain of promises
        .then( function () { console.log('...waiting 100 Millis for above to complete in parallel') })
        .done(done);
    });
    function setTimer(millis) {
      // we are both declaring and resolving promise with this helper https://www.npmjs.com/package/q#using-deferreds
      //function delay(ms) {
      //  var deferred = Q.defer();
      //  setTimeout(deferred.resolve, ms);
      //  return deferred.promise;
      //}
      return q.delay(millis).then( function () { console.log(millis + ' Millis OK') });
    }
    it("shows above mistake with helper, very easy to miss when you create independent promise chains with a sub-function", function (done) {
      q("Initial Value") //
        .then(setTimer(10))
        .then(setTimer(1))
        .then( function () { console.log('Completes immediately!')})
        .done();
      q.delay(100) // Third independenttly executing chain of promises
        .then( function () { console.log('...waiting 100 Millis for above to complete in parallel') })
        .done(done);
    });
    it.skip("when nested together as a sequence of promises", function (done) {
      var result = q("Initial Value");
      personPromises.forEach(function (f) {
        result = result.then(f);
      });
      result.then( function () { console.log('All completed in sequence, yay :)')}).done(done);
      result.then( function () { console.log('All completed in sequence, yay :)')}).done(done);
      // TODO Only first promise in array firing
    });
  });
  describe("successful promise resolution with mocha and chai", function () {
    var cadey;
    beforeEach(function () {
      cadey = closurePerson('Cadey');
      //cadey = Object.create(protoPerson);
      //cadey._name = 'Cadey'; // this is not bound correctly when promise calls back: Cannot set property '_disposition' of undefined
    });
    it('should illustrate use terminating of promise chains with done & done for promise fulfillment', function (done) {
      expect(cadey.disposition()).to.equal('Anticipation');

      var pizzaOrderFulfillment = q.defer();
      var pizzaDelivered = pizzaOrderFulfillment.promise;

      //pizzaDelivered.then(cadey.eat, cadey.beHungry)
      //  .done(function () {
      //    console.log("Done Called...");
      //    done(); // double done's triggered somehow from this test which mocha somehow ran twice!!
      //  });

      pizzaDelivered.then(cadey.eat, cadey.beHungry)
        .then(function (message) {
          expect(message).to.exist;
          expect(message).to.have.string('Pepperoni');
        })
        .done(done); // done reports Uncaught AssertionError: expected undefined to exist, expectations fail above
      // This style encourages one to catch AssertionErrors, let's see how the others handle non expectation failures?!

      //expect(cadey.disposition()).to.equal('Satisfied'); // Cmd line quiting before this...

      pizzaOrderFulfillment.resolve('Pepperoni');
    });
    it('should illustrate returning our promises to mocha to await fulfillment', function () {
      expect(cadey.disposition()).to.equal('Anticipation');

      var pizzaOrderFulfillment = q.defer();
      var pizzaDelivered = pizzaOrderFulfillment.promise;

      pizzaOrderFulfillment.resolve('Pepperoni'); // This return style relies on the fact you can resolve() before then() with promises

      return pizzaDelivered.then(cadey.eat, cadey.beHungry)
        .then(function(message) {
          expect(message).to.exist;
          expect(message).to.have.string('Pepperoni');
        }); // Mocha will just say AssertionError: expected undefined to exist
    });
    it('should illustrate use of chai-as-promised to notify of promise fulfillment', function (done) {
      expect(cadey.disposition()).to.equal('Anticipation');

      var pizzaOrderFulfillment = q.defer();
      var pizzaDelivered = pizzaOrderFulfillment.promise;
      expect(pizzaDelivered.then(cadey.eat, cadey.beHungry)) // Can only set up a single expectation with this concise style
        .to.eventually.have.string('Pepperoni') // Get stack with have string and not with exist above??
        // TODO try compound expectation eg. expect(fn).to.throw(ReferenceError) .and.not.throw(/good function/);
        .notify(done);

      pizzaOrderFulfillment.resolve('Pepperoni');
    });
  });
  describe("promise rejection with mocha and chai", function () {
    var cadey;
    beforeEach(function () {
      cadey = closurePerson('Cadey');
    });
    it('should illustrate use terminating of promise chains with done & done for promise fulfillment', function (done) {
      expect(cadey.disposition()).to.equal('Anticipation');

      var pizzaOrderFulfillment = q.defer();
      var pizzaDelivered = pizzaOrderFulfillment.promise;

      pizzaDelivered.then(cadey.eat, cadey.beHungry)
        // Originally had my reject handler above return value, rather than throwing exception!
        // The well meaning but superflous then() below succeeded in being resolved with my error message,
        // which was of course re-thrown as an AssertionExcepton with err.actual set, then caught

        //.then(function (message) {
        //  expect(message).not.to.exist;
        //})
        .catch(function (err) {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.have.string('menu');
        })
        .done(done);

      pizzaOrderFulfillment.reject("Couldn't find take out menu!");
    });
    it('should illustrate returning our promises to mocha to await fulfillment', function () {
      expect(cadey.disposition()).to.equal('Anticipation');

      var pizzaOrderFulfillment = q.defer();
      var pizzaDelivered = pizzaOrderFulfillment.promise;

      pizzaOrderFulfillment.reject("Couldn't find take out menu!");

      return pizzaDelivered.then(cadey.eat, cadey.beHungry)
        .catch(function (err) {
          expect(err).to.exist;
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.have.string('menu');
        });
    });
    it('should illustrate use of chai-as-promised to notify of promise fulfillment', function (done) {
      expect(cadey.disposition()).to.equal('Anticipation');

      var pizzaOrderFulfillment = q.defer();
      var pizzaDelivered = pizzaOrderFulfillment.promise;

      pizzaOrderFulfillment.reject("Couldn't find take out menu!");

      expect(pizzaDelivered.then(cadey.eat, cadey.beHungry)) // Can only set up a single expectation with this concise style
        .to.be.rejected
        //.to.be.rejectedWith(/menu/)
        //.to.be.rejectedWith("\n\nCadey is hungry because: Couldn't find take out menu!")
        .notify(done);

      // CwP carefully showed that my cadey error handler is returning a value, not an error, so promise chain is not rejected :)
      // AssertionError: expected promise to be rejected but it was fulfilled with '\n\nCadey is hungry because: Couldn\'t find take out menu!'
    });
  });
  describe.skip("restaurant example", function () {
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
    it('should illustrate promise rejection', function () {
      var pizzaPit = new Restaurant();
      var pizzaDelivered = pizzaPit.takeOrder('Capricciosa');

      pizzaDelivered.then(cadey.eat, cadey.beHungry);

      pizzaPit.problemWithOrder('no Capricciosa, only Margherita');
    });
  });
});




