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


### Flash .js source code

```sh
$ kameleon flash <file> -p <port>
```

* `<file>` : Path to the file to copy.
* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```sh
$ kameleon flash index.js -p /dev/tty.usbmodem1441
```

### Firmware update


```sh
$ kameleon firmware <file> -p <port>
```

* `<file>` : Path to the firmware to update.
* `-p, --port <port>` : Port where device is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```sh
$ kameleon firmware kameleon.bin -p /dev/tty.usbmodem1441
```
