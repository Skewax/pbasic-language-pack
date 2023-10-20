import typescript from "rollup-plugin-ts"
import {string} from "rollup-plugin-string"
import {lezer} from "@lezer/generator/rollup"
import json from "@rollup/plugin-json"

export default {
  input: "example-code/examples.ts",
  external: id => id != "tslib" && !/^(\.?\/|\w:)/.test(id),
  output: [
    {file: "./example-code-build/out.cjs", format: "cjs"},
    {dir: "./example-code-build", format: "es"}
  ],
  plugins: [lezer(), typescript(), json(), string({include: "**/*.grammar.txt"})]
}