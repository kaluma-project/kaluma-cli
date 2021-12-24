const fs = require("fs");
const path = require("path");
const UglifyJS = require("uglify-js");

const FILE_GET_CODE = `
function (fn, fz, pz) {
  let fs = require('fs');
  let fd = fs.open(fn, 'r');
  while (fz > 0) {
    let pk = new Uint8Array(Math.min(fz, pz));
    fs.read(fd, pk);
    process.stdout.write(pk);
    while (true) {
      let c = process.stdin.read(1);
      if (c && c[0] === 0x06) {
        break;
      }
    }
    fz -= pk.length;
  };
  fs.close(fd);
}
`;

async function get(bs, srcPath, destPath, fileSize) {
  const packetSize = 128;

  // .echo off
  await bs.write("\r.echo off\r");
  await bs.wait(10);
  bs.clear();

  // run code
  const code = `(${FILE_GET_CODE})('${srcPath}', ${fileSize}, ${packetSize});`;
  const minified = UglifyJS.minify(code);
  await bs.write(`${minified.code}\r`);
  await bs.wait(200);

  // receive data
  process.stdout.write(`Copying ${srcPath} (device) to ${destPath} (host) `);
  let bytesRemained = fileSize;
  const fd = fs.openSync(path.resolve(destPath), "w");
  while (bytesRemained > 0) {
    let pk = await bs.readAwait(Math.min(bytesRemained, packetSize));
    let bytesWritten = fs.writeSync(fd, pk);
    process.stdout.write(".");
    await bs.write(new Uint8Array([0x06])); // ACK
    bytesRemained -= bytesWritten;
  }
  fs.closeSync(fd);
  process.stdout.write("\r\n");

  // .echo on
  await bs.write("\r.echo on\r");
}

module.exports = get;
