#!/usr/bin/env node

const program = require('commander')
const protocol = require('../lib/protocol')
const config = require('../package.json')
const sleep = require('system-sleep')

program
  .version(config.version)
  .option('-l, --list-ports', 'List serial ports')

program
  .command('write <file>')
  .description('Write .js file to Kameleon')
  .option('-p, --port <port>', 'Port where device is connected')
  .action(function (file, options) {
    var port = options.port
    protocol.write(port, file, () => {
      setTimeout(() => {
        protocol.send(port, '.load\r')
      }, 100)
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

if (program.listPorts) {
  protocol.list()
}
