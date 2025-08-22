#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const { spawn, execSync } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");

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

// iOS Functions
function checkXcodeCommandLineTools() {
  try {
    execSync("xcode-select --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function checkSimulatorApp() {
  const simulatorPath =
    "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app";
  return fs.existsSync(simulatorPath);
}

function installXcodeCommandLineTools() {
  console.log(
    chalk.yellow("Xcode Command Line Tools not found. Installing...")
  );
  console.log(
    chalk.yellow("This may take a while and require user interaction.")
  );

  try {
    execSync("xcode-select --install", { stdio: "inherit" });
    console.log(
      chalk.green("Xcode Command Line Tools installation initiated.")
    );
    console.log(
      chalk.yellow("Please complete the installation and run emu again.")
    );
    process.exit(0);
  } catch (error) {
    console.error(chalk.red("Failed to install Xcode Command Line Tools:"));
    console.error(
      chalk.red(
        "Please install manually from: https://developer.apple.com/xcode/"
      )
    );
    process.exit(1);
  }
}

function listIOSSimulators() {
  try {
    // Get devices with runtime information using JSON format
    const output = execSync("xcrun simctl list devices available -j", {
      encoding: "utf8",
    });
    const data = JSON.parse(output);
    const simulators = [];

    // Iterate through all runtimes
    for (const runtime of Object.keys(data.devices)) {
      const devices = data.devices[runtime];

      for (const device of devices) {
        // Extract iOS version from runtime string (e.g., "com.apple.CoreSimulator.SimRuntime.iOS-18-3")
        const runtimeMatch = runtime.match(/iOS-(\d+)-(\d+)/);
        const iosVersion = runtimeMatch
          ? `${runtimeMatch[1]}.${runtimeMatch[2]}`
          : "";

        const displayName = iosVersion
          ? `${device.name} (${iosVersion})`
          : device.name;

        simulators.push({
          name: device.name,
          id: device.udid,
          state: device.state,
          runtime: iosVersion,
          display: `${displayName} (${device.state})`,
        });
      }
    }

    return simulators;
  } catch (error) {
    throw new Error(
      "Failed to list iOS simulators. Make sure Xcode is properly installed."
    );
  }
}

function selectIOSSimulator(simulators) {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "simulator",
        message: "Select an iOS Simulator to launch:",
        choices: simulators.map((s) => ({ name: s.display, value: s })),
      },
    ])
    .then((answers) => answers.simulator);
}

function launchIOSSimulator(simulator) {
  try {
    // Launch the simulator
    execSync(`xcrun simctl boot "${simulator.id}"`, { stdio: "ignore" });

    // Open the Simulator app
    execSync("open -a Simulator", { stdio: "ignore" });

    console.log(chalk.green(`Launched iOS Simulator: ${simulator.name}`));
  } catch (error) {
    console.error(
      chalk.red(`Failed to launch iOS Simulator: ${error.message}`)
    );
    process.exit(1);
  }
}

// Android Functions (existing code)
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
    const emulatorPath = execSync(`${whichCmd} emulator`)
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

const EMULATOR_PATH = findEmulatorPath();

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
    // Check Node.js version first
    checkNodeVersion();

    // Select platform
    const platform = await selectPlatform();

    if (platform === "ios") {
      // Check iOS dependencies
      if (!checkXcodeCommandLineTools()) {
        installXcodeCommandLineTools();
        return;
      }

      if (!checkSimulatorApp()) {
        console.error(
          chalk.red(
            "Xcode Simulator app not found. Please install Xcode from the App Store."
          )
        );
        process.exit(1);
      }

      // List and select iOS simulator
      const simulators = listIOSSimulators();
      if (!simulators.length) {
        console.log(chalk.red("No iOS simulators found."));
        process.exit(1);
      }

      const simulator = await selectIOSSimulator(simulators);
      launchIOSSimulator(simulator);
    } else {
      // Android flow (existing code)
      const avds = await listAvds();
      if (!avds.length) {
        console.log(chalk.red("No AVDs found."));
        process.exit(1);
      }
      const avd = await selectAvd(avds);
      launchAvd(avd);
    }
  } catch (err) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}

main();
