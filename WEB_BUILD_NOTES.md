# Mindoct Web Build

## Why the web build is blank

The React Native + Expo project uses native modules (`@react-native-firebase`, `expo-speech`) that 
Metro bundler cannot resolve during `expo export -p web`. This causes a blank page.

## Solution: Use Expo's static web output with proper metro config

Create metro.config.js and web-specific module stubs.
