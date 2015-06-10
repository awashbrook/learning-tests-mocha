'use strict';

var
  chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  _ = require('lodash'),
  q = require('q');
q.longStackSupport = true;

chai.use(chaiAsPromised);
chai.use(sinonChai);

var log = console; // TODO log and return?

describe('promise based samples based on two alternative "object" approaches to inheritance', function () {

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
  describe("chaining promises together", function () {
    this.timeout(30 * 1000);
    it("shows how you can elegantly handle basic logging of resolution and rejection by console functions", function (done) {
      q.delay(1).then(function () { return 'OK'; })
        .then(console.log).catch(console.error).done(done);
    });
    describe("array handling helper methods for promises: all and spread", function () {
      it("shows lots of short promise chain tuples aggregated togther with all()", function (done) {
        // http://stackoverflow.com/questions/16976573/chaining-an-arbitrary-number-of-promises-in-q
        // http://stackoverflow.com/a/24579654
        q.all([
          q.delay(1).then( function () { console.log('1 Millis OK') }),
          q.delay(1000).then( function () { console.log('1000 Millis OK') }),
          q.delay(100).then( function () { console.log('100 Millis OK') }),
          q.delay(10).then( function () { console.log('10 Millis OK') })
        ]).then( function () { console.log('All completed in parallel, yay :)')}).done(done);
      });
      it("shows how to reproduce the above parallel execution using map", function (done) {
        var delayMillis = [1, 1000, 100, 1];
        q.all(_.map(delayMillis, function (millis) {
            return q.delay(millis).then( function () { console.log(millis + ' Millis OK'); return millis });
          })
        ).then( function (results) {
            console.log('All completed in parallel, promises return: ' + JSON.stringify(results));
            expect(results).to.deep.equal(delayMillis);
          }).done(done);
      });
      // with promises as with continuation passing, if you want to pass on multiple around several arguments,
      // you are limited just as with returning a single value from a function. thus chaining together async call
      // with arrays of callback parameters are common in node
      // http://stackoverflow.com/questions/22773920/can-promises-have-multiple-arguments-to-onfulfilled
      it.skip("Bluebird and Q supports this convention by allowing you to use spread() an array as params across the arguments of next fulfillment", function () {
        // https://github.com/kriskowal/q#combination
        return getUsername()
          .then(function (username) {
            return [username, getUser(username)];
          })
          .spread(function (username, user) {
          });
      });
    });
    describe("sequences and nesting: want a bunch of functions to be executed one after the other, with a delay between them", function () {
      // delay was my own use case as simplest async op, eventaull found documented precisely
      // http://stackoverflow.com/questions/24579521/how-to-use-q-all-with-delay?rq=1
      beforeEach(function () {
        //personPromises = [ // Can't do this as they all fire in parallel when declared :(
        //  q.delay(1).then( function () { console.log('1 Millis OK') }),
        //  q.delay(5000).then( function () { console.log('Five Secs OK') }),
        //  q.delay(1000).then( function () { console.log('One Sec OK') }),
        //  q.delay(100).then( function () { console.log('100 Millis OK') }),
        //  q.delay(10).then( function () { console.log('10 Millis OK') })
        //];
        // Similar anti-pattern: http://www.html5rocks.com/en/tutorials/es6/promises/#toc-parallelism-sequencing
      });
      it('WORKS and shows simplest possible way of showing delay then log, highligting common mistake', function (done) {
        // This case does NOT use delay in the most appropriate manner (see next)
        q()
          .then(q.delay(60 * 1000))// Antipattern: immediately creates an independently ticking time bomb
          .then( function () { console.log('\n ...FAILED to wait one minute - Cant declare that way ever!') })
          .then( function () { return q.delay(100); })
          .then( function () { console.log('\n ...100 millis OK') })
          .then( function () { return q.delay(10); }).then(function () { console.log('\n10 Millis OK') })
          .then( function () { console.log('...Only last two complete properly :)')})
          .done(done);
        // The above is highlighting a very easy mistake, with any function that creates deferreds and resolves
        // similar to q.delay() https://www.npmjs.com/package/q#using-deferreds
        //
        //function delay(ms) {
        //  var deferred = Q.defer();
        //  setTimeout(deferred.resolve, ms);
        //  return deferred.promise;
        //}
        // The antipattern is accidentally invoking such a function immediately, instead of wrapping within a function!
      });
      it.skip("shows how to use delay() properly)", function (done) {//TODO
        //delay() with promises this has evolved separately for Q and Bluebird, inspired by jquery
        //
        // The static form q.delay() immediately creates an independently ticking time bomb, as soon as it is declared
        // this is unexpected, no errors will be thrown...
        // Wrapping iniside a function closure works to have it tick within your promise chain
        // The q method level delay sets its timer when resolved, much more convienient:
        // http://stackoverflow.com/questions/17714082/delay-in-the-q-module and PR: https://github.com/kriskowal/q/pull/326/files
        //
        //  Tests for delay are here, it is also used through q spec for testing q itself, doh!!
        //  https://github.com/kriskowal/q/blob/v1/spec/q-spec.js#l1982
      });
      it("is BROKEN, failing to iterate over single unnested sequence of promises - it is it not equivalent to above", function (done) {
        var personPromises = [
          q.delay(1),
          function () { console.log('1 Millis OK') },
          q.delay(5000),
          function () { console.log('Five Secs OK') },
          q.delay(1000),
          function () { console.log('One Sec OK') },
          function () { console.log('One Sec OK') },
          q.delay(100),
          function () { console.log('100 Millis OK') },
          q.delay(10),
          function () { console.log('10 Millis OK') }
        ];
        var result = q("Initial Value");
        personPromises.forEach(function (f) {
          result = result.then(f);
        });
        result.then( function () { console.log(personPromises.length + ' promises completed in sequence, NOPE :(')}).done(done);
      });
      function setTimer(millis) {
        // This works only as the head of a promise chain...not as links within it
        // Very easy to miss
        return q.delay(millis).then( function () { console.log(millis + ' Millis OK') });
      }
      it("shows a short chain long hand, this is NOT the correct way to declared nested promises", function (done) {
        // the nested final example may be leading me astray https://www.npmjs.com/package/q#chaining
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
      it("shows above mistake with helper, NOT correct and very easy to miss when you create independent promise chains with a sub-function", function (done) {
        q("Initial Value") //
          .then(setTimer(10)) // You should never invoke a function directly within a then, it is to be invoked in the future, duh!!
          .then(setTimer(1)) // If you see parenthisis within your then, your doing it wrong :)
          .then( function () { console.log('Completes immediately!')})
          .done();

        setTimer(500) // Third independently executing chain of promises
          .then( function () { console.log('...waiting 100 Millis for above to complete in parallel :(' ) })
          .done(done);
      });
      it("is a GOOD example from SO to iterate over a single sequence of promises in serial fashion", function (done) {
        // http://stackoverflow.com/a/17764496 shows the reduce optimization of above with delay also :)
        // Similar exmaple with forEach and reduce: http://www.html5rocks.com/en/tutorials/es6/promises/#toc-parallelism-sequencing
        var personPromises = [1, 500, 100, 10, 1];
        var chain = personPromises.reduce(function (previousPromise, millis) {
          return previousPromise.then(function (previousValue) {
            console.log(previousValue);
            console.log(millis + ' Millis will pass');
            // return your async operation
            return q.delay(millis); // this promise doesn't return value // static invocation of delay is different!
          })
        }, q());

        chain.then( function () { console.log('...All completed in proper manner...this one actually works :)')})
          .done(done);
      });
      it("same thing in brief", function (done) {
        // they are iterating over funcs not times: http://stackoverflow.com/a/24579654
        var personPromises = [1, 500, 100, 10, 1];
        var result = personPromises.reduce( function(previousPromise, millis) {
          return previousPromise.then( function () { console.log(millis + ' Millis will pass'); }).delay(millis);
        }, q());
        result.then( function () { console.log('...All completed in proper manner...this one actually works :)')})
          .done(done);

      });
      it.skip("is NOT WORKING the same as above, using the compact form of reduce pattern for simply loops in series", function (done) {
        // as per http://taoofcode.net/promise-anti-patterns/#comment-1263189977 Q(x) should be used to “cast” a value
        // to a promise instead of Q.when(), the only reason when is kept is for the sequence compact pattern:
        var personPromises = [1, 500, 100, 10, 1];
        var chain = personPromises.reduce(q.when, q());
        chain.then( function () { console.log('...All completed in proper manner...this one actually works :)')})
          .done(done);
      });
      it("similar example on Queuing Asynchronous Actions tutorial", function () {
        //http://www.html5rocks.com/en/tutorials/es6/promises/#toc-chaining
      });
      it.skip("shows nesting rather than chaining", function () {
        // indented function declarations have access to all the parental closures as always…
        // https://github.com/kriskowal/q#chaining
        function authenticate() {
          return getUsername() //
            .then(function (username) {
              return getUser(username);
            })
            // chained because we will not need the user name in the next event
            .then(function (user) {
              return getPassword()
                // nested because we need both user and password next
                .then(function (password) {
                  if (user.passwordHash !== hash(password)) {
                    throw new Error("Can't authenticate");
                  }
                });
            });
        }
      });
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
    it('should illustrate use terminating of promise chains with done & done for promise rejection', function (done) {
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
    it('should illustrate returning our promises to mocha to await rejection', function () {
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
    it('should illustrate use of chai-as-promised to notify of promise rejection', function (done) {
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




