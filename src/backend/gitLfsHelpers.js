/**
 * Git LFS Helpers used by all Git based backends that support Git-LFS
 * **/

import { isHexStr } from '../utils'
/**
  * Tell if a resource represents a POSIX-path (i.e. local file) resource

    >>> is_posix_path_resource({"path": "data/file.csv"})
    True

    >>> is_posix_path_resource({"path": "a file with some stange name"})
    True

    >>> is_posix_path_resource({"path": "http://example.com/my-resource"})
    False

    >>> is_posix_path_resource({"data": "some-inline-data"})
    False

    >>> is_posix_path_resource({"path": ["file1.csv", "file2.csv"]})
    False
    """
  * @param {*} resource 
  */
function isPosixPathResource(resource) {
  if (!(Object.keys(resource).includes("path"))) {
    return false
  }

  if (!(isString(resource['path']))) {
    return false
  }

  if (resource['path'].slice(0, 7) in { 'http://': '', 'https:/': '' }) {
    return false
  }

  return true
}

/**
 * Tell if a resource has the attributes required for an LFS-stored resource

    >>> has_lfs_attributes({"path": "data.csv", "bytes": 1234, "hash": "someshavalue"})
    True

    >>> has_lfs_attributes({"path": "data.csv", "size": 1234, "hash": "someshavalue"})
    False

    >>> has_lfs_attributes({"path": "data.csv", "hash": "someshavalue"})
    False

    >>> has_lfs_attributes({"path": "data.csv", "bytes": 1234})
    False

    >>> has_lfs_attributes({"path": "data.csv"})
    False
 * @param {*} resource 
 */
function hasLfsAttributes(resource) {
  if (!isString(resource['hash'])) {
    return false
  }

  if (!Number.isInteger(resource['bytes'])) {
    return false
  }

  return true
}

/**
 * Create the contents of a .gitattributes file as required by Git LFS
 * @param {*} trackFiles
 */
function createGitAttributesFile(trackFiles) {
  let lines = ''
  trackFiles.forEach((file) => {
    let line = `${file} filter=lfs diff=lfs merge=lfs -text\n`
    lines = lines.concat(line)
  })
  return lines
}

/**
 * Create contents of .lfsconfig file
 * @param {*} lfsServerUrl
 * @param {*} remote
 */
function createLfsConfigFile(lfsServerUrl, remote = 'origin') {
  return `[remote "${remote}"]\n\tlfsurl = ${lfsServerUrl}`
}

/**
 * Create contents for LFS pointer file
 * @param {*} resource
 */
function createLfsPointerFile(resource) {
  // if (!isHexStr(resource['hash'], 64)) {
  //   throw new Error(
  //     'Resource sha256 value does not seem to be a valid sha256 hex string'
  //   )
  // }
  return `version https://git-lfs.github.com/spec/v1\noid sha256:${resource['hash']}\nsize ${resource['bytes']}\n`
}

function isString(obj) {
  return Object.prototype.toString.call(obj) === '[object String]'
}

export {
  isPosixPathResource,
  hasLfsAttributes,
  createGitAttributesFile,
  createLfsConfigFile,
  createLfsPointerFile,
}
