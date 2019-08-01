const https = require('https');
const http = require('http');

const HOST = 'api.stdlib.com';
const PORT = 443;
const PATH = '/';

const LOCALENV = 'local';
const LOCALPORT = process.env.STDLIB_LOCAL_PORT || 8170;

module.exports = (cfg, names, params, callback) => {

  cfg = cfg || {};
  cfg = Object.keys(cfg).reduce((ncfg, key) => {
    ncfg[key] = cfg[key];
    return ncfg
  }, {});
  cfg.host = cfg.host || HOST;
  cfg.port = cfg.port || PORT;
  cfg.path = cfg.path || PATH;
  cfg.debug = !!cfg.debug;

  cfg.token = cfg.token || null;
  cfg.keys = cfg.keys || null;
  cfg.webhook = cfg.webhook || null; // TODO: Deprecate
  cfg.convert = !!cfg.convert;

  let pathname;

  if ((names[2] || '').split(':')[0] === `@${LOCALENV}`) {
    cfg.host = 'localhost';
    cfg.port = parseInt((names[2] || '').split(':')[1]) || LOCALPORT;
    names[2] = '';
    pathname = names.slice(0, 2).join('/') + names.slice(2).join('/');
  } else if (cfg.host === 'localhost') {
    cfg.port = cfg.port || LOCALPORT;
    pathname = names.slice(0, 2).join('/') + names.slice(2).join('/');
  } else {
    cfg.host = names.slice(0, 1).concat(cfg.host).join('.');
    pathname = names.slice(1, 2).join('/') + names.slice(2).join('/');
  }

  pathname = pathname + '/';
  if (params.__path) {
    pathname = pathname + params.__path;
    if (!pathname.endsWith('/')) {
      pathname = pathname + '/';
    }
    delete params.__path;
  }
  let headers = {};
  let body;

  headers['Content-Type'] = 'application/json';
  headers['X-Faaslang'] = 'true';
  body = Buffer.from(JSON.stringify(params));

  cfg.token && (headers['Authorization'] = `Bearer ${cfg.token}`);
  cfg.keys && (headers['X-Authorization-Keys'] = JSON.stringify(cfg.keys));
  cfg.webhook && (headers['X-Webhook'] = cfg.webhook); // TODO: Deprecate
  cfg.convert && (headers['X-Convert-Strings'] = 'true');
  cfg.bg && (pathname += `:bg${typeof cfg.bg === 'string' ? '=' + encodeURIComponent(cfg.bg) : ''}`);

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
      var contentType = (res.headers['content-type'] || '').split(';')[0];

      if (contentType === 'application/json') {
        response = response.toString();
        try {
          response = JSON.parse(response);
        } catch(e) {
          response = null;
        }
      } else if (contentType === 'text/plain') {
        response = response.toString();
      }

      responded = true;

      if (((res.statusCode / 100) | 0) !== 2) {
        let message = typeof response === 'object' ?
          (response && response.error && response.error.message) || ('Unspecified error running remote Standard Library function "' + names.join('.') + '"') :
          response;
          let error = new Error(message);
          if (response.error && response.error.hasOwnProperty('details')) {
            error.details = response.error.details;
          }
          if (response.error && response.error.hasOwnProperty('type')) {
            error.type = response.error.type;
          }
          return callback(error, response);
      } else {
        return callback(null, response, res.headers);
      }

    });

  });

  req.on('error', err => responded || callback(err));
  req.write(body);
  req.end();

};
