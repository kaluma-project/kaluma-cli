#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { program } = require('commander')
const protocol = require('../lib/protocol')
const config = require('../package.json')
const SerialPort = require('serialport')

const serialOptions = {
  autoOpen: false,
  baudRate: 115200
}

program
  .version(config.version)

program
  .command('list')
  .description('list available serial ports')
  .action(function () {
    SerialPort.list()
      .then(ports => {
        ports.forEach(function (port) {
          console.log(port)
          var s = port.path
          if (port.manufacturer) s += ` [${port.manufacturer}]`
          if (port.serialNumber) s += ` (${port.serialNumber})`
          console.log(s)
        })
      })
      .catch(err => {
        console.error(err)
      })
  })

program
  .command('write <file>')
  .description('write code (.js file) to a Kaluma board')
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
  .description('erase code in Kaluma board')
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
