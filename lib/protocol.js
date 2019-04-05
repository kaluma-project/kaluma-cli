const sleep = require('system-sleep')
const ymodem = require('./ymodem')

/**
 * Write user code (.js)
 * @param {SerialPort} serial The serial port where device connected
 * @param {string} code Code to write
 * @param {function(err,result)} callback Called when complete
 */
function write (serial, code, callback) {
  serial.open(err => {
    if (err) {
      callback(new Error('Error: failed to open the port ' + serial.path))
    } else {
      // Turn to flash writing mode
      serial.write('\r')
      serial.write('.flash -w\r')
      sleep(500)

      // Send the file via Ymodem protocol
      var buffer = Buffer.from(code, 'utf8')
      ymodem.transfer(serial, 'usercode', buffer, (err, result) => {
        if (err) {
          callback(err)
        } else {
          setTimeout(() => {
            if (serial.isOpen) {
              serial.close()
            }
            callback(null, result)
            // load written code
            setTimeout(() => {
              send(serial, '.load', (err) => {
                if (err) {
                  callback(err)
                }
              })
            }, 100)
          }, 500)
        }
      })
    }
  })
}

/**
 * Erase user code
 * @param {SerialPort} serial The serial port where device connected
 * @param {function(err,result)} callback Called when complete
 */
function erase (serial, callback) {
  serial.open(err => {
    if (err) {
      callback(new Error('Error: failed to open the port ' + serial.path))
    } else {
      serial.write('\r')
      serial.write('.flash -e\r')
      sleep(500)
      serial.write('.clear\r')
      sleep(100)
      callback(null)
    }
  })
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
  serial.open(err => {
    if (err) {
      callback(new Error('Error: failed to open the port ' + serial.path))
    } else {
      ymodem.transfer(serial, 'firmware', buffer, (err, result) => {
        if (err) {
          callback(err)
        } else {
          setTimeout(() => {
            if (serial.isOpen) {
              serial.close()
            }
            callback(null, result)
          }, 500)
        }
      }, progressCallback)
    }
  })
}

/**
 * Send command
 * @param {SerialPort} serial The serial port where device connected
 * @param {string} command Command to send
 * @param {function} callback Callback called when finished
 */
function send (serial, command, callback) {
  serial.open(err => {
    if (err) {
      callback(new Error('Error: failed to open the port ' + serial.path))
    } else {
      serial.write('\r')
      serial.write(command + '\r')
      setTimeout(function () {
        if (serial.isOpen) {
          serial.close()
        }
        if (callback) {
          callback(null)
        }
      }, 500)
    }
  })
}

exports.write = write
exports.erase = erase
exports.update = update
exports.send = send
