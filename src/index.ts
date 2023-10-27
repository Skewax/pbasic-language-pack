import { CompletionContext, autocompletion, completeFromList } from "@codemirror/autocomplete";
import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent, syntaxTree, foldCode, foldAll, languageDataProp, defineLanguageFacet} from "@codemirror/language"
import {Tag, styleTags, tags as t} from "@lezer/highlight"
import { formatKWTypes, formatKWs, kwTypes, kws } from "./specialization";
import { Diagnostic, linter } from "@codemirror/lint";
import { Facet } from "@codemirror/state";
import { ContextTracker } from "@lezer/lr";

/**
 * The unmodified parser for PBasic
 */
export const pbasic_parser = parser;

type SyntaxNode = Parameters<typeof foldInside>[0];
// huh?
type Extract<T> = T extends {[selector: string]: infer U} ? U : never;
type EditorState = Parameters<Extract<Parameters<typeof foldNodeProp.add>[0]>>[1];

type Definitions = {[name: string]: {from: number, to: number}};

/**
 * Get the literal text of some node.
 */
const getNodeText = (node: SyntaxNode | null, editor: EditorState) => 
    editor.doc.sliceString(node?.from ?? 0, node?.to ?? 0);

/**
 * Extract a 'defident' if one exists within a node.
 * @returns [raw_text, ident] if the defident was found, [null, null] otherwise
 */
function extractDefident(node: SyntaxNode, editor: EditorState): [string | null, string | null]
{
    if(node.name == 'VarDecl'
    || node.name == 'PinDecl'
    || node.name == 'ConDecl'
    || node.name == 'Label')
    {
        const id = getNodeText(node.firstChild, editor);
        return [id, id.toLowerCase()]
    }

    return [null, null]
}

/**
 * All of the predefined items which come bundled with PBasic
 */
const predefined = [
    // input variables
    "in0", "in1", "in2", "in3", "in4", "in5", "in6", "in7", "in8", "in9"
]

/**
 * Get all definitions that occur in a syntax node.
 */
function getDefinitions(node: SyntaxNode, editor: EditorState)
{
    // Prefill with predefined variables
    let defs = {} as Definitions

    predefined.forEach(x => {
        defs[x] = {from: 0, to: 0}
    })

    // Internal function: implements the recursion
    function loadDefinitions(node: SyntaxNode)
    {
        // Check if there is a defident at this node
        const [, id] = extractDefident(node, editor);

        if(id)
        {
            // If this is a new defident, add it with this positioning
            if(!defs[id]) 
                defs[id] = {from: node.from, to: node.to}
        }
        else 
        {
            // Iterate through child nodes and load their definitions
            let child = node.firstChild
            while(child !== null)
            {
                loadDefinitions(child)
                child = child.nextSibling
            }
        }
    }

    loadDefinitions(node)
    return defs
}

/**
 * Gets the set of style tags for PBasic.
 * This exists to allow for algorithmic modifications of the style tag list
 * compared to an object literal.
 */
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

/**
 * The PBasic language instance
 */
export const PBasic = LRLanguage.define({
    name: 'pbasic',
    parser: parser.configure({
    props: [
        styleTags(getStyleTags()),
        foldNodeProp.add({
            Loop: foldInside,
            UntilLoop: foldInside,
            WhileLoop: foldInside,

            For: foldInside,

            If: foldInside,
            Elseif: foldInside,
            Else: foldInside,

            Select: foldInside,
            Case: foldInside,
            CaseElse: foldInside,
            
            DataLit: n => ({ from: n.from ?? 0, to: n.to ?? 0 }),

            Label: n => {
                // TODO: understand why this code refused to run
                let r: SyntaxNode | null = n;
                while(r && ['Goto', 'Return'].findIndex(x => x === r?.type.name) === -1)
                {
                    r = r.nextSibling;
                    console.log(r);
                }

                if(!r) return null;

                return {from: n.from, to: r?.to};
            }
        })
    ]
    }),
    languageData: {
        commentTokens: {line: "'"}
    }
})

/**
 * The base completion map which will be added onto when definitions
 * are factored in.
 */
const pbasicCompletionMap = [
    ...kws      .map(x => {return {label: x.toUpperCase(), type: "keyword"}}),
    ...formatKWs.map(x => {return {label: x.toUpperCase(), type: "keyword"}})
]

/**
 * The getter for all completions, including definitions, somewhere in a document.
 */
function completions(context: CompletionContext)
{
    // Do not suggest inside of a comment
    if(context.tokenBefore(['Comment']) !== null)
        return null;

    // Get the definitions. 
    // TODO: This should be memoized, if possible.
    const tree = syntaxTree(context.state);
    const definitions = getDefinitions(tree.topNode, context.state);

    // Get the completions associated with the given definitions.
    const defCompletes = Object.keys(definitions).map(x => ({label: x, type: "variable"}));

    // Return the completions using the complete from list predefined.
    return completeFromList(pbasicCompletionMap.concat(defCompletes))(context)
}

/**
 * The completion extension for PBasic.
 */
const pbasicCompletion = PBasic.data.of({
    autocomplete: completions
})

/**
 * The linter extension for PBasic.
 */
const pbasic_linter = linter(view => {

    let diagnostics: Diagnostic[] = []

    // Get the definitions.
    // TODO: This should be memoized, if possible.
    const tree = syntaxTree(view.state);
    const definitions = getDefinitions(tree.topNode, view.state);

    // Iterate through the syntax tree.
    tree.cursor().iterate(node => {
        // Report invalid syntax
        if (node.name == "⚠") diagnostics.push({
            from: node.from,
            to: node.to,
            severity: "error",
            message: "Invalid syntax"
        })
        // Report unknown identifiers
        else if (node.name == "Identifier") {
            const id = getNodeText(node.node, view.state)

            if(!definitions[id.toLowerCase()]) diagnostics.push({
                from: node.from,
                to: node.to,
                severity: "error",
                message: `Unknown item ${id}`
            })
        }
        // Handle all other nodes
        else {
            // If this node is a definition syntax
            const [txt, id] = extractDefident(node.node, view.state);

            if(id)
            {
                // Report double definitions
                if(definitions[id].from !== node.from || definitions[id].to !== node.to) diagnostics.push({
                    from: node.from,
                    to: node.to,
                    severity: "error",
                    message: `Double definition of item ${txt}`
                })
            }
        }
    })

    return diagnostics
})

/**
 * The language support instance for PBasic.
 */
export function pbasic() {
    return new LanguageSupport(PBasic, [pbasicCompletion, pbasic_linter])
}