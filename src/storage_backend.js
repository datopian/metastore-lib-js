import { v4 as uuidv4 } from 'uuid'
import { ObjectInfo } from './types'

class StorageBackend {
  /**
   * Create a new data package
   * @param {*} objectId
   * @param {*} metadata
   * @param {*} author
   * @param {*} description
   */
  create(objectId, metadata, author, description) {
    throw new Error('This method is not implemented for this backend')
  }

  /**
   * Fetch a data package, potentially at a given revision / tag
   * @param {*} objectId
   * @param {*} revisionRef
   */
  fetch(objectId, revisionRef) {
    throw new Error('This method is not implemented for this backend')
  }

  /**
   * Update or partial update (patch) a data package
   * @param {*} objectId
   * @param {*} metadata
   * @param {*} author
   * @param {*} partial
   * @param {*} description
   * @param {*} baseRevisionRef
   */
  update(
    objectId,
    metadata,
    author,
    partial = false,
    description,
    baseRevisionRef
  ) {
    throw new Error('This method is not implemented for this backend')
  }

  _makeRevisionId() {
    return uuidv4()
  }

  _getObjectInfo(objectId, revision, author, description, metadata, created) {
    created = created || new Date()

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
}

export { StorageBackend }
