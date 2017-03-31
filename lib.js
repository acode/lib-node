const appendLibPath = require('./lib/append.js');
const parseParameters = require('./lib/parse.js');
const executeLocal = require('./lib/local.js');
const executeRemote = require('./lib/remote.js');
const flags = require('./lib/flags.js');

module.exports = (function() {

  let LibGen = (rootCfg, cfg, names) => {
    rootCfg = Object.assign(cfg || {}, rootCfg || {});
    names = names || [];
    return new Proxy(
      function __call__() {
        let args = [].slice.call(arguments);
        let isLocal = !names[0];
        if (names.length === 0) {
          return LibGen(rootCfg, (typeof args[0] === 'object' ? args[0] : null) || {}, names);
        } else if (names.length === 1 && !isLocal) {
          return LibGen(rootCfg, {keys: (typeof args[0] === 'object' ? args[0] : {})}, names);
        } else {
          let p = parseParameters(args);
          let func = isLocal ? executeLocal : executeRemote;
          let execute = func.bind(null, cfg, names, p.args, p.kwargs, p.body);
          if (p.callback) {
            return execute(p.callback);
          } else {
            return new Promise((resolve, reject) => execute((err, result) => err ? reject(err) : resolve(result)));
          }
        }

      },
      {
        get: (target, name) => {
          if (name[0] === '_') {
            let flag = flags[name.substr(1)];
            if (!flag) {
              throw new Error(`Invalid flag: "${name.substr(1)}". Valid flags: ${Object.keys(flags).join(', ')}.`);
            }
            return function __flag__() {
              return LibGen(rootCfg, flag(...arguments), names);
            };
          } else {
            return LibGen(rootCfg, {}, appendLibPath(names, name));
          }
        }
      }
    );
  };

  return LibGen();

})();
