module.exports = (args) => {

  let kwargs = {};
  let body;
  let content;
  let callback = typeof args[args.length - 1] === 'function' ? args.pop() : () => {};

  if (args.length === 1 && args[0] instanceof Buffer) {
    body = args.pop();
    content = 'file';
  } else {
    kwargs = typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null ? args.pop() : {};
    body = new Buffer(JSON.stringify({args: args, kwargs: kwargs}));
    content = 'json';
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
      stack = stack.slice(0, 1).concat(stack.slice(5));
      stack[1] = stack[1].replace('Object.<anonymous>', names.join('.'));
      err.stack = stack.join('\n');
      throw err;
    }
  });

  return {
    args: args,
    kwargs: kwargs,
    content: content,
    body: body,
    callback: callback
  };

};
