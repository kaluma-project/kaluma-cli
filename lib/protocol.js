const SerialPort = require('serialport')
const sleep = require('system-sleep')
const YModem = require('./ymodem')

const options = {
  autoOpen: false,
  baudRate: 115200
}

/**
 * Write a file to the port
 *
 * @param {string} port Port where device connected
 * @param {string} filePath Full path of the origin (e.g. `/my/path/test.js`)
 * @param {function} callback Called when copy is complete
 */
function write (port, filePath, callback) {
  const serial = new SerialPort(port, options)
  serial.open(err => {
    if (err) {
      console.log('Error: failed to open the port ' + port)
    } else {
      // Turn to flash writing mode
      serial.write('\r')
      serial.write('.flash -w\r')
      sleep(500)

      // Send the file via Ymodem protocol
      var ymodem = new YModem(serial)
      ymodem.on('open', () => {
        console.log('Writing code...')
      })
      ymodem.on('done', (filename, writtenBytes) => {
        console.log(`Done. (${filename} : ${writtenBytes} bytes)`)
      })
      ymodem.on('close', () => {
        setTimeout(() => {
          if (serial.isOpen) {
            serial.write('\r')
            serial.close()
          }
        }, 1000)
      })
      ymodem.on('error', (err) => {
        console.error('Failed to write the file.')
        console.error(err)
      })
      ymodem.transfer(filePath)
    }
  })
}

/**
 * Update firmware
 *
 * @param {string} port Port where device is connected
 * @param {string} filePath Full path to a firmware binary (e.g. `./kameleon.bin`)
 */
function update (port, filePath) {
  const serial = new SerialPort(port, options)
  serial.open(err => {
    if (err) {
      console.log('Error: failed to open the port ' + port)
    } else {
      var ymodem = new YModem(serial)
      var checkPoint = 1024 * 32
      ymodem.on('open', () => {
        console.log('Updating firmware...')
      })
      ymodem.on('progress', (progress) => {
        if (progress.writtenBytes >= checkPoint) {
          var kb = Math.floor(progress.writtenBytes / 1024)
          var percent = Math.floor((progress.writtenBytes / progress.totalBytes) * 100)
          console.log(kb + 'KB uploaded (' + percent + '%)')
          checkPoint = checkPoint + 1024 * 32
          if (checkPoint > progress.totalBytes) {
            checkPoint = progress.totalBytes
          }
        }
      })
      ymodem.on('done', (filename, writtenBytes) => {
        console.log(`Firmware is successfully updated (${filename} : ${writtenBytes} bytes)`)
      })
      ymodem.on('close', () => {
        setTimeout(() => {
          if (serial.isOpen) {
            serial.close()
          }
        }, 1000)
      })
      ymodem.on('error', (err) => {
        console.error('Failed to update firmware.')
        console.error(err)
      })
      ymodem.transfer(filePath)
    }
  })
}

exports.write = write
exports.update = update
