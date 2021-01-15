"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isHexStr = isHexStr;

function isHexStr(value, chars = 40) {
  if (value.length != chars) {
    return false;
  }

  try {
    parseInt(value, 16);
  } catch (error) {
    return false;
  }

  return true;
}