const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Watch the canonical website catalogue and its image metadata, without
// exposing server modules or requiring a second catalogue copy.
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../src/data')];
module.exports = config;
