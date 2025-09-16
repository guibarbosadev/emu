# emu

A CLI tool to list, select, and launch Android emulators and iOS simulators for mobile development.

## Features

- 🤖 **Android Support**: Launch Android Virtual Devices (AVDs) on any platform
- 🍎 **iOS Support**: Launch iOS Simulators (macOS only)

## Installation

```sh
npm install -g @guilhermebpereira/emu
```

## Usage

Simply run:

```sh
emu
```

The CLI will:
1. Present you with platform options (Android/iOS)
2. Show available emulators/simulators for your selected platform
3. Launch your selected device in a detached process

### Platform-Specific Behavior

#### Android
- Works on all platforms (Windows, macOS, Linux)
- Lists all available Android Virtual Devices (AVDs)
- Launches emulator in detached mode

#### iOS (macOS only)
- Only available on macOS
- Lists all available iOS Simulators with iOS versions
- Shows simulator states (Booted, Shutdown, etc.)
- Automatically installs Xcode Command Line Tools if missing

## Requirements

### General
- Node.js 14+ (Node 18+ recommended for best compatibility)

### Android Requirements
- Android SDK installed with emulator tools
- Common SDK locations are automatically detected:
  - `~/Library/Android/sdk` (macOS)
  - `~/Android/Sdk` (Linux)
  - `%LOCALAPPDATA%/Android/Sdk` (Windows)
- Or set `ANDROID_SDK_ROOT` or `ANDROID_HOME` environment variables

### iOS Requirements (macOS only)
- Xcode installed from the App Store
- Xcode Command Line Tools (will be installed automatically if missing)
- iOS Simulators (installed with Xcode)

## Troubleshooting

### Android Issues
- **"Could not find the Android emulator binary"**: Ensure Android SDK is installed and emulator tools are available
- **"No AVDs found"**: Create AVDs using Android Studio or `avdmanager`

### iOS Issues
- **iOS option disabled**: iOS simulators only work on macOS
- **"Xcode Simulator app not found"**: Install Xcode from the App Store
- **Command Line Tools missing**: The tool will automatically prompt to install them

## Uninstall

```sh
npm uninstall -g @guilhermebpereira/emu
``` 