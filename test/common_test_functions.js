async function _repoExists(repoName, org, octo) {
  const repos = await octo.repos.listForOrg({
    org: org,
  })

  const repoNames = repos.data.map((repo) => {
    return repo.name
  })

  if (repoNames.includes(repoName)) {
    return true
  } else {
    return false
  }
}

function _createTestDatapackage(name, ...props) {
  let object = {
    name: name,
    resources: [{ path: 'data/myresource.csv' }],
    ...props,
  }
  return object
}

export { _repoExists, _createTestDatapackage }
