"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMetastore = createMetastore;

var _filesystem = require("./backend/filesystem");

var _github = require("./backend/github");

function createMetastore(backendType = "file", config = {}) {
  if (backendType == "file") {
    return new _filesystem.FilesystemStorage();
  } else if (backendType == "github") {
    return new _github.GitHubStorage(config);
  } else {
    throw new Error("Backend not found.");
  }
}