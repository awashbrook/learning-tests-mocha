'use strict';

var hec = {
  host: 'http://sbapp.hescloud.net',
  url: 'http://sbapp.hescloud.net/session/wsdl'
};
var opts = { // NOT USED, rely on TLS hack below
  'url': null,
  //proxy: "http://internetproxy.int.thomsonreuters.com:8080",
  // https://github.com/vpulim/node-soap#clientsslsecurity and https://nodejs.org/api/tls.html#tls_tls_connect_options_callback
  wsdl_options: {
    strictSSL: false,
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  },
  strictSSL: false,
  rejectUnauthorized: false,
  requestCert: true,
  agent: false,
  ////secureOptions: constants.SSL_OP_NO_TLSv1_2,
  timeout: 20000 // 30s
};

// This is the big hack as neater ones dont work for all node libraries consistently
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// related request https://github.com/request/request/issues/418 and about self signed cert https://github.com/vpulim/node-soap/issues/459

module.exports.hec = hec;
