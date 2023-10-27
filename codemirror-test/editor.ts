import {EditorView, basicSetup} from "codemirror"
import {PBasic, pbasic} from "../dist"
import { codeFolding, language, syntaxTree } from "@codemirror/language"

import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor,
  rectangularSelection, crosshairCursor,
  lineNumbers, highlightActiveLineGutter} from "@codemirror/view"
import {Extension, EditorState} from "@codemirror/state"
import {defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching,
  foldGutter, foldKeymap} from "@codemirror/language"
import {defaultKeymap, history, historyKeymap} from "@codemirror/commands"
import {searchKeymap, highlightSelectionMatches} from "@codemirror/search"
import {autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete"
import {Diagnostic, lintGutter, lintKeymap, linter} from "@codemirror/lint"

let editor = new EditorView({
  extensions: [
    lineNumbers(),
    dropCursor(),
    autocompletion(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    rectangularSelection(),
    history(),
    syntaxHighlighting(defaultHighlightStyle),
    drawSelection(),
    highlightSpecialChars(),
    EditorState.allowMultipleSelections.of(true),
    pbasic(),
    lintGutter(),
    codeFolding(),
    foldGutter(),
    keymap.of([
      ...defaultKeymap,
      ...lintKeymap,
      ...foldKeymap
    ])
  ],
  parent: document.body
})