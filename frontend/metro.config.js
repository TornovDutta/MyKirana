const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve CommonJS build for Zustand to eliminate import.meta on web and mobile
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    try {
      return {
        filePath: require.resolve(moduleName),
        type: 'sourceFile',
      };
    } catch (e) {}
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
