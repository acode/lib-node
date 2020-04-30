function appendVersion(names, str) {
  return names.concat(str);
}

function appendPath(names, str) {
  if (!str.match(/^[A-Z0-9\-\_]+$/gi)) {
    if (str.indexOf('@') !== -1) {
      throw new Error(`${names.join('.')} invalid name: ${str}, please specify versions and environments with [@version]`);
    }
    throw new Error(`${names.join('.')} invalid name: ${str}`);
  }
  return names.concat(str);
}

function appendLibPath(names, str) {

  names = names ? names.slice() : [];
  let defaultVersion = '@release';

  if (names.length === 0 && str === '') {

    return names.concat(str);

  } else if (names.length === 0 && str.indexOf('.') !== -1) {

    let versionMatch = str.match(/^[^\.]+?\.[^\.]*?(\[@[^\[\]]*?\])(\.|$)/);
    let arr;

    if (versionMatch) {
      version = versionMatch[1];
      version = version.replace(/^\[?(.*?)\]?$/, '$1');
      str = str.replace(versionMatch[1], '');
      arr = str.split('.');
      arr = arr.slice(0, 2).concat(version, arr.slice(2));
    } else {
      arr = str === '.' ? [''] : str.split('.');
    }

    while (arr.length && (names = appendLibPath(names, arr.shift())));
    return names;

  } else if (names.length === 2 && names[0] !== '') {

    return str[0] === '@' ?
      appendVersion(names, str) :
      appendPath(appendVersion(names, defaultVersion), str);

  } else {

    return appendPath(names, str);

  }

}

module.exports = appendLibPath;
