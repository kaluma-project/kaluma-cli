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
    const serial = new SerialPort(port, serialOptions)
    var code = fs.readFileSync(file, 'utf8')
    console.log('Writing ' + path.basename(file) + '...')
    protocol.write(serial, code, (err, result) => {
      if (err) {
        console.error(err)
      } else {
        console.log(`Done. (${file} : ${result.writtenBytes} bytes)`)
      }
    })
  })

program
  .command('erase')
  .description('erase user code in Kameleon')
  .option('-p, --port <port>', 'port where device is connected')
  .action(function (options) {
    var port = options.port
    const serial = new SerialPort(port, serialOptions)
    console.log('Erasing user code...')
    protocol.erase(serial, err => {
      if (err) {
        console.error(err)
      } else {
        console.log('Done.')
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
    protocol.send(serial, '.firmup', function (err) {
      if (err) {
        console.error(err)
      } else {
        // Need long time (3sec) to re-identify serial port after disconnection
        setTimeout(() => {
          console.log('Updating firmware...')
          var checkPoint = 1024 * 32
          var buffer = fs.readFileSync(firmware)
          const serial2 = new SerialPort(port, serialOptions)
          protocol.update(serial2, buffer, (err, result) => {
            if (err) {
              console.error(err)
            } else {
              console.log(`Firmware is successfully updated (${firmware} : ${result.writtenBytes} bytes)`)
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
        }, 3000)
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
