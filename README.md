# emu

A simple CLI to list, select, and launch Android emulators (AVDs) on macOS.

## Installation

From the project directory:

```sh
npm install -g .
```

## Usage

Just run:

```sh
emu
```

- You will see a list of available AVDs.
- Select one using your keyboard.
- The emulator will launch in a detached window.

## Requirements
- Node.js 14+ (Node 18+ recommended for best compatibility)
- Android SDK installed at `~/Library/Android/sdk` (default for macOS)

## Uninstall

```sh
npm uninstall -g emu
``` 