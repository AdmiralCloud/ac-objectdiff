const _ = require('lodash')
const expect = require('expect')
const acDiff = require('../index')

const defValue = {
  searchConfiguration: {
    defaultSearchFields: ['fileName', 'tags', 'contacts', 'container_name', 'container_description', 'container_comment', 'meta_pdfToText', 'meta_audiocontent', 'meta_textInImage_content'],
    mediaContainer: {
      test: ['abc', 'def'],
      obj: {
        objTest1: true,
        objTest2: false
      },
      searchableFields: {
        fields: [
          {
            field: 'container_name',
            hasLanguage: true,
            searchTypes: [{
              type: 'match_phrase',
              boost: 1e6,
              suffix: 'exact'
            }, {
              type: 'match',
              boost: 1e6,
              suffix: 'prefix'
            }]
          },
          {
            field: 'container_description',
            hasLanguage: true,
            searchTypes: [{
              type: 'match_phrase',
              boost: 1e6,
              suffix: 'exact'
            }]
          }
        ]
      }
    }
  }
}

const userValue = {
  searchConfiguration: {
    mediaContainer: {
      test: ['abc'],
      obj: {
        objTest1: false,
        objTest3: true
      },
      onlyInUser: 1235667,
      searchableFields: {
        fields: [
          {
            field: 'container_name',
            hasLanguage: true,
            searchTypes: [{
              type: 'xx',
              boost: 124556,
              suffix: 'delta'
            }]
          }
        ]
      }
    }
  }
}

const customerConfig = {
  name: 'AdmiralCloud',
  individualConfiguration: {
    audioLanguages: ['de', 'en']
  },
  anotherConfiguration: {
    config1: {
      thisIsAnArray: [22, 2, 96]
    }
  },
  internalConfiguration: {
    export: {
      accessKeyId: 'xxxx',
      secretAccessKey: 'yyyy',
      bucket: 'ac-zzzzz'
    }
  }
}
const customerConfigUpdate = {
  name: 'AdmiralCloud',
  individualConfiguration: {
    imprint: {
      url: 'https://www.admiralcloud.com'
    }
  },
  anotherConfiguration: {
    config1: {
      thisIsAnArray: [22, 2, 96]
    }
  },
  internalConfiguration: {
    export: {
      accessKeyId: 'xxxx',
      secretAccessKey: 'yyyy',
      bucket: 'ac-zzzzz'
    }
  }
}

