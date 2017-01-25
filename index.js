const https = require('https');
const path = require('path');

const HOST = 'f.stdlib.com';
const METHOD = 'POST';
const PORT = 443;
const PATH = '/';

const lib = (function() {

  function appendVersion(names, str) {
    if (!str.match(/^@[A-Z0-9\-\.]+$/gi)) {
      throw new Error(`${names.join('.')} invalid version: ${str}`);
    }
    return names.concat(str);
  }

  function appendPath(names, str) {
    if (!str.match(/^[A-Z0-9\-]+$/gi)) {
      if (str.indexOf('@') !== -1) {
        throw new Error(`${names.join('.')} invalid name: ${str}, please specify versions and environments with [@version]`);
      }
      throw new Error(`${names.join('.')} invalid name: ${str}`);
    }
    return names.concat(str);
  }

  function appendLibPath(names, str) {

    names = names ? names.slice() : [];
    let defaultVersion = '@release';

    if (names.length === 0 && str === '') {

      return names.concat(str);

    } else if (names.length === 0 && str.indexOf('.') !== -1) {

      let versionMatch = str.match(/^[^\.]*?\.[^\.]*?(\[@[^\[\]]*?\])(\.|$)/);
      let arr;

      if (versionMatch) {
        version = versionMatch[1];
        version = version.replace(/^\[?(.*?)\]?$/, '$1');
        str = str.replace(versionMatch[1], '');
        arr = str.split('.');
        arr = arr.slice(0, 2).concat(version, arr.slice(2));
      } else {
        arr = str.split('.');
      }

      while (arr.length && (names = appendLibPath(names, arr.shift())));
      return names;

    } else if (names.length === 2 && names[0] !== '') {

      return str[0] === '@' ?
        appendVersion(names, str) :
        appendPath(appendVersion(names, defaultVersion), str);

    } else {

      return appendPath(names, str);

    }

  }

  let LibGen = (names) => {
    names = names || [];
    return new Proxy(
      function __call__() {

        let args = [].slice.call(arguments);

        let isLocal = !names[0];

        let kwargs = {};
        let body;
        let headers;
        let callback = typeof args[args.length - 1] === 'function' ? args.pop() : () => {};

        if (args.length === 1 && args[0] instanceof Buffer) {
          body = args.pop();
          headers = {'Content-Type': 'application/octet-stream'};
        } else {
          kwargs = typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null ? args.pop() : {};
          body = new Buffer(JSON.stringify({args: args, kwargs: kwargs}));
          headers = {'Content-Type': 'application/json'};
        }

        args.forEach(arg => {
          if (
            arg !== null &&
            typeof arg !== 'boolean' &&
            typeof arg !== 'string' &&
            typeof arg !== 'number'
          ) {
            let err = new TypeError(`${names.join('.')}: All arguments must be Boolean, Number, String or null`);
            let stack = err.stack.split('\n');
            stack = stack.slice(0, 1).concat(stack.slice(4));
            stack[1] = stack[1].replace('Object.<anonymous>', names.join('.'));
            err.stack = stack.join('\n');
            throw err;
          }
        });

        if (isLocal) {

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
          let fn;

          try {
            fn = require(pathname);
          } catch (e) {
            return callback(e);
          }

          if (typeof fn !== 'function') {
            return callback(new Error(`${params.name}: No valid function exported from "${pathname}"`));
          }

          let fnParams = {args: args, kwargs: kwargs};
          fnParams.buffer = new Buffer(JSON.stringify(fnParams));
          fnParams.env = process.env.ENV || 'dev';
          fnParams.service = '.';
          fnParams.remoteAddress = '::1';
          fn(fnParams, callback);

        } else {

          let pathname = names.slice(0, 2).join('/') + names.slice(2).join('/');
          let responded = false;

          let req = https.request({
            host: HOST,
            method: METHOD,
            headers: headers,
            port: PORT,
            path: `${PATH}${pathname}`,
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

        }

      },
      {
        get: (target, name) => LibGen(appendLibPath(names, name))
      }
    );
  };

  return LibGen();

})();

module.exports = lib;
