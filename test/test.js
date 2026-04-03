const _ = require('lodash')
const acDiff = require('../index')
const chai = require('chai')
const expect = chai.expect


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

describe('TESTING comparison', function() {
  it('Prepare customerConfig for storage - changed properties only (based on root level)', done => {
    const testObj = _.clone(customerConfigUpdate)
    const r = acDiff.diff(testObj, customerConfig)
    expect(r.individualConfiguration.audioLanguages).to.be.undefined
    expect(r.individualConfiguration.imprint).to.deep.equal(customerConfigUpdate.individualConfiguration.imprint)
    expect(r.name).to.be.undefined
    expect(r.anotherConfiguration).to.be.undefined
    expect(r.internalConfiguration).to.be.undefined

    return done()
  })

  it('Prepare customerConfig for storage - another config has changed on deep level', done => {
    const testObj = _.clone(customerConfigUpdate)
    testObj.anotherConfiguration.config1.thisIsAnArray = [13, 11]
    const r = acDiff.diff(testObj, customerConfig)
    expect(r.individualConfiguration.audioLanguages).to.be.undefined
    expect(r.individualConfiguration.imprint).to.deep.equal(customerConfigUpdate.individualConfiguration.imprint)
    expect(r.name).to.be.undefined
    expect(r.anotherConfiguration.config1.thisIsAnArray).to.deep.equal(testObj.anotherConfiguration.config1.thisIsAnArray)

    return done()
  })

  it('Store only items that are not in defValue', (done) => {
    const testObj = _.clone(userValue)
    const r = acDiff.diff(testObj, defValue)
    // concat
    expect(r.searchConfiguration.mediaContainer.test).to.deep.equal(['abc'])

    expect(r.searchConfiguration.mediaContainer.obj).to.deep.equal({ objTest1: false, objTest3: true })
    const first = _.first(r.searchConfiguration.mediaContainer.searchableFields.fields)
    expect(first.field).to.equal('container_name')
    expect(first.searchTypes).to.deep.equal([ { type: 'xx', boost: 124556, suffix: 'delta' } ])
    expect(r.searchConfiguration.mediaContainer.onlyInUser).to.equal(userValue.searchConfiguration.mediaContainer.onlyInUser)
    return done()
  })

  it('Send null value for obj', (done) => {
    const testObj = _.clone(userValue)
    _.set(testObj, 'searchConfiguration.mediaContainer.obj', null)
    const r = acDiff.diff(testObj, defValue)
    expect(r.searchConfiguration.mediaContainer.obj).to.be.undefined

    // rest should be unchanged
    expect(r.searchConfiguration.mediaContainer.test).to.deep.equal(['abc'])
    const first = _.first(r.searchConfiguration.mediaContainer.searchableFields.fields)
    expect(first.field).to.equal('container_name')
    expect(first.searchTypes).to.deep.equal([ { type: 'xx', boost: 124556, suffix: 'delta' } ])
    expect(r.searchConfiguration.mediaContainer.onlyInUser).to.equal(userValue.searchConfiguration.mediaContainer.onlyInUser)

    return done()
  })

  it('Return combined object', done => {
    const testObj = _.clone(userValue)
    const r = acDiff.merge(testObj, defValue)
    // from user value
    expect(r.searchConfiguration.mediaContainer.test).to.deep.equal(['abc', 'def'])
    expect(r.searchConfiguration.mediaContainer.obj).to.deep.equal(userValue.searchConfiguration.mediaContainer.obj)
    expect(r.searchConfiguration.defaultSearchFields).to.deep.equal(defValue.searchConfiguration.defaultSearchFields)
    expect(r.searchConfiguration.mediaContainer.onlyInUser).to.equal(userValue.searchConfiguration.mediaContainer.onlyInUser)

    // mediacontainer.searchableField.fields should be merged and contain 3 elements, container_name twice
    const first = _.first(r.searchConfiguration.mediaContainer.searchableFields.fields)
    expect(first.field).to.equal('container_name')

    expect(first.searchTypes).to.deep.equal([ { type: 'xx', boost: 124556, suffix: 'delta' } ])

    let test = _.filter(r.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_name' })
    expect(test.length).to.equal(2)

    test = _.find(r.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_description' })
    const compare = _.find(defValue.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_description' })
    expect(test.searchTypes).to.deep.equal(compare.searchTypes)

    return done()
  })

  it('Return combined object - use fieldIdentifier', done => {
    const testObj = _.clone(userValue)
    const r = acDiff.merge(testObj, defValue, { mergeArray: { mode: 'merge', field: 'field' } })
    // from user value
    expect(r.searchConfiguration.mediaContainer.test).to.deep.equal(['abc', 'def'])
    expect(r.searchConfiguration.mediaContainer.obj).to.deep.equal(userValue.searchConfiguration.mediaContainer.obj)
    expect(r.searchConfiguration.mediaContainer.onlyInUser).to.equal(userValue.searchConfiguration.mediaContainer.onlyInUser)

    // from default
    expect(r.searchConfiguration.defaultSearchFields).to.deep.equal(defValue.searchConfiguration.defaultSearchFields)

    let test = _.find(r.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_name' })
    const compareUser = _.find(userValue.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_name' })
    expect(test.searchTypes).to.deep.equal(compareUser.searchTypes)

    test = _.find(r.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_description' })
    const compare = _.find(defValue.searchConfiguration.mediaContainer.searchableFields.fields, { field: 'container_description' })
    expect(test.searchTypes).to.deep.equal(compare.searchTypes)
    return done()
  })

  it('Check if there are any changes on the object ', done => {
    const originalObject = { 'autoGenerate': { 'formats': [6], 'playerConfigurations': [] } }
    const newObject = { 'autoGenerate': { 'playerConfigurations': [] } }
    const r = acDiff.diff(newObject, originalObject, { hasChanges: true })
    expect(r.hasChanges).to.be.true
    return done()
  })
})