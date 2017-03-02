const path = require('path');

module.exports = (cfg, names, args, kwargs, body, callback) => {

  return new Promise((resolve, reject) => {

    let hasCallback = typeof callback === 'function';

    try {
      pkg = require(path.join(process.cwd(), 'package.json'));
    } catch (e) {
      let err = new Error('Could not run local stdlib function, invalid package.json\n[!] Please make sure this directory contains a valid StdLib service');
      return hasCallback ? callback(err) : reject(err);
    }

    if (!pkg.stdlib) {
      let err = new Error('Could not run local stdlib function, no "stdlib" property set in package.json\n[!] Please make sure this directory contains a valid StdLib service');
      return hasCallback ? callback(err) : reject(err);
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
      return hasCallback ? callback(e) : reject(e);
    }

    if (typeof fn !== 'function') {
      let err = new Error(`${params.name}: No valid function exported from "${pathname}"`);
      return hasCallback ? callback(err) : reject(err);
    }

    let fnParams = {args: args, kwargs: kwargs};
    fnParams.buffer = body instanceof Buffer ? body : new Buffer(0);
    fnParams.remoteAddress = '::1';
    fnParams.service = '.';
    fnParams.env = process.env.ENV || 'dev';
    fnParams.keys = {};
    fnParams.user = null;

    fn(fnParams, (err, result, rheaders) => {

      if (err) {
        return hasCallback ? callback(err) : reject(err);
      }

      let headers = {'content-type': result instanceof Buffer ? 'application/octet-stream' : 'application/json'};
      rheaders = rheaders || {};
      Object.keys(fnheaders)
        .forEach(h => headers[h.toLowerCase()] = fnheaders[h]);
      Object.keys(rheaders)
        .forEach(h => headers[h.toLowerCase()] = rheaders[h]);

      return hasCallback ? callback(null, result, headers) : resolve(result);

    });

  });

};
