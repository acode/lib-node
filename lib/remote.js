const https = require('https');
const http = require('http');

const HOST = 'f.stdlib.com';
const PORT = 443;
const PATH = '/';
const KEYS = {};

module.exports = (cfg, names, args, kwargs, body, callback) => {

  cfg = cfg || {};
  cfg.host = cfg.host || HOST;
  cfg.port = cfg.port || PORT;
  cfg.path = cfg.path || PATH;
  cfg.keys = cfg.keys || KEYS;
  cfg.debug = !!cfg.debug;
  cfg.webhook = cfg.webhook || null;

  let pathname = cfg.debug ?
    names.slice(3).join('/') :
    names.slice(0, 2).join('/') + names.slice(2).join('/');
  let headers = {};
  let responded = false;

  if (body instanceof Buffer) {
    headers['Content-Type'] = 'application/octet-stream';
    pathname += '?' + Object.keys(kwargs).map(key => `${encodeURI(key)}=${encodeURI(kwargs[key])}`).join('&');
  } else {
    headers['Content-Type'] = 'application/json';
    body = new Buffer(JSON.stringify(body));
  }

  if (cfg.token) {
    headers['Authorization'] = `Bearer ${cfg.token}`;
  }

  if (cfg.webhook) {
    headers['X-Webhook'] = cfg.webhook;
  }

  if (Object.keys(cfg.keys).length) {
    headers['X-Authorization-Keys'] = JSON.stringify(cfg.keys);
  }

  let req = (cfg.port === 443 ? https : http).request({
    host: cfg.host,
    method: 'POST',
    headers: headers,
    port: cfg.port,
    path: `${cfg.path}${pathname}`,
    agent: false
  }, function (res) {

    let buffers = [];

    res.on('data', chunk => buffers.push(chunk));
    res.on('end', () => {

      var response = Buffer.concat(buffers);
      var contentType = res.headers['content-type'] || '';

      if (contentType === 'application/json') {
        response = response.toString();
        try {
          response = JSON.parse(response);
        } catch(e) {
          response = null;
        }
      } else if (contentType.match(/^text\/.*$/i)) {
        response = response.toString();
      }

      responded = true;

      if (((res.statusCode / 100) | 0) !== 2) {
        let message = typeof response === 'object' ?
          (response && response.error && response.error.message) || 'Unspecified Error' :
          response;
        return callback(new Error(message), response);
      } else {
        return callback(null, response, res.headers);
      }

    });

  });

  req.on('error', err => responded || callback(err));
  req.write(body);
  req.end();

};
