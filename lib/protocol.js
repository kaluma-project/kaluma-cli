const SerialPort = require('serialport')
const fs = require('fs')
const sleep = require('system-sleep')
const YModem = require('./ymodem')

const options = {
  autoOpen: false,
  baudRate: 115200
}

function toHex (file) {
  var data = fs.readFileSync(file, 'utf8')
  var buffer = Buffer.from(data, 'utf8')
  var hex = buffer.toString('hex').toUpperCase()
  return hex
}

/**
 * Write a file to the port
 *
 * @param {string} port Port where device connected
 * @param {string} file Full path of the origin (e.g. `/my/path/test.js`)
 * @param {function} callback Called when copy is complete
 */
function write (port, file, callback) {
  const serial = new SerialPort(port, options)
  serial.open(err => {
    if (err) {
      console.log('Error: failed to open the port ' + port)
    } else {
      // wake up or clear command buffer
      serial.write('\r')
      // echo off
      serial.write('.echo off\r')
      // run .flash command in write mode
      serial.write('.flash -w\r')
      sleep(1000)
      // write hex data
      var hex = toHex(file)
      // split string into multiple segments which has 512 size
      var segments = hex.match(/.{1,512}/g)
      segments.forEach(function (seg) {
        console.log('write: ' + (seg.length / 2) + ' bytes')
        serial.write(seg)
        sleep(1000)
      })
      console.log('done.')
      // send ctrl+z (0x1a) and finish
      serial.write(Buffer.from([0x1a]))
      // echo on
      serial.write('.echo on\r', function () {
        serial.close(function (err) {
          if (callback) {
            callback(err)
          }
        })
      })
    }
  })
}

/**
 * Update firmware
 *
 * @param {string} port Port where device is connected
 * @param {string} file Full path of a firmware binary (e.g. `./kameleon.bin`)
 */
function update (port, firmware) {
  var ymodem = new YModem(port, options.baudRate)
  var checkPoint = 1024 * 32
  ymodem.on('start', () => {
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
  ymodem.on('done', () => {
    console.log(`Firmware is updated successfully: ${firmware} (${checkPoint} bytes)`)
  })
  ymodem.on('error', (err) => {
    console.error(err)
  })
  ymodem.transfer(firmware)
}

exports.write = write
exports.update = update
