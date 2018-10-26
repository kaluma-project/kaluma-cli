# Kameleon CLI (Command Line Interface)

## Installation

```bsh
$ npm install -g kameleon-cli
```

## Usage

### Help

```sh
$ kameleon -h
```

### Write user code (.js)

```sh
$ kameleon write <file> -p <port>
```

* `<file>` : Path to the file to copy.
* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```sh
$ kameleon write index.js -p /dev/tty.usbmodem1441
```

### Erase user code

```sh
$ kameleon erase -p <port>
```

* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```sh
$ kameleon erase -p /dev/tty.usbmodem1441
```

### Firmware update


```sh
$ kameleon update <firmware> -p <port>
```

* `<firmware>` : Path to the firmware to update.
* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```bsh
$ kameleon update kameleon.bin -p /dev/tty.usbmodem1441
```
