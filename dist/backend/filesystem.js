"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FilesystemStorage = void 0;

var _storageBackend = require("../storageBackend");

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fs = require('fs');

class FilesystemStorage extends _storageBackend.StorageBackend {
  constructor(uri = '', defaultAuthor) {
    super();
    this.basePath = _path.default.join(process.cwd(), 'tmp', uri);
    this._fs = fs.opendirSync(this.basePath);
    this._defaultAuthor = defaultAuthor;
  }

  create(objectId, metadata = {}, author, message = '', description) {
    const packageDir = this._getObjectPath(objectId);

    try {
      fs.mkdirSync(packageDir);
    } catch (error) {
      throw new Error(`EEXIST: file ${objectId} already exists`);
    }

    const revisionId = this._makeRevisionId();

    try {
      let filename = _path.default.join(packageDir, 'datapackage.json');

      fs.writeFileSync(filename, JSON.stringify(metadata));
    } catch (error) {
      console.log(error);
    }

    const objectInfo = this._getObjectInfo(objectId, revisionId, author, message, metadata);

    return objectInfo;
  }

  fetch(objectId) {
    const filePath = _path.default.join(process.cwd(), 'tmp', objectId, 'datapackage.json');

    let datapackage;

    try {
      datapackage = JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      throw new Error('ENOENT: no such file or directory');
    }

    return datapackage;
  }

  update(objectId, metadata = {}, author, partial = false, message = '') {
    let currentObject = this.fetch(objectId);

    const packageDir = this._getObjectPath(objectId);

    const revisionId = this._makeRevisionId();

    metadata = { ...currentObject,
      ...metadata
    };

    try {
      let filename = _path.default.join(packageDir, 'datapackage.json');

      fs.writeFileSync(filename, JSON.stringify(metadata));
    } catch (error) {
      console.log(error);
    }

    const objectInfo = this._getObjectInfo(objectId, revisionId, author, message, metadata);

    return objectInfo;
  }

  _getObjectPath(objectId) {
    return _path.default.join(this._fs.path, objectId);
  }

  get _name() {
    return 'FileSystemStorage';
  }

}

exports.FilesystemStorage = FilesystemStorage;