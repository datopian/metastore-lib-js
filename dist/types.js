"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObjectInfo = exports.Author = void 0;

class Author {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

}

exports.Author = Author;

class ObjectInfo {
  constructor(objectId, revisionId, createdAt, author, description, metadata) {
    this.objectId = objectId;
    this.revisionId = revisionId;
    this.createdAt = createdAt;
    this.author = author;
    this.description = description;
    this.metadata = metadata;
  }

  getInfo() {
    const objectInfo = {
      objectId: this.objectId,
      revisionId: this.revisionId,
      createdAt: this.createdAt,
      author: this.author,
      description: this.description,
      metadata: this.metadata
    };
    return objectInfo;
  }

}

exports.ObjectInfo = ObjectInfo;