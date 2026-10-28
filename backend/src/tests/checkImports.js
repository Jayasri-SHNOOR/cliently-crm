const fs = require('fs')
const path = require('path')

const SRC = path.resolve(__dirname, '..')
const REQUIRE_PATTERN = /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g

function listJsFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listJsFiles(fullPath))
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath)
    }
  }
  return files
}

function findFile(basePath) {
  const candidates = [basePath, `${basePath}.js`, path.join(basePath, 'index.js')]
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
}

function toRequirePath(fromDir, targetFile) {
  const relative = path.relative(fromDir, targetFile).split(path.sep).join('/').replace(/\.js$/, '').replace(/\/index$/, '')
  return relative.startsWith('.') ? relative : `./${relative}`
}

function suggestFix(file, request) {
  const stripped = request.replace(/^(\.\.?\/)+/, '')
  const fileDir = path.dirname(file)
  const places = [path.join(SRC, stripped), path.join(fileDir, '..', stripped), path.join(fileDir, stripped)]
  for (const place of places) {
    const found = findFile(place)
    if (found) {
      return toRequirePath(fileDir, found)
    }
  }
  return null
}

let broken = 0

for (const file of listJsFiles(SRC)) {
  const code = fs.readFileSync(file, 'utf8')
  for (const match of code.matchAll(REQUIRE_PATTERN)) {
    const request = match[1]
    if (!findFile(path.resolve(path.dirname(file), request))) {
      broken += 1
      const fix = suggestFix(file, request)
      const hint = fix ? `change to '${fix}'` : 'file not found anywhere in src'
      console.log(`${path.relative(SRC, file)}\n   require('${request}')  ->  ${hint}\n`)
    }
  }
}

console.log(broken === 0 ? 'All local requires are correct.' : `${broken} wrong path(s) found.`)