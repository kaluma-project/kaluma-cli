const ymodem = require('./ymodem')

/**
 * Write user code (.js)
 * @param {SerialPort} serial The serial port where device connected
 * @param {string} code Code to write
 * @param {function(err,result)} callback Called when complete
 */
function write (serial, code, callback) {
  // Turn to flash writing mode
  serial.write('\r')
  serial.write('.flash -w\r')
  setTimeout(() => {
    // Send the file via Ymodem protocol
    var buffer = Buffer.from(code, 'utf8')
    ymodem.transfer(serial, 'usercode', buffer, (err, result) => {
      if (err) {
        callback(err)
      } else {
        callback(null, result)
      }
    })
  }, 500)
}

/**
 * Erase user code
 * @param {SerialPort} serial The serial port where device connected
 * @param {function} callback Called when complete
 */
function erase (serial, callback) {
  serial.write('\r')
  serial.write('.flash -e\r')
  setTimeout(() => {
    serial.write('\r')
    serial.write('.clear\r')
    setTimeout(() => {
      callback()
    }, 200)
  }, 500)
}

/**
 * Update firmware.
 * Before calling this function, the board should be in firmware update mode. (`.firmup` command)
 * @param {SerialPort} serial The serial port where device connected
 * @param {Buffer} buffer Firmware binary data to write
 * @param {function(err,result)} callback Called when complete
 * @param {function} progressCallback
 */
function update (serial, buffer, callback, progressCallback) {
  ymodem.transfer(serial, 'firmware', buffer, (err, result) => {
    if (err) {
      callback(err)
    } else {
      callback(null, result)
    }
  }, progressCallback)
}

/**
 * Send command
 * @param {SerialPort} serial The serial port where device connected
 * @param {string} command Command to send
 * @param {function} callback Callback called when finished
 */
function send (serial, command, callback) {
  serial.write('\r')
  serial.write(command + '\r')
  setTimeout(() => {
    if (callback) {
      callback()
    }
  }, 0)
}

exports.write = write
exports.erase = erase
exports.update = update
exports.send = send
