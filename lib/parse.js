module.exports = (args) => {

  let kwargs = {};
  let body;
  let content;
  let callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;

  if ((args.length === 1 || args.length === 2) && args[0] instanceof Buffer) {
    body = args.shift();
    kwargs = args.shift();
    kwargs = typeof kwargs === 'object' && kwargs !== null ? kwargs : {};
  } else {
    kwargs = typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null ? args.pop() : {};
    body = {args: args, kwargs: kwargs};
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
    body: body,
    callback: callback
  };

};
