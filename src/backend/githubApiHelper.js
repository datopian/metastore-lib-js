import {
  createLfsPointerFile,
  createGitAttributesFile,
  createLfsConfigFile,
} from './gitLfsHelpers'

import { hasLfsAttributes, isPosixPathResource } from './gitLfsHelpers'
import { GraphQLClient, gql } from 'graphql-request'

/**
 * Creates a repository on Github org. If repo exists, do nothing.
 * @param {Octokit} octo: Authenticated Octokit Object
 * @param {String} org: Name of organisation or repo owner on Github
 * @param {String} name: Repository name, also called objectId in metastore-lib terms
 * @param {String} description: A short description of the repository on Github
 */
async function createRepo(octo, org, name, description) {
  try {
    await octo.repos.createInOrg({ org, name, description, auto_init: true })
  } catch (error) {
    const msg = `Repository creation failed.: {"resource":"Repository","code":"custom","field":"name","message":"name already exists on this account"}`
    if (!error.message == msg) {
      throw error
    }
    return
  }
}

/**
 * Create LFS pointer files and config files, if we need to
 * throws ValueError: If resources with conflicting file names are found
 * throws ValueError: If resources with invalid paths are found
 * @param {Object} metadata:  Metadata containing a resource object
 * @param {String} lfsServerUrl LFS server URL for constructing files
 */
export function createLfsFiles(metadata, lfsServerUrl) {
  if (!lfsServerUrl) {
    return []
  }

  let fileResources = metadata['resources'] || []

  fileResources = fileResources.filter((resource) => {
    return isPosixPathResource(resource) && hasLfsAttributes(resource)
  })

  if (fileResources.length == 0) {
    return []
  }

  let paths = new Set()
  fileResources.forEach((resoure) => {
    paths.add(resoure['path'])
  })

  if (paths.size != fileResources.length) {
    throw new Error(
      'Data package contains resources with conflicting file names'
    )
  }

  paths.forEach((path) => {
    if (path[0] == '/' || path.includes('../')) {
      throw new Error(
        `Resource path is absolute or contains parent dir references: ${path}`
      )
    }
  })

  const pointerFiles = fileResources.map((resource) => {
    return { pointer: createLfsPointerFile(resource), path: resource['path'] }
  })
  const gitattributes = createGitAttributesFile(paths)
  const lfsconfig = createLfsConfigFile(lfsServerUrl)

  return { pointerFiles, gitattributes, lfsconfig }
}

/**
 * Converts object in files to base64 blobs and gets their path
 * @param {Object} files
 * @param {String} lfsServerUrl
 */
function getFileBlobsAndPaths(files, lfsServerUrl) {
  let fileBlobsAndPaths = { filesAsUTF8: [], pathsForUTF8Files: [] }
  let lfsFiles = createLfsFiles(files['metadata'], lfsServerUrl)
  if (Array.isArray(lfsFiles) && lfsFiles.length == 0) {
    //no LFS files
    const metadata = getFileAsUTF8(files['metadata'], 'json')
    fileBlobsAndPaths.filesAsUTF8.push(metadata)
    fileBlobsAndPaths.pathsForUTF8Files.push('datapackage.json')

    if ('readMe' in files) {
      const readMe = getFileAsUTF8(files['readMe'], 'string')
      fileBlobsAndPaths.filesAsUTF8.push(readMe)
      fileBlobsAndPaths.pathsForUTF8Files.push('README.md')
    }
    return fileBlobsAndPaths
  } else {
    const metadata = getFileAsUTF8(files['metadata'], 'json')
    const gitattributes = getFileAsUTF8(lfsFiles['gitattributes'], 'string')
    const lfsconfig = getFileAsUTF8(lfsFiles['lfsconfig'], 'string')

    fileBlobsAndPaths.filesAsUTF8.push(metadata)
    fileBlobsAndPaths.filesAsUTF8.push(gitattributes)
    fileBlobsAndPaths.filesAsUTF8.push(lfsconfig)

    fileBlobsAndPaths.pathsForUTF8Files.push('datapackage.json')
    fileBlobsAndPaths.pathsForUTF8Files.push('.gitattributes')
    fileBlobsAndPaths.pathsForUTF8Files.push('.lfsconfig')

    if ('readMe' in files) {
      const readMe = getFileAsUTF8(files['readMe'], 'string')
      fileBlobsAndPaths.filesAsUTF8.push(readMe)
      fileBlobsAndPaths.pathsForUTF8Files.push('README.md')
    }

    lfsFiles['pointerFiles'].forEach((pFile) => {
      fileBlobsAndPaths.filesAsUTF8.push(
        getFileAsUTF8(pFile['pointer'], 'string')
      )
      fileBlobsAndPaths.pathsForUTF8Files.push(pFile['path'])
    })

    return fileBlobsAndPaths
  }
}

/**
 * Upload a list of files to specified Github repo.
 * @param {Octokit} octo Authenticated Octokit object
 * @param {Object} files An object with metadata and readMe properties: {metadata: {...}, readMe: ""}
 * @param {String} org Name of organisation or repo owner on Github
 * @param {String} repo Repository name, also called objectId in metastore-lib terms
 * @param {String} branch (Defaults: main) Name of the branch on github
 * @param {String} lfsServerUrl LFS server URL for constructing files
 * @param {String} commitMessage commit message on github
 */
