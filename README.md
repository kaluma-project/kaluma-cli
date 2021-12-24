# Kaluma CLI (Command Line Interface)

Kaluma CLI is a command-line tool to write (or erase) a JavaScript file (.js) to a Kaluma-compatible boards.

> You can only upload only a single .js file with CLI. If you want to upload multiple .js files, you need to bundle them into a single .js file using Webpack or other bundlers. Here is a [sample local project](https://github.com/kaluma-project/local-project-sample) showing how to setup a project in local with Webpack.

## Install

```sh
$ npm install -g @kaluma/cli

# for Apple M1 or Raspberry Pi
$ sudo npm install -g @kaluma/cli --unsafe-perm --build-from-source
```

## Usage

### Help

Print help for commands and options.

```
$ kaluma -h
```

### List available ports

List all available serial ports.

```
$ kaluma list
```

### Write code (.js)

Write the user code to the specified port where a Kaluma board connected.

```
$ kaluma write <file> -p <port>
```

- `<file>` : Path to the file to upload.
- `-p, --port <port>` : Port where a device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

**Example**:

```
$ kaluma write index.js -p /dev/tty.usbmodem1441
```

### Erase code

Erase the user code stored in the Kaluma board.

```
$ kaluma erase -p <port>
```

- `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

**Example**:

```
$ kaluma erase -p /dev/tty.usbmodem1441
```

### Put file

Copy a file from host computer to device.

```
$ kaluma put <src> <dest> -p <port>
```

- `<src>` A file path in host computer
- `<dest>` A file path in device
- `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

**Example**:

Copy `data.txt` file in host computer to the path `/dir1/data.txt` in device.

```
$ kaluma put host.txt /dir1/device.txt -p /dev/tty.usbmodem1441
```

### Put get

Copy a file from device to host computer.

```
$ kaluma get <src> <dest> -p <port>
```

- `<src>` A file path in device
- `<dest>` A file path in host computer
- `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

**Example**:

Copy `data.txt` file in host computer to the path `/dir1/data.txt` in the device.

```
$ kaluma get /dir1/device.txt ./host.txt -p /dev/tty.usbmodem1441
```
