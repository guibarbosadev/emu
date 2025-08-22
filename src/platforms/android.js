const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const inquirer = require("inquirer");

function findEmulatorPath() {
  // 1. Check environment variables
  const envVars = ["ANDROID_SDK_ROOT", "ANDROID_HOME"];
  for (const envVar of envVars) {
    const sdkPath = process.env[envVar];
    if (sdkPath) {
      const emulatorPath = path.join(
        sdkPath,
        "emulator",
        process.platform === "win32" ? "emulator.exe" : "emulator"
      );
      if (fs.existsSync(emulatorPath)) return emulatorPath;
    }
  }

  // 2. Check if emulator is in PATH
  try {
    const whichCmd = process.platform === "win32" ? "where" : "which";
    const emulatorPath = require("child_process")
      .execSync(`${whichCmd} emulator`)
      .toString()
      .split("\n")[0]
      .trim();
    if (fs.existsSync(emulatorPath)) return emulatorPath;
  } catch {}

  // 3. Fallback to common locations
  const home = os.homedir();
  const fallbackPaths = [
    path.join(home, "Library/Android/sdk/emulator/emulator"), // macOS
    path.join(home, "Android/Sdk/emulator/emulator"), // Linux
    path.join(
      process.env.LOCALAPPDATA || "",
      "Android",
      "Sdk",
      "emulator",
      "emulator.exe"
    ), // Windows
  ];
  for (const p of fallbackPaths) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(
    "Could not find the Android emulator binary. Please ensure it is installed and in your PATH or set ANDROID_SDK_ROOT."
  );
}

function listAvds(emulatorPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(emulatorPath, ["-list-avds"]);
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

function launchAvd(avdName, emulatorPath) {
  // Detach the emulator process
  const child = spawn(emulatorPath, ["@" + avdName], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  console.log(chalk.green(`Launched emulator: ${avdName}`));
}

async function handleAndroid() {
  const emulatorPath = findEmulatorPath();
  const avds = await listAvds(emulatorPath);
  
  if (!avds.length) {
    console.log(chalk.red("No AVDs found."));
    process.exit(1);
  }
  
  const avd = await selectAvd(avds);
  launchAvd(avd, emulatorPath);
}

module.exports = {
  handleAndroid,
  findEmulatorPath,
  listAvds,
  selectAvd,
  launchAvd,
};
