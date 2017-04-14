module.exports = (names, params) => {

  let callback;
  let keywords;

  if (typeof params[params.length - 1] === 'function') {
    callback = params.pop();
  }

  for (let i = 0; i < params.length; i++) {
    if (typeof params[i] === 'function') {
      throw new TypeError(`${names.join('.')}: Can not pass functions as arguments, except for callback`);
    }
  }

  return {
    params: params,
    callback: callback
  };

};
