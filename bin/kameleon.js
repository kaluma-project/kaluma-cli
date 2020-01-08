#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const program = require('commander')
const protocol = require('../lib/protocol')
const config = require('../package.json')
const SerialPort = require('serialport')

const serialOptions = {
  autoOpen: false,
  baudRate: 115200
}

function tryOpen (serial, interval, callback) {
  setTimeout(() => {
    serial.open(err => { /* 1st try */
      if (err) {
        setTimeout(() => {
          serial.open(err => { /* 2nd try */
            if (err) {
              setTimeout(() => {
                serial.open(err => { /* 3rd try */
                  if (err) {
                    setTimeout(() => {
                      serial.open(err => { /* 4th try */
                        if (err) {
                          setTimeout(() => {
                            serial.open(err => { /* 5th try */
                              if (err) {
                                callback(err)
                              } else {
                                callback(null, serial)
                              }
                            })
                          }, interval)
                        } else {
                          callback(null, serial)
                        }
                      })
                    }, interval)
                  } else {
                    callback(null, serial)
                  }
                })
              }, interval)
            } else {
              callback(null, serial)
            }
          })
        }, interval)
      } else {
        callback(null, serial)
      }
    })
  }, interval)
}

program
  .version(config.version)
  .option('-l, --list-ports', 'list serial ports')

program
  .command('write <file>')
  .description('write user code (.js file) to Kameleon')
  .option('-p, --port <port>', 'port where device is connected')
  .action(function (file, options) {
    var port = options.port
    var code = fs.readFileSync(file, 'utf8')
    console.log('Writing ' + path.basename(file) + '...')
    const serial = new SerialPort(port, serialOptions)
    serial.open(err => {
      if (err) {
        console.error(err)
      } else {
        protocol.write(serial, code, (err, result) => {
          if (err) {
            console.error(err)
          } else {
            setTimeout(() => {
              // load written code
              serial.write('\r\r\r')
              serial.write('.load\r')
              setTimeout(() => {
                if (serial.isOpen) {
                  serial.close()
                }
                console.log(`Done. (${file} : ${result.writtenBytes} bytes)`)
              }, 1000)
            }, 1000)
          }
        })
      }
    })
  })

program
  .command('erase')
  .description('erase user code in Kameleon')
  .option('-p, --port <port>', 'port where device is connected')
  .action(function (options) {
    var port = options.port
    console.log('Erasing user code...')
    const serial = new SerialPort(port, serialOptions)
    serial.open(err => {
      if (err) {
        console.error(err)
      } else {
        protocol.erase(serial, () => {
          console.log('Done.')
        })
      }
    })
  })

program
  .command('update <firmware>')
  .description('update firmware to Kameleon')
  .option('-p, --port <port>', 'port where device is connected')
  .action(function (firmware, options) {
    var port = options.port
    const serial = new SerialPort(port, serialOptions)
    serial.open(err => {
      if (err) {
        console.error(err)
      } else {
        serial.write('\r')
        protocol.send(serial, '.firmup', () => {
          // Serial port should be closed because the board is rebooted in bootloader mode
          if (serial.isOpen) {
            serial.close()
          }
          console.log('Rebooting in firmware update mode...')
          var checkPoint = 1024 * 32
          var buffer = fs.readFileSync(firmware)
          const serial2 = new SerialPort(port, serialOptions)
          // Try to open serial multiple times
          tryOpen(serial2, 3000, (err, serial2) => {
            if (err) {
              console.error(err)
            } else {
              console.log('Updating firmware...')
              serial2.on('data', data => {})
              protocol.update(serial2, buffer, (err, result) => {
                if (err) {
                  console.error(err)
                } else {
                  console.log(`Firmware is successfully updated (${firmware} : ${result.writtenBytes} bytes)`)
                  console.log(`Press RESET to reboot.`)
                  // Close the serial after firmware update complete
                  setTimeout(() => {
                    if (serial2.isOpen) {
                      serial2.close()
                    }
                  }, 1000)
                }
              }, function (progress) {
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
            }
          })
        })
      }
    })
  })

program.parse(process.argv)

if (program.listPorts) {
  SerialPort.list((err, ports) => {
    if (err) {
      console.error(err)
    } else {
      ports.forEach(function (port) {
        var s = port.comName
        if (port.manufacturer) s += ` [${port.manufacturer}]`
        if (port.serialNumber) s += ` (${port.serialNumber})`
        console.log(s)
      })
    }
  })
}
