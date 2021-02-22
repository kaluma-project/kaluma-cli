# Kaluma CLI (Command Line Interface)

Kaluma CLI is a command-line tool to write (or erase) a JavaScript file (.js) to a Kaluma-compatible boards.

## Install

```
$ npm install -g @kaluma/cli
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
$ kaluma -l
```

### Write code (.js)

Write the user code to the specified port where a Kaluma board connected.

```
$ kaluma write <file> -p <port>
```

* `<file>` : Path to the file to upload.
* `-p, --port <port>` : Port where a device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```
$ kaluma write index.js -p /dev/tty.usbmodem1441
```

### Erase code

Erase the user code stored in the Kaluma board.

```
$ kaluma erase -p <port>
```

* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```
$ kaluma erase -p /dev/tty.usbmodem1441
```
