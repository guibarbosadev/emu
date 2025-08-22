const { execSync } = require("child_process");
const fs = require("fs");
const chalk = require("chalk");
const inquirer = require("inquirer");

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

function listSimulators() {
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

function selectSimulator(simulators) {
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

function launchSimulator(simulator) {
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

async function handleIOS() {
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
  const simulators = listSimulators();
  if (!simulators.length) {
    console.log(chalk.red("No iOS simulators found."));
    process.exit(1);
  }

  const simulator = await selectSimulator(simulators);
  launchSimulator(simulator);
}

module.exports = {
  handleIOS,
  checkXcodeCommandLineTools,
  checkSimulatorApp,
  installXcodeCommandLineTools,
  listSimulators,
  selectSimulator,
  launchSimulator,
};
