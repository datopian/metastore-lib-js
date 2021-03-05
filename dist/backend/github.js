"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GitHubStorage = void 0;

var _storageBackend = require("../storageBackend");

var _dotenv = _interopRequireDefault(require("dotenv"));

var _rest = require("@octokit/rest");

var _githubApiHelper = require("./githubApiHelper");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_dotenv.default.config();

const DEFAULT_DESCRIPTION = `### This is a datapackage repository created using metastore-lib-js ==> https://github.com/datopian/metastore-lib-js`;
const DEFAULT_BRANCH = 'main';
const DEFAULT_COMMIT_MESSAGE = 'Add Datapackage';
const DEFAULT_README = `# ¯\\_(ツ)_/¯\n'
                      'This is a datapackage repository created by '
                      '[\`metastore-lib-js\`](https://github.com/datopian/metastore-lib-js)'`;

class GitHubStorage extends _storageBackend.StorageBackend {
  constructor(config) {
    super();
    const baseConfig = {
      token: '',
      org: '',
      defaultAuthor: {
        name: '',
        email: ''
      },
      defaultBranch: DEFAULT_BRANCH,
      defaultReadMe: DEFAULT_README,
      private: false,
      lfsServerUrl: undefined,
      ...config
    };
    this.token = process.env.PERSONAL_ACESSS_TOKEN || baseConfig.token;
    this.org = baseConfig.org;
    this.defaultAuthorName = baseConfig.defaultAuthor.name;
    this.defaultAuthorEmail = baseConfig.defaultAuthor.email;
    this.private = baseConfig.private;
    this.defaultBranch = baseConfig.branch;
    this.lfsServerUrl = baseConfig.lfsServerUrl;
    this.octo = new _rest.Octokit({
      auth: this.token
    });
  }

  async create(options = {}) {
    return new Promise(async (resolve, reject) => {
      let {
        objectId,
        metadata,
        message,
        description,
        readMe
      } = options;

      if (!objectId) {
        throw new Error('objectId name cannot be null');
      }

      message = message || DEFAULT_COMMIT_MESSAGE;
      description = description || DEFAULT_DESCRIPTION;
      readMe = readMe || DEFAULT_README;
      metadata = metadata || {};

      const {
        org,
        repoName
      } = this._parseId(objectId);

      (0, _githubApiHelper.createRepo)(octo, org, repoName, description).then(() => {
        const filesToUpload = {
          metadata: metadata,
          readMe: readMe
        };
        return (0, _githubApiHelper.uploadToRepo)(octo, filesToUpload, org, repoName, this.defaultBranch, this.lfsServerUrl, message);
      }).then(() => {
        const authorName = this.defaultAuthorName;
        const authorEmail = this.defaultAuthorEmail;
        const author = {
          name: authorName,
          email: authorEmail
        };

        const objectInfo = this._getObjectInfo(objectId, author, description, metadata);

        resolve(objectInfo);
      }).catch(error => {
        reject(error);
      });
    });
  }

  async fetch(objectId, branch) {
    return new Promise(async (resolve, reject) => {
      (0, _githubApiHelper.getRepo)(objectId, branch, this.org, this.token).then(repo => {
        let {
          author,
          metadata,
          description,
          createdAt
        } = repo;

        const objectInfo = this._getObjectInfo(objectId, author, description, metadata, createdAt);

        resolve(objectInfo);
      }).catch(error => {
        reject(error);
      });
    });
  }

  async update(options = {}) {
    return new Promise(async (resolve, reject) => {
      let {
        objectId,
        metadata,
        message,
        branch,
        readMe
      } = options;

      if (!objectId) {
        throw new Error('objectId name cannot be null');
      }

      let {
        org,
        repoName
      } = this._parseId(objectId);

      let existingMetadata;
      let newMetadata;
      let author;
      message = message || DEFAULT_COMMIT_MESSAGE;
      (0, _githubApiHelper.getRepo)(objectId, branch, org, this.token).then(async repo => {
        existingMetadata = repo.metadata;
        newMetadata = { ...existingMetadata,
          ...metadata
        };
        const authorName = this.defaultAuthorName;
        const authorEmail = this.defaultAuthorEmail;
        author = {
          name: authorName,
          email: authorEmail
        };
        let filesToUpload;

        if (readMe) {
          filesToUpload = {
            metadata: newMetadata,
            readMe
          };
        } else {
          filesToUpload = {
            metadata: newMetadata
          };
        }

        return (0, _githubApiHelper.uploadToRepo)(this.octo, filesToUpload, org, repoName, this.defaultBranch, this.lfsServerUrl, message);
      }).then(() => {
        const objectInfo = this._getObjectInfo(objectId, author, message, metadata);

        resolve(objectInfo);
      }).catch(error => {
        reject(error);
      });
    });
  }

  _parseId(objectId) {
    if (objectId.includes('/')) {
      return objectId.split('/', 1);
    } else if (this.org) {
      return {
        org: this.org,
        repoName: objectId
      };
    } else {
      throw new Error(`Invalid package ID for the GitHub backend: ${objectId}`);
    }
  }

  async delete(options = {
    isResource: false
  }) {
    return new Promise(async (resolve, reject) => {
      const {
        objectId,
        path,
        branch,
        isResource
      } = options;

      if (!objectId) {
        throw new Error('objectId name cannot be null');
      }

      const {
        org,
        repoName
      } = this._parseId(objectId);

      (0, _githubApiHelper.getRepo)(objectId, branch, org, this.token).then(async repo => {
        if (isResource) {
          return (0, _githubApiHelper.deleteFile)(repoName, org, path, branch, this.octo, repo);
        } else {
          return (0, _githubApiHelper.deleteRepo)(repoName, org, this.octo);
        }
      }).then(status => {
        resolve(status);
      }).catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  get _name() {
    return 'GitHubStorage';
  }

}

exports.GitHubStorage = GitHubStorage;