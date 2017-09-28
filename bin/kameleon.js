#!/usr/bin/env node

var program = require('commander');
var protocol = require('../lib/protocol');
var path = require('path');

program
  .version('0.1.0');

program
  .command('copy <file> [dest]')
  .alias('cp')
  .description('copy a file to Kameleon')
  .option("-p, --port <port>", "Port where Kameleon is connected")
  .action(function (file, dest, options) {
    console.log('Copying a file...');
    var base = path.basename(file);
    var port = options.port;
    var dest = path.join(dest || '/usr', base);
    protocol.copy(port, file, dest, function (err) {
      console.log(`File copied: ${file} to ${dest}.`);
    });
  });

program
  .command('list')
  .alias('ls')
  .description('list all files in Kameleon')
  .option("-p, --port <port>", "Port where Kameleon is connected")
  .action(function (options) {
    console.log('list files...');
    console.log(options.port);
  });

program
  .command('remove <file>')
  .alias('rm')
  .description('remove a file in Kameleon')
  .option("-p, --port <port>", "Port where Kameleon is connected")
  .action(function (file, options) {
    console.log('remove a file...');
    console.log(options.port);
  });

program.parse(process.argv);
