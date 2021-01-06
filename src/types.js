class Author {
  constructor(name, email) {
    this.name = name
    this.email = email
  }
}

class ObjectInfo {
  constructor(objectId, revisionId, created, author, description, metadata) {
    this.objectId = objectId
    this.revisionId = revisionId
    this.created = created
    this.author = author
    this.description = description
    this.metadata = metadata
  }

  getInfo() {
    const objectInfo = {
      objectId: this.objectId,
      revisionId: this.revisionId,
      created: this.created,
      author: this.author,
      description: this.description,
      metadata: this.metadata,
    }
    return objectInfo
  }
}

export { Author, ObjectInfo }
