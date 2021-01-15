"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StorageBackend = void 0;

var _uuid = require("uuid");

var _types = require("./types");

class StorageBackend {
  create(objectId, metadata, author, description) {
    throw new Error('This method is not implemented for this backend');
  }

  fetch(objectId, revisionRef) {
    throw new Error('This method is not implemented for this backend');
  }

  update(objectId, metadata, author, partial = false, description, baseRevisionRef) {
    throw new Error('This method is not implemented for this backend');
  }

  _makeRevisionId() {
    return (0, _uuid.v4)();
  }

  _getObjectInfo(objectId, revision, author, description, metadata, createdAt) {
    createdAt = createdAt || new Date();
    let objectInfo = new _types.ObjectInfo(objectId, revision, createdAt, author, description, metadata).getInfo();
    return objectInfo;
  }

}

exports.StorageBackend = StorageBackend;