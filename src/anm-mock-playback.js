'use strict';

// run standalone  node -e "require('./src/anm-mock-playback').playback();"

var nock = require('nock');
var nockBack = nock.back;

var rp = require('request-promise');
// rp('http://sbapp.hescloud.net/session/wsdl').then(console.dir).catch(console.error);

// Otherwise we get 'NetConnectNotAllowedError'. This error happens when fixture already exists with nockBack!!
nock.enableNetConnect('sbapp.hescloud.net:80');
nockBack.fixtures = './spec/fixtures_back';

var filterOutSidsInRequest = function (scope) {
  scope.filteringRequestBody = function (body) {
    if (typeof(body) !== 'string') {
      return body;
    }
    return body.replace(/^(.*)\?access_token.*$/, '$1?access_token=__FAKE_TOKEN__');
  }
};

function playback() {
  nockBack.setMode('wild');
  //nockBack.setMode('record');

  nockBack('sample.nocks.json', /*{ before: filterOutSidsInRequest }*/ function (nockDone) {
    //q.all([ function ()
    //  q.delay(1).then(function () {
    //    console.log('1 Millis OK')
    //  }),
    //  q.delay(10).then(function () {
    //    console.log('10 Millis OK')
    //  })
    //]).then(function () {
    //  console.log('All completed in parallel, yay :)')
    rp('http://sbapp.hescloud.net/session/wsdl')
      .then(function (body) {
        console.log(body);
        //this.assertScopesFinished();
      })
      .catch(console.error)
      .done(nockDone);
  });
}

module.exports.playback = playback;















