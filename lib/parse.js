function formatBuffer(b) {
  return Buffer.isBuffer(b) ? {_base64: b.toString('base64')} : b;
}

function containsKeywords(params) {
  return typeof params[0] === 'object' &&
  !Array.isArray(params[0]) &&
  !Buffer.isBuffer(params[0]);
}

function formatParams(params) {
  var src = params[0] || {};
  var dst = {};
  return Object.keys(params[0] || {}).reduce((dst, name) => {
    dst[name] = formatBuffer(src[name]);
    return dst;
  }, dst);
}

module.exports = (names, params) => {

  let callback;

  if (typeof params[params.length - 1] === 'function') {
    callback = params.pop();
  }

  if (params.length > 1) {
    throw new Error('No more than one optional argument containing an object of key-value pairs expected.');
  } else if (params.length && !containsKeywords(params)) {
    throw new Error('Argument must be an object of key-value pairs that act as function parameters.');
  }

  return {
    params: formatParams(params),
    callback: callback
  };

};
