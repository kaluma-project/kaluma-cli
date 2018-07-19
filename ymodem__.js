'use strict';

var LightYModem = module.exports = function LightYModem(){
	if(typeof this === 'undefined'){
		throw 'class not instantiated with "new"';
	}
	var self = this;
	
	self.seq = 0;
	self.ymodem = null;
	self.consoleLog = console.log;
	self.progressCb = console.log;

	self.write = function write(packet, cb){
		var timer;
		self.ymodem.write(packet, function(err, res){
			if(err){
				console.error('Error:', err);
			} else if(res === -1){
				self.consoleLog('result is -1'); // res values are undocumented, it seems like an error, and when it is send, the callback is called twice.
			} else if(cb){
				cb();
			}
		});
		return packet.length;
	}

	self._send_ymodem_packet = function _send_ymodem_packet(data, cb){
		data = Buffer.concat([data, Buffer(LightYModem.packet_len - data.length)], LightYModem.packet_len);

		var seqchr = new Buffer([self.seq & 0xFF]);
		var seqchr_neg = new Buffer([(-self.seq-1) & 0xFF]);
		var crc16 = new Buffer([0x00, 0x00]);
		
		var packet = Buffer.concat([(new Buffer([LightYModem.packet_mark])), seqchr, seqchr_neg, data, crc16]);
		if(packet.length != LightYModem.expected_packet_len){
			throw('packet length is wrong!');
		}

		self.ymodem.once('data', function(data) {
			var response = data[0];
			self.consoleLog('sent packet nr ' + self.seq);
			self.seq += 1;
			cb(response);
		});
		self.write(packet);
	}
	
	self._send_close = function _send_close(){
		self.consoleLog('closing');
		self.ymodem.write(Buffer([LightYModem.eot]), function(){
			self.consoleLog('eot sent');
			self.send_filename_header("", 0, function(){
				self.consoleLog('header sent');
			});
			
		});
	};

	self.send_packet = function send_packet(file, cb){
		var sendSlice = function(offset){
			var lower = offset*LightYModem.packet_len;
			var higher = ((offset+1)*LightYModem.packet_len);
			var end = false;
			if(higher >= file.length){
				higher = file.length;
			}
			self.progressCb({
				current:lower,
				total:file.length
			});
			if(lower >= file.length){
				cb();
			} else {
				var buf = file.slice(lower, higher);
				self._send_ymodem_packet(buf, function(){
					sendSlice(offset+1);
				});
			}
		}
		sendSlice(0);
	}

	self.send_filename_header = function send_filename_header(name, size, cb){
		self.seq = 0;
		var filenameHeader = new Buffer(name+ ' ' + size + ' ');
		filenameHeader[name.length] = 0;
		self._send_ymodem_packet(filenameHeader, cb);
	}


	self.transfer = function transfer(file, ymodem, progressCb, consoleOutput){
		self.ymodem = ymodem;
		self.consoleLog = consoleOutput || self.consoleLog;
		self.progressCb = progressCb || self.progressCb;

		self.ymodem.on('error', function(msg){
			console.error('Error', msg);
		});
		self.ymodem.on('close', function(){
			console.error('Close');
		});
		self.ymodem.on('open', function () {
			self.ymodem.on('data', function(data) {
				if(data.length <= 2){
					for(var x=0;x<data.length;x++){
						for(var key in LightYModem){
							if(data[x] === LightYModem[key]){
								self.consoleLog('cmd received: ' + key);
							}
						}						
					}
				} else {
					self.consoleLog('message received: '  + data.toString().trim() );
				}
			});

			self.send_filename_header('binary', file.length, function(){
				self.consoleLog('done header');
				self.send_packet(file, function(response){
					self.consoleLog('done file');
					 self._send_close();
				});
			});

		});
		self.ymodem.open();
	}

	return self;
};
LightYModem.soh = 1;     // 128 byte blocks
LightYModem.stx = 2;     // 1K blocks
LightYModem.eot = 4;
LightYModem.ack = 6;
LightYModem.nak = 0x15;
LightYModem.ca =  0x18;    // 24
LightYModem.crc16 = 0x43;  // 67 "C"
LightYModem.abort1 = 0x41; // 65
LightYModem.abort2 = 0x61; // 97

// 1K blocks does not seem to work
LightYModem.packet_len = 1024;
LightYModem.packet_mark = LightYModem.stx;
LightYModem.expected_packet_len = LightYModem.packet_len+5;

// LightYModem.packet_len = 128;
// LightYModem.packet_mark = LightYModem.soh;
// LightYModem.expected_packet_len = LightYModem.packet_len+5;
