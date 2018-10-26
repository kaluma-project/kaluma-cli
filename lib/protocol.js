const SerialPort = require('serialport')
const path = require('path')
const sleep = require('system-sleep')
const ymodem = require('./ymodem')

const options = {
  autoOpen: false,
  baudRate: 115200
}

/**
 * Write user code (.js)
 * @param {string} port Port where device connected
 * @param {string} filePath Full path of the origin (e.g. `/my/path/test.js`)
 */
function write (port, filePath) {
  const serial = new SerialPort(port, options)
  serial.open(err => {
    if (err) {
      console.log('Error: failed to open the port ' + port)
    } else {
      // Turn to flash writing mode
      serial.write('\r')
      serial.write('.flash -w\r')
      sleep(500)

      var filename = path.basename(filePath)
      console.log('Writing ' + filename + '...')

      // Send the file via Ymodem protocol
      ymodem.transfer(serial, filePath, (err, result) => {
        if (err) {
          console.error(err)
        } else {
          setTimeout(() => {
            if (serial.isOpen) {
              serial.close()
            }
            console.log(`Done. (${filename} : ${result.writtenBytes} bytes)`)

            // load written code
            setTimeout(() => {
              send(port, '.load')
            }, 100)
          }, 500)
        }
      })
    }
  })
}

/**
 * Erase user code
 * @param {string} port Port where device connected
 */
function erase (port) {
  const serial = new SerialPort(port, options)
  serial.open(err => {
    if (err) {
      console.log('Error: failed to open the port ' + port)
    } else {
      console.log('Erasing user code...')
      serial.write('\r')
      serial.write('.flash -e\r')
      sleep(500)
      serial.write('.clear\r')
      sleep(100)
      console.log('Done.')
    }
  })
}

/**
 * Update firmware
 * @param {string} port Port where device is connected
 * @param {string} filePath Path to a firmware binary (e.g. `./kameleon.bin`)
 */
function update (port, filePath) {
  const serial = new SerialPort(port, options)
  serial.open(err => {
    if (err) {
      console.log('Error: failed to open the port ' + port)
    } else {
      var checkPoint = 1024 * 32
      console.log('Updating firmware...')

      ymodem.transfer(serial, filePath,
        function (err, result) {
          if (err) {
            console.error(err)
          } else {
            setTimeout(() => {
              if (serial.isOpen) {
                serial.close()
              }
              var filename = path.basename(filePath)
              console.log(`Firmware is successfully updated (${filename} : ${result.writtenBytes} bytes)`)
            }, 500)
          }
        },
        function (progress) {
          if (progress.writtenBytes >= checkPoint) {
            var kb = Math.floor(progress.writtenBytes / 1024)
            var percent = Math.floor((progress.writtenBytes / progress.totalBytes) * 100)
            console.log(kb + 'KB uploaded (' + percent + '%)')
            checkPoint = checkPoint + 1024 * 32
            if (checkPoint > progress.totalBytes) {
              checkPoint = progress.totalBytes
            }
          }
        }
      )
    }
  })
}

/**
 * List serial ports
 */
function list () {
  SerialPort.list((err, ports) => {
    if (err) {
      console.error(err)
    } else {
      ports.forEach(function (port) {
        console.log(port.comName)
      })
    }
  })
}

/**
 * Send command
 * @param {string} port Port where device is connected
 * @param {string} command Command to send
 * @param {function} callback Callback called when finished
 */
function send (port, command, callback) {
  const serial = new SerialPort(port, options)
  serial.open(err => {
    if (err) {
      console.log('Error: failed to open the port ' + port)
      if (callback) {
        callback(err)
      }
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
exports.list = list
exports.send = send
