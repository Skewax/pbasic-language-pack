import { CompletionContext, autocompletion, completeFromList } from "@codemirror/autocomplete";
import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent, syntaxTree, foldCode, foldAll, languageDataProp, defineLanguageFacet} from "@codemirror/language"
import {Tag, styleTags, tags as t} from "@lezer/highlight"
import { formatKWTypes, formatKWs, kwTypes, kws } from "./specialization";
import { Diagnostic, linter } from "@codemirror/lint";
import { hoverTooltip } from "@codemirror/view"

/**
 * The unmodified parser for PBasic
 */
export const pbasic_parser = parser;

type SyntaxNode = Parameters<typeof foldInside>[0];
// huh?
type Extract<T> = T extends {[selector: string]: infer U} ? U : never;
export type EditorState = Parameters<Extract<Parameters<typeof foldNodeProp.add>[0]>>[1];

type BasicType = 'bit' | 'byte' | 'word' | 'label';
interface ArrayType {
    key: 'array'
    type: BasicType,
    size: number
}
interface ConstType {
    key: 'const',
    type: 'con' | 'pin'
    value: number
}

type Type = BasicType | ArrayType | ConstType;

type Declarator = 'Label' | 'Var' | 'Con' | 'Pin' | 'Data';

interface Definition {

    name: string,
    case_name: string,
    type: Type,

    from: number,
    to: number,

    doc?: string | null,
    declarator: Declarator

}
type Definitions = {[name: string]: Definition};

function isBasicType(type: Type): type is BasicType 
{
    return typeof(type) === 'string'
}
function isNonconstType(type: Type): type is BasicType | ArrayType
{
    return typeof(type) === 'string' || type.key === 'array'
}

function typeToString(type: Type): string
{
    if (typeof(type) !== 'string')
    {
        if(type.key == 'array')
            return `${typeToString(type.type)}(${type.size})`;
        else return type.value.toString()
    }

    return type.toUpperCase()
}

/**
 * Get the literal text of some node.
 */
const getNodeText = (node: SyntaxNode | null, editor: EditorState) => 
    editor.doc.sliceString(node?.from ?? 0, node?.to ?? 0);

function parseType(node: SyntaxNode, editor: EditorState): Type
{
    if(node.name === "ArrayType")
    {
        if(!node.firstChild)
            throw "unreachable"
        if(!node.lastChild?.prevSibling)
            throw "unreachable"

        const type = parseType(node.firstChild, editor)
        const sizeTxt = getNodeText(node.lastChild.prevSibling, editor)
        const size = Number.parseInt(sizeTxt)

        return {key: 'array', type: type as BasicType, size: size}
    }

    return getNodeText(node, editor) as BasicType
}

/**
 * Extract a 'defident' if one exists within a node.
 * @returns [raw_text, ident, type, doc] if the defident was found, [null, null, null, null] otherwise
 */
function extractDefident(node: SyntaxNode, editor: EditorState): 
    [string | null, string | null, Type | null, string | null, Declarator | null]
{
    let doc: string | null = null

    if(node.prevSibling?.name === "Comment")
    {
        const txt = getNodeText(node.prevSibling, editor)

        if (txt.startsWith("''"))
        {
            doc = txt.substring(2)
        }
    }

    if(node.name === 'VarDecl')
    {
        if (!node.lastChild)
            throw "variable declarations must have a last child (their type)"

        const id = getNodeText(node.firstChild, editor)
        const ty = parseType(node.lastChild, editor)

        return [id, id.toLowerCase(), ty, doc, 'Var']
    }

    if(node.name === 'PinDecl'
    || node.name === 'ConDecl')
    {
        const id = getNodeText(node.firstChild, editor)
        const value = getNodeText(node.lastChild, editor)

        const type = {
            key: 'const', 
            type: node.name === 'PinDecl' ? 'pin' : 'con', 
            value: Number.parseInt(value)
        } as ConstType

        return [id, id.toLowerCase(), type, doc, node.name.substring(0, 3) as Declarator]
    }

    if(node.name === 'Label')
    {
        const id = getNodeText(node.firstChild, editor)
        return [id, id.toLowerCase(), 'label', doc, 'Label']
    }

    if(node.name === 'DataDecl' && node.firstChild?.name === 'Defident')
    {
        const id = getNodeText(node.firstChild, editor)
        return [id, id.toLowerCase(), 'word', doc, 'Data']
    }

    return [null, null, null, null, null]
}

