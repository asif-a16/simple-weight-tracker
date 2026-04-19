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

// Resolve symlinks to real paths so pnpm's symlinked packages share one module ID.
config.resolver.unstable_enableSymlinks = true

// Force React imports to always resolve from the workspace root regardless of
// which package triggers the import. This prevents duplicate React instances
// in a pnpm monorepo where both root and app node_modules contain React symlinks.
const FORCE_ROOT = ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime']
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (FORCE_ROOT.includes(moduleName)) {
    return {
      filePath: require.resolve(moduleName, { paths: [workspaceRoot] }),
      type: 'sourceFile',
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
