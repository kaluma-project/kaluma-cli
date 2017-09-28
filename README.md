# Kameleon CLI (Command Line Interface)

## Installation

```
$ npm install -g kameleon-cli
```

## Usage

### File copy

```
$ kameleon cp <file> [dest] -p <port>
```

* `<file>` : Path to the file to copy.
* `[dest]` : _(Optional)_ Destination path in Kameleon. Default to `/usr`.
* `-p, --port <port>` : Port name where Kameleon is connected. (e.g. `-p /dev/cu.usbmodem1`)

__Example__:

```
$ kameleon cp index.js -p /dev/cu.usbmodem1
```
