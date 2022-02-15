![license](https://img.shields.io/github/license/kaluma-project/kaluma-cli?style=flat-square)
![npm](https://img.shields.io/npm/v/@kaluma/cli.svg?style=flat-square)

# Kaluma CLI

Kaluma CLI is a command-line tool to program devices and boards running Kaluma runtime. It communicates with devices and boards via serial ports. Before using CLI, please ensure that your device or board is connected to a serial port.

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

```sh
kaluma flash <file> --port <port> [--bundle] [--no-load] [...]
```

- `<file>` : Path to the file to upload.
- `-p, --port <port>` option : Path to a serial port where device is connected. You can check the available serial ports using `ports` command. (e.g. `/dev/tty.usbmodem*` or `COM*`)
- `--no-load` option : Skip code loading after flash. Use this option, if you don't want to run the flashed code immediately.
- `-b, --bundle` option : Bundle .js code before flash. If you use this option, you can also use all options of `bundle` command.

Examples:

```sh
# flash index.js
kaluma flash index.js --port /dev/tty.usbmodem1441

# flash index.js without load
kaluma flash index.js --port /dev/tty.usbmodem1441 --no-load

# bundle index.js and then flash
kaluma flash index.js --port /dev/tty.usbmodem1441 --bundle
```

### `erase` command

Erase code in device.

```sh
kaluma erase --port <port>
```

- `-p, --port <port>` option: See `flash` command.

Example:

```sh
kaluma erase --port /dev/tty.usbmodem1441
```

### `put` command

Copy a file from host computer to device.

```sh
kaluma put <src> <dest> --port <port>
```

- `<src>` Path to a file to send in host computer.
- `<dest>` Path to the file received in device.
- `-p, --port <port>` option: See `flash` command.

Examples:

```sh
# copy 'file.txt' [host] to '/file.txt' [device]
kaluma put file.txt /file.txt --port /dev/tty.usbmodem1441

# copy 'send.txt' [host] to '/dir1/recv.txt' [device]
kaluma put host.txt /dir1/recv.txt --port /dev/tty.usbmodem1441
```

### `get` command

Copy a file from device to host computer.

```sh
kaluma get <src> <dest> --port <port>
```

- `<src>` Path to a file in device.
- `<dest>` Path to the file received in host computer.
- `-p, --port <port>` option: See `flash` command.

Examples:

```sh
# copy '/dir1/device.txt` [device] to 'host.txt' [host]
kaluma get /dir1/device.txt host.txt --port /dev/tty.usbmodem1441
```

## License

[Apache](LICENSE)
