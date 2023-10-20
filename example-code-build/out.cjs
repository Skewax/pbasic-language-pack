'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var index_cjs = require('../dist/index.cjs');
var fs = require('fs');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespace(fs);

//⚠ == oopsie
function debug_file(file) {
    console.log("Debugging " + file + "\n" + "-".repeat(50));
    const filetext = fs__namespace.readFileSync("./example-code/examples/" + file).toString();
    const tree = index_cjs.pbasic_parser.parse(filetext);
    let indent = 0;
    let out = "";
    tree.iterate({
        enter: function (node) {
            out += "\n" + "  ".repeat(indent) + node.name;
            if (node.node.firstChild) {
                out += "(";
                indent++;
            }
            else {
                out += ": '" + filetext.substring(node.to, node.from) + "'";
            }
        },
        leave: function (node) {
            // exit on no children
            if (node.node.firstChild) {
                out += ")";
                indent--;
            }
            if (node.node.nextSibling)
                out += ", ";
            else
                out += "\n" + "  ".repeat(Math.max(indent - 1, 0));
        }
    });
    console.log(out + "-".repeat(50));
}
function run_examples() {
    let to_run = [];
    if (process.argv.length === 2) {
        to_run = fs__namespace.readdirSync("./example-code/examples");
    }
    else {
        to_run = process.argv.slice(2);
    }
    for (let file of to_run) {
        debug_file(file);
    }
}
run_examples();

exports.run_examples = run_examples;
