import { CompletionContext, completeFromList } from "@codemirror/autocomplete";
import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {Tag, styleTags, tags as t} from "@lezer/highlight"
import { formatKWTypes, formatKWs, kwTypes, kws } from "./specialization";

export const pbasic_parser = parser;

function getStyleTags(): {[selector: string]: Tag}
{
  let out: {[selector: string]: Tag} = {
    Identifier: t.variableName,
    String: t.string,
    Char: t.string,
    Comment: t.lineComment,
    Number: t.number
  };

  kwTypes.forEach(x => out[x] = t.keyword);
  formatKWTypes.forEach(x => out[x] = t.keyword);

  return out;
}

export const PBasic = LRLanguage.define({
  name: 'pbasic',
  parser: parser.configure({
    props: [
      styleTags(getStyleTags())
    ]
  }),
  languageData: {
    commentTokens: {line: "'"}
  }
})

function completions(context: CompletionContext)
{
  let word = context.matchBefore(/\w*/);

  if (word === null) 
    return null; // remove if null
  if (word.from === word.to && !context.explicit)
    return null; // remove if no completion found

  let comment_pref = context.matchBefore(/[^\n]*\'.*/gs);
  if (comment_pref === null || comment_pref.from !== comment_pref.to)
    return null; // remove from comments

  return {
    from: word.from,
    options: [
      ...kws      .map(x => {return {label: x.toUpperCase(), type: "keyword"}}),
      ...formatKWs.map(x => {return {label: x.toUpperCase(), type: "keyword"}}),
    ]
  }
}

export const pbasicCompletion = PBasic.data.of({
  autocomplete: completeFromList([
    ...kws.map(x => {return {label: x.toUpperCase(), type: "keyword"}})
  ])
})

export function pbasic() {
  return new LanguageSupport(PBasic, [pbasicCompletion])
}