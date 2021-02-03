"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPosixPathResource = isPosixPathResource;
exports.hasLfsAttributes = hasLfsAttributes;
exports.createGitAttributesFile = createGitAttributesFile;
exports.createLfsConfigFile = createLfsConfigFile;
exports.createLfsPointerFile = createLfsPointerFile;

var _utils = require("../utils");

function isPosixPathResource(resource) {
  if (!Object.keys(resource).includes("path")) {
    return false;
  }

  if (!isString(resource['path'])) {
    return false;
  }

  if (resource['path'].slice(0, 7) in {
    'http://': '',
    'https:/': ''
  }) {
    return false;
  }

  return true;
}

function hasLfsAttributes(resource) {
  if (!isString(resource['hash'])) {
    return false;
  }

  if (!Number.isInteger(resource['bytes'])) {
    return false;
  }

  return true;
}

function createGitAttributesFile(trackFiles) {
  let lines = '';
  trackFiles.forEach(file => {
    let line = `${file} filter=lfs diff=lfs merge=lfs -text\n`;
    lines = lines.concat(line);
  });
  return lines;
}

function createLfsConfigFile(lfsServerUrl, remote = 'origin') {
  return `[remote "${remote}"]\n\tlfsurl = ${lfsServerUrl}`;
}

function createLfsPointerFile(resource) {
  return `version https://git-lfs.github.com/spec/v1\noid sha256:${resource['hash']}\nsize ${resource['bytes']}\n`;
}

function isString(obj) {
  return Object.prototype.toString.call(obj) === '[object String]';
}