describe('TESTING comparison', function () {
  it('Prepare customerConfig for storage - changed properties only (based on root level)', done => {
    let testObj = _.clone(customerConfigUpdate)
    let r = acDiff.diff(testObj, customerConfig)
    expect(r.individualConfiguration.audioLanguages).toBeUndefined()
    expect(r.individualConfiguration.imprint).toEqual(customerConfigUpdate.individualConfiguration.imprint)
    expect(r.name).toBeUndefined()
    expect(r.anotherConfiguration).toBeUndefined()
    expect(r.internalConfiguration).toBeUndefined()

    return done()
  })

  it('Prepare customerConfig for storage - another config has changed on deep level', done => {
    let testObj = _.clone(customerConfigUpdate)
    testObj.anotherConfiguration.config1.thisIsAnArray = [13, 11]
    let r = acDiff.diff(testObj, customerConfig)
    expect(r.individualConfiguration.audioLanguages).toBeUndefined()
    expect(r.individualConfiguration.imprint).toEqual(customerConfigUpdate.individualConfiguration.imprint)
    expect(r.name).toBeUndefined()
    expect(r.anotherConfiguration.config1.thisIsAnArray).toEqual(testObj.anotherConfiguration.config1.thisIsAnArray)

    return done()
  })

  it('Store only items that are not in defValue', (done) => {
    let testObj = _.clone(userValue)
    let r = acDiff.diff(testObj, defValue)
    // concat
    expect(r.searchConfiguration.mediaContainer.test).toEqual(['abc'])

    expect(r.searchConfiguration.mediaContainer.obj).toEqual({ objTest1: false, objTest3: true })
    let first = _.first(r.searchConfiguration.mediaContainer.searchableFields.fields)
    expect(first.field).toEqual('container_name')
    expect(first.searchTypes).toEqual([ { type: 'xx', boost: 124556, suffix: 'delta' } ])
    expect(r.searchConfiguration.mediaContainer.onlyInUser).toEqual(userValue.searchConfiguration.mediaContainer.onlyInUser)
    return done()
  })

  it('Send null value for obj', (done) => {
    let testObj = _.clone(userValue)
    _.set(testObj, 'searchConfiguration.mediaContainer.obj', null)
    let r = acDiff.diff(testObj, defValue)
    expect(r.searchConfiguration.mediaContainer.obj).toBeUndefined()

    // rest should be unchanged
    expect(r.searchConfiguration.mediaContainer.test).toEqual(['abc'])
    let first = _.first(r.searchConfiguration.mediaContainer.searchableFields.fields)
    expect(first.field).toEqual('container_name')
    expect(first.searchTypes).toEqual([ { type: 'xx', boost: 124556, suffix: 'delta' } ])
    expect(r.searchConfiguration.mediaContainer.onlyInUser).toEqual(userValue.searchConfiguration.mediaContainer.onlyInUser)

    return done()
  })

  it('Return combined object', done => {
    let testObj = _.clone(userValue)
    let r = acDiff.merge(testObj, defValue)
    // from user value
    expect(r.searchConfiguration.mediaContainer.test).toEqual(['abc', 'def'])
    expect(r.searchConfiguration.mediaContainer.obj).toEqual(userValue.searchConfiguration.mediaContainer.obj)
    expect(r.searchConfiguration.defaultSearchFields).toEqual(defValue.searchConfiguration.defaultSearchFields)
    expect(r.searchConfiguration.mediaContainer.onlyInUser).toEqual(userValue.searchConfiguration.mediaContainer.onlyInUser)

    // mediacontainer.searchableField.fields should be merged and contain 3 elements, container_name twice
    let first = _.first(r.searchConfiguration.mediaContainer.searchableFields.fields)
    expect(first.field).toEqual('container_name')

    expect(first.searchTypes).toEqual([ { type: 'xx', boost: 124556, suffix: 'delta' } ])

    let test = _.filter(r.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_name' })
    expect(test.length).toEqual(2)

    test = _.find(r.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_description' })
    let compare = _.find(defValue.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_description' })
    expect(test.searchTypes).toEqual(compare.searchTypes)

    return done()
  })

  it('Return combined object - use fieldIdentifier', done => {
    let testObj = _.clone(userValue)
    let r = acDiff.merge(testObj, defValue, { mergeArray: { mode: 'merge', field: 'field' } })
    // from user value
    expect(r.searchConfiguration.mediaContainer.test).toEqual(['abc', 'def'])
    expect(r.searchConfiguration.mediaContainer.obj).toEqual(userValue.searchConfiguration.mediaContainer.obj)
    expect(r.searchConfiguration.mediaContainer.onlyInUser).toEqual(userValue.searchConfiguration.mediaContainer.onlyInUser)

    // from default
    expect(r.searchConfiguration.defaultSearchFields).toEqual(defValue.searchConfiguration.defaultSearchFields)

    let test = _.find(r.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_name' })
    let compareUser = _.find(userValue.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_name' })
    expect(test.searchTypes).toEqual(compareUser.searchTypes)

    test = _.find(r.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_description' })
    let compare = _.find(defValue.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_description' })
    expect(test.searchTypes).toEqual(compare.searchTypes)
    return done()
  })

  it('Check if there are any changes on the object ', done => {
    let originalObject = { 'autoGenerate': { 'formats': [6], 'playerConfigurations': [] } }
    let newObject = { 'autoGenerate': { 'playerConfigurations': [] } }
    let r = acDiff.diff(newObject, originalObject, { hasChanges: true })
    expect(r.hasChanges).toBe(true)
    return done()
  })
})
