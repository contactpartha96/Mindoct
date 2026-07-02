// Web stub for expo-speech
// expo-speech uses registerWebModule from expo-modules-core which is not available on web.
// This stub is loaded instead on web platform via metro.config.js resolver.
const Speech = {
  speak: () => {},
  stop: () => {},
  isSpeakingAsync: async () => false,
  getAvailableVoicesAsync: async () => [],
};
module.exports = Speech;
module.exports.default = Speech;
