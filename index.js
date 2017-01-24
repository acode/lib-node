const https = require('https');

const HOST = 'f.stdlib.com';
const METHOD = 'POST';
const PORT = 443;
const PATH = '/';

const lib = (function() {

  let LibGen = (names) => {
    names = names || [];
    return new Proxy(
      function __call__() {

        if (!names.length) {
          return LibGen(arguments[0]);
        }

        let name = names.slice(0, 2).join('/') + names.slice(2).join('/');
        let args = [].slice.call(arguments);
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

        let responded = false;

        let req = https.request({
          host: HOST,
          method: METHOD,
          headers: headers,
          port: PORT,
          path: `${PATH}${name}`,
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

      },
      {
        get: (target, name) => {
          name = names.length === 2 && name[0] !== '@' ? ['@release', name] : [name];
          return LibGen(names.concat(name));
        }
      }
    );
  };

  return LibGen();

})();

module.exports = lib;
