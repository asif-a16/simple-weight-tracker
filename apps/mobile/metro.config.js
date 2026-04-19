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

// pnpm (node-linker=hoisted) installs real copies of packages in both root
// and app node_modules. Metro treats each path as a distinct module, creating
// duplicate singletons that break the app:
//   react            → two schedulers  → "Invalid hook call"
//   react-native     → two ViewConfigRegistries → "RNSVGRect undefined"
//   react-native-svg → registers in one registry, Fabric reads the other
//
// Fix: force the EXACT main entry of each package to root so every importer
// shares one instance. We only redirect the bare package name — NOT subpaths
// like react-native/Libraries/… — so Metro's own platform-aware resolver
// still picks .android.js/.native.js variants for internal requires.
// pnpm hoists React as a real directory to root/node_modules/react, while
// app/node_modules/react is a symlink to the .pnpm store. unstable_enableSymlinks
// resolves the symlink but not the real directory, giving two distinct module IDs.
// Force all React imports to root's copy so there is exactly one instance.
const FORCE_ROOT = ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime']
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (FORCE_ROOT.includes(moduleName)) {
    try {
      return {
        filePath: require.resolve(moduleName, { paths: [workspaceRoot] }),
        type: 'sourceFile',
      }
    } catch {
      // fall through to default resolution
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
