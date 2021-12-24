#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const SerialPort = require("serialport");
const protocol = require("../lib/protocol");
const config = require("../package.json");
const put = require("../lib/put");
const get = require("../lib/get");
const eval = require('../lib/eval');
const { BufferedSerial } = require("../lib/buffered-serial");

const serialOptions = {
  autoOpen: false,
  baudRate: 115200,
};

program.version(config.version);

program
  .command("list")
  .description("list available serial ports")
  .action(function () {
    SerialPort.list()
      .then((ports) => {
        ports.forEach(function (port) {
          var s = port.path;
          if (port.manufacturer) s += ` [${port.manufacturer}]`;
          console.log(s);
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });

program
  .command("write <file>")
  .description("write code (.js file) to Kaluma board")
  .option("-p, --port <port>", "port where device is connected")
  .action(function (file, options) {
    var port = options.port;
    var code = fs.readFileSync(file, "utf8");
    console.log("Writing " + path.basename(file) + "...");
    const serial = new SerialPort(port, serialOptions);
    serial.open((err) => {
      if (err) {
        console.error(err);
      } else {
        protocol.write(serial, code, (err, result) => {
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
  .description("erase code in Kaluma board")
  .option("-p, --port <port>", "port where device is connected")
  .action(function (options) {
    var port = options.port;
    console.log("Erasing user code...");
    const serial = new SerialPort(port, serialOptions);
    serial.open((err) => {
      if (err) {
        console.error(err);
      } else {
        protocol.erase(serial, () => {
          console.log("Done.");
        });
      }
    });
  });

program
  .command("put <src> <dest>")
  .description("Copy a file from host to device")
  .option("-p, --port <port>", "port where device is connected")
  .action(function (src, dest, options) {
    const fullPath = path.resolve(src);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${src}`);
      return;
    }
    const filename = path.basename(fullPath);
    const destPath = path.join(dest, filename);
    const stat = fs.statSync(fullPath);
    const port = options.port;
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        const bs = new BufferedSerial(serial);
        await put(bs, fullPath, destPath, stat.size);
        serial.close();
      }
    });
  });

program
  .command("get <src> <dest>")
  .description("Copy a file from device to host")
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
