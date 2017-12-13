# Kameleon CLI (Command Line Interface)

## Installation

```bsh
$ npm install -g kameleon-cli
```

## Usage

```bsh
$ kameleon flash <file> -p <port>
```

* `<file>` : Path to the file to copy.
* `-p, --port <port>` : Port name where Kameleon is connected. (e.g. `-p /dev/tty.usbmodem1441`)

__Example__:

```bsh
$ kameleon flash index.js -p /dev/tty.usbmodem1441
```
