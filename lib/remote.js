const https = require('https');
const http = require('http');

const HOST = 'f.stdlib.com';
const PORT = 443;
const PATH = '/';

module.exports = (cfg, names, params, callback) => {

  cfg = cfg || {};
  cfg.host = cfg.host || HOST;
  cfg.port = cfg.port || PORT;
  cfg.path = cfg.path || PATH;
  cfg.debug = !!cfg.debug;

  cfg.token = cfg.token || null;
  cfg.keys = cfg.keys || null;
  cfg.webhook = cfg.webhook || null;

  let pathname = cfg.debug ?
    names.slice(3).join('/') :
    names.slice(0, 2).join('/') + names.slice(2).join('/')
  pathname = pathname + '/';
  let headers = {};
  let body;

  headers['Content-Type'] = 'application/json';
  headers['X-Faaslang'] = 'true';
  body = new Buffer(JSON.stringify(params));

  cfg.token && (headers['Authorization'] = `Bearer ${cfg.token}`);
  cfg.keys && (headers['X-Authorization-Keys'] = JSON.stringify(cfg.keys));
  cfg.webhook && (headers['X-Webhook'] = cfg.webhook);

  let responded = false;

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
        return callback(new Error(typeof response === 'object' ? response.message : response), response);
      } else {
        return callback(null, response, res.headers);
      }

    });

  });

  req.on('error', err => responded || callback(err));
  req.write(body);
  req.end();

};
