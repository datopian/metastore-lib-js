/**
 * Check if a string is a hex-only string of exactly :param:`chars` characters length.

    This is useful to verify that a string contains a valid SHA, MD5 or UUID-like value.

    >>> is_hex_str('0f1128046248f83dc9b9ab187e16fad0ff596128f1524d05a9a77c4ad932f10a', 64)
    True

    >>> is_hex_str('0f1128046248f83dc9b9ab187e16fad0ff596128f1524d05a9a77c4ad932f10a', 32)
    False

    >>> is_hex_str('0f1128046248f83dc9b9ab187e1xfad0ff596128f1524d05a9a77c4ad932f10a', 64)
    False

    >>> is_hex_str('ef42bab1191da272f13935f78c401e3de0c11afb')
    True

    >>> is_hex_str('ef42bab1191da272f13935f78c401e3de0c11afb'.upper())
    True

    >>> is_hex_str('ef42bab1191da272f13935f78c401e3de0c11afb', 64)
    False

    >>> is_hex_str('ef42bab1191da272f13935.78c401e3de0c11afb')
    False
    """
 * @param {*} value 
 * @param {*} chars 
 * 
 */
function isHexStr(value, chars = 40) {
  if (value.length != chars) {
    return false
  }
  try {
    parseInt(value, 16)
  } catch (error) {
    return false
  }

  return true
}

export {isHexStr}