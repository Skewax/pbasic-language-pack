import {parser} from "./syntax.grammar";
import {SyntaxNodeRef} from "@lezer/common";
import * as fs from "fs";

//⚠ == oopsie

function debug_file(file: string) {
    
    console.log("Debugging " + file + "\n" + "-".repeat(50));

    const filetext = fs.readFileSync("example-code/" + file).toString();
    const tree = parser.parse(filetext);
  
    let indent = 0;
    let out = "";
  
    tree.iterate({
        enter: function(node: SyntaxNodeRef)
        {
            out += "\n" + "  ".repeat(indent) + node.name;
    
            if(node.node.firstChild)
            {
                out += "(";
                indent++;
            }
            else 
            {
                out += ": '" + filetext.substring(node.to, node.from) + "'";
            }
        },
    
        leave: function(node: SyntaxNodeRef)
        {
            // exit on no children
            if(node.node.firstChild) 
            {
                out += ")";
                indent--;
            }
    
            if(node.node.nextSibling) out += ", ";
            else out += "\n" + "  ".repeat(Math.max(indent - 1, 0))
        }
    });
  
    console.log(out + "-".repeat(50));
}

export function run_examples() {
    let to_run = []

    if(process.argv.length === 3)
    {
        to_run = fs.readdirSync("./example-code");
    }
    else 
    {
        to_run = process.argv.slice(3);
    }

    for(let file of to_run)
    {
        debug_file(file);
    }
}