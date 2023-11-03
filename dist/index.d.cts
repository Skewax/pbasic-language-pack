import { LRLanguage, LanguageSupport, foldNodeProp } from "@codemirror/language";
/**
 * The unmodified parser for PBasic
 */
declare const pbasic_parser: import("@lezer/lr").LRParser;
type Extract<T> = T extends {
    [selector: string]: infer U;
} ? U : never;
type EditorState = Parameters<Extract<Parameters<typeof foldNodeProp.add>[0]>>[1];
/**
 * The PBasic language instance
 */
declare const PBasic: LRLanguage;
declare let typeHoverDOMProvider: (view: EditorState, text: string) => {
    dom: HTMLDivElement;
};
/**
 * The language support instance for PBasic.
 */
declare function pbasic(): LanguageSupport;
export { pbasic_parser, EditorState, PBasic, typeHoverDOMProvider, pbasic };
