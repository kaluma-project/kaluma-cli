/**
 * Erase user code
 * @param {SerialPort} serial The serial port where device connected
 * @param {function} callback Called when complete
 */
function erase(serial, callback) {
  serial.write("\r");
  serial.write(".flash -e\r");
  setTimeout(() => {
    callback();
  }, 500);
}

module.exports = erase;
