pinMode(4, OUTPUT);
var timer = setInterval(function () {
  digitalToggle(4);
}, 1000);
