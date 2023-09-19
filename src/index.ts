import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {styleTags, tags as t} from "@lezer/highlight"

export const PBasic = LRLanguage.define({
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