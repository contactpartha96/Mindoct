const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// On web platform, replace native-only modules with web-safe stubs.
// This prevents the "registerWebModule is not a function" crash.
config.resolver.extraNodeModules = {
  // Firebase native modules -> no-op stubs
  '@react-native-firebase/app': path.resolve(__dirname, 'src/stubs/firebase-stub.js'),
  '@react-native-firebase/auth': path.resolve(__dirname, 'src/stubs/firebase-stub.js'),
  '@react-native-firebase/firestore': path.resolve(__dirname, 'src/stubs/firebase-stub.js'),
  // Expo native modules -> web-safe stubs
  'expo-speech': path.resolve(__dirname, 'src/stubs/expo-speech-stub.js'),
  'expo-av': path.resolve(__dirname, 'src/stubs/expo-av-stub.js'),
};

module.exports = config;
