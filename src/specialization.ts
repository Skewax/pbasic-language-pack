import { Stack } from "@lezer/lr"
import grammar_text from "./syntax.grammar.txt"

// read keywords from grammar file
function readKeywords(header_name: string, grammar: string): string[]
{
    const start = `START ${header_name}`
    const end = `END ${header_name}`

    const start_index = grammar.match(start)?.index;
    const end_index = grammar.match(end)?.index;

    const match = grammar.substring(start_index ?? 0, end_index)

    const keywords = match.match(/[\w\d_]+KW/gm);
    console.log(keywords);

    if(keywords === null)
    {
        return [];
    }

    keywords.forEach((value, index) => 
    {
        keywords[index] = value
            .substring(0, value.length - 2)
            .toLowerCase();
    });

    return keywords;
}

// convert string list to mapping
function convertToTermMap(arr: string[], offset?: number | null): TermMap
{
    offset = offset ?? 0;

    let out: TermMap = {};

    for(let i = 0; i < arr.length; i++)
    {
        out[arr[i]] = i + 1 + offset;
    }

    return out;
}

type TermMap = {[name: string]: number};

// read keyword map
export const kws = readKeywords(
    'KEYWORDS', grammar_text
);
export const kwTypes = kws.map(x => x.at(0)?.toUpperCase() + x.substring(1) + 'KW');

const kwMap: TermMap = convertToTermMap(kws);

export const formatKWs = readKeywords(
    'FORMAT KEYWORDS', grammar_text
);
export const formatKWTypes = formatKWs.map(x => x.at(0)?.toUpperCase() + x.substring(1) + 'KW');

const formatKwMap: TermMap = convertToTermMap(formatKWs, kws.length);

// actual specialization logic
export function keyword(value: string, stack: Stack) 
{
    const key = value.toLowerCase();
    if(kwMap[key]) return kwMap[key];
    
    return -1;
};

export function format_keyword(value: string, stack: Stack) 
{
    let key = value.toLowerCase();

    // remove ending digits
    while(/\d/.test(key[key.length - 1]))
    {
        key = key.substring(0, key.length - 1);
    }

    if(formatKwMap[key]) return formatKwMap[key];
    
    return -1;
};