async function uploadToRepo(
  octo,
  files,
  org,
  repo,
  branch = `main`,
  lfsServerUrl,
  commitMessage
) {
  const currentCommit = await getCurrentCommit(octo, org, repo, branch)

  let { filesAsUTF8, pathsForUTF8Files } = getFileBlobsAndPaths(
    files,
    lfsServerUrl
  )

  let filesBlobs = await Promise.all(
    filesAsUTF8.map(createBlobForFile(octo, org, repo))
  )
  const newTree = await createNewTree(
    octo,
    org,
    repo,
    filesBlobs,
    pathsForUTF8Files,
    currentCommit.treeSha
  )

  commitMessage = commitMessage || `Add new package`
  const newCommit = await createNewCommit(
    octo,
    org,
    repo,
    commitMessage,
    newTree.sha,
    currentCommit.commitSha
  )
  await setBranchToCommit(octo, org, repo, branch, newCommit.sha)
}

/**
 * Get recent commit from a Github repo
 * @param {*} octo
 * @param {*} org
 * @param {*} repo
 * @param {*} branch
 */
async function getCurrentCommit(octo, org, repo, branch = 'main') {
  const { data: refData } = await octo.git.getRef({
    owner: org,
    repo,
    ref: `heads/${branch}`,
  })
  const commitSha = refData.object.sha
  const { data: commitData } = await octo.git.getCommit({
    owner: org,
    repo,
    commit_sha: commitSha,
  })
  return {
    commitSha,
    treeSha: commitData.tree.sha,
  }
}

/**
 * Converts a file to base64 for Github blob upload
 * @param {*} file
 * @param {*} type (string || json)
 */
function getFileAsUTF8(file, type) {
  if (type == 'json') {
    return Buffer.from(JSON.stringify(file, null, 2)).toString('base64')
  } else if (type == 'string') {
    return Buffer.from(file).toString('base64')
  } else {
    throw new Error('Content type not supported')
  }
}

/**
 * Create a blob from a base64 file content
 * @param {*} octo
 * @param {*} org
 * @param {*} repo
 */
const createBlobForFile = (octo, org, repo) => async (content) => {
  const blobData = await octo.git.createBlob({
    owner: org,
    repo,
    content,
    encoding: 'base64',
  })
  return blobData.data
}

/**
 * Creates a Github commit tree for multiple files
 * @param {*} octo
 * @param {*} owner
 * @param {*} repo
 * @param {*} blobs
 * @param {*} paths
 * @param {*} parentTreeSha
 */
async function createNewTree(octo, owner, repo, blobs, paths, parentTreeSha) {
  const tree = blobs.map(({ sha }, index) => ({
    path: paths[index],
    mode: `100644`,
    type: `blob`,
    sha,
  }))
  const { data } = await octo.git.createTree({
    owner,
    repo,
    tree,
    base_tree: parentTreeSha,
  })
  return data
}

/**
 * Creates a new commit on a Github repo
 * @param {*} octo
 * @param {*} org
 * @param {*} repo
 * @param {*} message
 * @param {*} currentTreeSha
 * @param {*} currentCommitSha
 */
async function createNewCommit(
  octo,
  org,
  repo,
  message,
  currentTreeSha,
  currentCommitSha
) {
  return (
    await octo.git.createCommit({
      owner: org,
      repo,
      message,
      tree: currentTreeSha,
      parents: [currentCommitSha],
    })
  ).data
}

/**
 * Set the branch for a new commit
 * @param {*} octo
 * @param {*} org
 * @param {*} repo
 * @param {*} branch
 * @param {*} commitSha
 */
async function setBranchToCommit(octo, org, repo, branch = `main`, commitSha) {
  await octo.git.updateRef({
    owner: org,
    repo,
    ref: `heads/${branch}`,
    sha: commitSha,
  })
}

/**
 * Gets a specified repository by name from Github
 * @param {*} objectId
 * @param {*} branch
 * @param {*} org
 * @param {*} token
 */
async function getRepo(objectId, branch, org, token) {
  return new Promise(async (resolve, reject) => {
    const owner = org
    branch = branch || 'main'
    const expBranch = `"${branch}:"`
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

    graphQLClient
      .request(query, variables)
      .then((data) => {
        const repoObj = data.repository
        repoObj.object.entries.forEach((entry) => {
          if (entry.name == 'datapackage.json') {
            let metadata = entry.object.text
            let sha = entry.object.oid

            try {
              metadata = JSON.parse(metadata)
            } catch (error) {
              reject(error)
            }

            let repoInfo = {
              metadata: metadata,
              description: repoObj.description,
              createdAt: repoObj.createdAt,
              updatedAt: repoObj.updatedAt,
              sha: sha,
              author: repoObj.ref.target.history.edges[0].node.author,
            }

            resolve(repoInfo)
          }
        })
      })
      .catch((error) => {
        reject(error)
      })
  })
}

export { createRepo, uploadToRepo, getRepo, getFileBlobsAndPaths }
