const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Provide web-safe stubs for native-only modules
config.resolver.extraNodeModules = {
  '@react-native-firebase/app': path.resolve(__dirname, 'src/stubs/firebase-stub.js'),
  '@react-native-firebase/auth': path.resolve(__dirname, 'src/stubs/firebase-stub.js'),
  '@react-native-firebase/firestore': path.resolve(__dirname, 'src/stubs/firebase-stub.js'),
};

module.exports = config;
