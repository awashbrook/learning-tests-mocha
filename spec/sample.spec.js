'use strict';

var
  chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  request = require('request'),
  soap = require('soap');

var config = require('../src/config');
var discovery = require('../src/discovery');

// https://github.com/poetic/nock-vcr-recorder#configuration
//vcr = require('nock-vcr-recorder-mocha');
var vcrOptions = {
  mode: 'all' // overwrite existing fixtures
};

chai.use(sinonChai);

//vcr.describe('sample', vcrOptions, function () {
describe('sample', function () {
  describe('test internet endpoints', function () {
    it('github', function (done) {
      discovery.ping(done, 'https://github.com/');
    });
  });
  describe('request', function() {
    describe('external', function() {
      it('github', function (done) {
        discovery.ping(done, 'https://github.com/');
      });
      it('hecWsdl', function (done) {
        request('http://sbapp.hescloud.net/session/wsdl', function (error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
          }
        );
      });
      describe('soap', function() {
        it('hecWsdl', function (done) {
          discovery.retrieveWsdl(done, 'http://sbapp.hescloud.net/session/wsdl');
        });
      });
    });
  });
});



