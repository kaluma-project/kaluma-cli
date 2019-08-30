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
          // Need long time (3sec) to re-identify serial port after disconnection
          setTimeout(() => {
            console.log('Updating firmware...')
            var checkPoint = 1024 * 32
            var buffer = fs.readFileSync(firmware)
            const serial2 = new SerialPort(port, serialOptions)
            serial2.open(err => {
              if (err) {
                console.error(err)
              } else {
                protocol.update(serial2, buffer, (err, result) => {
                  if (err) {
                    console.error(err)
                  } else {
                    console.log(`Firmware is successfully updated (${firmware} : ${result.writtenBytes} bytes)`)
                    // Close the serial after firmware update complete
                    setTimeout(() => {
                      if (serial2.isOpen) {
                        serial2.close()
                      }
                    }, 500)
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
          }, 3000)
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
        console.log(port.comName)
      })
    }
  })
}
