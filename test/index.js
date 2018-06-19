var led = board.led(0);
pinMode(led, OUTPUT);
var timer = setInterval(function () {
  digitalToggle(led);
}, 1000);
