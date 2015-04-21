'use strict';

var _ = require('lodash');
var request = require('request');
var soap = require('soap');
var fs = require('fs');

var config = require('./config');

function retrieveWsdl(done, url) {
  url = url || config.hec.url;
  console.log('Retrieving WSDL: ' + url);
  soap.createClient(url, function (err, client) {
    if (err) {
      console.error(err); // transport errors like timeouts, not soap errors, where are they handled?!
      process.exit(1);
    }
    var wsdl = client.describe();
    //console.log(wsdl);
    done && done();
  });
}

module.exports.retrieveWsdl = retrieveWsdl;
