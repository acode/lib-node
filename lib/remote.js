const https = require('https');

const HOST = 'f.stdlib.com';
const PORT = 443;
const PATH = '/';

module.exports = (cfg, names, args, kwargs, content, body, callback) => {

  cfg = cfg || {};
  cfg.host = cfg.host || HOST;
  cfg.port = cfg.port || PORT;
  cfg.path = cfg.path || PATH;

  let pathname = names.slice(0, 2).join('/') + names.slice(2).join('/');
  let headers = {};
  let responded = false;

  if (content === 'file') {
    headers['Content-Type'] = 'application/octet-stream';
  } else {
    headers['Content-Type'] = 'application/json';
  }

  let req = https.request({
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
        return callback(new Error(response));
      } else {
        return callback(null, response, res.headers);
      }

    });

  });

  req.on('error', err => responded || callback(err));
  req.write(body);
  req.end();

};
