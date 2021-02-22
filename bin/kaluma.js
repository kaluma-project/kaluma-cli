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

/*
function tryOpen (serial, interval, callback) {
  setTimeout(() => {
    serial.open(err => { // 1st try
      if (err) {
        setTimeout(() => {
          serial.open(err => { // 2nd try
            if (err) {
              setTimeout(() => {
                serial.open(err => { // 3rd try
                  if (err) {
                    setTimeout(() => {
                      serial.open(err => { // 4th try
                        if (err) {
                          setTimeout(() => {
                            serial.open(err => { // 5th try
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
*/

program
  .version(config.version)
  .option('-l, --list-ports', 'list serial ports')

program
  .command('write <file>')
  .description('write user code (.js file) to a Kaluma board')
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
  .description('erase user code in Kaluma board')
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
