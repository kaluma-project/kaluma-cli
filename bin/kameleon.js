#!/usr/bin/env node

var program = require('commander')
var protocol = require('../lib/protocol')
// var path = require('path')

program
  .version('0.1.0')

program
  .command('flash <file>')
  .description('Flash a file to Kameleon')
  .option('-p, --port <port>', 'Port where device is connected')
  .action(function (file, options) {
    console.log('Flashing a file...')
    // var base = path.basename(file)
    var port = options.port
    protocol.flash(port, file, err => {
      if (err) {
        console.error(err)
      } else {
        console.log(`Flashed successfully: ${file}.`)
      }
    })
  })

program
  .command('firmware <file>')
  .description('Update firmware to Kameleon')
  .option('-p, --port <port>', 'Port where device is connected')
  .action(function (file, options) {
    var port = options.port
    protocol.firmware(port, file)
  })

program.parse(process.argv)
