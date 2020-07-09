const request = require('./request.js');


const HOST = 'api.stdlib.com';
const PORT = 443;
const PATH = '/';

const LOCALENV = 'local';
const LOCALPORT = process.env.STDLIB_LOCAL_PORT || 8170;

const MAX_REDIRECTS = 1;

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
  if (params.hasOwnProperty('__path')) {
    pathname = pathname + params.__path;
    if (!pathname.endsWith('/')) {
      pathname = pathname + '/';
    }
    delete params.__path;
  }
  let headers = {};
  let body;

  if (params.hasOwnProperty('__providers')) {
    headers['X-Authorization-Providers'] = typeof params.__providers === 'string'
      ? params.__providers
      : JSON.stringify(params.__providers);
    delete params.__providers;
  }

  headers['Content-Type'] = 'application/json';
  headers['X-Faaslang'] = 'true';
  body = Buffer.from(JSON.stringify(params));

  return request(cfg, 'POST', pathname, headers, body, names, MAX_REDIRECTS, (err, res, resHeaders) => {
    if (err) {
      return callback(err);
    }
    return callback(null, res, resHeaders);
  })

};