/**
 * All of the predefined items which come bundled with PBasic
 */
const predefined: {name: string, case_name: string, type: Type, doc?: string | null}[] = [
    // input variables
    {name: "in0", case_name: "IN0", type: "word"},
    {name: "in1", case_name: "IN1", type: "word"},
    {name: "in2", case_name: "IN2", type: "word"},
    {name: "in3", case_name: "IN3", type: "word"},
    {name: "in4", case_name: "IN4", type: "word"},
    {name: "in5", case_name: "IN5", type: "word"},
    {name: "in6", case_name: "IN6", type: "word"},
    {name: "in7", case_name: "IN7", type: "word"},
    {name: "in8", case_name: "IN8", type: "word"},
    {name: "in9", case_name: "IN9", type: "word"}
]

/**
 * Get all definitions that occur in a syntax node.
 */
function getDefinitions(node: SyntaxNode, editor: EditorState)
{
    // Prefill with predefined variables
    let defs = {} as Definitions

    predefined.forEach(x => {
        defs[x.name] = {...x, from: 0, to: 0, declarator: 'Var'}
    })

    // Internal function: implements the recursion
    function loadDefinitions(node: SyntaxNode)
    {
        // Check if there is a defident at this node
        const [txt, id, type, doc, decl] = extractDefident(node, editor);

        if(id && txt && type && decl)
        {
            // If this is a new defident, add it with this positioning
            if(!defs[id]) 
                defs[id] = {
                    name: id, 
                    case_name: txt, 
                    type: type, 
                    from: node.from, 
                    to: node.to, 
                    doc: doc, 
                    declarator: decl
                }
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
                console.log("AAAAAAAAAAAAAAAAAA")

                while(r && r.name !== "Goto" && r.name !== "Return")
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
    const defCompletes = Object.values(definitions).map(x => ({label: x.case_name, type: "variable"}));

    // Return the completions using the complete from list predefined.
    return completeFromList(pbasicCompletionMap.concat(defCompletes))(context)
}

/**
 * The completion extension for PBasic.
 */
const pbasicCompletion = PBasic.data.of({
    autocomplete: completions
})

const pbasicHover = hoverTooltip((view, pos, side) => {
    // TODO: this better
    const tree = syntaxTree(view.state);
    const definitions = getDefinitions(tree.topNode, view.state);

    // Find definition containing this position.
    const node_here = tree.cursorAt(pos, side).node

    if (node_here.name !== "Identifier")
        return null

    const id = getNodeText(node_here, view.state).toLowerCase()

    if(!definitions[id])
        return null

    return {
        pos: node_here.from,
        end: node_here.to,
        above: true,
        create(view)
        {
            let txt = definitions[id].declarator.toUpperCase() + ' ' 
                + definitions[id].case_name

            if (definitions[id].type !== 'label')
            {
                if (isNonconstType(definitions[id].type)) txt += ': '
                else                                      txt += " = " 

                txt += typeToString(definitions[id].type)
            }

            if (definitions[id].doc)
                txt += ` '' ${definitions[id].doc}`

            return typeHoverDOMProvider(view.state, txt)
        }
    }
})

export let typeHoverDOMProvider = (view: EditorState, text: string) => 
{
    let dom = document.createElement('div')
    dom.textContent = text
    return {dom}
}

/**
 * The linter extension for PBasic.
 */
const pbasicLinter = linter(view => {

    let diagnostics: Diagnostic[] = []

    // Get the definitions.
    // TODO: This should be memoized, if possible.
    const tree = syntaxTree(view.state);
    const definitions = getDefinitions(tree.topNode, view.state);

    // Iterate through the syntax tree.
    tree.cursor().iterate(node => {
        // Report invalid syntax
        if (node.name === "⚠") diagnostics.push({
            from: node.from,
            to: node.to,
            severity: "error",
            message: "Invalid syntax"
        })
        // Report unknown identifiers
        else if (node.name === "Identifier") {
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
    return new LanguageSupport(PBasic, [pbasicCompletion, pbasicLinter, pbasicHover])
}