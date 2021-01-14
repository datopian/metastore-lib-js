# metastore-lib-js
Library for storing (dataset) metadata, with versioning support and pluggable backends including GitHub. Original written in Python ([See Python version](https://github.com/datopian/metastore-lib)). Originally designed for datasets it can be used for storing any kind of metadata. Versioning (revisioning) support is built-in e.g. you can do: fetch(objectId) => metadata at that revision of the object

### Installation
```
npm install metastore-lib-js
```

### Requirements
Node version 12 and above

## Usage
The metastore-lib-js saves metadata (datapackage.json), to a selected backend. There are current;y two supported backend-Github and FileSystem. 
### Using Github Backend
The Github backend when selected, will save metadata to a specified github organisation. To use a Github backend as your storage, you need to be obtain a [personal access token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) from github. After obtaining a token, you can initialize a basic metastore storage as shown below:

```javascript
const metastore = require("metastore-lib-js");

const config = {
  token: "personal_access_token",
  org: "name_of_organisation_on_github",
  defaultAuthor: { name: "John Doe", email: "john@mail.com" },
  lfsServerUrl: "https://some-lfs-server"
};

const storage = metastore.createMetastore("github", config);
...
```

All supported config options are:
* token: (Required), personal access token for authenticating storage to Github
* org: (Required), Name of the organisation you want to save metadata to. 
* defaultAuthor: (Required), object of name, email pair. Details of  author making changes/commits
* defaultCommitMessage: (Optional), short github commit message when saving metadata
* lfsServerUrl: (Optional), The base URL of the Git-LFS server in use. Providing this will make the GitHub backend create Git LFS configuration and pointer files for resources where applicable

After initialization, the storage object can be used to create, fetch and update repositories as shown following sections:

### Creating a metadata
To create a metadata on github, you need to pass some metadata for the repository. Supported parameters are:

* objectId: (Required), unique name of the new repo on github
* metadata: (Required), metadata object to save, can also be called datapackage.json
* message: (Optional), commit message for github
* description: (Optional), short description of the repository
* author: (Required), author saving/commiting the file

```javascript

const objectId = "New-Financial-2020"; 
const metadata = { 
  name: "Test Financial File",
  resources: [
      { path: "data/myresource.csv",
        type: "text/csv" }
     ],
  description: "A financial dataset",
};

const author = { name: "Rising Odegua", email: "rising@datopian.com" } 
const description = "This is a financial file"; 

async function run() {
  let objectInfo = await storage.create({
    objectId,
    metadata,
    author,
    description,
  });
  console.log(objectInfo);
}
run();

```
### Updating a metadata
To update an existing metadata on github, you need to pass some metadata for the repository. Supported parameters are:

* objectId: (Required), unique name of an existing repo on github
* metadata: (Optional), metadata object to save, can also be called datapackage.json
* message: (Optional), commit message for github
* description: (Optional), short description of the repository
* author: (Required), author saving/commiting the file
* branch: (Optional), one of `main` or `master`. Defaults to `main`. Only specify `master` for old repos created before the Github master term removal (See Gotchas section).

```javascript

const objectId = "New-Financial-2020"; 
const metadata = { 
  name: "Updated Financial File",
  description: "A financial dataset about Paris",
}
const readMe = `## An updated Readme`

async function run() {
  let objectInfo = await storage.update({
    objectId,
    metadata,
    readMe
  });
  console.log(objectInfo);
}
run();

```

### Fetching a Metadata
To fetch or retrieve an existing metadata on Github, you can pass the objectId/repository name to the fetch method as shown below:

All suported parameters:
* objectId: (Required), unique name of an existing repo on github
* branch: (Defaults to `main`), can be one of `master` or `main` 
```javascript
async function run() {
  const objectInfo = await storage.fetch(objectId);
  console.log(objectInfo);
}
```

### GOTCHAS
* __Which github branch to use?__ : 
Due to the recent [removal](https://www.zdnet.com/article/github-to-replace-master-with-alternative-term-to-avoid-slavery-references/) of the "master" term on github, some repo may be retrieved under the "master" or "main" branch. Take note of this when calling functions like fetch or update. 

### Using FileSystem Backend
The File System backend when selected, will save metadata to a specified local folder on your computer called `tmp`. The filesystem should only be used for testing purpose and never in production. 

> Before initializing a File System, ensure you have a existing folder called `tmp` in your current working directory. 

```javascript
const metastore = require("metastore-lib-js");

let storage = metastore.createMetastore("file");
...
```

After initialization, the storage object can be used to create, fetch and update repositories as shown following sections:

### Creating a metadata
To create a metadata on a FileSystem, you need to pass some metadata for the repository. Supported parameters are:

* objectId: (Required), unique name of the new repo on github
* metadata: (Required), metadata object to save, can also be called datapackage.json
* author: (Required), author saving/commiting the file
* description: (Optional), short description of the repository

```javascript

let objectId = "New-Financial-2020";
let metadata = {
  name: "Test Financial File",
  resources: [{ path: "data/myresource.csv", mimetype: "text/csv" }],
  description: "I updated the file",
};
let author = { name: "Rising Odegua", email: "rising@datopian.com" };
let description = "This is a financial file";

async function run() {
  let objectInfo = await storage.create(
    objectId,
    metadata,
    author,
    description,
  );
  console.log(objectInfo);
}
run();

//outputs
{
  objectId: 'New-Financial-2020',
  revisionId: '311ab4aa-7309-4f38-b0c5-811a6fc7ace1',
  created: 2021-01-11T11:37:24.358Z,
  author: { name: 'Rising Odegua', email: 'rising@datopian.com' },
  description: 'This is a financial file',
  metadata: {
    name: 'Test Financial File',
    resources: [ [Object] ],
    description: 'I updated the file',
    revision: 0
  }
}
```
### Updating a metadata
To update an existing metadata on github, you need to pass some metadata for the repository. Supported parameters are:

* objectId: (Required), unique name of an existing repo on github
* metadata: (Optional), metadata object to save, can also be called datapackage.json
* description: (Optional), short description of the repository
* author: (Required), author saving/commiting the file


```javascript

let objectId = "New-Financial-2020";
let metadata = {
  name: "Financial File",
  resources: [{ path: "data/myresource.csv", mimetype: "text/csv" }],
  description: "I just updated this file in filesystem",
};
let author = { name: "Rising Odegua", email: "rising@datopian.com" };
let description = "This is a an updated file";

async function run() {
  let objectInfo = await storage.update(
    objectId,
    metadata,
    author,
    description,
  );
  console.log(objectInfo);
}
run();

//output
{
  objectId: 'New-Financial-2020',
  revisionId: '0ab7049e-1ab5-4281-968c-3973a7a1c0de',
  created: 2021-01-11T11:42:53.178Z,
  author: { name: 'Rising Odegua', email: 'rising@datopian.com' },
  description: '',
  metadata: {
    name: 'Financial File',
    resources: [ [Object] ],
    description: 'I just updated this file in filesystem',
    revision: 1
  }
}

```

### Fetching a Metadata
To fetch or retrieve an existing metadata in FileSystem, you can pass the objectId/repository name to the fetch method as shown below:

All suported parameters:
* objectId: (Required), unique name of an existing repo on github

```javascript
async function run() {
  let objectInfo = await storage.fetch(objectId);
  console.log(objectInfo);
}
```

## Developers

### Setup
1. Clone the repo:
```
git clone https://github.com/datopian/metastore-lib-js.git
```

2. Install dependencies: 
```
yarn
```

3. Run tests: 
```
yarn test
```
4. Do some dev work

Once done, make sure tests are passing. Then build distribution version of the app:
```
 yarn build
```
