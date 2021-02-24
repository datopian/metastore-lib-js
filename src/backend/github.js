/**
 * Github Storage Backend implementation.
 * This backend stores datasets as GitHub repositories, utilizing Git's built-in
 * revisions and tags. This implementation is based on GitHub's Web API, and will
 * not support other Git hosting services.
 */

import { StorageBackend } from '../storageBackend'
import dotenv from 'dotenv'
import { Octokit } from '@octokit/rest'
import {
  createRepo,
  uploadToRepo,
  getRepo,
  deleteRepo,
  deleteFile,
} from './githubApiHelper'

dotenv.config()

const DEFAULT_DESCRIPTION = `### This is a datapackage repository created using metastore-lib-js ==> https://github.com/datopian/metastore-lib-js`
const DEFAULT_BRANCH = 'main'
const DEFAULT_COMMIT_MESSAGE = 'Add Datapackage'
const DEFAULT_README = `# ¯\\_(ツ)_/¯\n'
                      'This is a datapackage repository created by '
                      '[\`metastore-lib-js\`](https://github.com/datopian/metastore-lib-js)'`

class GitHubStorage extends StorageBackend {
  constructor(config) {
    super()
    const baseConfig = {
      token: '',
      org: '',
      defaultAuthor: { name: '', email: '' },
      defaultBranch: DEFAULT_BRANCH,
      defaultReadMe: DEFAULT_README,
      private: false,
      lfsServerUrl: undefined,
      ...config,
    }
    this.token = process.env.PERSONAL_ACESSS_TOKEN || baseConfig.token
    this.org = baseConfig.org
    this.defaultAuthorName = baseConfig.defaultAuthor.name
    this.defaultAuthorEmail = baseConfig.defaultAuthor.email
    this.private = baseConfig.private
    this.defaultBranch = baseConfig.branch
    this.lfsServerUrl = baseConfig.lfsServerUrl
    this.octo = new Octokit({
      auth: this.token,
    })
  }

  /**
   * Creates a new repository with specified file contents on a Github backend
   * @param {Object} options params from which repo is created, can be one of:
   * options = {objectId: Unique repository name,
   *            metadata: package information to save,
   *            message: commit message for files commited to the repo on github,
   *            description: A short description for repository on github,
   *            readMe: A markdown flavored text of the repository's README}
   */
  async create(options = {}) {
    return new Promise(async (resolve, reject) => {
      let { objectId, metadata, message, description, readMe } = options

      if (!objectId) {
        throw new Error('objectId name cannot be null')
      }

      message = message || DEFAULT_COMMIT_MESSAGE
      description = description || DEFAULT_DESCRIPTION
      readMe = readMe || DEFAULT_README
      metadata = metadata || {}

      const { org, repoName } = this._parseId(objectId)
      const revisionId = this._makeRevisionId()
      const octo = this.octo
      metadata.revision = 0
      metadata.revisionId = revisionId

      createRepo(octo, org, repoName, description)
        .then(() => {
          const filesToUpload = { metadata: metadata, readMe: readMe }
          return uploadToRepo(
            octo,
            filesToUpload,
            org,
            repoName,
            this.defaultBranch,
            this.lfsServerUrl,
            message
          )
        })
        .then(() => {
          const authorName = this.defaultAuthorName
          const authorEmail = this.defaultAuthorEmail
          const author = { name: authorName, email: authorEmail }

          const objectInfo = this._getObjectInfo(
            objectId,
            revisionId,
            author,
            description,
            metadata
          )
          resolve(objectInfo)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * Retrieves object information of an existing repository from Github
   * @param {*} objectId : Unique name of the repository
   * @param {*} branch : (Defaults-main), specific branch to look for repo content
   */
  async fetch(objectId, branch) {
    return new Promise(async (resolve, reject) => {
      getRepo(objectId, branch, this.org, this.token)
        .then((repo) => {
          let { author, metadata, description, createdAt } = repo
          const revisionId = metadata['revisionId'] || ''

          const objectInfo = this._getObjectInfo(
            objectId,
            revisionId,
            author,
            description,
            metadata,
            createdAt
          )

          resolve(objectInfo)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * Creates a new repository with specified file contents on a Github backend
   * @param {Object} options params from which repo is created, can be one of:
   * options = {objectId: Unique repository name,
   *            metadata: package information to save,
   *            message: commit message for files commited to the repo on github,
   *            branch: main or master, branch on github to look for content
   *            readMe: A markdown flavored text of the repository's README}
   */
  async update(options = {}) {
    return new Promise(async (resolve, reject) => {
      let { objectId, metadata, message, branch, readMe } = options

      if (!objectId) {
        throw new Error('objectId name cannot be null')
      }
      let { org, repoName } = this._parseId(objectId)
      let existingMetadata
      let newMetadata
      let revisionId
      let author

      message = message || DEFAULT_COMMIT_MESSAGE

      getRepo(objectId, branch, org, this.token)
        .then(async (repo) => {
          existingMetadata = repo.metadata
          newMetadata = { ...existingMetadata, ...metadata }
          const authorName = this.defaultAuthorName
          const authorEmail = this.defaultAuthorEmail
          author = { name: authorName, email: authorEmail }
          revisionId = this._makeRevisionId()
          newMetadata.revision =
            'revision' in existingMetadata
              ? (existingMetadata['revision'] += 1)
              : 0

          let filesToUpload
          if (readMe) {
            filesToUpload = { metadata: newMetadata, readMe }
          } else {
            filesToUpload = { metadata: newMetadata }
          }

          return uploadToRepo(
            this.octo,
            filesToUpload,
            org,
            repoName,
            this.defaultBranch,
            this.lfsServerUrl,
            message
          )
        })
        .then(() => {
          const objectInfo = this._getObjectInfo(
            objectId,
            revisionId,
            author,
            message,
            metadata
          )
          resolve(objectInfo)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * Verify that the package ID looks like something we can work with and parse
   * it into GitHub owner (user or org) and repo name
   * @param {*} objectId
   */
  _parseId(objectId) {
    if (objectId.includes('/')) {
      return objectId.split('/', 1)
    } else if (this.org) {
      return { org: this.org, repoName: objectId }
    } else {
      throw new Error(`Invalid package ID for the GitHub backend: ${objectId}`)
    }
  }

  /**
   * Deletes contents from a repository with specified path
   * @param {Object} options params from which repo is created, can be one of:
   * options = {objectId: Unique repository name,
   *            path: path of the file to delete, defaults to full repository,
   *            message: commit message for files commited to the repo on github,
   *            branch: main or master, branch on github to look for content
   *            isResource: If you're deleting a metadata resource or not
   */
  async delete(options = { isResource: false }) {
    return new Promise(async (resolve, reject) => {
      const { objectId, path, branch, isResource } = options
      if (!objectId) {
        throw new Error('objectId name cannot be null')
      }
      const { org, repoName } = this._parseId(objectId)

      getRepo(objectId, branch, org, this.token)
        .then(async (repo) => {
          if (isResource) {
            return deleteFile(
              repoName,
              org,
              path,
              branch,
              this.octo,
              repo
            )
          } else {
            return deleteRepo(
              repoName,
              org,
              this.octo,
            )
          }
        }).then((status) => {
          resolve(status)
        })
        .catch((err) => {
          console.log(err)
          reject(err)
        })
    })
  }

  get _name() {
    return 'GitHubStorage'
  }
}

export { GitHubStorage }
