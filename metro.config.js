const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

// Unify @firebase/app and @firebase/component to CJS so auth component registration
// is shared, while keeping package exports active for Expo SDK 58 modules (@expo/log-box, expo-router, etc.)
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@firebase/app') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@firebase/app/dist/index.cjs.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === '@firebase/component') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@firebase/component/dist/index.cjs.js'),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });

