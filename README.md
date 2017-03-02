# StdLib Node.js Bindings

[StdLib Setup](https://github.com/stdlib/lib) |
**Node** |
[Python](https://github.com/stdlib/lib-python) |
[Ruby](https://github.com/stdlib/lib-ruby) |
[Web](https://github.com/stdlib/lib-js)

Basic Node bindings for StdLib service accession (Node 4+).

Used to interface with services built using [StdLib](https://stdlib.com) and
the [StdLib Command Line Tools](https://github.com/stdlib/lib).

The `lib` package is available on [npm: lib](https://npmjs.org/package/lib) and
operates as zero-dependency interface to run StdLib functions. This means that
you can utilize any service on StdLib without installing any additional
dependencies, and when you've deployed services to StdLib, you have a pre-built
Node.js SDK --- for example;

```javascript
const lib = require('lib');
lib.yourUsername.hostStatus({name: 'Dolores Abernathy'}, (err, result) => {

  // handle result

});
```

Or, using the Promise API:

```javascript
const lib = require('lib');
lib.yourUsername.hostStatus({name: 'Dolores Abernathy'})
  .then((result) => {
    // handle result
  })
  .catch((err) => {
    // handle errors
  });
```

To discover StdLib services, visit https://stdlib.com/search. To build a service,
get started with [the StdLib CLI tools](https://github.com/stdlib/lib).

## Installation

To install locally in a project (StdLib service or otherwise), use;

```shell
$ npm install lib --save
```

## Usage

```javascript
const lib = require('lib');

// [1]: Call "stdlib.reflect" function, the latest version, from StdLib
lib.stdlib.reflect(0, 1, {kwarg: 'value'}, (err, result) => {});

// [2]: Call "stdlib.reflect" function from StdLib, with "dev" environment
lib.stdlib.reflect['@dev'](0, 1, {kwarg: 'value'}, (err, result) => {});

// [3]: Call "stdlib.reflect" function from StdLib, with "release" environment
//      This is equivalent to (1)
lib.stdlib.reflect['@release'](0, 1, {kwarg: 'value'}, (err, result) => {});

// [4]: Call "stdlib.reflect" function from StdLib, with specific version
//      This is equivalent to (1)
lib.stdlib.reflect['@0.0.1'](0, 1, {kwarg: 'value'}, (err, result) => {});

// [5]: Call functions within the service (not just the defaultFunction)
//      This is equivalent to (1) when "main" is the default function
lib.stdlib.reflect.main(0, 1, {kwarg: 'value'}, (err, result) => {});

// Valid string composition from first object property only:
lib['stdlib.reflect'](0, 1, {kwarg: 'value'}, (err, result) => {});
lib['stdlib.reflect[@dev]'](0, 1, {kwarg: 'value'}, (err, result) => {});
lib['stdlib.reflect[@release]'](0, 1, {kwarg: 'value'}, (err, result) => {});
lib['stdlib.reflect[@0.0.1]'](0, 1, {kwarg: 'value'}, (err, result) => {});
lib['stdlib.reflect.main'](0, 1, {kwarg: 'value'}, (err, result) => {});
lib['stdlib.reflect[@dev].main'](0, 1, {kwarg: 'value'}, (err, result) => {});
lib['stdlib.reflect[@release].main'](0, 1, {kwarg: 'value'}, (err, result) => {});
lib['stdlib.reflect[@0.0.1].main'](0, 1, {kwarg: 'value'}, (err, result) => {});
```

### Local Usage

To use StdLib services locally (from within a StdLib function), use the
"string composition" method and begin your service path with a period;

```javascript
lib['.otherFunction']({key: 'X'}, (err, result) => {});
```

This functionality exists, so if needs be, you can directly interface with
other functions within a StdLib service when testing locally (i.e. MapReduce
  usage). Please note that **local functions always execute in the same context
  and thread as the caller**, meaning you *will not* get the scalability benefits
  of calling the function remotely, however **latency is significantly reduced**.

## Additional Information

To learn more about StdLib, visit [stdlib.com](https://stdlib.com) or read the
[StdLib CLI documentation on GitHub](https://github.com/stdlib/lib).

You can follow the development team on Twitter, [@StdLibHQ](https://twitter.com/stdlibhq)

StdLib is &copy; 2016 - 2017 Polybit Inc.
