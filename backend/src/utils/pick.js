function pick(source, allowedKeys) {
    const result = {}
    allowedKeys.forEach((key) => {
      if (source[key] !== undefined) {
        result[key] = source[key]
      }
    })
    return result
  }
module.exports = pick