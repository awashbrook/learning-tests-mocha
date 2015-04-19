'use strict';

var nock = require('nock');
var nockBack = nock.back;

//var http = require('http');
var sample = require('./sample');
var config = require('./config');

nock.enableNetConnect(); // Otherwise we get 'NetConnectNotAllowedError'. This error happens when fixture already exists with nockBack!!

var options = {allowUnmocked: true}; // pass through unknown requests

nockBack.fixtures = config.fixtures.dir + '/hec';

//nokBack.setMode('lockdown');

var host =
  'http://sbapp.hescloud.net/session/wsdl';
//'http://www.google.co.uk';

function record() {
  nockBack.setMode('dryrun'); // the default
  //nockBack.setMode('record'); // not the default

  nockBack('hecWsdl.json', function (done) {
    sample.ping();
    //this.assertScopesFinished();
    done();
  });

}

module.exports.nockBack = nockBack;
module.exports.record = record;



var filterOutSidsInRequest = function (scope) {
  //scope.filteringRequestBody(/<sid>[^<]+<\/sid>/g, '<sid>FAKE_SID</sid>')
  scope.filteringRequestBody = function (body) {
    if (typeof(body) !== 'string') { return body; }
    return body.replace(/<sid>[^<]+<\/sid>/g, '<sid>FAKE_SID</sid>');
  }
};

function playback() {
  nockBack.setMode('dryrun'); // the default

  nockBack('wsdl', function (done) {
    //sample.ping();
    //this.assertScopesFinished();
    done();
  });

  nockBack('wsdlistDeviceIdsl', { before: filterOutSidsInRequest }, function (done) {
    //sample.ping();
    //this.assertScopesFinished();
    done();
  });
}

module.exports.playback = playback;















