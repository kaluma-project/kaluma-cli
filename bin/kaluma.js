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
          var s = port.path
          if (port.manufacturer) s += ` [${port.manufacturer}]`
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

/*
(function (fn, fz, pz) {
  var fs = require('fs');
  var i = process.stdin;
  var fd = fs.open(fn, 'w');
  var buf = new Uint8Array(pz);
  while (fz > 0) {
    var bz = Math.min(fz, buf.length);
    var bl = bz;
    while (bl > 0) {
      var c = i.read();
      if (c) {
        buf.set(c, bi);
        bl -= c.length;
      }
    }
    fs.write(fd, buf);
    // process.stdout.write(new Uint8Array([0x06])); // ACK
    fz -= bz;
  }
  fs.close(fd);
})
*/

/*
(function (fn, fz) {
  var fs = require('fs');
  var fd = fs.open(fn, 'w');
  while (fz > 0) {
    var c = process.stdin.read();
    if (c) {
      fs.write(fd, c);
      fz -= c.length;
    }
  };
  fs.close(fd);
})
*/

const src = `(function(fn,fz){var fs=require('fs');var fd=fs.open(fn,'w');while(fz>0){var c=process.stdin.read();if(c){fs.write(fd,c);fz-=c.length}};fs.close(fd)})`

program
  .command('test')
  .description('test ... ')
  .option('-p, --port <port>', 'port where device is connected')
  .action(function (options) {
    const port = options.port
    const serial = new SerialPort(port, serialOptions)
    serial.open(err => {
      if (err) {
        console.error(err)
      } else {
        let data = ''
        // console.log('flowing', serial.readableFlowing)
        // console.log('flowing', serial.readableFlowing)
        serial.write('\r.echo off\r', () => {
          // serial.on('data', (chunk) => {
          //   data += String.fromCharCode.apply(null, chunk)
          // })
          serial.write(`${src}('f.txt', 10);\r`, () => {
            setTimeout(() => {
              serial.write('abcde12345', () => {
                serial.write('\r.echo on\r', () => {
                  console.log(`data="${data}"`)
                  serial.close()
                })
              })
            }, 100)
          })
        })
      }
    })
  })

program.parse(process.argv)
