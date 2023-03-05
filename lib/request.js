const https = require('https');
const http = require('http');
const url = require('url');
const SSEHandler = require('./ssehandler.js');

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

function request (
  cfg, method, pathname, headers, body, names, remainingRedirects,
  streamListeners, debugListeners,
  stackError,
  callback
) {

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

  const responseHandler = (statusCode, headers, response, callback) => {
    let contentType = (headers['content-type'] || '').split(';')[0];
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
    if (((statusCode / 100) | 0) === 2) {
      return callback(null, response, headers);
    } else if (statusCode === 302 || statusCode === 301) {
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
      error.stack = stackError(message);
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
  };

  const sseResponseHandler = (name, value, eventData) => {
    let headers = {};
    let body = null;
    Object.keys(value.headers).forEach(function (key) {
      headers[key.toLowerCase()] = value.headers[key];
    });
    if (headers['content-type'] !== 'application/json') {
      let json;
      try {
        json = JSON.parse(value.body);
        if (
          Object.keys(json).length === 1 &&
          json._base64
        ) {
          body = Buffer.from(json._base64, 'base64');
        }
      } catch (e) {
        // do nothing
      }
    }
    if (!body) {
      body = Buffer.from(value.body);
    }
    responseHandler(
      value.statusCode,
      headers,
      body,
      callback
    );
  };

  let req = (cfg.port === 443 ? https : http).request({
    host: cfg.host,
    method: method,
    headers: headers,
    port: cfg.port,
    path: `${cfg.path}${pathname}`,
    agent: false
  }, function (res) {

    let contentType = (res.headers['content-type'] || '').split(';')[0];
    let buffers = [];
    let serverSentEvent = null;
    if (contentType === 'text/event-stream') {
      serverSentEvent = new SSEHandler(
        streamListeners,
        debugListeners,
        sseResponseHandler
      );
    }
    res.on('data', chunk => {
      buffers.push(chunk);
      if (serverSentEvent) {
        serverSentEvent.process(chunk.toString());
      }
    });
    res.on('end', () => {
      if (!serverSentEvent) {
        let response = Buffer.concat(buffers);
        responseHandler(res.statusCode, res.headers, response, callback);
      }
    });
  });

  req.on('error', err => responded || callback(err));
  req.write(body);
  req.end();
}

module.exports = request;
