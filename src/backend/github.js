/**
 * Github Storage Backend implementation.
 * This backend stores datasets as GitHub repositories, utilizing Git's built-in
 * revisions and tags. This implementation is based on GitHub's Web API, and will
 * not support other Git hosting services.
 */

import { StorageBackend } from '../storage_backend'
import dotenv from 'dotenv'
import { Octokit } from '@octokit/rest'

dotenv.config()

const DEFAULT_DESCRIPTION = `### This is a datapackage repository created using metastore-lib-js ==> https://github.com/datopian/metastore-lib-js`
const DEFAULT_BRANCH = 'main'
const DEFAULT_COMMIT_MESSAGE = 'Add Datapackage'

class GitHubStorage extends StorageBackend {
  constructor(config) {
    super()
    const baseConfig = {
      token: '',
      org: '',
      defaultAuthor: { name: '', email: '' },
      defaultBranch: DEFAULT_BRANCH,
      defaultCommitMessage: DEFAULT_COMMIT_MESSAGE,
      private: false,
      ...config,
    }
    this.token = process.env.PERSONAL_ACESSS_TOKEN || baseConfig.token
    this.org = baseConfig.org
    this.defaultAuthorName = baseConfig.defaultAuthor.name
    this.defaultAuthorEmail = baseConfig.defaultAuthor.email
    this.defaultBranch = baseConfig.defaultBranch
    this.defaultCommitMessage = baseConfig.defaultCommitMessage
    this.private = baseConfig.private
    this.repoNames = []
    this.octo = new Octokit({
      auth: this.token,
    })
  }

  /**
   * Create a new data package
   * @param {*} objectId
   * @param {*} metadata
   * @param {*} author
   * @param {*} message
   */
  async create(options = {}) {
    let { objectId, metadata, message, description, author } = options

    if (!objectId) {
      throw new Error('objectId name cannot be null')
    }

    message = message || DEFAULT_COMMIT_MESSAGE
    description = description || DEFAULT_DESCRIPTION
    metadata = metadata || {}

    const authorName = this.defaultAuthorName
    const authorEmail = this.defaultAuthorEmail
    author = author || { name: authorName, email: authorEmail }

    const org = this.org
    const name = objectId
    const revisionId = this._makeRevisionId()
    metadata.revision = 0
    metadata.revisionId = revisionId

    try {
      await this.octo.repos.createInOrg({ org, name, description })

      let metadataContent = this._prepareJsonFile(metadata)

      // let readMeContent = this._prepareTxtFile(
      //   description || DEFAULT_DESCRIPTION
      // )

      this._commitFileToGithub(
        objectId,
        'datapackage.json',
        message || this.defaultCommitMessage,
        metadataContent
      )

      const objectInfo = this._getObjectInfo(
        objectId,
        revisionId,
        author,
        description,
        metadata
      )
      return objectInfo
    } catch (error) {
      throw new Error(error.message)
    }
  }

  async fetch(objectId, branch) {
    let repoMeta = await this._getMetadataFromRepo(objectId)
    let metadata = await this._getDataPackageFromRepo(objectId)
    let lastCommit = await this._getLastCommit(objectId, branch)

    let author = {
      name: lastCommit.commit.committer.name,
      email: lastCommit.commit.committer.email,
    }
    let description = repoMeta.description
    let created = repoMeta.created_at
    let revisionId = metadata['revisionId'] || ''

    const objectInfo = this._getObjectInfo(
      objectId,
      revisionId,
      author,
      description,
      metadata,
      created
    )

    return objectInfo
  }

  async update(options = {}) {
    let { objectId, metadata, message, description, author, branch } = options
    if (!objectId) {
      throw new Error('objectId name cannot be null')
    }

    branch = branch || this.defaultBranch
    message = message || DEFAULT_COMMIT_MESSAGE
    description = description || DEFAULT_DESCRIPTION

    const existingMetadata = (await this.fetch(objectId, branch)).metadata
    const sha = (await this._getLastCommit(objectId, branch)).sha

    metadata = { ...existingMetadata, ...metadata }

    const authorName = this.defaultAuthorName
    const authorEmail = this.defaultAuthorEmail
    author = author || { name: authorName, email: authorEmail }
    const revisionId = this._makeRevisionId()

    // metadata.revision = metadata.revision += 1

    let metadataContent = this._prepareJsonFile(metadata)
    //perform update
    this._commitFileToGithub(
      objectId,
      'datapackage.json',
      message,
      metadataContent,
      sha,
      branch
    )

    const objectInfo = this._getObjectInfo(
      objectId,
      revisionId,
      author,
      message,
      metadata
    )
    return objectInfo
  }

  async _getLastCommit(objectId, branch) {
    const owner = this.org
    const repo = objectId

    let content = await this.octo.repos.getCommit({
      owner,
      repo,
      ref: branch,
    })
    return content.data
  }

  async _getDataPackageFromRepo(objectId) {
    const owner = this.org
    const repo = objectId
    let path = 'datapackage.json'

    let content = await this.octo.repos.getContent({
      owner,
      repo,
      path,
    })

    content = JSON.parse(
      Buffer.from(content.data.content, 'base64').toString()
    )
    return content
  }

  async _getMetadataFromRepo(objectId) {
    const owner = this.org
    const repo = objectId

    let content = await this.octo.repos.get({
      owner,
      repo,
    })
    return content.data
  }

  async _commitFileToGithub(objectId, path, message, content, sha, branch) {
    const org = this.org
    this.octo.repos.createOrUpdateFileContents({
      owner: org,
      repo: objectId,
      path: path,
      message: message,
      content: content,
      sha,
      branch,
    })
  }

  _prepareJsonFile(file) {
    return Buffer.from(JSON.stringify(file, null, 2)).toString('base64')
  }
  _prepareTxtFile(file) {
    return Buffer.from(file).toString('base64')
  }

  get _name() {
    return 'GitHubStorage'
  }
}

export { GitHubStorage }
