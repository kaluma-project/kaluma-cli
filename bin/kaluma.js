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

const optionDescriptions = {
  port: "port where device is connected. allows port path (/dev/tty*, COM*) or port query (@<vid>, @<vid>:<pid>). Raspberry Pi's VID is 2e8a",
  output: "output file path",
  minify: "minify bundled code",
  sourcemap: "generate sourcemap",
  bundle: "bundle file",
  noLoad: "skip code loading",
  shell: "shell connect",
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

function bind(serial, intercept) {
  process.stdin.setRawMode(true);
  process.stdin.on("data", (chunk) => {
    if (Array.isArray(intercept)) {
      let intercepted = false;
      intercept.forEach((i) => {
        if (chunk[0] === i.keycode) {
          i.callback();
          intercepted = true;
        }
      });
      if (!intercepted) {
        serial.write(chunk);
      }
    } else {
      serial.write(chunk);
    }
  });
  serial.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
}

async function findPort(portOrQuery, exit) {
  let port = null;
  const ports = await SerialPort.list();
  ports.forEach((p) => {
    if (p.vendorId) {
      p.vendorId = p.vendorId.toLowerCase();
    }
    if (p.productId) {
      p.productId = p.productId.toLowerCase();
    }
  });
  if (portOrQuery.startsWith("@")) {
    const query = portOrQuery.substr(1).toLowerCase();
    let vid = null;
    let pid = null;
    if (query.includes(":")) {
      const terms = query.split(":");
      vid = terms[0];
      pid = terms[1];
    } else {
      vid = query;
    }
    let result = ports.find(
      (p) => p.vendorId === vid && (pid === null || p.productId === pid)
    );
    if (result) {
      port = result.path;
    }
  } else {
    let result = ports.find((p) => p.path === portOrQuery);
    if (result) {
      port = result.path;
    }
  }
  if (exit && port === null) {
    console.log(`port not found: ${portOrQuery}`);
    process.exit(2);
  }
  return port;
}

program.version('-v, --version', 'output the version number');

program
  .command("shell")
  .description("shell connect (type Ctrl-D to exit)")
  .option("-p, --port <port>", optionDescriptions.port, "@2e8a")
  .action(async function (options) {
    // find port
    const port = await findPort(options.port, true);

    // shell connect
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Connected to ${port}`);
        console.log(colorName(`Type Ctrl-D to exit`));
        bind(serial, [
          {
            keycode: 0x04,
            callback: () => {
              process.exit(0);
            },
          },
        ]);
        serial.write("\r.hi\r");
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
          if (port.manufacturer) {
            s += ` [${port.manufacturer}]`;
          }
          if (port.vendorId && port.productId) {
            s +=
              " " +
              colors.gray(
                `(vid=${port.vendorId.toLowerCase()},pid=${port.productId.toLowerCase()})`
              );
          }
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
  .option("-p, --port <port>", optionDescriptions.port, "@2e8a")
  .option("--no-load", optionDescriptions.noLoad, false)
  .option("-b, --bundle", optionDescriptions.bundle, false)
  .option("-o, --output <file>", optionDescriptions.output, "bundle.js")
  .option("-m, --minify", optionDescriptions.minify, false)
  .option("-c, --sourcemap", optionDescriptions.sourcemap, false)
  .option("-s, --shell", optionDescriptions.shell, false)
  .action(async function (file, options) {
    let code = fs.readFileSync(file, "utf8");

    // find port
    const port = await findPort(options.port, true);

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
        console.log(`Connected to ${port}`);
        if (options.shell) {
          console.log(colorName(`Type Ctrl-D to exit`));
          bind(serial, [
            {
              keycode: 0x04,
              callback: () => {
                process.exit(0);
              },
            },
          ]);
          serial.write("\r.hi\r");
          await delay(100);
        }

        try {
          if (!options.shell) {
            process.stdout.write(colors.grey("flashing "));
          }
          const result = await flash(serial, code, () => {
            if (!options.shell) {
              process.stdout.write(colors.grey("."));
            }
          });
          if (!options.shell) {
            process.stdout.write("\r\n");
          }
          await delay(500);
          // load written code
          if (options.load) {
            serial.write("\r");
            serial.write(".load\r");
            await delay(500);
          }
          if (!options.shell && serial.isOpen) {
            serial.close();
          }
          if (!options.shell) {
            console.log(`${colorSize(result.writtenBytes)} flashed`);
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
  });

program
  .command("erase")
  .description("erase code in device")
  .option("-p, --port <port>", optionDescriptions.port, "@2e8a")
  .action(async function (options) {
    // find port
    const port = await findPort(options.port, true);

    // erase
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Connected to ${port}`);
        await erase(serial);
        console.log("erased.");
      }
    });
  });

program
  .command("bundle <file>")
  .description("bundle codes")
  .option("-o, --output <file>", optionDescriptions.output, "bundle.js")
  .option("-m, --minify", optionDescriptions.minify, false)
  .option("-c, --sourcemap", optionDescriptions.sourcemap, false)
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
  .option("-p, --port <port>", optionDescriptions.port, "@2e8a")
  .action(async function (src, dest, options) {
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

    // find port
    const port = await findPort(options.port, true);

    // put
    const serial = new SerialPort(port, serialOptions);
    serial.open(async (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Connected to ${port}`);
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
  .option("-p, --port <port>", optionDescriptions.port, "@2e8a")
  .action(async function (src, dest, options) {
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

      // find port
      const port = await findPort(options.port, true);

      // get
      const serial = new SerialPort(port, serialOptions);
      serial.open(async (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`Connected to ${port}`);
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
