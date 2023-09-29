import { Stack } from "@lezer/lr"
import { kws } from "./keywords.json"

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

const kwMap: TermMap = convertToTermMap(kws);

export function keyword(value: string, stack: Stack) 
{
    const key = value.toLowerCase();
    if(kwMap[key]) return kwMap[key];
    
    return -1;
};