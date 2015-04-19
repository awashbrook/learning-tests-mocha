'use strict';

var _ = require('lodash');
var q = require('q');
var request = require('request');
var soap = require('soap');
var fs = require('fs');

var config = require('./config');

var dataModelFile = __dirname + '/../data/hostsDataModel.json';

// Proxy works here, not convinced for soap?!
function ping(url, callback) {
  url = url || config.anm.url;
  console.log('Pinging: ' + url);
  request(url, function (transportErr, response, jsonStr) {
    if (transportErr) {
      if (callback) {
        return callback(transportErr);
      }
      console.error(transportErr);
      process.exit(1);
    } else if (response.statusCode == 200) {
      console.log(jsonStr);
      var apiErr;
      if (!jsonStr || jsonStr.length === 0) {
        apiErr = new Error('Empty Response!');
      }
    } else {
      apiErr = new Error("API did non return HTTP 200 OK!")
    }
    if (apiErr) {
      console.error('API Error');
      console.error(jsonStr);
      console.error(apiErr.message);
      if (callback) {
        return callback(apiErr);
      } else {
        console.error(apiErr);
        process.exit(1);
      }
    }
    callback && callback(null, jsonStr);
  });
}
function put(opts, callback) {
  console.log('Putting to API: ' + JSON.stringify(opts));
  request.put(opts, function (transportErr, response, jsonObj) {
    if (transportErr) {
      if (callback) {
        return callback(transportErr);
      }
      console.error(transportErr);
      process.exit(1);
    } else if (response.statusCode == 200) {
      console.log(jsonObj);
      var cudlErr;
      if (!jsonObj || jsonObj.length === 0) {
        cudlErr = new Error('Empty Response from API!');
      }
      //try {
      //  JSON.parse(body);
      //} catch (syntaxError) {
      //  // Don't print the syntax parse error as it's not relevant in practice...the error is the body of the message!
      //  cudlErr = syntaxError;
      //}
    } else {
      cudlErr = new Error("API did non return HTTP 200 OK!")
    }
    if (cudlErr) {
      console.error('API API Error');
      console.error(jsonObj);
      console.error(cudlErr.message);
      if (callback) {
        return callback(cudlErr);
      } else {
        console.error(cudlErr);
        process.exit(1);
      }
    }
    callback && callback(null, jsonObj);
  });
}
function retrieveWsdl(done, url) {
  url = url || config.anm.url;
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
// https://docs.google.com/presentation/d/1ez7wH30nwR1Km9G1-x7nAdIxchBw8nXO4p9pJdaFtR0/edit#slide=id.p
function chain(thing, cb) {
  var model = [];
  (function LOOP(i, len) {
    if (i >= len) {
      return cb(null, model);
    }
    thing[i](function (er, data) {
      if (er) {
        //return cb(er); // Going to ignore those contexts that error out, in the interests in completing our iteration
      } else {
        //console.len(data);
        model = model.concat(data); // Don't care what the data is, just assemble into contiguous array
        console.log('Total data: ' + model.length);
      }
      LOOP(i + 1, len)
    })
  })(0, thing.length)
}

module.exports.retrieveWsdl = retrieveWsdl;
module.exports.ping = ping;
module.exports.put = put;
