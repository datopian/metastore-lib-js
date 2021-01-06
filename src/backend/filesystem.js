import { StorageBackend } from '../storage_backend'
import { ObjectInfo } from '../types'
import path from 'path'
const fs = require('fs')
import { v4 as uuidv4 } from 'uuid'

/**
 * Abstract filesystem based storage based on Node FileSystem
 * This storage backend is useful mostly in testing, especially with the.
 *  You most likely shouldn't be using it in production,
 *  unless you know exactly what you are doing. This backend does not guarantee
 *  consistency of storage, and using it in concurrent environments may cause issues.
 */
class FilesystemStorage extends StorageBackend {
  constructor(uri = '', defaultAuthor) {
    super()
    this.basePath = path.join(process.cwd(), 'tmp', uri)
    this._fs = fs.opendirSync(this.basePath)
    this._defaultAuthor = defaultAuthor
  }

  create(objectId, metadata = {}, author, message = '') {
    const packageDir = this._getObjectPath(objectId)
    try {
      fs.mkdirSync(packageDir)
    } catch (error) {
      throw new Error(`EEXIST: file ${objectId} already exists`)
    }
    const revisionId = this._makeRevisionId()
    metadata.revision = 0
    try {
      let filename = path.join(packageDir, 'datapackage.json')
      fs.writeFileSync(filename, JSON.stringify(metadata))
    } catch (error) {
      console.log(error)
    }
    const objectInfo = this._getObjectInfo(
      objectId,
      revisionId,
      author,
      message,
      metadata
    )
    return objectInfo
  }

  fetch(objectId) {
    const filePath = path.join(
      process.cwd(),
      'tmp',
      objectId,
      'datapackage.json'
    )
    let datapackage
    try {
      datapackage = JSON.parse(fs.readFileSync(filePath))
    } catch (error) {
      throw new Error('ENOENT: no such file or directory')
    }
    return datapackage
  }

  update(objectId, metadata = {}, author, partial = false, message = '') {
    let currentObject = this.fetch(objectId)
    const packageDir = this._getObjectPath(objectId)
    const revisionId = this._makeRevisionId()

    metadata = { ...currentObject, ...metadata }
    metadata.revision = metadata.revision += 1

    try {
      let filename = path.join(packageDir, 'datapackage.json')
      fs.writeFileSync(filename, JSON.stringify(metadata))
    } catch (error) {
      console.log(error)
    }

    const objectInfo = this._getObjectInfo(
      objectId,
      revisionId,
      author,
      message,
      metadata
    )
    return objectInfo
  }

  _getObjectInfo(objectId, revision, author, message, metadata) {
    const created = new Date()
    const description = message

    let objectInfo = new ObjectInfo(
      objectId,
      revision,
      created,
      author,
      description,
      metadata
    ).getInfo()

    return objectInfo
  }

  _getObjectPath(objectId) {
    return path.join(this._fs.path, objectId)
  }

  _makeRevisionId() {
    return uuidv4()
  }

  get _name() {
    return 'FileSystemStorage'
  }
}

export { FilesystemStorage }
