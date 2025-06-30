const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.transformer = {
  ...config.transformer,
};
config.resolver.alias = {
  crypto: 'react-native-quick-crypto',
  stream: 'readable-stream',
  buffer: '@craftzdog/react-native-buffer',
};
config.resolver.unstable_enablePackageExports = true;

// const {
//   wrapWithReanimatedMetroConfig,
// } = require('react-native-reanimated/metro-config');

module.exports = config;
