# AC ObjectDiff
Ingests a default and a target object and returns only values from target object that are different form default object.

This way, you can store only the difference.

## Usage

***objectDiff.diff(targetObj, defaultObject, options)***

Returns an object which contains only the difference from target to default object.

Rules
+ objects will be examined and compared on property level
+ for all other field targetObject's value will take precedence

## Examples

```
const objectDiff = require('ac-objectdiff')

let default = {
  arrayItem: [123],
  stringItem: 'hello',
  objItem: {
    obj1: true,
    obj2: false
  }
}

let target = {
  arrayItem: [345],
  objItem: {
    obj1: false,
    obj3: true
  }
}

// Result
let objectToStore = {
  arrayItem: [345],
  objItem: {
    obj1: false,
    obj3: true
  }
}

```
# Links
- [Website](https://www.admiralcloud.com/)
- [Twitter (@admiralcloud)](https://twitter.com/admiralcloud)
- [Facebook](https://www.facebook.com/MediaAssetManagement/)

# Run tests
Run "npm run test" or "npm run test-jenkins".

## License

[MIT License](https://opensource.org/licenses/MIT) Copyright © 2009-present, AdmiralCloud, Mark Poepping
