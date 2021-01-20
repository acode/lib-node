const https = require('https');
const http = require('http');
const url = require('url');

function parseBuffers (value, contentType) {
  if (Buffer.isBuffer(value)) {
    let buffer = value;
    buffer.contentType = contentType || 'application/octet-stream';
    return buffer;
  } else if (Array.isArray(value)) {
    return value.map(v => parseBuffers(v));
  } else if (value && typeof value === 'object' && Object.keys(value).length === 1 && typeof value._base64 === 'string') {
    let buffer = Buffer.from(value._base64, 'base64');
    buffer.contentType = contentType || 'application/octet-stream';
    return buffer;
  } else if (value && typeof value === 'object') {
    return Object.keys(value).reduce((n, key) => {
      n[key] = parseBuffers(value[key]);
      return n;
    }, {});
  } else {
    return value;
  }
};

function followRedirect (cfg, response, remainingRedirects, callback) {
  if (remainingRedirects < 1) {
    throw new Error('Too many redirects');
  }

  if (!response.headers.location) {
    throw new Error('No "location" header provided with redirect response');
  }

  let parsedUrl = url.parse(response.headers.location);

  let redirectCfg = Object.keys(cfg).reduce((n, key) => {
    n[key] = cfg[key];
    return n;
  }, {});

  redirectCfg.host = parsedUrl.host;
  redirectCfg.path = parsedUrl.pathname;
  redirectCfg.port = parsedUrl.protocol.includes('https') ? 443 : 80;

  return request (redirectCfg, 'GET', '', {}, '', [], remainingRedirects - 1, (err, res) => {
    if (err) {
      return callback(err);
    }
    return callback(null, res);
  });
}

function request (cfg, method, pathname, headers, body, names, remainingRedirects, callback) {

  let namesList = names.slice();
  if (namesList.length < 3) {
    namesList.push('@release');
  }
  let serviceName = namesList.slice(0, 2).join('/');
  let serviceEnvironment = namesList[2];
  let servicePathname = namesList.slice(3).join('/');

  cfg.token && (headers['Authorization'] = `Bearer ${cfg.token}`);
  cfg.keys && (headers['X-Authorization-Keys'] = JSON.stringify(cfg.keys));
  cfg.convert && (headers['X-Convert-Strings'] = 'true');
  headers['X-Stdlib-Stack-Trace'] = process.env.__STDLIB_STACK_TRACE || '';
  cfg.bg && (pathname += `:bg${typeof cfg.bg === 'string' ? '=' + encodeURIComponent(cfg.bg) : ''}`);

  let responded = false;

  let req = (cfg.port === 443 ? https : http).request({
    host: cfg.host,
    method: method,
    headers: headers,
    port: cfg.port,
    path: `${cfg.path}${pathname}`,
    agent: false
  }, function (res) {

    let buffers = [];

    res.on('data', chunk => buffers.push(chunk));
    res.on('end', () => {
      let response = Buffer.concat(buffers);
      let contentType = (res.headers['content-type'] || '').split(';')[0];

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

      response = parseBuffers(response, contentType);
      responded = true;

      if (((res.statusCode / 100) | 0) === 2) {
        return callback(null, response, res.headers);
      } else if (res.statusCode === 302 || res.statusCode === 301) {
        return followRedirect(cfg, res, remainingRedirects, (err, response) => {
          if (err) {
            return callback(err);
          }
          return callback(null, response);
        });
      } else {
        let message = typeof response === 'object' ?
          (response && response.error && response.error.message) || ('Unspecified error running remote Standard Library function "' + names.join('.') + '"') :
          response;
          message += ` (${serviceName + serviceEnvironment + (servicePathname ? '/' + servicePathname : '')})`;
        let error = new Error(message);
        if (response.error && response.error.hasOwnProperty('details')) {
          error.details = response.error.details;
        }
        if (response.error && response.error.hasOwnProperty('type')) {
          error.type = response.error.type;
        }
        if (response.error && response.error.hasOwnProperty('stack')) {
          error.stack = response.error.stack;
        }
        return callback(error, response);
      }

    });

  });

  req.on('error', err => responded || callback(err));
  req.write(body);
  req.end();
}

module.exports = request;
