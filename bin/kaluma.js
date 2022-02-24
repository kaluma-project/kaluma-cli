#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const SerialPort = require("serialport");
const config = require("../package.json");
const colors = require("colors/safe");
const filesize = require("file-size");

const flash = require("../lib/flash");
const erase = require("../lib/erase");
const bundle = require("../lib/bundle");
const put = require("../lib/put");
const get = require("../lib/get");
const eval = require("../util/eval");
const { BufferedSerial } = require("../util/buffered-serial");

const serialOptions = {
  autoOpen: false,
  baudRate: 115200,
};

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function colorName(file) {
  return colors.cyan(file);
}

function colorSize(size) {
  return colors.yellow(`[${filesize(parseInt(size)).human()}]`);
}

program.version(config.version);

program
  .command("shell")
  .description("...")
  .requiredOption("-p, --port <port>", "port where device is connected")
  .action(async function (options) {
    let port = options.port;
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        serial.on("data", (chunk) => {
          // console.log("serial ===== ", chunk);
          process.stdout.write(chunk);
        });

        process.stdin.setRawMode(true);
        process.stdin.on("data", (chunk) => {
          // console.log("data = ", chunk);
          if (chunk[0] === 0x03) {
            // ctrl+c
            process.exit(0);
          } else {
            serial.write(chunk);
          }
        });
      }
    });
  });

program
  .command("ports")
  .description("list available serial ports")
  .action(function () {
    SerialPort.list()
      .then((ports) => {
        ports.forEach(function (port) {
          let s = colorName(port.path);
          if (port.manufacturer)
            s += " " + colors.gray(`[${port.manufacturer}]`);
          console.log(s);
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });

program
  .command("flash <file>")
  .description("flash code (.js file) to device")
  .requiredOption("-p, --port <port>", "port where device is connected")
  .option("--no-load", "skip code loading", false)
  .option("-b, --bundle", "bundle file", false)
  .option("-o, --output <file>", "port where device is connected", "bundle.js")
  .option("-m, --minify", "minify bundled code", false)
  .option("-s, --sourcemap", "generate sourcemap", false)
  .action(async function (file, options) {
    let port = options.port;
    let code = fs.readFileSync(file, "utf8");

    // bundle code if required
    if (options.bundle) {
      const stats = await bundle(file, Object.assign(options));
      if (stats.hasErrors()) {
        console.log(stats.toString("errors-only"));
      } else {
        const json = stats.toJson();
        json.assets.forEach((asset) => {
          console.log(`${colorName(asset.name)} ${colorSize(asset.size)}`);
          file = asset.name; // set file to bundle output
          code = fs.readFileSync(file, "utf8");
        });
      }
    }

    // flash code
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        try {
          process.stdout.write(colors.grey("flashing "));
          const result = await flash(serial, code, () => {
            process.stdout.write(colors.grey("."));
          });
          process.stdout.write("\r\n");
          await delay(500);
          // load written code
          if (options.load) {
            serial.write("\r");
            serial.write(".load\r");
            await delay(500);
          }
          if (serial.isOpen) {
            serial.close();
          }
          console.log(`${colorSize(result.writtenBytes)} flashed`);
        } catch (err) {
          console.log(err);
        }
      }
    });
  });

program
  .command("erase")
  .description("erase code in device")
  .requiredOption("-p, --port <port>", "port where device is connected")
  .action(async function (options) {
    let port = options.port;
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        await erase(serial);
        console.log("erased.");
      }
    });
  });

program
  .command("bundle <file>")
  .description("bundle codes")
  .option("-o, --output <file>", "port where device is connected", "bundle.js")
  .option("-m, --minify", "minify bundled code", false)
  .option("-s, --sourcemap", "generate sourcemap", false)
  .action(async function (file, options) {
    try {
      const stats = await bundle(file, options);
      if (stats.hasErrors()) {
        console.log(stats.toString("errors-only"));
      } else {
        const json = stats.toJson();
        json.assets.forEach((asset) => {
          console.log(`${colorName(asset.name)} ${colorSize(asset.size)}`);
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

program
  .command("put <src> <dest>")
  .description("copy a file from host to device")
  .requiredOption("-p, --port <port>", "port where device is connected")
  .action(function (src, dest, options) {
    const srcPath = path.resolve(src);
    if (!fs.existsSync(srcPath)) {
      console.log(`file not found: ${src}`);
      return;
    }
    if (!path.isAbsolute(dest) || path.basename(dest).length === 0) {
      console.log(`full path required: ${dest}`);
      return;
    }
    const stat = fs.statSync(srcPath);
    const fileSize = stat.size;
    const port = options.port;
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        const bs = new BufferedSerial(serial);
        process.stdout.write(colors.grey("copying "));
        await put(bs, srcPath, dest, fileSize, () => {
          process.stdout.write(colors.grey("."));
        });
        process.stdout.write("\r\n");
        serial.close();
        console.log(
          `[host] ${colorName(src)} --> [device] ${colorName(dest)} ${colorSize(
            fileSize
          )}`
        );
      }
    });
  });

program
  .command("get <src> <dest>")
  .description("copy a file from device to host")
  .requiredOption("-p, --port <port>", "port where device is connected")
  .action(function (src, dest, options) {
    try {
      const destPath = path.resolve(dest);
      if (fs.existsSync(destPath)) {
        console.log(`file already exists: ${dest}`);
        return;
      }
      if (!path.isAbsolute(src) || path.basename(src).length === 0) {
        console.log(`full path required: ${src}`);
        return;
      }
      const port = options.port;
      const serial = new SerialPort(port, serialOptions);
      serial.open(async (err) => {
        if (err) {
          console.error(err);
        } else {
          const bs = new BufferedSerial(serial);
          const fun = `
          function (fn) {
            let fs = require('fs');
            let stat = fs.stat(fn);
            return stat.size;
          }
          `;
          let fsize = await eval(bs, fun, src);
          process.stdout.write(colors.grey("copying "));
          await get(bs, src, dest, fsize, () => {
            process.stdout.write(colors.grey("."));
          });
          process.stdout.write("\r\n");
          serial.close();
          console.log(
            `[device] ${colorName(src)} --> [host] ${colorName(
              dest
            )} ${colorSize(fsize)}`
          );
        }
      });
    } catch (err) {
      console.log(err);
    }
  });

program.parse(process.argv);
