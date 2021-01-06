import { expect } from 'chai'
import { FilesystemStorage } from '../../src/backend/filesystem'
const fs = require('fs')
import path from 'path'
import { object } from 'assert-plus'
import { Author } from '../../src/types'

before(async () => {
  let basePath = path.join(process.cwd(), 'tmp')
  fs.mkdirSync(basePath)
})

// after(async () => {
//   let basePath = path.join(process.cwd(), 'tmp')
//   fs.rmdirSync(basePath, { recursive: true })
// })

function createTestDatapackage(name, ...props) {
  let object = {
    name: name,
    resources: [{ path: 'data/myresource.csv' }],
    ...props,
  }
  return object
}

describe('File System Backend', () => {
  it('Checks if a base directory tmp exists', () => {
    let storage = new FilesystemStorage()
    expect(storage._fs.path).to.eq(path.join(process.cwd(), 'tmp'))
  })

  it('Creates a new data package dir', () => {
    let storage = new FilesystemStorage()
    storage.create('France-bud-2020')
    let dirs = storage._fs.readSync()
    expect(dirs.name).to.eq('France-bud-2020')
  })

  it('Throws error on duplicate package creation', () => {
    let storage = new FilesystemStorage()
    storage.create('Japan-Budget-2000')
    expect(() => {
      storage.create('Japan-Budget-2000')
    }).to.throw(`EEXIST: file Japan-Budget-2000 already exists`)
  })

  it('Creates a new data package file in dir', () => {
    let storage = new FilesystemStorage()
    let name = 'Nigeria-Financial-2020'
    let metadata = createTestDatapackage(name)
    let author = new Author('Rising Odegua', 'rising@datopian.com')
    let message = 'This is my financial budget file'

    let objectInfo = storage.create(name, metadata, author, message)
    let filePath = path.join(process.cwd(), 'tmp', name, 'datapackage.json')
    let datapackage = JSON.parse(fs.readFileSync(filePath))
    expect(datapackage.name).to.eq(name)
    expect(datapackage.resources[0].path).to.eq('data/myresource.csv')
  })
})
