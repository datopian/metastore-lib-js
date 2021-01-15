import { expect } from 'chai'
import { FilesystemStorage } from '../../src/backend/filesystem'
import { _createTestDatapackage } from '../commonTestFunctions'
const fs = require('fs')
import path from 'path'
import { Author } from '../../src/types'

before(async () => {
  let basePath = path.join(process.cwd(), 'tmp')
  fs.mkdirSync(basePath)
})

after(async () => {
  let basePath = path.join(process.cwd(), 'tmp')
  fs.rmdirSync(basePath, { recursive: true })
})


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
    let metadata = _createTestDatapackage(name)
    let author = new Author('Rising Odegua', 'rising@datopian.com')
    let message = 'This is my financial budget file'

    let objectInfo = storage.create(name, metadata, author, message)
    let filePath = path.join(process.cwd(), 'tmp', name, 'datapackage.json')
    let datapackage = JSON.parse(fs.readFileSync(filePath))
    expect(datapackage.name).to.eq(name)
    expect(datapackage.resources[0].path).to.eq('data/myresource.csv')
  })

  it('Fetchs a data package file in dir', () => {
    let storage = new FilesystemStorage()
    let name = 'India-Financial-2020'
    let metadata = _createTestDatapackage(name)
    let author = new Author('Rising Odegua', 'rising@datopian.com')
    let message = 'This is my financial budget file'

    storage.create(name, metadata, author, message)

    let datapackage = storage.fetch(name)
    expect(datapackage.name).to.eq(name)
    expect(datapackage.resources[0].path).to.eq('data/myresource.csv')
  })

  it('Throws error on fetch object not exist', () => {
    let storage = new FilesystemStorage()
    expect(() => {
      storage.fetch('Some-file')
    }).to.throw('ENOENT: no such file or directory')
  })

  it('Update an existing data package', () => {
    let storage = new FilesystemStorage()
    let name = 'India-Finance-2020'
    let metadata = _createTestDatapackage(name)
    let author = new Author('Rising Odegua', 'rising@datopian.com')
    let message = 'This is my financial budget file'

    storage.create(name, metadata, author, message)

    let newMetadata = _createTestDatapackage('India-New-2021')
    let newAuthor = new Author('Rising Odegua', 'rising@datopian.com')
    let newMessage = 'This is an updated file'

    storage.update(name, newMetadata, newAuthor, false, newMessage)

    let datapackage = storage.fetch(name)
    expect(datapackage.name).to.eq('India-New-2021')
    expect(datapackage.resources[0].path).to.eq('data/myresource.csv')
    expect(datapackage.revision).to.eq(1)
  })
})
