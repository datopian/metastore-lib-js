import { expect } from 'chai'
import {
  isPosixPathResource,
  hasLfsAttributes,
  createGitAttributesFile,
  createLfsConfigFile,
  createLfsPointerFile,
} from '../../src/backend/gitLfsHelpers'

describe('Git LFS Helpers', () => {
  it('isPosixPathResource works correctly ', () => {
    const resource1 = { path: 'data/file.csv' }
    const resource2 = { path: 'https://file.csv' }
    const resource3 = { path: 'http://file.csv' }

    expect(isPosixPathResource(resource1)).to.eq(true)
    expect(isPosixPathResource(resource2)).to.eq(false)
    expect(isPosixPathResource(resource3)).to.eq(false)
  })

  it('isPosixPathResource works correctly ', () => {
    const resource1 = { path: 'data/file.csv', bytes: 1234, sha256: 'bjdhd' }
    const resource2 = { path: 'data/file.csv', size: 1234, sha256: 'bjdhd' }

    expect(hasLfsAttributes(resource1)).to.eq(true)
    expect(hasLfsAttributes(resource2)).to.eq(false)
  })

  it('createGitAttributesFile works correctly ', () => {
    const paths = ['data/file.csv', 'data/file2.csv']
    const gitAttributeFiles =
      'data/file.csv filter=lfs diff=lfs merge=lfs -text\ndata/file2.csv filter=lfs diff=lfs merge=lfs -text\n'
    expect(createGitAttributesFile(paths)).to.eq(gitAttributeFiles)
  })

  it('createLfsConfigFile works correctly ', () => {
    const lfsConfigUrl = `[remote "origin"]\n\tlfsurl = https://my-lfs-server`
    expect(createLfsConfigFile('https://my-lfs-server')).to.eq(lfsConfigUrl)
  })

  it('createLfsPointerFile works correctly ', () => {
    const resource = {
      path: 'data/file.csv',
      bytes: 1234,
      sha256: 'c3ac9f623869d3c883d6982e6a163bf09b3719d0ebf6af3171ac12c5bb4b3d50',
    }
    const lfsPointer = `version https://git-lfs.github.com/spec/v1\noid sha256:c3ac9f623869d3c883d6982e6a163bf09b3719d0ebf6af3171ac12c5bb4b3d50\nsize 1234\n`
    expect(createLfsPointerFile(resource)).to.eq(lfsPointer)
  })
})
