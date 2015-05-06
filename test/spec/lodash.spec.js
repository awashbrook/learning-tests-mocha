'use strict';

var
  chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  _ = require('lodash');

chai.use(sinonChai);

describe.only('lodash waza', function () {
  describe("deduplication waza", function () {
    it("demonstrate without() deduplicate arrays of new primitive values vs existing values", function () {
      // without works when we have a few baseline values
      var newIntegers = _.without([1, 2, 1, 3], 1, 2);
      //expect(newIntegers).to.equal([3]); // compares array objects
      expect(newIntegers).to.exist;
      console.log(JSON.stringify(newIntegers));
      expect(newIntegers).to.be.instanceOf(Array);
      expect(newIntegers).not.to.be.empty;
      expect(newIntegers.length).to.equal(1);
      expect(newIntegers[0]).to.equal(3);
    });
    it("demonstrate differene() deduplicate arrays of new primitive values vs existing values", function () {
      // without works when we have a few baseline values
      var newIntegers = _.difference([1, 2, 1, 3], [1, 2]);
      //expect(newIntegers).to.equal([3]); // compares array objects
      expect(newIntegers).to.exist;
      console.log(JSON.stringify(newIntegers));
      expect(newIntegers).to.be.instanceOf(Array);
      expect(newIntegers).not.to.be.empty;
      expect(newIntegers.length).to.equal(1);
      expect(newIntegers[0]).to.equal(3);
    });
    it("is broken: demonstrate difference to deduplicate arrays of new and old objects", function () {
      //http://stackoverflow.com/questions/6715641/an-efficient-way-to-get-the-difference-between-two-arrays-of-objects?lq=1
      var oldArray = [{
        "nature": "thing1",
        "state": "UP"
      },{
        "nature": "thing2",
        "state": "UP"
      }];
      var newArray = [{
        "nature": "thing1",
        "state": "UP"
      },{
        "nature": "thing2",
        "state": "DOWN" // state change
      }];
      expect(oldArray[1].state).to.equal("UP");
      expect(newArray[1].state).to.equal("DOWN");

      var newRecords = _.difference(newArray, oldArray);
      expect(newRecords).to.exist;
      expect(newRecords).to.be.instanceOf(Array);
      expect(newRecords).not.to.be.empty;
      //expect(newRecords.length).to.equal(1); // only works with primitives
      //expect(newRecords[0].nature).to.equal("thing2");
      //expect(newRecords[0].state).to.equal("DOWN");
    });
    it("demonstrate deduplication of arrays of objects using filter() and matches()", function () {
      var oldArray = [{
        "nature": "thing1",
        "state": "UP"
      },{
        "nature": "thing2",
        "state": "UP"
      }];
      var newArray = [{
        "nature": "thing1",
        "state": "UP"
      },{
        "nature": "thing2",
        "state": "DOWN" // state change
      }];
      expect(oldArray[1].state).to.equal("UP");
      expect(newArray[1].state).to.equal("DOWN");

      var newRecords = _.filter(newArray, function (newItem) {
        return !_.matches(_.find(oldArray, _.matches({ nature: newItem.nature }))).call(null, newItem);
      });

      expect(newRecords).to.exist;
      expect(newRecords).to.be.instanceOf(Array);
      expect(newRecords).not.to.be.empty;
      expect(newRecords.length).to.equal(1); // only works with primitives
      expect(newRecords[0].nature).to.equal("thing2");
      expect(newRecords[0].state).to.equal("DOWN");
    });
  });
});



