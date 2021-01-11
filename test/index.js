import { expect } from 'chai'
import { createMetastore } from '../src/index'


describe('Create a Metatstore', () => {
  it('inits a FileStorage Backend', () => {
    let filestorage = createMetastore('file')
    expect(filestorage._name).to.eq('FileSystemStorage')
  })

  it('inits a Github Backend', () => {
    let gitstorage = createMetastore('github', {
      org: 'gift-data',
      private: true,
    })
    expect(gitstorage._name).to.eq('GitHubStorage')
  })
})
