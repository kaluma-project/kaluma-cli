const fs = require("fs");
const path = require("path");
const UglifyJS = require("uglify-js");
const { BufferedSerial } = require("../util/buffered-serial");

const FILE_PUT_CODE = `
function (fn, fz, pz) {
  let fs = require('fs');
  let fd = fs.open(fn, 'w');
  while (fz > 0) {
    let pk = new Uint8Array(Math.min(fz, pz));
    let pi = 0;
    while (pi < pk.length) {
      let c = process.stdin.read(pk.length - pi);
      if (c) {
        pk.set(c, pi);
        pi += c.length;
      };
    };
    fs.write(fd, pk);
    fz -= pi;
    pi = 0;
    process.stdout.write(new Uint8Array([0x06]));
  };
  fs.close(fd);
}
`;

/**
 * Copy a file from host to device
 * @param {BufferedSerial} bs
 * @param {string} srcPath
 * @param {string} destPath
 * @param {string} fileSize
 * @param {function} packetCallback
 * @returns {Promise}
 */
async function put(bs, srcPath, destPath, fileSize, packetCallback) {
  const filename = path.basename(srcPath);
  const packetSize = 128;
  let bytesRemained = fileSize;

  // .echo off
  await bs.write("\r.echo off\r");
  await bs.wait(10);

  // run code
  const code = `(${FILE_PUT_CODE})('${destPath}', ${bytesRemained}, ${packetSize});`;
  const minified = UglifyJS.minify(code);
  await bs.write(`${minified.code}\r`);
  await bs.wait(200);
  bs.clear();

  // send data
  const fd = fs.openSync(srcPath, "r");
  while (bytesRemained > 0) {
    let pk = new Uint8Array(Math.min(bytesRemained, packetSize));
    let bytesRead = fs.readSync(fd, pk);
    bytesRemained -= bytesRead;
    await bs.write(pk);
    // wait ACK
    let ack = false;
    while (!ack) {
      await bs.wait(1);
      let c = bs.read(1);
      if (c && c[0] === 0x06) {
        ack = true;
      }
    }
    if (packetCallback) packetCallback(bytesRead, bytesRemained);
  }
  fs.closeSync(fd);

  // .echo on
  await bs.write("\r.echo on\r");
}

module.exports = put;
