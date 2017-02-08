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
        let p = parseParameters(args);
        let isLocal = !names[0];

        if (isLocal) {
          executeLocal(cfg, names, p.args, p.kwargs, p.body, p.callback);
        } else {
          executeRemote(cfg, names, p.args, p.kwargs, p.body, p.callback);
        }

      },
      {
        get: (target, name) => LibGen(cfg, appendLibPath(names, name))
      }
    );
  };

  return LibGen();

})();
