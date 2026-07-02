const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Custom resolver to force stubbing of native-only packages on web platform.
// This is necessary because default Metro resolver prioritizes node_modules over extraNodeModules.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'expo-speech') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'src/stubs/expo-speech-stub.js'),
      };
    }
    if (moduleName === 'expo-av') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'src/stubs/expo-av-stub.js'),
      };
    }
    if (moduleName.startsWith('@react-native-firebase/')) {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'src/stubs/firebase-stub.js'),
      };
    }
  }
  // Chain to the default Metro resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
