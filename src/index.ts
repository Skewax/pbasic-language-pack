import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {styleTags, tags as t} from "@lezer/highlight"
import { run_examples } from "./examples"

export const PBasic = LRLanguage.define({
  name: 'pbasic',
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: t.variableName,
        String: t.string,
        Comment: t.lineComment,
      })
    ]
  }),
  languageData: {
    commentTokens: {line: "'"}
  }
})

export function pbasic() {
  return new LanguageSupport(PBasic)
}

if(process.argv[2] == "--run-examples")
{
  run_examples();
}