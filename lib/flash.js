const ymodem = require("../util/ymodem");

/**
 * Flash user code (.js)
 * @param {SerialPort} serial The serial port where device connected
 * @param {string} code Code to write
 * @returns {Promise}
 */
function flash(serial, code) {
  return new Promise((resolve, reject) => {
    // Turn to flash writing mode
    serial.write("\r");
    serial.write(".flash -w\r");
    setTimeout(() => {
      // Send the file via Ymodem protocol
      let buffer = Buffer.from(code, "utf8");
      ymodem.transfer(serial, "usercode", buffer, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    }, 500);
  });
}

module.exports = flash;
