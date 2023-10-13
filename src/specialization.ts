import { Stack } from "@lezer/lr"
import * as fs from "fs"

// read keywords from grammar file
function readKeywords(header_name: string, grammar: string): string[]
{
    const reg = RegExp(
        `\\[\\[START ${header_name}\\]\\].+\\[\\[END ${header_name}\\]\\]`
    );
    const match = grammar.match(reg);

    if(match === null) 
        return [];

    const keywords = match[0].match(/[\w\d_]+KW/g);

    if(keywords === null)
        return [];

    keywords.forEach((value, index) => 
    {
        keywords[index] = value
            .substring(0, value.length - 2)
            .toLowerCase();
    });

    return keywords;
}

// convert string list to mapping
function convertToTermMap(arr: string[]): TermMap
{
    let out: TermMap = {};

    for(let i = 0; i < arr.length; i++)
    {
        out[arr[i]] = i + 1;
    }

    return out;
}

type TermMap = {[name: string]: number};

// read keyword map
const kwMap: TermMap = convertToTermMap(
    readKeywords(
        'KEYWORDS',
        // TODO: how can i include this in a portable way?
        fs.readFileSync('src/syntax.grammar').toString()
    )
);
const formatKwMap: TermMap = convertToTermMap(
    readKeywords(
        'FORMAT KEYWORDS',
        // TODO: how can i include this in a portable way?
        fs.readFileSync('src/syntax.grammar').toString()
    )
);

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