# Kaluma CLI (Command Line Interface)

Kaluma CLI is a command-line tool for devices running Kaluma runtime.

## Install

```sh
npm install -g @kaluma/cli

# for Apple M1 or Raspberry Pi
sudo npm install -g @kaluma/cli --unsafe-perm --build-from-source
```

## Usage

### Help

Print help for commands and options.

```sh
kaluma help
```

### List available ports

List all available serial ports.

```sh
kaluma ports
```

### Flash code (.js) to device

Flash your code to the specified port.

```sh
kaluma flash <file> --port <port>
```

- `<file>` : Path to the file to upload.
- `-p, --port <port>` : Port where a device is connected. (e.g. `/dev/tty.usbmodem1441`)

**Example**:

```sh
kaluma flash index.js --port /dev/tty.usbmodem1441
```

### Erase code in device

Erase the user code stored in the Kaluma board.

```sh
kaluma erase --port <port>
```

- `-p, --port <port>` : Port where device is connected. (e.g. `/dev/tty.usbmodem1441`)

**Example**:

```sh
kaluma erase --port /dev/tty.usbmodem1441
```

### Put file to device

Copy a file from host computer to device.

```sh
kaluma put <src> <dest> --port <port>
```

- `<src>` A file path in host computer
- `<dest>` A file path in device
- `-p, --port <port>` : Port where device is connected. (e.g. `/dev/tty.usbmodem1441`)

**Example**:

Copy `data.txt` file in host computer to the path `/dir1/data.txt` in device.

```sh
kaluma put host.txt /dir1/device.txt --port /dev/tty.usbmodem1441
```

### Get file from device

Copy a file from device to host computer.

```sh
kaluma get <src> <dest> --port <port>
```

- `<src>` A file path in device
- `<dest>` A file path in host computer
- `-p, --port <port>` : Port where device is connected. (e.g. `/dev/tty.usbmodem1441`)

**Example**:

Copy `data.txt` file in host computer to the path `/dir1/data.txt` in the device.

```sh
kaluma get /dir1/device.txt ./host.txt --port /dev/tty.usbmodem1441
```
