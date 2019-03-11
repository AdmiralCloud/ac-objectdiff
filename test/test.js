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

describe('TESTING comparison', function () {
  it('Store only items that are not in defValue', (done) => {
    let testObj = _.clone(userValue)
    let r = acDiff.diff(testObj, defValue)

    expect(r.searchConfiguration.mediaContainer.test).toEqual(['abc'])
    expect(r.searchConfiguration.mediaContainer.obj).toEqual({ objTest1: false, objTest3: true })
    let first = _.first(r.searchConfiguration.mediaContainer.searchableFields.fields)
    expect(first.field).toEqual('container_name')
    expect(first.searchTypes).toEqual([ { type: 'xx', boost: 124556, suffix: 'delta' } ])
    expect(r.searchConfiguration.mediaContainer.onlyInUser).toEqual(1235667)
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
    expect(r.searchConfiguration.mediaContainer.onlyInUser).toEqual(1235667)

    return done()
  })
})
