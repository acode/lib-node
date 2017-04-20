function formatBuffer(b) {
  return Buffer.isBuffer(b) ? {_base64: b.toString('base64')} : b;
}

function containsKeywords(params) {
  return params.length &&
  typeof params[0] === 'object' &&
  !Array.isArray(params[0]) &&
  !Buffer.isBuffer(params[0]);
}

function formatParams(params) {
  if (containsKeywords(params)) {
    if (params.length > 1) {
      throw new Error('Can not send additional arguments with parameters as keywords');
    } else {
      return Object.keys(params[0]).reduce((body, name) => {
        body[name] = formatBuffer(body[name]);
        return body;
      }, params[0]);
    }
  } else {
    return params.map(formatBuffer);
  }
}

module.exports = (names, params) => {

  let callback;

  if (typeof params[params.length - 1] === 'function') {
    callback = params.pop();
  }

  return {
    params: formatParams(params),
    callback: callback
  };

};
