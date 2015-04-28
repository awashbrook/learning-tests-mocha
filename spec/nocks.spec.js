'use strict';

var chai = require('chai'),
  expect = chai.expect;

var nock = require('nock');
var fs = require('fs');

var fixturesDir = __dirname + '/fixtures';
//dir: __dirname + '/../spec/fixtures'
//dir: 'cassettes' // For mocha vcr

var fixtures = {
  types: {
    // Please note you can only record ONE service at a time...
    gists: {
      record: false, // IMPORTANT Temporarily enable to re-record mocked backend data, you MUST commit disabled to build efficiently :)
      dir: fixturesDir + '/gists',
      recordedFixturesFile: fixturesDir + '/gists/gists.nocks.json'
    }
    ,
    hec: {
      record: false, // IMPORTANT Temporarily enable to re-record mocked backend data, you MUST commit disabled to build efficiently :)
      dir: fixturesDir + '/hec',
      recordedFixturesFile: fixturesDir + '/hec/hec.nocks.json'
    }
  },
  helpers: {
    startRecordingFixtures: function (fixtureType) {
      if (fixtures.types[fixtureType].record === true) {
        nock.recorder.rec({
          dont_print: true,
          output_objects: true
        });
      }
    },
    finishRecordingFixtures: function(fixtureType) {
      if (fixtures.types[fixtureType].record === true) {
        var nocks = nock.recorder.play();
        console.log("...recording " + nocks.length + " nocks to " + fixtures.types[fixtureType].recordedFixturesFile);
        nocks.forEach(function (nock) {
          if(nock.scope === 'https://api.github.com:443') {
            nock.path = nock.path.replace(/^(.*)\?access_token.*$/g, '$1?access_token=FAKE_TOKEN');
          } else if (nock.path === '/anm/OperationManager' && typeof(nock.body) === 'string') {
            nock.body = nock.body.replace(/<sid>[^<]+<\/sid>/gm, '<sid>FAKE_SID</sid>');
          }
        });
        fs.writeFileSync(fixtures.types[fixtureType].recordedFixturesFile, JSON.stringify(nocks));
      }
    }
  }
};

// Setup manual nocks with broad scope after recording of specific nocks

//var gistScope = nock('https://api.github.com')
//  .persist()
//  .filteringPath(/^(.*)\?access_token.*$/, '$1?access_token=__FAKE_TOKEN__')
//  .log(console.log)
//  .get('/gists/starred?access_token=__FAKE_TOKEN__')
//  .reply(200, fixtures.types.gists.dir + '/gistsWsdl.xml');

var hecScope = nock('http://sbapp.hescloud.net')
  .persist()
  .log(console.log)
  .get('/session/wsdl')
  .replyWithFile(200, fixtures.types.hec.dir + '/hecWsdl.xml');

// Manual nocks above take precedence over those recorded and defined below

before(function () {
  // Load recorded nocks fist as we have specific train of requst/responses // TODO load *.nocks.json
  for (var fixtureType in fixtures.types) {
    if (fixtures.types.hasOwnProperty(fixtureType)) {
      if (fs.existsSync(fixtures.types[fixtureType].recordedFixturesFile)) {
        var nocks = nock.load(fixtures.types[fixtureType].recordedFixturesFile);
        nocks.forEach(function (nock) {
          nock.persist();
          nock.log(console.log);
          console.log(JSON.stringify(nock));
          nock.filteringPath(/^(.*)\?access_token.*$/, '$1?access_token=FAKE_TOKEN');
        });
        console.log("...loaded " + nocks.length + " nocks from " + fixtures.types[fixtureType].recordedFixturesFile);
      } else {
        console.warn("Could not find nock fixtures file: " + fixtures.types[fixtureType].recordedFixturesFile)
      }
    }
  }
});

describe("faking github oauth access token in outgoing requests", function () {
  it('should transform access token into FAKE_TOKEN', function () {
    var exampleGistRequest = 'https://api.github.com/gists/starred?access_token=123456789';
    expect(exampleGistRequest.replace(/^(.*)\?access_token.*$/g, '$1?access_token=FAKE_TOKEN'))
      .to.have.string('https://api.github.com/gists/starred?access_token=FAKE_TOKEN');
  });

});

module.exports.fixtures = fixtures;











