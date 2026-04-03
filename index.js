const _ = require('lodash')

const objectDiff = () => {
  const debugMode = process.env.NODE_DEBUGMODE
  /**
   * Returns the difference between objToCheck and defaultObject
   *
   * options.removeEmptyObjects - BOOL if true, empty objects are removed from objectToCheck
   * options.addMissingProperties - BOOL if true, properties missing on root level will be added from defaultObject.
   * ATTN: On deeper levels (in objects) they are added!
   */
  const diff = (objToCheck, defaultObject, options) => {
    if (!_.isObject(objToCheck)) {
      return { message: 'objToCheck_mustBeObject' }
    }

    if (!_.isObject(defaultObject)) {
      return { message: 'defaultObject_mustBeObject' }
    }

    const targetObject = _.cloneDeep(objToCheck)

    // define default options
    options = options || {}
    options.path = undefined
    check(targetObject, defaultObject, options)

    // remove NULL keys from targetObject
    _.forOwn(targetObject, (val, key) => {
      if (_.isNull(val)) _.unset(targetObject, key)
    })

    // merge remaining items from objToCheck
    return targetObject
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

    const targetObject = _.cloneDeep(objToCheck)
    const combinedObject = {}

    options = options || {}
    options.combinedObject = combinedObject
    checkMerge(targetObject, defaultObject, options)

    // merge remainuing items from objToCheck
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
    const path = _.get(options, 'path')
    const combinedObject = _.get(options, 'combinedObject')
    const origin = path ? _.get(defaultObject, path) : defaultObject
    const target = path ? _.get(objToCheck, path) : objToCheck
    _.forOwn(origin, (val, key) => {
      if (debugMode) {
        console.warn(_.repeat('-', 60))
        console.warn('Checking key %s - target has value %s', key, _.has(target, key))
      }
      if (!_.has(target, key) || _.isNil(_.get(target, key))) {
        // use the default value
        _.set(combinedObject, path ? path + '.' + key : key, _.get(origin, key))
        // remove nil keys from targetObject so they don't overwrite defaults in final merge
        if (_.has(target, key)) _.unset(target, key)
      }
      else {
        // target has key - use merge
        if (_.isPlainObject(_.get(target, key))) {
          if (debugMode) console.warn('Go deeper', path ? path + '.' + key : key)
          options.path = path ? path + '.' + key : key
          checkMerge(objToCheck, defaultObject, options)
        }
        else if (_.isArray(_.get(target, key))) {
          const mode = _.get(options, 'mergeArray.' + (path ? path + '.' + key : key) + '.mode', _.get(options, 'mergeArray.mode', 'concat'))
          const fieldIdentifier = _.get(options, 'mergeArray.' + (path ? path + '.' + key : key) + '.field', _.get(options, 'mergeArray.field'))
          let combinedArray
          // array of objects
          if (_.isPlainObject(_.first(_.get(target, key)))) {
            if (mode === 'target') {
              if (debugMode) console.warn('Use target mode on array of objects %s', path ? path + '.' + key : key)
              combinedArray = _.get(target, key)
            }
            else {
              if (!fieldIdentifier) {
                if (debugMode) console.warn('Use concat without fieldIdentifier for array of objects %s', path ? path + '.' + key : key)
                combinedArray = _.concat(_.get(target, key), _.get(origin, key))
              }
              else {
                if (debugMode) console.warn('Use targetMode with fieldIdentifier %s for array of objects %s', fieldIdentifier, path ? path + '.' + key : key)
                combinedArray = []
                _.forEach(_.get(origin, key), item => {
                  const findParams = {}
                  _.set(findParams, fieldIdentifier, _.get(item, fieldIdentifier))
                  const test = _.find(_.get(target, key), findParams)
                  if (test) {
                    if (debugMode) console.warn('Use value from objToCheck for fieldIdentifier %s for array of objects %s', fieldIdentifier, path ? path + '.' + key : key)
                    combinedArray.push(test)
                    // remove from target
                    const index = _.findIndex(_.get(target, key), findParams)
                    _.get(target, key).splice(index, 1)
                  }
                  else {
                    if (debugMode) console.warn('Use default value for fieldIdentifier %s for array of objects %s', fieldIdentifier, path ? path + '.' + key : key)
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
              if (debugMode) console.warn('Use target mode on plain array %s', path ? path + '.' + key : key)
              combinedArray = _.get(target, key)
            }
            else {
              if (debugMode) console.warn('Concat plain arrays %s', path ? path + '.' + key : key)
              combinedArray = _.uniq(_.concat(_.get(origin, key), _.get(target, key)))
            }
          }
          _.set(combinedObject, path ? path + '.' + key : key, combinedArray)
          // remove from targetObject
          _.unset(target, key)
        }
        else if (_.get(target, key) !== _.get(origin, key)) {
          // store element
          if (debugMode) console.warn('Store key %s with value %j', key, _.get(target, key))
          _.set(combinedObject, path ? path + '.' + key : key, _.get(target, key))
          // remove from targetObject
          _.unset(target, key)
        }
      }
    })
  }

  const check = (objToCheck, defaultObject, options) => {
    const path = _.get(options, 'path')
    const origin = path ? _.get(defaultObject, path) : defaultObject
    const target = path ? _.get(objToCheck, path) : objToCheck
    const optionRemoveEmptyObjects = _.get(options, 'removeEmptyObjects', true)
    const level = _.size(_.split(path, '.')) - 1

    _.forOwn(origin, (val, key) => {
      if (debugMode) {
        console.warn(_.repeat('-', 60))
        console.warn('Checking key %s - target has value %s', key, _.has(target, key))
      }
      if (_.has(target, key)) {
        if (_.get(options, 'hasChanges')) _.set(objToCheck, 'hasChanges', true)
        if (_.isPlainObject(_.get(target, key))) {
          if (debugMode) console.warn('Go deeper', path ? path + '.' + key : key)
          options.path = path ? path + '.' + key : key
          options.addMissingProperties = level > 0
          check(objToCheck, defaultObject, options)
        }
        else if (_.isNull(_.get(target, key))) {
          if (debugMode) console.warn('Remove key %s with value %j', key, _.get(target, key))
          _.unset(objToCheck, path ? path + '.' + key : key)
          // remove from targetObject
          _.unset(target, key)
        }
        else if (_.isArray(_.get(target, key))) {
          const difference = _.differenceWith(_.get(target, key), _.get(origin, key), _.isEqual)
          if (_.size(_.get(origin, key)) !== _.size(_.get(target, key)) || _.size(difference)) {
            if (debugMode) console.warn('Store Array key %s with value %j | original value %j', key, _.get(target, key), _.get(origin, key))
            _.set(objToCheck, path ? path + '.' + key : key, _.get(target, key))
          }
          else {
            _.unset(target, key)
          }
        }
        else if (_.get(target, key) !== _.get(origin, key)) {
          // store element
          if (debugMode) console.warn('Store key %s with value %j | original value %j', key, _.get(target, key), _.get(origin, key))
          _.set(objToCheck, path ? path + '.' + key : key, _.get(target, key))
        }
        else if (!options.addMissingProperties) {
          // target and origin are identical
          _.unset(target, key)
        }
      }
      else if (_.get(options, 'addMissingProperties')) {
        if (_.get(options, 'hasChanges')) _.set(objToCheck, 'hasChanges', true)
        if (val) _.set(objToCheck, (path ? path + '.' + key : key), val)
      }
    })

    // remove empty objects
    if (optionRemoveEmptyObjects) {
      removeEmptyObjects(objToCheck)
    }
  }

  const removeEmptyObjects = (objToCheck, options) => {
    const path = _.get(options, 'path')
    const targetObj = path ? _.get(objToCheck, path) : objToCheck
    options = options || {}
    _.forOwn(targetObj, (val, key) => {
      if (_.isPlainObject(val) && _.isEmpty(val)) {
        _.unset(targetObj, key)
      }
      else if (_.isPlainObject(val)) {
        options.path = path ? path + '.' + key : key
        removeEmptyObjects(objToCheck, options)
      }
    })
  }

  return {
    diff,
    merge
  }
}

module.exports = objectDiff()
