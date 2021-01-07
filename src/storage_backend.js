
class StorageBackend{
    /**
     * Create a new data package
     * @param {*} objectId 
     * @param {*} metadata 
     * @param {*} author 
     * @param {*} message 
     */
    create(objectId, metadata, author, message){
        throw new Error("This method is not implemented for this backend")
    }

    /**
     * Fetch a data package, potentially at a given revision / tag
     * @param {*} objectId 
     * @param {*} revisionRef 
     */
    fetch(objectId, revisionRef){
        throw new Error("This method is not implemented for this backend")
    }

    /**
     * Update or partial update (patch) a data package
     * @param {*} objectId 
     * @param {*} metadata 
     * @param {*} author 
     * @param {*} partial 
     * @param {*} message 
     * @param {*} baseRevisionRef 
     */
    update(objectId, metadata, author, partial=false, message, baseRevisionRef){
        throw new Error("This method is not implemented for this backend")
    }
}

export {
    StorageBackend
}