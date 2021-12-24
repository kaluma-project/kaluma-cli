const UglifyJS = require("uglify-js");

/**
 * Evaluate function with args on the device
 * @param {BufferedSerial} bs
 * @param {string} fun 
 * @param  {...any} args 
 * @returns {any}
 */
async function eval(bs, fun, ...args) {
  const stringifiedArgs = args.map(arg => JSON.stringify(arg));
  const called = `(${fun})(${stringifiedArgs.join(',')})`;
  const wrapped = `
    (function () {
      let r = ${called};
      print(JSON.stringify(r));
      print(String.fromCharCode(4)); // EOT
    })();
  `;
  const minified = UglifyJS.minify(wrapped);
  const code = minified.code;

  // .echo off
  await bs.write("\r.echo off\r");
  await bs.wait(10);
  bs.clear();

  // run code
  await bs.write(`${code}\r`);
  await bs.wait(200);
  // console.log(String.fromCharCode.apply(null, bs.buffer));
  // console.log();

  // get result
  let len = bs.buffer.indexOf(4); // EOT
  let buf = bs.getData(0, len);
  let result = JSON.parse(String.fromCharCode.apply(null, buf));

  // .echo on
  await bs.write("\r.echo on\r");
  await bs.wait(10);
  
  // return result
  return result;
}

module.exports = eval;
