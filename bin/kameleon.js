#!/usr/bin/env node

var program = require('commander')
var protocol = require('../lib/protocol')

program
  .version('0.1.0')

program
  .command('write <file>')
  .description('Write .js file to Kameleon')
  .option('-p, --port <port>', 'Port where device is connected')
  .action(function (file, options) {
    var port = options.port
    protocol.write(port, file)
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
