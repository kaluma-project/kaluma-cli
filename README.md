![license](https://img.shields.io/github/license/kaluma-project/kaluma-cli?style=flat-square)
![npm](https://img.shields.io/npm/v/@kaluma/cli.svg?style=flat-square)

# Kaluma CLI

Kaluma CLI is a command-line tool to program devices and boards running [Kaluma](https://kalumajs.org) runtime. It communicates with devices and boards via serial ports. Before using CLI, please ensure that your device or board is connected to a serial port.

- [Kaluma CLI](#kaluma-cli)
  - [Install](#install)
  - [Usage](#usage)
    - [`help` command](#help-command)
    - [`ports` command](#ports-command)
    - [`flash` command](#flash-command)
    - [`erase` command](#erase-command)
    - [`shell` command](#shell-command)
    - [`bundle` command](#bundle-command)
    - [`put` command](#put-command)
    - [`get` command](#get-command)
  - [License](#license)

## Install

Install CLI via `npm` globally.

```sh
npm install -g @kaluma/cli
```

If you failed to install, sometime you need to install by building from source as below (e.g. Apple M1, Raspberry Pi, or some Linux).

```sh
npm install -g @kaluma/cli --unsafe-perm --build-from-source
```

You can also install locally and run with `npx kaluma`.

```sh
npm install @kaluma/cli --save-dev
```

## Usage

### `help` command

Print help for commands and options.

```sh
kaluma help [command]
```

### `ports` command

List all available serial ports.

```sh
kaluma ports
```

### `flash` command

Flash code (.js file) to device.

> You can flash only a single .js file to Kaluma. If you have multiple .js files, you need to bundle them with `--bundle` option or `bundle` command.

```sh
kaluma flash <file> [--port <port>] [--bundle] [--no-load] [...]
```

- `<file>` : Path to the file to upload.
- `-p, --port <port>` option : Path to a serial port where device is connected. You can check the available serial ports using `ports` command. (e.g. `/dev/tty*` or `COM*`). Or, you can pass a port query with serial device's VID (Vendor ID) and PID (Product ID) (e.g. `@<vid>`, `@<vid>:<pid>`). (**Default:** `@2e8a` - This is VID of Respberry Pi, so automatically finds the port of Raspberry Pi Pico if you omit `--port` option)
- `--no-load` option : Skip code loading after flash. Use this option if you don't want to run the flashed code immediately.
- `-b, --bundle` option : Bundle .js code before flash. If you use this option, you can also use all options of [`bundle`](#bundle-command) command.

Examples:

```sh
# flash index.js to port: /dev/tty.usbmodem1441
kaluma flash index.js --port /dev/tty.usbmodem1441

# flash index.js to Raspberry Pi Pico (vid: 2e8a)
kaluma flash index.js

# flash index.js without load
kaluma flash index.js --port /dev/tty.usbmodem1441 --no-load

# bundle index.js and then flash
kaluma flash index.js --port /dev/tty.usbmodem1441 --bundle
```

### `erase` command

Erase code in device.

```sh
kaluma erase [--port <port>]
```

- `-p, --port <port>` option: See [`flash`](#flash-command) command.

Example:

```sh
# erase code in flash of port: /dev/tty.usbmodem1441
kaluma erase --port /dev/tty.usbmodem1441

# erase code in flash of Raspberry Pi Pico (vid: 2e8a)
kaluma erase
```

### `shell` command

> **THIS IS EXPERIMENTAL FEATURE** - It may not work in some shells (zsh in macOS). Works well in VSCode Terminal.

Shell connect (binds standard I/O to serial port).

```sh
kaluma shell [--port <port>]
```

- `-p, --port <port>` option: See [`flash`](#flash-command) command.

Example:

```sh
# shell connect to the port: /dev/tty.usbmodem1441
kaluma shell --port /dev/tty.usbmodem1441

# shell connect to Raspberry Pi Pico (vid: 2e8a)
kaluma shell
```

### `bundle` command

Bundle codes with webpack.

> Note that you can bundle and flash at once with `--bundle` option of [`flash`](#flash-command) command.

```sh
kaluma bundle <file> [--output <file>] [--minify] [--sourcemap]
```

- `<file>` : Path to the file to bundle.
- `-o, --output <file>` option : Output path of bundled code. (**Default:** `bundle.js`).
- `-m, --minify` option : Minify the bundled code. It can reduce the code size, but it may harden to debug.
- `-s, --sourcemap` option : Generates source-map file.

Example:

```sh
# Bundle 'index.js' into 'bundle.js'
kaluma bundle index.js

# Bundle 'index.js' into './dist/out.js'
kaluma bundle index.js --output ./dist/out.js

# Bundle 'index.js' into minified 'bundle.js'
kaluma bundle index.js --minify

# Bundle 'index.js' into 'bundle.js' with source-map file 'bundle.js.map'.
kaluma bundle index.js --sourcemap
```

### `put` command

Copy a file from host computer to device.

```sh
kaluma put <src> <dest> [--port <port>]
```

- `<src>` Path to a file to send in host computer.
- `<dest>` Path to the file received in device. Absolute file path is required.
- `-p, --port <port>` option: See [`flash`](#flash-command) command.

Examples:

```sh
# copy 'host.txt' [host] to '/dir/device.txt' [device]
kaluma put host.txt /dir/device.txt --port /dev/tty.usbmodem1441

# copy 'host.txt' [host] to '/dir/device.txt' [Raspberry Pi Pico]
kaluma put host.txt /dir/device.txt
```

### `get` command

Copy a file from device to host computer.

```sh
kaluma get <src> <dest> [--port <port>]
```

- `<src>` Path to a file in device. Absolute file path is required.
- `<dest>` Path to the file received in host computer.
- `-p, --port <port>` option: See [`flash`](#flash-command) command.

Examples:

```sh
# copy '/dir/device.txt` [device] to 'host.txt' [host]
kaluma get /dir/device.txt host.txt --port /dev/tty.usbmodem1441

# copy '/dir/device.txt` [Raspberry Pi Pico] to 'host.txt' [host]
kaluma get /dir/device.txt host.txt
```

## License

[Apache](LICENSE)
