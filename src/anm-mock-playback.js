'use strict';

// run standalone  node -e "require('./src/anm-mock-playback').playback();"

var nock = require('nock');
var nockBack = nock.back;

var request = require('request');

//nock.enableNetConnect(); // Otherwise we get 'NetConnectNotAllowedError'. This error happens when fixture already exists with nockBack!!

nockBack.fixtures = './spec/fixtures_back';

var filterOutSidsInRequest = function (scope) {
  scope.filteringRequestBody = function (body) {
    if (typeof(body) !== 'string') { return body; }
    return body.replace(/^(.*)\?access_token.*$/, '$1?access_token=__FAKE_TOKEN__');
  }
};

function playback() {
  nockBack.setMode('record');

  nockBack('hecWsdl.nocks.json', { before: filterOutSidsInRequest }, function (done) {
    request('http://sbapp.hescloud.net/session/wsdl', function (error, response, body) {
        console.log(body);
        done();
      }
    );
    //this.assertScopesFinished();
  });
}

module.exports.playback = playback;

















