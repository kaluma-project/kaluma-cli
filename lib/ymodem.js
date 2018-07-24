const SerialPort = require('serialport')
const path = require('path')
const fs = require('fs')
const EventEmitter = require('events')
const crc16 = require('crc16')

/**
 * YModem protocol implementation
 */
class YModem extends EventEmitter {
  /**
   * @param {*} port
   * @param {*} baudrate
   */
  constructor (port, baudrate) {
    super()
    var options = {
      autoOpen: false,
      baudRate: baudrate
    }
    this.serial = new SerialPort(port, options)
    this.queue = []
    this.filename = ''
    this.writtenBytes = 0
    this.totalBytes = 0
    this.seq = 0
    this.session = false
    this.sending = false
  }

  /**
   * Split buffer into multiple smaller buffer in the given size
   * @param {Buffer} buffer
   * @param {number} size
   * @param {number} fixedSize
   */
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
      var buf = Buffer.alloc(fixedSize || size, 0xff)
      buffer.copy(buf, 0, 0, buffer.byteLength)
      return [buf]
    }
  }

  /**
   * Send buffer to the serial port
   * @param {*} buffer
   */
  sendBuffer (buffer) {
    var chunks = this.splitBuffer(buffer, 256)
    chunks.forEach(chunk => {
      this.serial.write(chunk, 'binary')
      this.serial.drain()
    })
  }

  /**
   * Make file header payload from file path and size
   * @param {*} filePath
   * @param {*} fileSize
   */
  makeFileHeader (filePath, fileSize) {
    var payload = Buffer.alloc(YModem.PACKET_SIZE, 0x00)
    var offset = 0
    if (filePath) {
      this.filename = path.basename(filePath)
      payload.write(this.filename, offset)
      offset = this.filename.length + 1
    }
    if (fileSize) {
      payload.write(fileSize.toString() + ' ', offset)
    }
    return payload
  }

  /**
   * Send a packet in the queue
   */
  sendPacket () {
    if (this.seq < this.queue.length) {
      // make a packet (3 for packet header, YModem.PACKET_SIZE for payload, 2 for crc16)
      var packet = Buffer.alloc(3 + YModem.PACKET_SIZE + 2)

      // packet header
      packet[0] = YModem.STX
      packet[1] = this.seq
      packet[2] = 0xff - packet[1]

      // packet payload
      var payload = this.queue[this.seq]
      payload.copy(packet, 3)

      // packet crc16
      var crc = crc16(payload)
      packet.writeUInt16BE(crc, packet.byteLength - 2)

      // send packet
      this.sendBuffer(packet)
    } else {
      // send EOT
      if (this.sending) {
        this.sendBuffer(Buffer.from([ YModem.EOT ]))
      }
    }
  }

  /**
   * Handle response code from receiver
   * @param {number} res
   */
  handleReponse (res) {
    if (res === YModem.CRC16) {
      if (!this.sending) {
        this.sendPacket()
        this.sending = true
      }
    } else if (res === YModem.ACK) {
      if (!this.session) {
        setTimeout(() => {
          if (this.serial.isOpen) {
            this.serial.close()
          }
        }, 100)
      }
      if (this.sending) {
        if (this.seq < this.queue.length) {
          if (this.writtenBytes < this.totalBytes) {
            this.writtenBytes = (this.seq + 1) * YModem.PACKET_SIZE
            if (this.writtenBytes > this.totalBytes) {
              this.writtenBytes = this.totalBytes
            }
            this.emit('progress', { writtenBytes: this.writtenBytes, totalBytes: this.totalBytes })
          }
          this.seq++
          this.sendPacket()
        } else { /* send complete */
          if (this.session) {
            this.emit('done', this.filename, this.writtenBytes)
          }
          this.sending = false
          this.session = false
          // send null header for end of session
          var endsession = Buffer.alloc(YModem.PACKET_SIZE + 5, 0x00)
          endsession[0] = YModem.STX
          endsession[1] = 0x00
          endsession[2] = 0xff
          this.sendBuffer(endsession)
        }
      }
    } else if (res === YModem.NAK) {
      this.sendPacket()
    } else if (res === YModem.CA) {
      setTimeout(() => {
        if (this.serial.isOpen) {
          this.serial.close()
        }
      }, 100)
    }
  }

  /**
   * Transfer a file to serial port using ymodem protocol
   * @param {string} filePath
   * @param {function} cb
   */
  transfer (filePath, cb) {
    this.seq = 0
    var buffer = fs.readFileSync(filePath)
    this.totalBytes = buffer.byteLength

    // file header payload
    var headerPayload = this.makeFileHeader(filePath, this.totalBytes)
    this.queue = [ headerPayload ]

    // file data packets
    var payloads = this.splitBuffer(buffer, YModem.PACKET_SIZE, YModem.PACKET_SIZE)
    payloads.forEach(payload => {
      this.queue.push(payload)
    })

    // open serial
    this.serial.open(() => {
      this.emit('start')
      this.session = true
      // handle receivers response
      this.serial.on('data', (data) => {
        for (var i = 0; i < data.byteLength; i++) {
          this.handleReponse(data[i])
        }
      })
    })
  }
}

YModem.PACKET_SIZE = 1024
YModem.SOH = 0x01 // 128 byte blocks
YModem.STX = 0x02 // 1K blocks
YModem.EOT = 0x04
YModem.ACK = 0x06
YModem.NAK = 0x15
YModem.CA = 0x18 // 24
YModem.CRC16 = 0x43 // 67 "C"
YModem.ABORT1 = 0x41 // 65
YModem.ABORT2 = 0x61 // 97

module.exports = YModem
