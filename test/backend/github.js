// import { expect } from 'chai'
// import { GitHubStorage } from '../../src/backend/github'
// import { _createTestDatapackage, _repoExists } from '../common_test_functions'
// import dotenv from 'dotenv'
// import { Octokit } from '@octokit/rest'

// dotenv.config()

// const octo = new Octokit({
//   auth: process.env.PERSONAL_ACESSS_TOKEN,
// })

// const OBJECTID = "Italy-Financial-2020"

// after(async () => {
//   console.log('Performing Cleanup...Deleting test repositories')
//   try {
//     octo.repos.delete({
//       owner: 'gift-data',
//       repo: OBJECTID,
//     })
//     console.log('Cleanup completed successfully')
//   } catch (error) {
//     console.log(error)
//   }
// })


// describe('Github Backend', function () {
//   it('Creates a new repo on github', async function () {
//     let storage = new GitHubStorage({
//       token: process.env.PERSONAL_ACESSS_TOKEN,
//       org: 'gift-data',
//     })
//     let objectId = OBJECTID
//     let metadata = _createTestDatapackage(objectId)
//     let description = 'This is my financial budget file'

//     let objectInfo = await storage.create({ objectId, metadata, description })
//     expect(objectInfo.objectId).to.eq(objectId)
//     expect(objectInfo.description).to.eq(description)
//   })

//   it('Fetch an existing object by ID (ref: master)', async function () {
//     let storage = new GitHubStorage({
//       token: process.env.PERSONAL_ACESSS_TOKEN,
//       org: 'gift-data',
//     })

//     let file = await storage.fetch('croatia-budget-spending', 'master')
//     expect(await file.objectId).to.eq('croatia-budget-spending')
//     expect(await file.createdAt).to.eq('2020-09-01T18:36:49Z')
//   })

//   it('Fetch an existing object by ID (ref: main)', async function () {
//     let storage = new GitHubStorage({
//       token: process.env.PERSONAL_ACESSS_TOKEN,
//       org: 'gift-data',
//     })

//     let file = await storage.fetch(OBJECTID, 'main')
//     expect(await file.objectId).to.eq(OBJECTID)
//   })

//   it('Updates a data package', async function () {
//     let storage = new GitHubStorage({
//       token: process.env.PERSONAL_ACESSS_TOKEN,
//       org: 'gift-data',
//     })
//     let objectId = OBJECTID

//     let metadata = { description: 'A first update', revisionId: 'hmmm' }
//     let branch = 'main'
//     let file = await storage.update({ objectId, metadata, branch })

//     expect(file.metadata.description).to.eq('A first update')
//   })
// })
