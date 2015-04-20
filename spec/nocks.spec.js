'use strict';

var chai = require('chai'),
  expect = chai.expect;

var nock = require('nock');
var fs = require('fs');

var fixturesDir = __dirname + '/fixtures';
//dir: __dirname + '/../spec/fixtures'
//dir: 'cassettes' // For mocha vcr

var hecFixturesDir = fixturesDir + '/hec';

var fixtures = {
  types: {
    hec: {
      record: false, // IMPORTANT Temporarily enable to re-record mocked backend data, you MUST commit disabled to build efficiently :)
      recordedFixturesFile: fixturesDir + '/hec/hec.nocks.json'
    }
  },
  helpers: {
    startRecordingFixtures: function (fixtureType) {
      return;
      if (fixtures.types[fixtureType].record === true) {
        nock.recorder.rec({
          dont_print: true,
          output_objects: true
        });
      }
    },
    finishRecordingFixtures: function(fixtureType) {
      return;
      if (fixtures.types[fixtureType].record === true) {
        var nocks = nock.recorder.play();
        console.log("...recording " + nocks.length + " nocks to " + fixtures.types[fixtureType].recordedFixturesFile);
        nocks.forEach(function (nock) {
          if(typeof(nock.body) === 'string') { // Not for JSON instantiated object
            nock.body = nock.body.replace(/<sid>[^<]+<\/sid>/gm, '<sid>FAKE_SID</sid>');
          }
        });
        fs.writeFileSync(fixtures.types[fixtureType].recordedFixturesFile, JSON.stringify(nocks));
      }
    }
  }
};

// TODO Setup manual nocks with broad scope after recording of specific...should take precedence over those recorded (TBC)
var scope = nock('http://sbapp.hescloud.net')
  .persist()
  .get('/session/wsdl')
  //.reply(200, cannedWsdl); // soap can parse WSDL from nock, awesome!
  .replyWithFile(200, __dirname + '/../spec/fixtures/hec/hecWsdl.xml');


//before(function () {
//  // Load recorded nocks fist as we have specific train of requst/responses // TODO load *.nocks.json
//  for (var fixtureType in fixtures.types) {
//    if (fixtures.types.hasOwnProperty(fixtureType)) {
//      if (fs.existsSync(fixtures.types[fixtureType].recordedFixturesFile)) {
//        var nocks = nock.load(fixtures.types[fixtureType].recordedFixturesFile);
//        nocks.forEach(function (nock) {
//          nock.persist();
//          if(typeof(nock.body) === 'string') { // Not for JSON instantiated object
//            nock.filteringRequestBody(/<sid>[^<]+<\/sid>/g, '<sid>FAKE_SID</sid>');
//          }
//        });
//        console.log("...loaded " + nocks.length + " nocks from " + fixtures.types[fixtureType].recordedFixturesFile);
//      } else {
//        console.warn("Could not find nock fixtures file: " + fixtures.types[fixtureType].recordedFixturesFile)
//      }
//    }
//  }
//});

describe("faking the session id in outgoing requests", function () {
});

module.exports.fixtures = fixtures;











