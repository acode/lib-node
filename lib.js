const appendLibPath = require('./lib/append.js');
const parseParameters = require('./lib/parse.js');
const executeLocal = require('./lib/local.js');
const executeRemote = require('./lib/remote.js');

module.exports = (function() {

  let LibGen = (cfg, names) => {
    cfg = cfg || {};
    names = names || [];
    return new Proxy(
      function __call__() {

        let args = [].slice.call(arguments);
        let isLocal = !names[0];

        if (names.length === 0) {
          cfg = (typeof args[0] === 'object' ? args[0] : null) || {};
          return LibGen(cfg, names);
        } else if (names.length === 1 && !isLocal) {
          cfg.keys = (typeof args[0] === 'object' ? args[0] : null) || {};
          return LibGen(cfg, names);
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
        get: (target, name) => LibGen(cfg, appendLibPath(names, name))
      }
    );
  };

  return LibGen();

})();
