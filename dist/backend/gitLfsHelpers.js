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
  if (!('path' in resource)) {
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
  if (!isString(resource['sha256'])) {
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
  if (!(0, _utils.isHexStr)(resource['sha256'], 64)) {
    throw new Error('Resource sha256 value does not seem to be a valid sha256 hex string');
  }

  return `version https://git-lfs.github.com/spec/v1\noid sha256:${resource['sha256']}\nsize ${resource['bytes']}\n`;
}

function isString(obj) {
  return Object.prototype.toString.call(obj) === '[object String]';
}