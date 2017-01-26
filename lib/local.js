const path = require('path');

module.exports = (cfg, names, args, kwargs, content, body, callback) => {

  try {
    pkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {
    return callback(new Error('Could not run local stdlib function, invalid package.json'));
  }

  if (!pkg.stdlib) {
    return callback(new Error('Could not run local stdlib function, no "stdlib" property set in package.json'));
  }

  names = names.length === 1 && pkg.stdlib.defaultFunction ?
    names.concat(pkg.stdlib.defaultFunction) :
    names;
  let pathname = path.join.apply(null, [process.cwd()].concat('f', names, 'index.js'));
  let fnpathname = path.join.apply(null, [process.cwd()].concat('f', names, 'function.json'));
  let fn;
  let fndata;
  let fnheaders;

  try {
    fn = require(pathname);
    fndata = require(fnpathname) || {};
    fnheaders = fndata.http && fndata.http.headers || {};
  } catch (e) {
    return callback(e);
  }

  if (typeof fn !== 'function') {
    return callback(new Error(`${params.name}: No valid function exported from "${pathname}"`));
  }

  let fnParams = {args: args, kwargs: kwargs};
  fnParams.buffer = body;
  fnParams.env = process.env.ENV || 'dev';
  fnParams.service = '.';
  fnParams.remoteAddress = '::1';

  fn(fnParams, (err, result, rheaders) => {

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

};
