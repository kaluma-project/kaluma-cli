class BufferedSerial {
  constructor(serial) {
    this.serial = serial;
    this.serial.on("data", (chunk) => {
      this.buffer.set(chunk, this.length);
      this.length += chunk.length;
    });

    this.buffer = new Uint8Array(1024); // 64K
    this.length = 0;
  }

  write(data) {
    return new Promise((resolve, reject) => {
      this.serial.write(data, (err) => {
        if (err) {
          reject(err);
        } else {
          this.serial.drain((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  clear() {
    this.buffer.fill(0);
    this.length = 0;
  }

  available() {
    return this.length;
  }

  read(size) {
    if (typeof size !== "number") {
      size = this.buffer.length + 1;
    }
    if (this.length < size) {
      return null;
    } else {
      let buf = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        buf[i] = this.buffer[i];
      }
      this.buffer.copyWithin(0, size, this.length);
      this.length -= size;
      return buf;
    }
  }

  wait(t) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, t);
    });
  }
}

exports.BufferedSerial = BufferedSerial;
