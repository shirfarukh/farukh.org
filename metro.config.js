const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Ensure a single module instance of @firebase/app and @firebase/component
// so component registration (such as 'auth') is universally shared.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@firebase/app': path.resolve(__dirname, 'node_modules/@firebase/app/dist/index.cjs.js'),
  '@firebase/component': path.resolve(__dirname, 'node_modules/@firebase/component/dist/index.cjs.js'),
};

module.exports = withNativeWind(config, { input: "./global.css" });

