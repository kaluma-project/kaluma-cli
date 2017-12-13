#!/usr/bin/env node

var program = require('commander');
var protocol = require('../lib/protocol');
var path = require('path');

program
  .version('0.1.0');

program
  .command('flash <file>')
  .description('Flash a file to Kameleon')
  .option("-p, --port <port>", "Port where the file is transmitted")
  .action(function (file, options) {
    console.log('Flashing a file...');
    var base = path.basename(file);
    var port = options.port;
    protocol.flash(port, file, function (err) {
      console.log(`Flashed successfully: ${file}.`);
    });
  });

program.parse(process.argv);
