var lightYModem = require('./ymodem');
var SerialPort = require("serialport");
var fs = require('fs');
 
var file = fs.readFileSync('./kameleon_2.bin');
var serialPort = new SerialPort('/dev/tty.usbmodem143231', {baudRate: 28800}, false);
var progressCallback = function(val){  console.log(val); }
var logCallback = console.log;
 
var modem = new lightYModem();
modem.transfer(file, serialPort, progressCallback, logCallback);
