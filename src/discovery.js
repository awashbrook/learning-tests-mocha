'use strict';

var _ = require('lodash');
var request = require('request');
var soap = require('soap');
var fs = require('fs');

var config = require('./config');


function ping(done, url) {
  url = url || config.hec.url;
  console.log('Pinging ' + url);
  request(url, function (error, response, body) {
      if (error) {
        console.error(error);
        throw error;
      } else if (response.statusCode == 200) {
        console.log(body);
        //fs.writeFileSync('wsdl.xml', body);
        done && done();
      }
    }
  );
}

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
