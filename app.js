console.log("start...");

const SerialPort = require('serialport')

const options = {
  autoOpen: false,
  baudRate: 115200
}

SerialPort.list((err, ports) => {
  const port = new SerialPort("/dev/cu.usbmodem1", options);

  port.on('data', data => {
    let str = String.fromCharCode.apply(null, new Uint16Array(data))
    console.log('received:', str);
  })

  port.open(err => {
    var content = new Buffer("console.log('test1');");
    var data = content.toString('hex').toUpperCase();
    console.log(data);
    console.log(data.length);
    port.write(new Buffer([0x1b]));
    port.write("!w");
    port.write("/usr/test1.js\n");
    port.write(data);
    port.write(new Buffer([0x04]));
    console.log('done');
  });

});
