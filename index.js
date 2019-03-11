const _ = require('lodash')

const objectDiff = () => {
  /**
   * Converts value into unit.
   * If unit is not given, try to determine based on power of ten
   * @param value FLOAT byte value
   */
  const diff = (objToCheck, defaultObject, options) => {
    if (!_.isObject(objToCheck)) {
      return { message: 'objToCheck_mustBeObject' }
    }

    if (!_.isObject(defaultObject)) {
      return { message: 'defaultObject_mustBeObject' }
    }

    // define default options
    options = options || {}

    let objectToStore = {}
    let path
    check(objToCheck, defaultObject, { path, objectToStore })

    // mergec remainuing items from objToCheck
    _.merge(objectToStore, objToCheck)
    return objectToStore
  }

  const check = (objToCheck, defaultObject, options) => {
    let path = _.get(options, 'path')
    let objectToStore = _.get(options, 'objectToStore')
    let origin = path ? _.get(defaultObject, path) : defaultObject
    let target = path ? _.get(objToCheck, path) : objToCheck
    _.forOwn(origin, (val, key) => {
      // console.log(_.repeat('-', 60))
      // console.log('Checking key %s - target has value %s', key, _.has(target, key))
      if (_.has(target, key)) {
        if (_.isPlainObject(_.get(target, key))) {
          // console.log("Go deeper", path ? path + '.' + key : key )
          check(objToCheck, defaultObject, { path: path ? path + '.' + key : key, objectToStore })
        }
        else if (_.get(target, key) !== _.get(origin, key)) {
          // store element
          // console.log('Store key %s with value %j', key,  _.get(target, key))
          _.set(objectToStore, path + '.' + key, _.get(target, key))
          // remove from targetObject
          _.unset(target, key)
        }
      }
    })
  }

  return {
    diff
  }
}

module.exports = objectDiff()
