import { expect } from 'chai'
import { _createTestDatapackage, _repoExists } from '../commonTestFunctions'
import { getFileBlobsAndPaths } from '../../src/backend/githubApiHelper'

const lfs_test_server = 'http://some-local-server'
const sampleMetadata = {
  name: 'Test Package',
  resources: [
    {
      path: 'data/myresource.csv',
      sha256:
        '0f1128046248f83dc9b9ab187e16fad0ff596128f1524d05a9a77c4ad932f10a',
      bytes: 1234,
    },
    {
      path: 'data/newResource.csv',
      sha256:
        '0f1128046248f83dc9b9ab187e16fad0ff596128f1524d05a9a77c4ad932f11b',
      bytes: 14,
    },
  ],
}

const files = {
  metadata: sampleMetadata,
  readMe: `'# ¯\\_(ツ)_/¯\n'
    'This is a datapackage repository created by '
    '[\`metastore-lib\`](https://github.com/datopian/metastore-lib)'`,
}

describe('LFS Helpers-getFileBlobsAndPaths', () => {
  it('Test getFileBlobsAndPaths for package with resource', () => {
    const blobs = getFileBlobsAndPaths(files, lfs_test_server)
    const expectedBlobOutput = [
      'ewogICJuYW1lIjogIlRlc3QgUGFja2FnZSIsCiAgInJlc291cmNlcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAiZGF0YS9teXJlc291cmNlLmNzdiIsCiAgICAgICJzaGEyNTYiOiAiMGYxMTI4MDQ2MjQ4ZjgzZGM5YjlhYjE4N2UxNmZhZDBmZjU5NjEyOGYxNTI0ZDA1YTlhNzdjNGFkOTMyZjEwYSIsCiAgICAgICJieXRlcyI6IDEyMzQKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImRhdGEvbmV3UmVzb3VyY2UuY3N2IiwKICAgICAgInNoYTI1NiI6ICIwZjExMjgwNDYyNDhmODNkYzliOWFiMTg3ZTE2ZmFkMGZmNTk2MTI4ZjE1MjRkMDVhOWE3N2M0YWQ5MzJmMTFiIiwKICAgICAgImJ5dGVzIjogMTQKICAgIH0KICBdCn0=',
      'ZGF0YS9teXJlc291cmNlLmNzdiBmaWx0ZXI9bGZzIGRpZmY9bGZzIG1lcmdlPWxmcyAtdGV4dApkYXRhL25ld1Jlc291cmNlLmNzdiBmaWx0ZXI9bGZzIGRpZmY9bGZzIG1lcmdlPWxmcyAtdGV4dAo=',
      'W3JlbW90ZSAib3JpZ2luIl0KCWxmc3VybCA9IGh0dHA6Ly9zb21lLWxvY2FsLXNlcnZlcg==',
      'JyMgwq9cXyjjg4QpXy/CrwonCiAgICAnVGhpcyBpcyBhIGRhdGFwYWNrYWdlIHJlcG9zaXRvcnkgY3JlYXRlZCBieSAnCiAgICAnW2BtZXRhc3RvcmUtbGliYF0oaHR0cHM6Ly9naXRodWIuY29tL2RhdG9waWFuL21ldGFzdG9yZS1saWIpJw==',
      'dmVyc2lvbiBodHRwczovL2dpdC1sZnMuZ2l0aHViLmNvbS9zcGVjL3YxCm9pZCBzaGEyNTY6MGYxMTI4MDQ2MjQ4ZjgzZGM5YjlhYjE4N2UxNmZhZDBmZjU5NjEyOGYxNTI0ZDA1YTlhNzdjNGFkOTMyZjEwYQpzaXplIDEyMzQK',
      'dmVyc2lvbiBodHRwczovL2dpdC1sZnMuZ2l0aHViLmNvbS9zcGVjL3YxCm9pZCBzaGEyNTY6MGYxMTI4MDQ2MjQ4ZjgzZGM5YjlhYjE4N2UxNmZhZDBmZjU5NjEyOGYxNTI0ZDA1YTlhNzdjNGFkOTMyZjExYgpzaXplIDE0Cg==',
    ]
    const expectedBlobPaths = [
      'datapackage.json',
      '.gitattributes',
      '.lfsconfig',
      'README.md',
      'data/myresource.csv',
      'data/newResource.csv',
    ]

    expect(blobs.filesAsUTF8).to.eql(expectedBlobOutput)
    expect(blobs.pathsForUTF8Files).to.eql(expectedBlobPaths)
  })

  it('Test getFileBlobsAndPaths for package without resource', () => {
    const files = {
      metadata: {
        name: 'Test Package',
        resources: [],
      },
      readMe: `'# ¯\\_(ツ)_/¯\n'
          'This is a datapackage repository created by '
          '[\`metastore-lib\`](https://github.com/datopian/metastore-lib)'`,
    }
    const blobs = getFileBlobsAndPaths(files, lfs_test_server)
    const expectedBlobOutput = [
      'ewogICJuYW1lIjogIlRlc3QgUGFja2FnZSIsCiAgInJlc291cmNlcyI6IFtdCn0=',
      'JyMgwq9cXyjjg4QpXy/CrwonCiAgICAgICAgICAnVGhpcyBpcyBhIGRhdGFwYWNrYWdlIHJlcG9zaXRvcnkgY3JlYXRlZCBieSAnCiAgICAgICAgICAnW2BtZXRhc3RvcmUtbGliYF0oaHR0cHM6Ly9naXRodWIuY29tL2RhdG9waWFuL21ldGFzdG9yZS1saWIpJw==',
    ]
    const expectedBlobPaths = ['datapackage.json', 'README.md']

    expect(blobs.filesAsUTF8).to.eql(expectedBlobOutput)
    expect(blobs.pathsForUTF8Files).to.eql(expectedBlobPaths)
  })
})
