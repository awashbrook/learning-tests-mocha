'use strict';

var
  chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  request = require('request'),
  soap = require('soap');

var discovery = require('../src/discovery');
var github = require('../github.config');

// https://github.com/poetic/nock-vcr-recorder#configuration
var vcr = require('nock-vcr-recorder-mocha');
var vcrOptions = {
  //mode: 'all' // overwrite existing fixtures
};

chai.use(sinonChai);

vcr.describe('sample', vcrOptions, function () {
  this.timeout(10 * 1000); // allow a minute for individual calls with internet endpoints

  describe('gists', function () {
    var gistOpts, starredGistOpts;
    beforeEach(function () {
      gistOpts = {
        url: 'https://api.github.com/gists?access_token=' + github.gists.token,
        json: true,
        headers: {
          'User-Agent': 'request'
        }
      };
      starredGistOpts = {
        url: 'https://api.github.com/gists/starred?access_token=' + github.gists.token,
        json: true,
        headers: {
          'User-Agent': 'request'
        }
      };
    });
    it('listing my gists require auth', function (done) {
      request(github.gists.url, function (error, response, body) {
          expect(response.statusCode).to.equal(403);
          console.log(body); // http://developer.github.com/v3/#user-agent-required
          done();
        }
      );
    });
    it('list my gists with auth token', function (done) {
      request(gistOpts, function (error, response, body) {
          expect(response.statusCode).to.equal(200);
          //console.log(body);
          console.log('Discovered ' + body.length + ' gists');
          expect(body[0].url).to.equal('https://api.github.com/gists/566494c6108aa8ad0981');
          done();
        }
      );
    });
    it('list my starred gists with auth token', function (done) {
      request(starredGistOpts, function (error, response, body) {
          expect(response.statusCode).to.equal(200);
          //console.log(body);
          console.log('Discovered ' + body.length + ' gists');
          expect(body[0].url).to.equal('https://api.github.com/gists/6614023');
          done();
        }
      );
    });
  });
  describe('request', function() {
    it('hecWsdl', function (done) {
      request('http://sbapp.hescloud.net/session/wsdl', function (error, response, body) {
          expect(response.statusCode).to.equal(200);
          done();
        }
      );
    });
  });
  describe('soap', function() {
    it('hecWsdl', function (done) {
      discovery.retrieveWsdl(done, 'http://sbapp.hescloud.net/session/wsdl');
    });
  });
});



