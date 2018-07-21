#!/usr/bin/env node

var program = require('commander')
var protocol = require('../lib/protocol')
// var path = require('path')

program
  .version('0.1.0')

program
  .command('write <file>')
  .description('Write .js file to Kameleon')
  .option('-p, --port <port>', 'Port where device is connected')
  .action(function (file, options) {
    console.log('Writing a file...')
    // var base = path.basename(file)
    var port = options.port
    protocol.write(port, file, err => {
      if (err) {
        console.error(err)
      } else {
        console.log(`Written successfully: ${file}.`)
      }
    })
  })

program
  .command('update <firmware>')
  .description('Update firmware to Kameleon')
  .option('-p, --port <port>', 'Port where device is connected')
  .action(function (firmware, options) {
    var port = options.port
    protocol.update(port, firmware)
  })

program.parse(process.argv)
