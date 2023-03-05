const appendLibPath = require('./lib/append.js');
const parseParameters = require('./lib/parse.js');
const executeLocal = require('./lib/local.js');
const executeRemote = require('./lib/remote.js');

module.exports = (function() {

  let LibGen = (rootCfg, cfg, names) => {
    rootCfg = Object.assign(cfg || {}, rootCfg || {});
    names = names || [];
    return new Proxy(
      function __call__() {
        let grabStackError = new Error('GrabStackError');
        let stackError = (message) => {
          return [].concat(
            message,
            (grabStackError.stack || '')
              .split('\n')
              .slice(2)
              .join('\n')
              .replace(/at (eval|module\.exports) \(/gi, `at ${names.join('.')} (`)
          ).filter(v => !!v).join('\n');
        };
        let args = [].slice.call(arguments);
        let isLocal = !names[0];
        if (names.length === 0) {
          return LibGen(rootCfg, (typeof args[0] === 'object' ? args[0] : null) || {}, names);
        } else if (names.length === 1 && !isLocal) {
          return LibGen(rootCfg, {keys: (typeof args[0] === 'object' ? args[0] : {})}, names);
        } else {
          let p = parseParameters(names, args);
          let func = isLocal ? executeLocal : executeRemote;
          let execute = func.bind(null, cfg, names, p.params);
          if (p.callback) {
            return execute(p.callback, stackError);
          } else {
            return new Promise((resolve, reject) => execute((err, result) => err ? reject(err) : resolve(result), stackError));
          }
        }
      },
      {
        get: (target, name) => {
          return LibGen(rootCfg, {}, appendLibPath(names, name));
        }
      }
    );
  };

  return LibGen();

})();
