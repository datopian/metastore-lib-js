import { FilesystemStorage } from './backend/filesystem'
import { GitHubStorage } from './backend/github'

/**
 * Factory for storage backends. Defaults to filesystem backend
 * @param {*} backendType
 * @param {*} config
 */
function createMetastore(backendType = "file", config = {}) {
    if (backendType == "file"){
        return new FilesystemStorage()
    }else if (backendType == "github"){
        return new GitHubStorage(config)
    }else{
        throw new Error("Backend not found.")
    }
}

export {
    createMetastore
}