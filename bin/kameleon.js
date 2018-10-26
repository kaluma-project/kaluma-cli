#!/usr/bin/env node

const program = require('commander')
const protocol = require('../lib/protocol')
const config = require('../package.json')

program
  .version(config.version)
  .option('-l, --list-ports', 'list serial ports')

program
  .command('write <file>')
  .description('write user code (.js file) to Kameleon')
  .option('-p, --port <port>', 'port where device is connected')
  .action(function (file, options) {
    var port = options.port
    protocol.write(port, file)
  })

program
  .command('erase')
  .description('erase user code in Kameleon')
  .option('-p, --port <port>', 'port where device is connected')
  .action(function (options) {
    var port = options.port
    protocol.erase(port)
  })

program
  .command('update <firmware>')
  .description('update firmware to Kameleon')
  .option('-p, --port <port>', 'port where device is connected')
  .action(function (firmware, options) {
    var port = options.port
    protocol.send(port, '.firmup', function (err) {
      if (err) {
        console.error(err)
      } else {
        setTimeout(() => {
          protocol.update(port, firmware)
        }, 500)
      }
    })
  })

program.parse(process.argv)

if (program.listPorts) {
  protocol.list()
}
