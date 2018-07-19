var SerialPort = require('serialport')
var path = require('path')
var fs = require('fs')

const PACKET_SIZE = 1024

class YModem {
  constructor (port) {
    var options = {
      autoOpen: false,
      baudRate: 9600
    }
    this.serial = new SerialPort(port, options)
    this.queue = []
    this.seq = 0
    this.sending = false
  }

  splitBuffer (buffer, size, fixedSize) {
    if (buffer.byteLength > size) {
      var array = []
      var start = 0
      var end = start + size - 1
      while (start < buffer.byteLength) {
        if (end >= buffer.byteLength) {
          end = buffer.byteLength - 1
        }
        var chunk = Buffer.alloc(fixedSize || (end - start + 1), 0xff)
        buffer.copy(chunk, 0, start, end + 1)
        array.push(chunk)
        start = start + size
        end = start + size - 1
      }
      return array
    } else {
      return [buffer]
    }
  }

  sendBuffer (buffer) {
    var chunks = this.splitBuffer(buffer, 256)
    chunks.forEach(chunk => {
      this.serial.write(chunk, 'binary', () => {
        this.serial.drain()
      })
    })
  }

  sendPacket () {
    if (this.seq < this.queue.length) {
      // make a packet (3 for packet header, PACKET_SIZE for payload, 2 for crc16)
      var packet = Buffer.alloc(3 + PACKET_SIZE + 2)

      // packet header
      packet[0] = YModem.STX
      packet[1] = this.seq
      packet[2] = 0xff - packet[1]

      // packet payload
      var payload = this.queue[this.seq]
      payload.copy(packet, 3)

      // packet crc16
      packet[packet.byteLength - 2] = 0x00
      packet[packet.byteLength - 1] = 0x00

      // send packet
      this.sendBuffer(packet)
      console.log('#' + this.seq + ' packet sent')
      console.log('PACKET: ', packet.length, packet)
    } else {
      // send EOT
      if (this.sending) {
        this.sendBuffer(Buffer.from([ YModem.EOT ]))
      }
    }
  }

  handleReponse (res) {
    if (res === YModem.CRC16) {
      console.log('CRC16.')
      if (!this.sending) {
        this.sendPacket()
        this.sending = true
      }
    } else if (res === YModem.ACK) {
      console.log('ACK.')
      if (this.sending) {
        if (this.seq < this.queue.length) {
          this.seq++
          this.sendPacket()
        } else { /* send complete */
          console.log('file transfer complete.')
          this.sending = false
          // send null header for end of session
          var endsession = Buffer.alloc(PACKET_SIZE + 5, 0x00)
          endsession[0] = YModem.STX
          endsession[1] = 0x00 // this.seq
          endsession[2] = 0xff // 0xff - endsession[1]
          console.log(endsession.length, endsession)
          this.sendBuffer(endsession)
          // this.serial.close()
        }
      }
    } else if (res === YModem.NAK) {
      console.log('NAK.')
      this.sendPacket()
    } else if (res === YModem.CA) {
      console.log('CA.')
      // this.serial.close()
    } else {
      console.log(res)
    }
  }

  transfer (filePath, cb) {
    this.seq = 0
    var buffer = fs.readFileSync(filePath)

    // file header packet
    var headerPayload = Buffer.alloc(PACKET_SIZE, 0x00)
    var basename = path.basename(filePath)
    headerPayload.write(basename, 0)
    headerPayload.write(buffer.byteLength.toString() + ' ', basename.length + 1)
    this.queue = []
    this.queue.push(headerPayload)

    // file data packets
    var payloads = this.splitBuffer(buffer, PACKET_SIZE, PACKET_SIZE)
    payloads.forEach(payload => {
      this.queue.push(payload)
    })

    // open serial
    this.serial.open(() => {
      console.log('serial open')
      // handle receivers response
      this.serial.on('data', (data) => {
        // console.log(data.toString())
        for (var i = 0; i < data.byteLength; i++) {
          this.handleReponse(data[i])
        }
      })
    })
  }
}

YModem.SOH = 0x01 // 128 byte blocks
YModem.STX = 0x02 // 1K blocks
YModem.EOT = 0x04
YModem.ACK = 0x06
YModem.NAK = 0x15
YModem.CA = 0x18 // 24
YModem.CRC16 = 0x43 // 67 "C"
YModem.ABORT1 = 0x41 // 65
YModem.ABORT2 = 0x61 // 97

var ymodem = new YModem('/dev/tty.usbmodem143231')
ymodem.transfer('./kameleon_2.bin')
