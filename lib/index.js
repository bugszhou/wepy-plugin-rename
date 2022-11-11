const path = require("path");
const fs = require("fs");
const normalize = require("normalize-path");
const  parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

class WepyPluginRename {
  options = {};

  constructor(options = {}) {
    this.options = options;
  }

  apply(data) {
    const dist = normalize(path.join(process.cwd(), this.options && this.options.target ? this.options.target : ""));
    if (data.file.includes(path.join(dist, "app.js")) && !data.file.includes(path.join(dist, "app.json"))) {

      const wepyApp = `const preApp = App;
      let options = null;
      function WepyApp(opts) {
        options = opts; 
      }
      App = function (opts) {
        if (!options) {
          options = opts;
        }
        Object.keys(opts || {}).forEach((key) => {
          if (typeof options[key] === "function") {
            const temp = options[key];
            options[key] = function (...lifetimesOpts) {
              temp.apply(this, lifetimesOpts);
              opts[key].apply(this, lifetimesOpts);
            }
          } else {
            options[key] = opts[key];
          }
        });
        preApp(options);
      };`;
      data.code = `${wepyApp}${data.code}`;

      const ast = parser.parse(data.code, {
        sourceType: 'unambiguous'
      });

      traverse(ast, {
        CallExpression(path, state) {
          if (path.node.callee.name === 'App') {
              path.node.callee.name = "WepyApp";
          }
        }
      });

      const { code } = generate(ast);
      data.code = code;

      const newFile = path.join(path.dirname(data.file), "wepy-app.js");
      if (fs.existsSync(data.file)) {
        fs.renameSync(data.file, `${data.file}-app`);
      }
      data.output({
        action: 'Rename',
        file: newFile
      });
      data.next();
      fs.copyFileSync(
        data.file,
        newFile,
      );
      if (fs.existsSync(`${data.file}-app`)) {
        fs.renameSync(`${data.file}-app`, data.file);
      }
      return;
    }
    data.next();
  }
}

module.exports = WepyPluginRename;