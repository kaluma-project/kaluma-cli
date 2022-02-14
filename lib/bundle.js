const webpack = require("webpack");

const builtinModules = [
  "events",
  "gpio",
  "led",
  "button",
  "pwm",
  "adc",
  "i2c",
  "spi",
  "uart",
  "rp2",
  "graphics",
  "at",
  "stream",
  "net",
  "dgram",
  "http",
  "wifi",
  "url",
  "path",
  "flash",
  "fs",
  "rtc",
  "vfs_lfs",
  "vfs_fat",
];

const externals = {};
builtinModules.forEach((m) => {
  externals[m] = `commonjs ${m}`;
});

/**
 * Bundle with webpack
 * @param {string} filePath
 * @param {object} options
 * @returns {Promise}
 */
function bundle(filePath, options) {
  return new Promise((resolve, reject) => {
    const output = options.output;
    const minify = options.minify;
    const sourcemap = options.sourcemap;
    const memfs = options.memfs;

    // webpack config
    const config = {
      mode: minify ? "production" : "none",
      entry: filePath,
      output: {
        path: memfs ? "/" : process.cwd(),
        filename: output,
      },
      node: false,
      externals: externals,
      devtool: sourcemap ? "source-map" : undefined,
    };

    const compiler = webpack(config);

    if (memfs) {
      compiler.outputFileSystem = memfs;
    }

    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

module.exports = bundle;
