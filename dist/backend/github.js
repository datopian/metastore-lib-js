"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GitHubStorage = void 0;

var _storage_backend = require("../storage_backend");

var _dotenv = _interopRequireDefault(require("dotenv"));

var _rest = require("@octokit/rest");

var _graphqlRequest = require("graphql-request");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_dotenv.default.config();

const DEFAULT_DESCRIPTION = `### This is a datapackage repository created using metastore-lib-js ==> https://github.com/datopian/metastore-lib-js`;
const DEFAULT_BRANCH = 'main';
const DEFAULT_COMMIT_MESSAGE = 'Add Datapackage';

class GitHubStorage extends _storage_backend.StorageBackend {
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
      defaultCommitMessage: DEFAULT_COMMIT_MESSAGE,
      private: false,
      ...config
    };
    this.token = process.env.PERSONAL_ACESSS_TOKEN || baseConfig.token;
    this.org = baseConfig.org;
    this.defaultAuthorName = baseConfig.defaultAuthor.name;
    this.defaultAuthorEmail = baseConfig.defaultAuthor.email;
    this.defaultBranch = baseConfig.defaultBranch;
    this.defaultCommitMessage = baseConfig.defaultCommitMessage;
    this.private = baseConfig.private;
    this.repoNames = [];
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
        author
      } = options;

      if (!objectId) {
        throw new Error('objectId name cannot be null');
      }

      message = message || DEFAULT_COMMIT_MESSAGE;
      description = description || DEFAULT_DESCRIPTION;
      metadata = metadata || {};
      const authorName = this.defaultAuthorName;
      const authorEmail = this.defaultAuthorEmail;
      author = author || {
        name: authorName,
        email: authorEmail
      };
      const org = this.org;
      const name = objectId;

      const revisionId = this._makeRevisionId();

      metadata.revision = 0;
      metadata.revisionId = revisionId;
      this.octo.repos.createInOrg({
        org,
        name,
        description,
        auto_init: true
      }).then(() => {
        let metadataContent = _prepareJsonFile(metadata);

        return _commitFileToGithub(objectId, 'datapackage.json', message || this.defaultCommitMessage, metadataContent, undefined, undefined, org, this.octo);
      }).then(() => {
        const objectInfo = this._getObjectInfo(objectId, revisionId, author, description, metadata);

        resolve(objectInfo);
      }).catch(error => {
        reject(error);
      });
    });
  }

  async fetch(objectId, branch) {
    return new Promise(async (resolve, reject) => {
      _getRepo(objectId, branch, this.org, this.token).then(repo => {
        let author = repo.author;
        let metadata = repo.metadata;
        let description = repo.description;
        let createdAt = repo.createdAt;
        let revisionId = metadata['revisionId'] || '';

        const objectInfo = this._getObjectInfo(objectId, revisionId, author, description, metadata, createdAt);

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
        description,
        author,
        branch
      } = options;

      if (!objectId) {
        throw new Error('objectId name cannot be null');
      }

      branch = branch || this.defaultBranch;
      message = message || DEFAULT_COMMIT_MESSAGE;
      description = description || DEFAULT_DESCRIPTION;
      let existingMetadata;
      let sha;
      let newMetadata;
      let revisionId;

      _getRepo(objectId, branch, this.org, this.token).then(async repo => {
        existingMetadata = repo.metadata;
        sha = repo.sha;
        newMetadata = { ...existingMetadata,
          ...metadata
        };
        const authorName = this.defaultAuthorName;
        const authorEmail = this.defaultAuthorEmail;
        author = author || {
          name: authorName,
          email: authorEmail
        };
        revisionId = this._makeRevisionId();
        newMetadata.revision = newMetadata['revision'] += 1;

        let metadataContent = _prepareJsonFile(newMetadata);

        return _commitFileToGithub(objectId, 'datapackage.json', message, metadataContent, sha, branch, this.org, this.octo);
      }).then(() => {
        const objectInfo = this._getObjectInfo(objectId, revisionId, author, message, metadata);

        resolve(objectInfo);
      }).catch(error => {
        reject(error);
      });
    });
  }

  get _name() {
    return 'GitHubStorage';
  }

}

exports.GitHubStorage = GitHubStorage;

async function _getRepo(objectId, branch, org, token) {
  return new Promise(async (resolve, reject) => {
    const owner = org;
    const expBranch = `"${branch || 'main'}:"`;
    const endpoint = 'https://api.github.com/graphql';
    const graphQLClient = new _graphqlRequest.GraphQLClient(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const query = (0, _graphqlRequest.gql)`
    query RepoFiles($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        description
        url
        createdAt
        description
        updatedAt
        resourcePath
        name
        ref(qualifiedName: "${branch}") {
          target {
            ... on Commit {
              history(first: 1) {
                edges {
                  node {
                    oid
                    message
                    author {
                      name
                      email
                      date
                    }
                  }
                }
              }
            }
          }
        }
        object(expression: ${expBranch}) {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  byteSize
                  oid
                  text
                }
              }
            }
          }
        }
      }
    }
  `;
    const variables = {
      owner: owner,
      name: objectId,
      branch: branch
    };
    graphQLClient.request(query, variables).then(data => {
      const repoObj = data.repository;
      repoObj.object.entries.forEach(entry => {
        if (entry.name == 'datapackage.json') {
          let metadata = entry.object.text;
          let sha = entry.object.oid;

          try {
            metadata = JSON.parse(metadata);
          } catch (error) {
            reject(error);
          }

          let repoInfo = {
            metadata: metadata,
            description: repoObj.description,
            createdAt: repoObj.createdAt,
            updatedAt: repoObj.updatedAt,
            sha: sha,
            author: repoObj.ref.target.history.edges[0].node.author
          };
          resolve(repoInfo);
        }
      });
    }).catch(error => {
      reject(error);
    });
  });
}

async function _commitFileToGithub(objectId, path, message, content, sha, branch, org, octo) {
  return new Promise((resolve, reject) => {
    octo.repos.createOrUpdateFileContents({
      owner: org,
      repo: objectId,
      path: path,
      message: message,
      content: content,
      sha,
      branch
    }).then(() => {
      resolve();
    }).catch(error => {
      reject(error);
    });
  });
}

function _prepareJsonFile(file) {
  return Buffer.from(JSON.stringify(file, null, 2)).toString('base64');
}

function _prepareTxtFile(file) {
  return Buffer.from(file).toString('base64');
}