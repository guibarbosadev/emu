#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");

const EMULATOR_PATH = path.join(
  os.homedir(),
  "Library/Android/sdk/emulator/emulator"
);

function listAvds() {
  return new Promise((resolve, reject) => {
    const proc = spawn(EMULATOR_PATH, ["-list-avds"]);
    let output = "";
    proc.stdout.on("data", (data) => {
      output += data.toString();
    });
    proc.stderr.on("data", (data) => {
      // ignore
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim().split(/\r?\n/).filter(Boolean));
      } else {
        reject(new Error("Failed to list AVDs"));
      }
    });
  });
}

function selectAvd(avds) {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "avd",
        message: "Select an AVD to launch:",
        choices: avds,
      },
    ])
    .then((answers) => answers.avd);
}

function launchAvd(avdName) {
  // Detach the emulator process
  const child = spawn(EMULATOR_PATH, ["@" + avdName], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  console.log(chalk.green(`Launched emulator: ${avdName}`));
}

async function main() {
  try {
    const avds = await listAvds();
    if (!avds.length) {
      console.log(chalk.red("No AVDs found."));
      process.exit(1);
    }
    const avd = await selectAvd(avds);
    launchAvd(avd);
  } catch (err) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}

main();
