class Author {
  constructor(name, email) {
    this.name = name
    this.email = email
  }
}

class ObjectInfo {
  constructor(objectId, revision, created, author, description, metadata) {
    this.objectId = objectId
    this.revision = revision
    this.created = created
    this.author = author
    this.description = description
    this.metadata = metadata
  }

  getInfo() {
    const objectInfo = {
      objectId: this.objectId,
      revision: this.revision,
      created: this.created,
      author: this.author,
      description: this.description,
      metadata: this.metadata,
    }
    return objectInfo
  }
}

export { Author, ObjectInfo }
