// Web stub for expo-av
// expo-av uses registerWebModule from expo-modules-core which crashes on web export.
const AV = {
  Audio: {
    Sound: { createAsync: async () => ({ sound: { playAsync: () => {}, unloadAsync: () => {} } }) },
    setAudioModeAsync: async () => {},
    requestPermissionsAsync: async () => ({ granted: false }),
  },
  Video: {},
};
module.exports = AV;
module.exports.default = AV;
