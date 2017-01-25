# StdLib Node.js Bindings

Basic Node bindings for StdLib service accession.

## Usage

```javascript
const lib = require('lib');

// [1]: Call "stdlib.reflect" function, the latest version, from StdLib
lib.stdlib.reflect(0, 1, (err, result) => {});

// [2]: Call "stdlib.reflect" function from StdLib, with "dev" environment
lib.stdlib.reflect['@dev'](0, 1, (err, result) => {});

// [3]: Call "stdlib.reflect" function from StdLib, with "release" environment
//      This is equivalent to (1)
lib.stdlib.reflect['@release'](0, 1, (err, result) => {});

// [4]: Call "stdlib.reflect" function from StdLib, with specific version
//      This is equivalent to (1)
lib.stdlib.reflect['@0.0.1'](0, 1, (err, result) => {});

// [5]: Call functions within the service (not just the defaultFunction)
//      This is equivalent to (1) when "main" is the default function
lib.stdlib.reflect.main(0, 1, (err, result) => {});

// Valid string composition from first parameter only:
lib['stdlib.reflect'](0, 1, (err, result) => {});
lib['stdlib.reflect[@dev]'](0, 1, (err, result) => {});
lib['stdlib.reflect[@release]'](0, 1, (err, result) => {});
lib['stdlib.reflect[@0.0.1]'](0, 1, (err, result) => {});
lib['stdlib.reflect.main'](0, 1, (err, result) => {});
lib['stdlib.reflect[@dev].main'](0, 1, (err, result) => {});
lib['stdlib.reflect[@release].main'](0, 1, (err, result) => {});
lib['stdlib.reflect[@0.0.1].main'](0, 1, (err, result) => {});
```
