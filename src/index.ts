import {parser} from "./syntax.grammar"
import {SyntaxNodeRef} from "@lezer/common"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {styleTags, tags as t} from "@lezer/highlight"
import {readFileSync} from "fs";

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

export function test_for(file: string) {
  const filetext = readFileSync(file).toString();
  const tree = parser.parse(filetext);

  let indent = 0;
  let out = "";

  tree.iterate({
    enter: function(node: SyntaxNodeRef)
    {
      out += "\n" + "  ".repeat(indent) + node.name + "(";
      indent++;
    },

    leave: function(node: SyntaxNodeRef)
    {
      out += ")";

      if(node.node.nextSibling) out += ", ";
      else out += "\n" + "  ".repeat(indent - 2)

      indent--;
    }
  });

  console.log(out);
}

test_for("example-code/ex1.txt")