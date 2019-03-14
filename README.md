# AC ObjectDiff
Ingests a default and a target object and returns only values from target object that are different form default object.

This way, you can store only the difference.

Or use it to merge a custom object with a default object.

## Usage

***objectDiff.diff(targetObj, defaultObject, options)***

Returns an object which contains only the difference from target to default object.

Rules
+ objects will be examined and compared on property level
+ for all other field targetObject's value will take precedence

***objectDiff.merge(targetObj, defaultObject, options)***

Returns an object which contains only the difference from target to default object.

Options:
+ mergeArray OBJ
  + mode STRING concat OR target - concat concatenates the arrays (see below)
  + field STRING if using concat with array of objects, field is used to identify values in both origin and target
  + you can also use a PATH to give more specific instructions (e.g mergeArray.PATH.mode)

Rules
+ objects will be examined and compared on property level
+ for all other field targetObject's value will take precedence
+ except for arrays - they have their own rules

Arrays can me concatenated (and uniquefied) or in target mode, the target will overwrite the origin's array completely. If the array is an array ob objects, use concatenate with a field options to merge arrays of objects based in that property (i.e. if a target value for that property exists, it will overwrite an origin value)


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
