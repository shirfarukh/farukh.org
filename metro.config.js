/* global __dirname */
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "firebase/app": require.resolve("@firebase/app"),
  "firebase/auth": require.resolve("@firebase/auth"),
  "firebase/firestore": require.resolve("@firebase/firestore"),
  "firebase/functions": require.resolve("@firebase/functions"),
  "firebase/storage": require.resolve("@firebase/storage"),
  "firebase/database": require.resolve("@firebase/database"),
};

module.exports = withNativeWind(config, { input: "./global.css" });

