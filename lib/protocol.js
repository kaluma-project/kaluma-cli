const SerialPort = require('serialport')
const fs = require('fs')
const sleep = require('system-sleep')

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
 * Flash a file via the port
 *
 * @param {string} port - Port where device connected
 * @param {string} file - Full path of the origin (e.g. `/my/path/test.js`)
 * @param {function} callback - Called when copy is complete
 */
function flash (port, file, callback) {
  const serial = new SerialPort(port, options);
  serial.open(err => {
    if (err) {
      console.log("Error: failed to open the port " + port);
    } else {
      // wake up or clear command buffer
      serial.write('\r');
      // echo off
      serial.write(".echo off\r");
      // run .flash command in write mode
      serial.write(".flash -w\r");
      sleep(1000);
      // write hex data
      var hex = toHex(file);
      // split string into multiple segments which has 512 size
      var segments = hex.match(/.{1,512}/g);
      segments.forEach(function (seg) {
        console.log("write: " + (seg.length / 2) + " bytes");
        serial.write(seg);
        sleep(1000);
      });
      console.log("done.");
      // send ctrl+z (0x1a) and finish
      serial.write(new Buffer([0x1a]));
      // echo on
      serial.write(".echo on\r", function () {
        serial.close(function (err) {
          if (callback) {
            callback(err);
          }
        });
      });
    }
  });
}

exports.flash = flash;
