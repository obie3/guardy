const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
    ...config.transformer,
    unstable_enablePackageExports: false,
  };
// const {
//   wrapWithReanimatedMetroConfig,
// } = require('react-native-reanimated/metro-config');


module.exports = config;
