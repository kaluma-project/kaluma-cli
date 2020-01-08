# Kameleon CLI (Command Line Interface)

## Installation

```
$ npm install -g kameleon-cli
```

## Usage

### Help

Print help for commands and options.

```
$ kameleon -h
```

### List available ports

List all available serial ports.

```
$ kameleon -l
```

### Write user code (.js)

 Write user code to the specified port where Kameleon board connected.

```
$ kameleon write <file> -p <port>
```

* `<file>` : Path to the file to copy.
* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```
$ kameleon write index.js -p /dev/tty.usbmodem1441
```

### Erase user code

Erase the user code written in the Kameleon board.

```
$ kameleon erase -p <port>
```

* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```
$ kameleon erase -p /dev/tty.usbmodem1441
```

### Firmware update

Update firmware.

```
$ kameleon update <firmware> -p <port>
```

* `<firmware>` : Path to the firmware to update.
* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```
$ kameleon update kameleon.bin -p /dev/tty.usbmodem1441
```
