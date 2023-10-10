import { Stack } from "@lezer/lr"
import * as fs from "fs"

// read keywords from grammar file
function readKeywords(grammar: string): string[]
{
    const match = grammar.match(/\[\[START KEYWORDS\]\]/);

    if(match === null) 
        return [];

    let {index: start} = match;
    start = start || 0;

    const keywords = grammar.substring(start).match(/[\w\d_]+KW/g);

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
        // TODO: how can i include this in a portable way?
        fs.readFileSync('src/syntax.grammar').toString()
    )
);

console.log(kwMap);

// actual specialization logic
export function keyword(value: string, stack: Stack) 
{
    const key = value.toLowerCase();
    if(kwMap[key]) return kwMap[key];
    
    return -1;
};