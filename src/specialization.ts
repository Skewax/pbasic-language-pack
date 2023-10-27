import { Stack } from "@lezer/lr"
import grammar_text from "./syntax.grammar.txt"

/**
 * Read keywords in a provided group from the given grammar.
 */
function readKeywords(header_name: string, grammar: string): string[]
{
    // Get the text inside the given header
    const start = `START ${header_name}`
    const end = `END ${header_name}`

    const start_index = grammar.match(start)?.index
    const end_index = grammar.match(end)?.index

    const match = grammar.substring(start_index ?? 0, end_index)

    // Get all keywords defined within the region
    const keywords = match.match(/[\w\d_]+KW/gm)

    // If none were found, return empty
    if(keywords === null)
    {
        return []
    }

    // For each keyword found, modify it to be in lowercase, 
    // keyword-only form.
    keywords.forEach((value, index) => 
    {
        keywords[index] = value
            .substring(0, value.length - 2)
            .toLowerCase()
    })

    return keywords
}

/**
 * Convert the given word list to a term map
 */
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

/**
 * An associative map of terms to ids
 */
type TermMap = {[name: string]: number};

// Standard keyword map
export const kws = readKeywords(
    'KEYWORDS', grammar_text
);
export const kwTypes = kws.map(x => x.at(0)?.toUpperCase() + x.substring(1) + 'KW');

const kwMap: TermMap = convertToTermMap(kws);

// Format keyword map
export const formatKWs = readKeywords(
    'FORMAT KEYWORDS', grammar_text
);
export const formatKWTypes = formatKWs.map(x => x.at(0)?.toUpperCase() + x.substring(1) + 'KW');

const formatKwMap: TermMap = convertToTermMap(formatKWs, kws.length);

/**
 * Specialize for standard keywords
 */
export function keyword(value: string, stack: Stack) 
{
    const key = value.toLowerCase();
    if(kwMap[key]) return kwMap[key];
    
    return -1;
};

/**
 * Specialize for format keywords
 */
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