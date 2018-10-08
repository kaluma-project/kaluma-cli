#!/usr/bin/env node

var program = require('commander')
var protocol = require('../lib/protocol')
var config = require('../package.json')

program
  .version(config.version)
  .option('-l, --list-ports', 'List serial ports')

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

if (program.listPorts) {
  protocol.list()
}
