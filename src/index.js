const inquirer = require("inquirer");
const chalk = require("chalk");
const { checkNodeVersion, isMacOS } = require("./utils/checks");
const { handleIOS } = require("./platforms/ios");
const { handleAndroid } = require("./platforms/android");

function selectPlatform() {
  const choices = [
    { name: "Android", value: "android" },
    { name: "iOS (macOS only)", value: "ios", disabled: !isMacOS },
  ];

  return inquirer
    .prompt([
      {
        type: "list",
        name: "platform",
        message: "Select platform:",
        choices: choices,
      },
    ])
    .then((answers) => answers.platform);
}

async function main() {
  try {
    // Check Node.js version first
    checkNodeVersion();

    // Select platform
    const platform = await selectPlatform();

    if (platform === "ios") {
      await handleIOS();
    } else {
      await handleAndroid();
    }
  } catch (err) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}

module.exports = {
  main,
  selectPlatform,
};
