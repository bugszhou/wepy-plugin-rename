const path = require("path");
const fs = require("fs");
const normalize = require("normalize-path");

class WepyPluginRename {
  options = {};

  constructor(options = {}) {
    this.options = options;
  }

  apply(data) {
    const dist = normalize(this.options && this.options.target ? this.options.target : process.cwd());
    if (data.file.includes(path.join(dist, "app.js")) && !data.file.includes(path.join(dist, "app.json"))) {
      data.code = `var App = function(opts) {return opts;};${data.code}`;
      const newFile = path.join(path.dirname(data.file), "wepy-app.js");
      data.output({
        action: 'Rename',
        file: newFile
      });
      data.next();
      if (
        fs.existsSync(data.file) &&
        !fs.existsSync(newFile)
      ) {
        fs.renameSync(
          data.file,
          newFile,
        );
      }
      return;
    }
    data.next();
  }
}

module.exports = WepyPluginRename;