const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Resolve symlinks to their real paths so pnpm's symlinked packages
// (e.g. react appearing in both root and app node_modules) get the same
// module ID and are not bundled twice.
config.resolver.unstable_enableSymlinks = true

module.exports = config
