// WARNING: Deprecated. Use "@local" identifier instead.

const path = require('path');
const fs = require('fs');

const FUNCTION_PATH = 'functions';

module.exports = (cfg, names, params, callback) => {

  try {
    pkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {
    return callback(new Error('Could not run local stdlib function, invalid package.json\n[!] Please make sure this directory contains a valid StdLib service'));
  }

  if (!pkg.stdlib) {
    return callback(new Error('Could not run local stdlib function, no "stdlib" property set in package.json\n[!] Please make sure this directory contains a valid StdLib service'));
  }

  let args = Array.isArray(params) ? params : [];
  let kwargs = Array.isArray(params) ? {} : params;

  names = names.length === 1 && pkg.stdlib.defaultFunction ?
    names.concat(pkg.stdlib.defaultFunction) :
    names;
  let pathname = path.join.apply(null, [process.cwd()].concat(FUNCTION_PATH, names, 'index.js'));
  let fnpathname = path.join.apply(null, [process.cwd()].concat(FUNCTION_PATH, names, 'function.json'));
  let fn;
  let fndata;
  let fnheaders;

  if (cfg.webhook) {
    let cb = callback;
    callback = (err, result, headers) => {
      let prefix = `-> Simulated Webhook [${names.join('.')}]${err ? ' ERROR' : ''}: `;
      let presult = typeof result === 'object' ? JSON.stringify(result, null, 2) : (result + '');
      let message = (err ? (err.stack || err.message) : presult).split('\n').map(v => `${prefix}${v}`).join('\n');
      console.log(message);
      cb(err, 'webhook ok', headers);
    };
  }

  try {
    fn = require(pathname);
    fndata = require(fnpathname) || {};
    fnheaders = fndata.http && fndata.http.headers || {};
  } catch (e) {
    cfg.webhook || console.error(e);
    return callback(e);
  }

  if (typeof fn !== 'function') {
    return callback(new Error(`${params.name}: No valid function exported from "${pathname}"`));
  }

  let fnParams = {args: args, kwargs: kwargs};
  fnParams.buffer = Buffer.from([]);
  fnParams.remoteAddress = '::1';
  fnParams.service = '.';
  fnParams.env = process.env.ENV || 'dev';
  fnParams.keys = {};
  fnParams.user = null;

  let promise;
  promise = fn(fnParams, (err, result, rheaders) => {

    if (promise instanceof Promise) {
      return;
    }

    if (err) {
      return callback(err);
    }

    let headers = {'content-type': result instanceof Buffer ? 'application/octet-stream' : 'application/json'};
    rheaders = rheaders || {};
    Object.keys(fnheaders)
      .forEach(h => headers[h.toLowerCase()] = fnheaders[h]);
    Object.keys(rheaders)
      .forEach(h => headers[h.toLowerCase()] = rheaders[h]);

    return callback(err, result, headers);

  });

  if (promise instanceof Promise) {
    promise.catch(err => {
      console.error(err);
      callback(err);
    }).then(result => callback(null, result));
  }

};
