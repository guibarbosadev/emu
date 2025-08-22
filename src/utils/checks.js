const os = require("os");

// Check if we're on macOS for iOS support
const isMacOS = process.platform === "darwin";

function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
  if (majorVersion < 14) {
    throw new Error(
      `Node.js version ${nodeVersion} is not supported. Please use Node.js >= 14.`
    );
  }
}

function getPlatformInfo() {
  return {
    isMacOS,
    platform: process.platform,
    arch: process.arch,
  };
}

module.exports = {
  isMacOS,
  checkNodeVersion,
  getPlatformInfo,
};
