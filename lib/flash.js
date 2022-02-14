const ymodem = require("../util/ymodem");

/**
 * Flash user code (.js)
 * @param {SerialPort} serial The serial port where device connected
 * @param {string} code Code to write
 * @param {function(err,result)} callback Called when complete
 */
function flash(serial, code, callback) {
  // Turn to flash writing mode
  serial.write("\r");
  serial.write(".flash -w\r");
  setTimeout(() => {
    // Send the file via Ymodem protocol
    let buffer = Buffer.from(code, "utf8");
    ymodem.transfer(serial, "usercode", buffer, (err, result) => {
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    });
  }, 500);
}

module.exports = flash;
