const _ = require('lodash')

const objectDiff = () => {
  const debugMode = process.env.NODE_DEBUGMODE
  /**
   * Returns the difference between objToCheck and defaultObject
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

    let targetObject = _.cloneDeep(objToCheck)
    let objectToStore = {}
    let path
    check(targetObject, defaultObject, { path, objectToStore })

    // remove NULL keys from targetObject
    _.forOwn(targetObject, (val, key) => {
      if (_.isNull(val)) _.unset(targetObject, key)
    })

    // merge remaining items from objToCheck
    //_.merge(objectToStore, targetObject)
    return objectToStore
  }

  /**
   * Creates an object with all default values, merges it with objToCheck
   * @param {M} objToCheck
   * @param {*} defaultObject
   * @param {*} options
   */
  const merge = (objToCheck, defaultObject, options) => {
    if (!_.isObject(objToCheck)) {
      return { message: 'objToCheck_mustBeObject' }
    }

    if (!_.isObject(defaultObject)) {
      return { message: 'defaultObject_mustBeObject' }
    }

    // define default options
    options = options || {}

    let targetObject = _.cloneDeep(objToCheck)
    let combinedObject = {}

    options = options || {}
    options.combinedObject = combinedObject
    checkMerge(targetObject, defaultObject, options)

    // mergec remainuing items from objToCheck
    _.merge(combinedObject, targetObject)
    return combinedObject
  }

  /**
   *
   * @param {*} objToCheck
   * @param {*} defaultObject
   * @param {*} options.mergeArray -> {mode: ['concat', 'target'], field: ''} // default concat, no field - duplicate. You can alos use mergeArray.PATH.mode/field to set specific instructions for different paths
   */
  const checkMerge = (objToCheck, defaultObject, options) => {
    let path = _.get(options, 'path')
    let combinedObject = _.get(options, 'combinedObject')
    let origin = path ? _.get(defaultObject, path) : defaultObject
    let target = path ? _.get(objToCheck, path) : objToCheck
    _.forOwn(origin, (val, key) => {
      if (debugMode) {
        console.log(_.repeat('-', 60))
        console.log('Checking key %s - target has value %s', key, _.has(target, key))
      }
      if (!_.has(target, key) || _.isNil(_.get(target, key))) {
        // use the default value
        _.set(combinedObject, path ? path + '.' + key : key, _.get(origin, key))
      }
      else {
        // target has key - use merge
        if (_.isPlainObject(_.get(target, key))) {
          if (debugMode) console.log('Go deeper', path ? path + '.' + key : key)
          options.path = path ? path + '.' + key : key
          checkMerge(objToCheck, defaultObject, options)
        }
        else if (_.isArray(_.get(target, key))) {
          let mode = _.get(options, 'mergeArray.' + (path ? path + '.' + key : key) + '.mode', _.get(options, 'mergeArray.mode', 'concat'))
          let fieldIdentifier = _.get(options, 'mergeArray.' + (path ? path + '.' + key : key) + '.field', _.get(options, 'mergeArray.field'))
          let combinedArray
          // array of objects
          if (_.isPlainObject(_.first(_.get(target, key)))) {
            if (mode === 'target') {
              if (debugMode) console.log('Use target mode on array of objects %s', path ? path + '.' + key : key)
              combinedArray = _.get(target, key)
            }
            else {
              if (!fieldIdentifier) {
                if (debugMode) console.log('Use concat without fieldIdentifier for array of objects %s', path ? path + '.' + key : key)
                combinedArray = _.concat(_.get(target, key), _.get(origin, key))
              }
              else {
                if (debugMode) console.log('Use targetMode with fieldIdentifier %s for array of objects %s', fieldIdentifier, path ? path + '.' + key : key)
                combinedArray = []
                _.forEach(_.get(origin, key), item => {
                  let findParams = {}
                  _.set(findParams, fieldIdentifier, _.get(item, fieldIdentifier))
                  let test = _.find(_.get(target, key), findParams)
                  if (test) {
                    if (debugMode) console.log('Use value from objToCheck for fieldIdentifier %s for array of objects %s', fieldIdentifier, path ? path + '.' + key : key)
                    combinedArray.push(test)
                    // remove from target
                    let index = _.findIndex(_.get(target, key), findParams)
                    _.get(target, key).splice(index, 1)
                  }
                  else {
                    if (debugMode) console.log('Use default value for fieldIdentifier %s for array of objects %s', fieldIdentifier, path ? path + '.' + key : key)
                    combinedArray.push(item)
                  }
                })
                // add remaining items from target
                combinedArray = _.concat(combinedArray, _.get(target, key))
              }
            }
          }
          else {
            // concat and clean up
            if (mode === 'target') {
              if (debugMode) console.log('Use target mode on plain array %s', path ? path + '.' + key : key)
              combinedArray = _.get(target, key)
            }
            else {
              if (debugMode) console.log('Concat plain arrays %s', path ? path + '.' + key : key)
              combinedArray = _.uniq(_.concat(_.get(origin, key), _.get(target, key)))
            }
          }
          _.set(combinedObject, path ? path + '.' + key : key, combinedArray)
          // remove from targetObject
          _.unset(target, key)
        }
        else if (_.get(target, key) !== _.get(origin, key)) {
          // store element
          if (debugMode) console.log('Store key %s with value %j', key, _.get(target, key))
          _.set(combinedObject, path ? path + '.' + key : key, _.get(target, key))
          // remove from targetObject
          _.unset(target, key)
        }
      }
    })
  }

  const check = (objToCheck, defaultObject, options) => {
    let path = _.get(options, 'path')
    let objectToStore = _.get(options, 'objectToStore')
    let origin = path ? _.get(defaultObject, path) : defaultObject
    let target = path ? _.get(objToCheck, path) : objToCheck
    _.forOwn(origin, (val, key) => {
      if (debugMode) {
        console.log(_.repeat('-', 60))
        console.log('Checking key %s - target has value %s', key, _.has(target, key))
      }
      if (_.has(target, key)) {
        if (_.isPlainObject(_.get(target, key))) {
          if (debugMode) console.log('Go deeper', path ? path + '.' + key : key)
          check(objToCheck, defaultObject, { path: path ? path + '.' + key : key, objectToStore })
        }
        else if (_.isNull(_.get(target, key))) {
          if (debugMode) console.log('Remove key %s with value %j', key, _.get(target, key))
          _.unset(objectToStore, path ? path + '.' + key : key)
          // remove from targetObject
          _.unset(target, key)
        }
        else if (_.get(target, key) !== _.get(origin, key)) {
          // store element
          if (debugMode) console.log('Store key %s with value %j', key, _.get(target, key))
          _.set(objectToStore, path ? path + '.' + key : key, _.get(target, key))
          // remove from targetObject
          _.unset(target, key)
        }
      }
    })
  }

  return {
    diff,
    merge
  }
}

module.exports = objectDiff()
