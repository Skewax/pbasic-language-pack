import {PBasic} from "../dist/index.js"
import {fileTests} from "@lezer/generator/dist/test"
import {Tree} from "@lezer/common"

import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from 'url';
let caseDir = path.dirname(fileURLToPath(import.meta.url))

for (let file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) continue

  // let filetext = fs.readFileSync(path.join(caseDir, file), "utf8").toString();
  // console.log(tostr(PBasic.parser.parse(filetext)))

  let name = /^[^\.]*/.exec(file)[0]
  describe(name, () => {
    for (let {name, run} of fileTests(fs.readFileSync(path.join(caseDir, file), "utf8"), file))
      it(name, () => run(PBasic.parser))
  })
}