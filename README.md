# Autocode standard library Node.js bindings

Basic Node bindings for Autocode standard library service accession (Node 4+).

Used to interface with services built using [Autocode](https://autocode.com) and
the [Autocode CLI](https://github.com/acode/lib).

The `lib` package is available on [npm: lib](https://npmjs.org/package/lib) and
operates as zero-dependency interface to run Autocode standard library APIs and
web services. This means that you can utilize any service on Autocode without
installing any additional dependencies, and when you've deployed services to Autocode,
you have a pre-built Node.js SDK --- for example;

### Callback Style

```javascript
const lib = require('lib');
lib.yourUsername.hostStatus({name: 'Dolores Abernathy'}, (err, result) => {

  // handle result

});
```

### Promise Style

```javascript
const lib = require('lib');
lib.yourUsername.hostStatus({name: 'Dolores Abernathy'})
  .then(result => /* handle result */)
  .catch(err => /* handle error */);
```

To explore the Autocode standard library, visit https://autocode.com/lib/.
To build a web service or standard library API, sign up on https://autocode.com/.

## Installation

To install locally in a project, use;

```shell
$ npm install lib --save
```

## Usage

```javascript
const lib = require('lib');

// [1]: Call "utils.greet" function, the latest version, from Autocode
let message = await lib.utils.greet({name: 'Lionel Hutz'});

// [2]: Call "utils.greet" function with "dev" environment
let message = await lib.utils.greet['@dev']({name: 'Lionel Hutz'});

// [3]: Call "utils.greet" function with "release" environment
//      This is equivalent to (1)
let message = await lib.utils.greet['@release']({name: 'Lionel Hutz'});

// [4]: Call "utils.greet" function with specific version
//      if latest version, this is equivalent to (1)
let message = await lib.utils.greet['@0.0.1']({name: 'Lionel Hutz'});

// [5]: Call another endpoint within the "utils.greet" service
let message = await lib.utils.greet['@dev'].otherEndpoint();

// You can compose calls dynamically as well by using a string key
await lib['utils.greet']({name: 'Lionel Hutz'});
await lib['utils.greet[@dev]']({name: 'Lionel Hutz'});
await lib['utils.greet[@release]']({name: 'Lionel Hutz'});
await lib['utils.greet[@0.0.1]']({name: 'Lionel Hutz'});
await lib['utils.greet.otherEndpoint']({name: 'Lionel Hutz'});
await lib['utils.greet[@dev].otherEndpoint']({name: 'Lionel Hutz'});
await lib['utils.greet[@release].otherEndpoint']({name: 'Lionel Hutz'});
await lib['utils.greet[@0.0.1].otherEndpoint']({name: 'Lionel Hutz'});
```

## Additional Information

To learn more about Autocode, visit [autocode.com](https://autocode.com) or read the
[Autocode CLI documentation on GitHub](https://github.com/acode/lib).

You can follow the development team on Twitter, [@AutocodeHQ](https://twitter.com/AutocodeHQ)

Autocode is &copy; 2016 - 2021 Polybit Inc.
