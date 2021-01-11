/**
 * Github Storage Backend implementation.
 * This backend stores datasets as GitHub repositories, utilizing Git's built-in
 * revisions and tags. This implementation is based on GitHub's Web API, and will
 * not support other Git hosting services.
 */

import { StorageBackend } from '../storage_backend'
import dotenv from 'dotenv'
import { Octokit } from '@octokit/rest'
import { GraphQLClient, gql } from 'graphql-request'

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
    return new Promise(async (resolve, reject) => {
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

        await this._commitFileToGithub(
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
        resolve(objectInfo)
      } catch (error) {
        reject(error.message)
      }
    })
  }

  async fetch(objectId, branch) {
    return new Promise(async (resolve, reject) => {
      this._getRepo(objectId, branch)
        .then((repo) => {
          let author = repo.author
          let metadata = repo.metadata
          let description = repo.description
          let createdAt = repo.createdAt
          let revisionId = metadata['revisionId'] || ''

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

  async update(options = {}) {
    return new Promise(async (resolve, reject)=>{
      let { objectId, metadata, message, description, author, branch } = options

      if (!objectId) {
        throw new Error('objectId name cannot be null')
      }

      branch = branch || this.defaultBranch
      message = message || DEFAULT_COMMIT_MESSAGE
      description = description || DEFAULT_DESCRIPTION

      const repo = await this._getRepo(objectId, branch)
      
      const existingMetadata = repo.metadata
      const sha = repo.sha
      const newMetadata = { ...existingMetadata, ...metadata }
      const authorName = this.defaultAuthorName
      const authorEmail = this.defaultAuthorEmail
      author = author || { name: authorName, email: authorEmail }
      const revisionId = this._makeRevisionId()

      newMetadata.revision = metadata["revision"] += 1

      let metadataContent = this._prepareJsonFile(newMetadata)
      //perform update
      this._commitFileToGithub(
        objectId,
        'datapackage.json',
        message,
        metadataContent,
        sha,
        branch
      ).then(()=>{
        const objectInfo = this._getObjectInfo(
          objectId,
          revisionId,
          author,
          message,
          metadata
        )
        resolve(objectInfo)
      }).catch((error)=>{
        reject(error)
      })

    })
  }

  
  _getRepo(objectId, branch) {
    return new Promise(async (resolve, reject) => {
      const owner = this.org
      const token = this.token
      const expBranch = `"${branch || 'main'}:"`

      const endpoint = 'https://api.github.com/graphql'

      const graphQLClient = new GraphQLClient(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const query = gql`
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
    `

      const variables = {
        owner: owner,
        name: objectId,
        branch: branch,
      }

      try {
        const repoObj = (await graphQLClient.request(query, variables))
          .repository

        repoObj.object.entries.forEach((entry) => {
          if (entry.name == 'datapackage.json') {
            let metadata = entry.object.text
            let sha = entry.object.oid

            try {
              metadata = JSON.parse(metadata)
            } catch (error) {
              console.log(error)
            }

            let repoInfo = {
              metadata: metadata,
              description: repoObj.description,
              createdAt: repoObj.createdAt,
              updatedAt: repoObj.updatedAt,
              sha: sha,
              author: repoObj.ref.target.history.edges[0].node.author,
            }

            // console.log(repoInfo);
            resolve(repoInfo)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  async _commitFileToGithub(objectId, path, message, content, sha, branch) {
    const org = this.org
    await this.octo.repos.createOrUpdateFileContents({
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
