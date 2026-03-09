const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const sharedRoot = path.resolve(workspaceRoot, 'shared');
const expoRouterNodeModulesRoot = path.resolve(projectRoot, 'node_modules', 'expo-router', 'node_modules');
const reactNativeNodeModulesRoot = path.resolve(projectRoot, 'node_modules', 'react-native', 'node_modules');

const config = getDefaultConfig(projectRoot);

// Only watch the generated API package outside the app. Watching the whole
// workspace makes Metro traverse the root node_modules, which breaks on
// Windows if that tree contains WSL-created symlinks.
config.watchFolders = [sharedRoot];
config.resolver.nodeModulesPaths = [
  expoRouterNodeModulesRoot,
  path.resolve(projectRoot, 'node_modules'),
  reactNativeNodeModulesRoot,
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  '@expo/metro-runtime': path.resolve(
    expoRouterNodeModulesRoot,
    '@expo',
    'metro-runtime'
  ),
  '@react-native/virtualized-lists': path.resolve(
    reactNativeNodeModulesRoot,
    '@react-native',
    'virtualized-lists'
  ),
};

module.exports = withNativeWind(config, {
  input: './global.css',
});
