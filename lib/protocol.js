const SerialPort = require('serialport')
const fs = require('fs')

const options = {
  autoOpen: false,
  baudRate: 115200
}

function toHex(file) {
  var data = fs.readFileSync(file, 'utf8');
  var buffer = new Buffer(data);
  var hex = buffer.toString('hex').toUpperCase();
  return hex;
}

/**
 * Copy a file to the port
 *
 * @param {string} port - Port where device connected
 * @param {string} file - Full path of the origin (e.g. `/my/path/test.js`)
 * @param {string} dest - Full path of destination (e.g. `/usr/index.js`)
 * @param {function} callback - Called when copy is complete
 */
function copy (port, file, dest, callback) {
  const serial = new SerialPort(port, options);
  serial.open(err => {
    if (err) {
      console.log("Error: failed to open the port " + port);
    } else {
      var hex = toHex(file);
      serial.write('\r\r\r'); // Wake up
      serial.write(new Buffer([0x1b])); // ESC
      serial.write("!w"); // write command
      serial.write(dest + "\n"); // destination path
      serial.write(hex);
      serial.write(new Buffer([0x04]), function () {
        serial.close(function (err) {
          if (callback) {
            callback(err);
          }
        });
      });
    }
  });
}

function list (port) {

}

function remove (port, file) {

}

exports.copy = copy;
exports.list = list;
exports.remove = remove;
