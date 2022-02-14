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

program.version(config.version);

program
  .command("ports")
  .description("list available serial ports")
  .action(function () {
    SerialPort.list()
      .then((ports) => {
        ports.forEach(function (port) {
          let s = colors.cyan(port.path);
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
  .option("-p, --port <port>", "port where device is connected")
  .action(function (file, options) {
    let port = options.port;
    let code = fs.readFileSync(file, "utf8");
    console.log("Writing " + path.basename(file) + "...");
    const serial = new SerialPort(port, serialOptions);
    serial.open((err) => {
      if (err) {
        console.error(err);
      } else {
        flash(serial, code, (err, result) => {
          if (err) {
            console.error(err);
          } else {
            setTimeout(() => {
              // load written code
              serial.write("\r\r\r");
              serial.write(".load\r");
              setTimeout(() => {
                if (serial.isOpen) {
                  serial.close();
                }
                console.log(`Done. (${file} : ${result.writtenBytes} bytes)`);
              }, 1000);
            }, 1000);
          }
        });
      }
    });
  });

program
  .command("erase")
  .description("erase code in device")
  .option("-p, --port <port>", "port where device is connected")
  .action(function (options) {
    let port = options.port;
    console.log("Erasing user code...");
    const serial = new SerialPort(port, serialOptions);
    serial.open((err) => {
      if (err) {
        console.error(err);
      } else {
        erase(serial, () => {
          console.log("Done.");
        });
      }
    });
  });

program
  .command("bundle <file>")
  .description("bundle codes")
  .option("-o, --output <file>", "port where device is connected", "bundle.js")
  .option("-m, --minify", "minify bundled code", false)
  .option("-s, --sourcemap", "generate sourcemap", false)
  .action(function (file, options) {
    console.log("Bundling " + colors.grey(file));
    bundle(file, options, (err, stats) => {
      if (err) {
        console.log(err);
      } else {
        const json = stats.toJson();
        if (stats.hasErrors()) {
          console.log(stats.toString("errors-only"));
        } else {
          json.assets.forEach((asset) => {
            console.log(
              colors.cyan(`${asset.name}`) +
                " " +
                colors.yellow(`${filesize(parseInt(asset.size)).human()}`)
            );
          });
        }
      }
      console.log("Done.");
    });
  });

program
  .command("put <src> <dest>")
  .description("copy a file from host to device")
  .option("-p, --port <port>", "port where device is connected")
  .action(function (src, dest, options) {
    const srcPath = path.resolve(src);
    if (!fs.existsSync(srcPath)) {
      console.log(`File not found: ${src}`);
      return;
    }
    const stat = fs.statSync(srcPath);
    const port = options.port;
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        const bs = new BufferedSerial(serial);
        await put(bs, srcPath, dest, stat.size);
        serial.close();
      }
    });
  });

program
  .command("get <src> <dest>")
  .description("copy a file from device to host")
  .option("-p, --port <port>", "port where device is connected")
  .action(function (src, dest, options) {
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
        await get(bs, src, dest, fsize);
        serial.close();
      }
    });
  });

program.parse(process.argv);
