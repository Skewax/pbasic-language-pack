import {nodeResolve} from "@rollup/plugin-node-resolve"
import typescript from "rollup-plugin-ts"

export default {
  input: "codemirror-test/editor.ts",
  output: {
    file: "codemirror-test/editor.bundle.js",
    format: "iife"
  },
  plugins: [typescript(), nodeResolve()]
}