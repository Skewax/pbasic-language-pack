import { completeFromList } from '@codemirror/autocomplete';
import { LRParser } from '@lezer/lr';
import { LRLanguage, foldNodeProp, foldInside, syntaxTree, LanguageSupport } from '@codemirror/language';
import { styleTags, tags } from '@lezer/highlight';
import { linter } from '@codemirror/lint';
import { hoverTooltip } from '@codemirror/view';

var grammar_text = "@top Program { stmt* stmt_nosep? }\r\n\r\n// NOTE TO SELF: HANDLE FILE \r\n// C:\\Users\\rafaed\\Downloads\\Archive.zip\\Robotics 0\\simplified navigation\r\n\r\n@skip { space | Comment }\r\n\r\nstmt { stmt_nosep? stmt_sep | Preprocessor }\r\nstmt_sep { newline | \":\" }\r\nstmt_nosep { \r\n\r\n  Debugin |\r\n  Debug |\r\n\r\n  Serin |\r\n  Serout |\r\n\r\n  I2CIn |\r\n  I2COut |\r\n\r\n  Owin |\r\n  Owout |\r\n\r\n  Lcdin |\r\n  Lcdout |\r\n  Lcdcmd |\r\n\r\n  For | \r\n  any_loop | \r\n  If |\r\n  Select |\r\n\r\n  VarDecl | \r\n  PinDecl | \r\n  ConDecl |\r\n  DataDecl |\r\n\r\n  Branch |\r\n  OnGosub |\r\n  OnGoto |\r\n\r\n  Return | \r\n  Goto | \r\n  Gosub | \r\n\r\n  End |\r\n  Exit |\r\n  Stop |\r\n\r\n  Pause |\r\n  Nap |\r\n  Sleep |\r\n\r\n  Button |\r\n  RCTime |\r\n\r\n  Pollin | \r\n  Pollout |\r\n  Pollrun |\r\n  Pollwait |\r\n  Pollmode |\r\n\r\n  Compare |\r\n\r\n  High |\r\n  Low |\r\n  Toggle |\r\n\r\n  PWM |\r\n  Random |\r\n\r\n  Input |\r\n  Output |\r\n  Reverse |\r\n\r\n  Configpin |\r\n  Count |\r\n\r\n  Auxio |\r\n  Mainio |\r\n  Ioterm |\r\n\r\n  Freqout |\r\n  Pulsout |\r\n  Pulsin |\r\n\r\n  Read |\r\n  Write |\r\n  Lookup |\r\n  Lookdown |\r\n\r\n  Get | \r\n  Put |\r\n\r\n  Store |\r\n  Run |\r\n\r\n  XOut |\r\n  DTMFOut |\r\n\r\n  Assignment |\r\n\r\n  ShiftIn |\r\n  ShiftOut |\r\n\r\n  Label\r\n}\r\n\r\n// declarations\r\nConDecl { Defident ConKW term }\r\nPinDecl { Defident PinKW term }\r\nVarDecl { Defident VarKW type }\r\n\r\nDataDecl { Defident? DataKW DataLit }\r\nDataLit { comma_sep<DataAlloc | (WordKW? expr ~data_alloc) | DataLoc> | String }\r\nDataLoc { \"@\" DecimalInt }\r\n\r\n// TODO: this conflicts very oddly with ArrayIndex! How should this be approached?\r\nDataAlloc { WordKW? lit ~data_alloc \"(\" DecimalInt \")\" }\r\n\r\n// control flow\r\n\r\n// for loops\r\nFor { \r\n  ForHeader\r\n    stmt+ \r\n  NextKW \r\n}\r\nForHeader { ForKW Identifier \"=\" expr ToKW expr (StepKW expr)? }\r\n\r\n// loops with \"do\"\r\nany_loop { LoopUntil | UntilLoop | LoopWhile | WhileLoop | Loop }\r\n\r\nLoop { DoKW stmt+ LoopKW }\r\nUntilLoop { DoUntil stmt+ LoopKW }\r\nWhileLoop { DoWhile stmt+ LoopKW }\r\nLoopUntil { Loop Until }\r\nLoopWhile { Loop While }\r\n\r\nDoUntil { DoKW Until }\r\nDoWhile { DoKW While }\r\n\r\nUntil { UntilKW Logical }\r\nWhile { WhileKW Logical }\r\n\r\n// if statements\r\nIfTail { Elseif | Else | EndifKW }\r\n\r\nIf { IfKW Logical ThenKW stmt* IfTail }\r\nElseif { ElseifKW Logical ThenKW stmt* IfTail }\r\nElse { ElseKW stmt* EndifKW }\r\n\r\n// select statements\r\nSelect { SelectKW expr Case+ CaseElse? EndselectKW }\r\nCase { CaseLabel stmt* }\r\nCaseElse { CaseElseLabel stmt* }\r\n\r\nCaseLabel { CaseKW comma_sep<pattern> }\r\nCaseElseLabel { CaseKW ElseKW }\r\n\r\n// branchers\r\nBranch { BranchKW expr \",\" \"[\" comma_sep<Identifier> \"]\" }\r\nOnGosub { OnKW expr GosubKW comma_sep<Identifier> }\r\nOnGoto { OnKW expr GotoKW comma_sep<Identifier> }\r\n\r\n// labels\r\nLabel { Defident \":\" }\r\n\r\n// general commands\r\n\r\n// io commands\r\nDebugin { DebuginKW InputFormatExpr }\r\nDebug { DebugKW comma_sep<OutputFormatExpr> }\r\n\r\nSerin { SerinKW ser_args<InputFormatExpr> }\r\nSerout { SeroutKW ser_args<OutputFormatExpr> }\r\n\r\nser_args<fmt> {\r\n  expr (\"\\\\\" expr)? \",\"      // rpin{\\fpin}\r\n  expr \",\"                   // baudmode\r\n  (Identifier ~ plabel \",\")?          // {plabel}\r\n  (expr ~ plabel \",\" Identifier \",\")? // {timeout, tlabel}\r\n  \"[\" comma_sep<fmt> \"]\"     // format args\r\n}\r\n\r\nI2CIn { I2CInKW i2c_args<InputFormatExpr> }\r\nI2COut { I2COutKW i2c_args<OutputFormatExpr> }\r\n\r\ni2c_args<fmt> { \r\n  expr \",\"                  // pin \r\n  expr \",\"                  // slave id\r\n  (expr (\"\\\\\" expr)? \",\")?  // address / lowaddress\r\n  \"[\" comma_sep<fmt> \"]\"    // formatting data\r\n}\r\n\r\nOwin { OwinKW simple_io_args<InputFormatExpr> }\r\nOwout { OwoutKW simple_io_args<OutputFormatExpr> }\r\n\r\nLcdin { LcdinKW simple_io_args<InputFormatExpr> }\r\nLcdout { LcdoutKW simple_io_args<OutputFormatExpr> }\r\nLcdcmd { LcdcmdKW expr \",\" expr }\r\n\r\nsimple_io_args<fmt> { \r\n  expr \",\"               // pin \r\n  expr \",\"               // mode\r\n  \"[\" comma_sep<fmt> \"]\" // formatting data\r\n}\r\n\r\n// pause time\r\nPause { PauseKW expr }\r\n// nap time\r\nNap { NapKW expr }\r\n// sleep time\r\nSleep { SleepKW expr }\r\n\r\nCompare { CompareKW expr \",\" Identifier }\r\n\r\n// input\r\nInput { InputKW expr }\r\n// output\r\nOutput { OutputKW expr }\r\n// reverse\r\nReverse { ReverseKW expr }\r\n\r\nConfigpin { ConfigPinKW expr \",\" expr }\r\nCount { CountKW expr \",\" expr \",\" Identifier }\r\n\r\n// button pin, downstate, delay, rate, workspace,\r\n//      targetstate, address\r\nButton {\r\n  ButtonKW \r\n    expr \",\"        //pin\r\n    expr \",\"        //downstate\r\n    expr \",\"        //delay\r\n    expr \",\"        //rate\r\n    Identifier \",\"  //workspace\r\n    expr \",\"        //targetstate\r\n    Identifier      //address\r\n}\r\n// rctime pin, state, var\r\nRCTime { RCTimeKW lit \",\" lit \",\" Identifier }\r\n\r\nPollin { PollinKW expr \",\" expr }\r\nPollout { PolloutKW expr \",\" expr }\r\nPollrun { PollrunKW expr }\r\nPollwait { PollwaitKW expr }\r\nPollmode { PollmodeKW expr }\r\n\r\n// high pin\r\nHigh { HighKW expr }\r\n// low pin\r\nLow { LowKW expr }\r\n// low pin\r\nToggle { ToggleKW expr }\r\n\r\nPWM { PwmKW expr \",\" expr \",\" expr }\r\nRandom { RandomKW Identifier }\r\n\r\n// read data_ref, [type] variable\r\nRead { ReadKW expr \",\" comma_sep<WordKW? Identifier> }\r\nWrite { WriteKW expr \",\" comma_sep<WordKW? expr> }\r\n\r\nLookup { \r\n  LookupKW expr \",\" LookupTarget \",\" Identifier\r\n}\r\nLookdown { \r\n  LookdownKW expr comp_op? \",\" LookupTarget \",\" Identifier\r\n}\r\n\r\nLookupTarget {\r\n  \"[\" String \"]\" |\r\n  \"[\" comma_sep<lit> \"]\"\r\n}\r\n\r\nGet { GetKW expr \",\" comma_sep<WordKW? Identifier> }\r\nPut { PutKW expr \",\" comma_sep<WordKW? Identifier> }\r\n\r\nRun { RunKW expr }\r\nStore { StoreKW expr }\r\n\r\nFreqout { FreqoutKW expr \",\" expr \",\" expr }\r\nPulsout { PulsoutKW expr \",\" expr }\r\nPulsin { PulsinKW expr \",\" expr \",\" Identifier }\r\n\r\nAuxio { AuxioKW }\r\nMainio { MainioKW }\r\nIoterm { IotermKW expr }\r\n\r\nReturn { ReturnKW }\r\nGoto { GotoKW Identifier }\r\nGosub { GosubKW Identifier }\r\n\r\nEnd { EndKW }\r\nExit { ExitKW }\r\nStop { StopKW }\r\n\r\nAssignment { (ArrayIndex<Identifier> | Identifier) \"=\" expr }\r\n\r\nXOut {\r\n  XOutKW expr \",\" expr \",\" \"[\" comma_sep<XOutParam> \"]\"\r\n}\r\n\r\nXOutParam {\r\n  expr \"\\\\\" expr (\"\\\\\" expr)?\r\n}\r\n\r\nShiftIn { \r\n  ShiftInKW expr \",\" //dpin \r\n    expr \",\"         //cpin \r\n    expr \",\"         //mode \r\n    \"[\" comma_sep<ShiftArg> \"]\" //shift args\r\n}\r\nShiftOut { \r\n  ShiftOutKW expr \",\" //dpin \r\n    expr \",\"          //cpin \r\n    expr \",\"          //mode \r\n    \"[\" comma_sep<ShiftArg> \"]\" //shift args\r\n}\r\n\r\nShiftArg { Identifier (\"\\\\\" expr)? }\r\n\r\nDTMFOut { \r\n  DTMFOutKW expr \",\"        // pin\r\n    (expr \",\" expr)?        // on-off time\r\n    \"[\" comma_sep<expr> \"]\" // tones\r\n}\r\n\r\n// debug expressions are wacky\r\n\r\n// see 'serin' documentation\r\nInputFormatExpr\r\n{\r\n  (std_format_header | NumKW | SNumKW) Identifier |\r\n  StrKW Identifier \"\\\\\" DecimalInt (\"\\\\\" DecimalInt)? |\r\n  WaitStrKW Identifier (\"\\\\\" DecimalInt)? |\r\n  SkipKW expr |\r\n  SpstrKW expr \r\n}\r\nOutputFormatExpr \r\n{\r\n  std_format_header \"?\"? expr |\r\n  AscKW \"?\" expr |\r\n  StrKW \"?\"? expr (\"\\\\\" expr)? |\r\n  RepKW expr \"\\\\\" expr |\r\n  \"?\" ? expr |\r\n  String\r\n}\r\nstd_format_header {\r\n  DecKW | SDecKW |\r\n  HexKW | SHexKW | IHexKW | ISHexKW |\r\n  BinKW | SBinKW | IBinKW | ISBinKW\r\n}\r\n\r\n// patterns\r\npattern { ValuePattern | ComparisonPattern | RangePattern }\r\n\r\nValuePattern { term }\r\nComparisonPattern { comp_op term }\r\nRangePattern { term ToKW term }\r\n\r\n// logical expressions are distinct\r\nLogical { logical_term ((AndKW | XorKW | OrKW) logical_term)* }\r\nlogical_term {Not | Condition | Paren_Logical}\r\nParen_Logical { \"(\" Logical \")\" }\r\nNot { NotKW Condition }\r\nCondition { term comp_op term }\r\n\r\ncomp_op { \"=\" | \">\" | \"<\" | \">=\" | \"<=\" | \"<>\" }\r\n\r\n// simple expressions\r\nexpr { Arith | term | CrKW }\r\n\r\nArith { term (math_op term)+ }\r\nmath_op { Plus | Minus | Mult | Divide | Mult100 | Divide100 | Shl | Shr }\r\n\r\n// terms and literals\r\nterm { ArrayIndex<term> | lit | paren }\r\n\r\nArrayIndex<base> { base \"(\" expr \")\" }\r\nlit { LowByte | HighByte | Identifier | Number | Char }\r\n\r\nLowByte { Identifier \".\" LowByteKW }\r\nHighByte { Identifier \".\" HighByteKW }\r\n\r\nparen { \"(\" expr \")\" }\r\n\r\n// types \r\ntype { ArrayType | base_type }\r\nArrayType { base_type \"(\" DecimalInt \")\" }\r\nbase_type { BitKW | NibKW | ByteKW | WordKW }\r\n\r\n// general utilities\r\ncomma_sep<item> { item (\",\" newline* item)* }\r\nNumber { DecimalInt | binary_int | hex_int }\r\n\r\nDefident { Identifier }\r\n\r\n@tokens {\r\n  // Names\r\n  Identifier { $[a-zA-Z_] $[a-zA-Z_0-9]* }\r\n\r\n  // Numbers\r\n  DecimalInt { $[0-9]+ }\r\n  binary_int { \"%\" $[01]+ }\r\n  hex_int { \"$\" $[0-9A-Fa-f]+ }\r\n\r\n  // Text-based literals\r\n  Char { '\"' (![\"\\\\] | \"\\\\\" _) '\"' }\r\n  String { '\"' (![\"\\\\] | \"\\\\\" _) (![\"\\\\] | \"\\\\\" _)+ '\"' }\r\n\r\n  // Whitespace\r\n  Comment { \"'\" ![\\n]* }\r\n  space { $[ \\t]+ }\r\n  newline { $[\\n\\r]+ }\r\n\r\n  // Preprocessor\r\n  Preprocessor { \"#\" ![\\n]* }\r\n\r\n  // Operators\r\n  // arithmetics\r\n  Plus { '+' }\r\n  Minus { '-' }\r\n  Mult { '*' }\r\n  Divide { '/' }\r\n  Mult100 { '**' }\r\n  Divide100 { '/*' }\r\n  Shl { '>>' }\r\n  Shr { '<<' }\r\n\r\n  // comparison\r\n  \"=\"\r\n  \">\"\r\n  \"<\"\r\n  \">=\"\r\n  \"<=\"\r\n  \"<>\"\r\n\r\n  // misc characters\r\n  \",\"\r\n  \"(\"\r\n  \")\"\r\n  \"[\"\r\n  \"]\"\r\n  \"?\"\r\n  \":\"\r\n  \".\"\r\n  \"\\\\\"\r\n  \"@\"\r\n}\r\n\r\n// Keywords\r\n@external specialize {Identifier} keyword from \"./specialization.ts\" {\r\n\r\n  // [[START KEYWORDS]] //\r\n\r\n  DebugKW,\r\n  DebuginKW,\r\n\r\n  I2CInKW,\r\n  I2COutKW,\r\n\r\n  SerinKW,\r\n  SeroutKW,\r\n\r\n  OwinKW,\r\n  OwoutKW,\r\n\r\n  LcdinKW,\r\n  LcdoutKW,\r\n  LcdcmdKW,\r\n\r\n  BitKW,\r\n  NibKW,\r\n  ByteKW,\r\n  WordKW,\r\n\r\n  LowByteKW,\r\n  HighByteKW,\r\n\r\n  DataKW,\r\n\r\n  VarKW,\r\n  PinKW,\r\n  ConKW,\r\n\r\n  CrKW,\r\n\r\n  StrKW,\r\n  RepKW,\r\n  \r\n  NumKW,\r\n  SNumKW,\r\n  WaitStrKW,\r\n  SkipKW,\r\n  SpstrKW,\r\n\r\n  AscKW,\r\n\r\n  DoneKW,\r\n  ReturnKW,\r\n  EndKW,\r\n  ExitKW,\r\n  StopKW,\r\n\r\n  DoKW,\r\n  LoopKW,\r\n  WhileKW,\r\n  UntilKW,\r\n\r\n  ForKW,\r\n  ToKW,\r\n  StepKW,\r\n  NextKW,\r\n\r\n  IfKW,\r\n  ThenKW,\r\n  ElseKW,\r\n  ElseifKW,\r\n  EndifKW,\r\n\r\n  AndKW,\r\n  OrKW,\r\n  XorKW,\r\n  NotKW,\r\n\r\n  GotoKW,\r\n  GosubKW,\r\n\r\n  PauseKW,\r\n  NapKW,\r\n  SleepKW,\r\n\r\n  ButtonKW,\r\n  RCTimeKW,\r\n\r\n  PollinKW,\r\n  PolloutKW,\r\n  PollrunKW,\r\n  PollwaitKW,\r\n  PollmodeKW,\r\n\r\n  CompareKW,\r\n\r\n  HighKW,\r\n  LowKW,\r\n  ToggleKW,\r\n\r\n  PwmKW,\r\n  RandomKW,\r\n\r\n  InputKW,\r\n  OutputKW,\r\n  ReverseKW,\r\n\r\n  ConfigPinKW,\r\n  CountKW,\r\n\r\n  FreqoutKW,\r\n\r\n  PulsoutKW,\r\n  PulsinKW,\r\n\r\n  ReadKW,\r\n  WriteKW,\r\n  LookupKW,\r\n  LookdownKW,\r\n\r\n  GetKW,\r\n  PutKW,\r\n\r\n  RunKW,\r\n  StoreKW,\r\n\r\n  SelectKW,\r\n  EndselectKW,\r\n  CaseKW,\r\n\r\n  BranchKW,\r\n  OnKW,\r\n\r\n  AuxioKW,\r\n  MainioKW,\r\n  IotermKW,\r\n\r\n  XOutKW,\r\n  DTMFOutKW,\r\n\r\n  ShiftInKW,\r\n  ShiftOutKW\r\n  \r\n  // [[END KEYWORDS]] //\r\n\r\n}\r\n\r\n\r\n@external specialize {Identifier} format_keyword from \"./specialization.ts\" {\r\n\r\n  // [[START FORMAT KEYWORDS]] //\r\n\r\n  DecKW,\r\n  SDecKW,\r\n\r\n  HexKW,\r\n  SHexKW,\r\n  IHexKW,\r\n  ISHexKW\r\n\r\n  BinKW,\r\n  SBinKW,\r\n  IBinKW,\r\n  ISBinKW\r\n\r\n  // [[END FORMAT KEYWORDS]] //\r\n\r\n}";

/**
 * Read keywords in a provided group from the given grammar.
 */
function readKeywords(header_name, grammar) {
    var _a, _b;
    // Get the text inside the given header
    const start = `START ${header_name}`;
    const end = `END ${header_name}`;
    const start_index = (_a = grammar.match(start)) === null || _a === void 0 ? void 0 : _a.index;
    const end_index = (_b = grammar.match(end)) === null || _b === void 0 ? void 0 : _b.index;
    const match = grammar.substring(start_index !== null && start_index !== void 0 ? start_index : 0, end_index);
    // Get all keywords defined within the region
    const keywords = match.match(/[\w\d_]+KW/gm);
    // If none were found, return empty
    if (keywords === null) {
        return [];
    }
    // For each keyword found, modify it to be in lowercase, 
    // keyword-only form.
    keywords.forEach((value, index) => {
        keywords[index] = value
            .substring(0, value.length - 2)
            .toLowerCase();
    });
    return keywords;
}
/**
 * Convert the given word list to a term map
 */
function convertToTermMap(arr, offset) {
    offset = offset !== null && offset !== void 0 ? offset : 0;
    let out = {};
    for (let i = 0; i < arr.length; i++) {
        out[arr[i]] = i + 1 + offset;
    }
    return out;
}
// Standard keyword map
const kws = readKeywords('KEYWORDS', grammar_text);
const kwTypes = kws.map(x => { var _a; return ((_a = x.at(0)) === null || _a === void 0 ? void 0 : _a.toUpperCase()) + x.substring(1) + 'KW'; });
const kwMap = convertToTermMap(kws);
// Format keyword map
const formatKWs = readKeywords('FORMAT KEYWORDS', grammar_text);
const formatKWTypes = formatKWs.map(x => { var _a; return ((_a = x.at(0)) === null || _a === void 0 ? void 0 : _a.toUpperCase()) + x.substring(1) + 'KW'; });
const formatKwMap = convertToTermMap(formatKWs, kws.length);
/**
 * Specialize for standard keywords
 */
function keyword(value, stack) {
    const key = value.toLowerCase();
    if (kwMap[key])
        return kwMap[key];
    return -1;
}
/**
 * Specialize for format keywords
 */
function format_keyword(value, stack) {
    let key = value.toLowerCase();
    // remove ending digits
    while (/\d/.test(key[key.length - 1])) {
        key = key.substring(0, key.length - 1);
    }
    if (formatKwMap[key])
        return formatKwMap[key];
    return -1;
}

// This file was generated by lezer-generator. You probably shouldn't edit it.
const parser = LRParser.deserialize({
  version: 14,
  states: "!EpQYQPOOO%mQPO'#EoO&qQPO'#FVO(XQPO'#F[O(XQPO'#F_O(XQPO'#F`O(XQPO'#FaO(XQPO'#FbO(XQPO'#FcO(XQPO'#FdO(XQPO'#FeO(XQPO'#FfO(pQPO'#FhOYQPO'#FgO(uQPO'#FwO)PQPO'#IfOYQPO'#FvOYQPO'#FzOOQO'#If'#IfO)bQPO'#F|O(XQPO'#GQO)yQPO'#GZO*bQPO'#HkO*sQPO'#G_O(XQPO'#GdO(XQPO'#GeOOQO'#Gg'#GgO+QQPO'#GhO+VQPO'#GiOOQO'#Gj'#GjOOQO'#Gk'#GkOOQO'#Gl'#GlO(XQPO'#GmO(XQPO'#GnO(XQPO'#GoO(XQPO'#GpO+[QPO'#GqO(XQPO'#GrO(XQPO'#GsO(XQPO'#GtO(XQPO'#GuO(XQPO'#GvO(XQPO'#GwO(XQPO'#GxO(XQPO'#GyO(XQPO'#GzO(XQPO'#G{O+mQPO'#G|O(XQPO'#G}O(XQPO'#HOO(XQPO'#HPO(XQPO'#HQO(XQPO'#HROOQO'#HS'#HSOOQO'#HT'#HTO(XQPO'#HUO(XQPO'#HVO(XQPO'#HWO(XQPO'#HXO(XQPO'#HYO(XQPO'#HZO(XQPO'#H[O(XQPO'#H^O(XQPO'#H_O(XQPO'#H`O(XQPO'#HaO(XQPO'#HbO(XQPO'#HcO(XQPO'#HeO+rQPO'#HfO(XQPO'#HhO(XQPO'#HjOOQO'#IS'#ISOOQO'#Iu'#IuOOQO'#IR'#IRQ+wQPO'#IROOQO'#Hn'#HnQYQPOOOOQO'#IT'#ITO,PQPO'#EpO,UQPO'#EpO,ZQPO'#EpO(XQPO'#EpOOQO,5;Z,5;ZO-QQPO'#IUO3WQPO'#IWOOQO'#E{'#E{OOQO'#IW'#IWO(XQPO'#IZOOQO'#IV'#IVOOQO'#IU'#IUO8xQPO'#FWO9PQPO'#FWO9UQPO'#FWO(XQPO'#FWOOQO'#FW'#FWO(XQPO'#FWO9]QPO'#I]OOQO,5;q,5;qO9nQPO'#I_OOQO,5;v,5;vO9vQPO'#IaOOQO,5;y,5;yO:OQPO'#IbOOQO,5;z,5;zO:TQPO'#IcOOQO,5;{,5;{O:YQPO'#IdOOQO,5;|,5;|O:_QPO'#IeOOQO,5;},5;}OOQO,5<O,5<OOOQO,5<P,5<PO:dQPO,5<QO:iQPO,5<SO:nQPO,5<RO:uQPO,5<VO)bQPO'#FlOOQO,5<c,5<cO)bQPO'#FyOOQO,5<g,5<gOOQO,5<U,5<UOOQO,5<d,5<dO:|QPO,5<bO;TQPO,5<fO;[QPO'#FoO;sQPO'#IZO;zQPO'#FnOOQO'#Ig'#IgO<RQPO'#FmO@xQPO,5<hO@}QPO,5<lO(XQPO,5>RO(XQPO,5>QOASQPO,5<tO;zQPO,5<wO;zQPO,5<xO*sQPO,5<yOOQO,5>V,5>VOB]QPO'#IVO(XQPO'#ImOBdQPO'#GbOBiQPO'#ImOOQO'#G`'#G`OOQO,5<y,5<yOBwQPO,5=OOB|QPO,5=POOQO,5=S,5=SOOQO,5=T,5=TOOQO,5=X,5=XOOQO,5=Y,5=YOOQO,5=Z,5=ZOCUQPO,5=[OCZQPO,5=]OC`QPO,5=^OCeQPO,5=_OOQO,5=`,5=`OOQO,5=a,5=aOOQO,5=b,5=bOCjQPO,5=cOOQO,5=d,5=dOOQO,5=e,5=eOOQO,5=f,5=fOCoQPO,5=gOOQO,5=h,5=hOOQO,5=i,5=iOOQO,5=j,5=jOOQO,5=k,5=kOCtQPO,5=lOCyQPO,5=mOOQO,5=p,5=pODOQPO,5=qODTQPO,5=rODYQPO,5=sOD_QPO,5=tODdQPO,5=uODiQPO,5=vODnQPO,5=xODuQPO,5=yODzQPO,5=zOOQO,5={,5={OOQO,5=|,5=|OEPQPO,5=}OEUQPO,5>POEZQPO,5>SOE`QPO,5>UOOQO,5>m,5>mOOQO-E;l-E;lOOQO,5;[,5;[OEeQPO,5;[OEjQPO,5;[O(XQPO,5;aOOQO'#I['#I[O;zQPO'#HoOFjQPO,5;`OLOQPO,5;dOLWQPO,5>uOOQO,5;r,5;rO(XQPO,5;rOL]QPO,5;rO(XQPO,5;rOLqQPO,5;rOLvQPO'#HpOL}QPO,5>wO(XQPO,5>yO(XQPO,5>yO(XQPO,5>{O(XQPO,5>{O(XQPO,5>|O(XQPO,5>}O(XQPO,5?OO(XQPO,5?PO(XQPO1G1lO(XQPO1G1nOOQO1G1m1G1mOOQO1G1q1G1qOOQO,5<W,5<WOOQO,5<e,5<eOOQO1G1|1G1|OOQO1G2Q1G2QOOQO'#Ih'#IhO;zQPO,5<ZOM`QPO'#IUOMvQPO,5<aOOQO,5<Y,5<YO)bQPO'#HsOM{QPO,5<XO!$rQPO1G2SO!%PQPO'#GSO!%gQPO'#GROOQO'#Ht'#HtO!%qQPO1G2WO!%yQPO1G3mOOQO1G3l1G3lOOQO'#Il'#IlO!&OQPO'#IkOOQO'#Ik'#IkOOQO1G2`1G2`O!&^QPO1G2cO!&lQPO1G2dOOQO1G2e1G2eO!&zQPO,5<{O!'PQPO,5<{O!'WQPO,5?XOOQO,5<|,5<|O!'fQPO'#HvO!'WQPO,5?XO!'sQPO1G2jO!'xQPO1G2kO!'xQPO1G2lO(XQPO1G2vO+[QPO1G2wO(XQPO1G2xO(XQPO1G2yO!'}QPO1G2}O(XQPO1G3RO(XQPO1G3WO(XQPO1G3XO(XQPO1G3]O(XQPO1G3^O(XQPO1G3_O!(SQPO1G3`O!([QPO1G3aO!(cQPO1G3bO!(cQPO1G3dO!(hQPO1G3dO!(SQPO1G3eO!(SQPO1G3fO(XQPO1G3iO!(mQPO1G3kO(XQPO1G3nO(XQPO1G3pO!(tQPO1G0vO!(yQPO1G0vO!)OQPO1G0{O!)TQPO,5>ZOOQO-E;m-E;mOOQO1G1O1G1OOOQO1G1Q1G1QOOQO1G4a1G4aOOQO1G1^1G1^O(XQPO1G1^O!/SQPO1G1^OOQO'#Hq'#HqOLvQPO,5>[OOQO,5>[,5>[OOQO-E;n-E;nO!/hQPO1G4eO!/mQPO1G4eO!/rQPO1G4gO!/wQPO1G4gO!/|QPO1G4hO!0RQPO1G4iO!0WQPO1G4jO!0]QPO1G4kOOQO7+'W7+'WO!0bQPO7+'YO!0gQPO1G1uOOQO1G1{1G1{OOQO,5>_,5>_OOQO-E;q-E;qO)bQPO'#GOO!5aQPO'#GPOOQO'#F}'#F}OOQO7+'n7+'nO!$rQPO7+'nO!5hQPO'#GTO;zQPO'#GUOOQO'#Ij'#IjO!:[QPO'#IiOOQO,5<n,5<nO!>xQPO,5<mO!?SQPO'#GSOOQO-E;r-E;rO!?mQPO'#GWOOQO7+'r7+'rO!?tQPO7+'rOOQO7+)X7+)XO!?yQPO,5<vO!@OQPO1G2gO!@TQPO1G2gO!@YQPO1G4sO!@hQPO,5>bO(XQPO,5>bOOQO,5>b,5>bOOQO-E;t-E;tO!'xQPO7+(UO!@uQPO'#InOOQO7+(V7+(VOOQO7+(W7+(WO!AWQPO7+(bO!A]QPO7+(cOOQO7+(d7+(dOOQO7+(e7+(eOOQO7+(i7+(iO!AbQPO7+(mOOQO7+(r7+(rO!AgQPO7+(sO!AlQPO7+(wOOQO7+(x7+(xO!AqQPO7+(yO!AvQPO'#IoO!BUQPO'#IoOOQO7+(z7+(zO!BZQPO'#IpO(XQPO'#IpOOQO7+({7+({O!BiQPO'#H]O!BpQPO7+(|O!BuQPO7+)OO!(cQPO7+)OOOQO7+)P7+)POOQO7+)Q7+)QO!BzQPO7+)TO(XQPO7+)VO!CPQPO7+)VO!CUQPO7+)YO!CZQPO7+)[O!C`QPO7+&bOOQO7+&b7+&bOOQO7+&g7+&gOOQO7+&x7+&xO(XQPO7+&xOOQO-E;o-E;oOOQO1G3v1G3vO!DYQPO7+*PO(XQPO7+*PO!DdQPO7+*RO(XQPO7+*RO!DnQPO7+*SO!DuQPO7+*TO!D|QPO7+*UO!ERQPO7+*VO(XQPO<<JtO!EWQPO,5<jOOQO,5<k,5<kO!E]QPO,5<kOOQO<<KY<<KYO;zQPO,5<qO!EdQPO,5<pO!JTQPO'#HuO!JnQPO,5?TOOQO,5<s,5<sO# [QPO,5<rOOQO<<K^<<K^O# cQPO1G2bOOQO7+(R7+(RO# hQPO7+(RO(XQPO1G3|OOQO1G3|1G3|O# mQPO<<KpO# rQPO'#HwO# zQPO,5?YO(XQPO<<K|O#!]QPO<<K}O(XQPO<<LXO#!bQPO<<L_O(XQPO<<LcO#!gQPO<<LeO#!lQPO'#HxO#!wQPO,5?ZO#!wQPO,5?ZO##VQPO'#HyO##aQPO,5?[O##aQPO,5?[O##oQPO'#IqO##wQPO,5=wO##|QPO<<LhO#$RQPO<<LjO#$WQPO<<LjO#$]QPO<<LoO#$bQPO'#IsO#$jQPO<<LqO(XQPO<<LqO(XQPO<<LtO(XQPO<<LvO#$oQPO<<I|OOQO<<Jd<<JdO#$tQPO<<MkO%mQPO<<MkO#${QPO<<MkO#%QQPO<<MkO#%VQPO<<MmO&qQPO<<MmO#%^QPO<<MmO#%cQPO<<MmO%mQPO<<MnO#%hQPO<<MnO&qQPO<<MoO#%pQPO<<MoO%mQPO<<MpO&qQPO<<MqO#%xQPOAN@`O!$rQPO1G2UOOQO1G2V1G2VO#*`QPO1G2]O!JTQPO,5>aOOQO,5>a,5>aOOQO-E;s-E;sOOQO7+'|7+'|OOQO<<Km<<KmOOQO7+)h7+)hOOQOANA[ANA[O#/PQPO,5>cOOQO,5>c,5>cOOQO-E;u-E;uO#/XQPOANAhOOQOANAiANAiOOQOANAsANAsOOQOANAyANAyOOQOANA}ANA}OOQOANBPANBPO#/^QPO,5>dOOQO,5>d,5>dO#/iQPO,5>dOOQO-E;v-E;vO#/nQPO1G4uO#/|QPO,5>eOOQO,5>e,5>eO(XQPO,5>eOOQO-E;w-E;wO#0WQPO1G4vO#0fQPO'#HzO#0mQPO,5?]OOQO1G3c1G3cOOQOANBSANBSOOQOANBUANBUO#0uQPOANBUO(XQPOANBZO!'lQPO'#H|O#0zQPO,5?_OOQOANB]ANB]O#1SQPOANB]O#1XQPOANB`O#1^QPOANBbOOQOAN?hAN?hO#1cQPOANCVO#1jQPO'#I`O#1rQPOANCVO#1wQPOANCVO#1|QPOANCVO#2WQPOANCXO#2_QPOANCXO#2dQPOANCXO#2iQPOANCXO#2sQPOANCYO#2xQPOANCYO(XQPOANCYO#2}QPOANCZO#3SQPOANCZO(XQPOANCZO#3XQPOANC[O#3^QPOANC]O(XQPOG25zOOQO7+'p7+'pO!$rQPO7+'pOOQO1G3{1G3{OOQO1G3}1G3}O(XQPOG27SOOQO1G4O1G4OO#3cQPO1G4OOOQO1G4P1G4PO(XQPO1G4PO#0fQPO,5>fOOQO,5>f,5>fOOQO-E;x-E;xOOQOG27pG27pO#3hQPO'#HdO#3mQPO'#IrO#3uQPOG27uO!'lQPO,5>hOOQO,5>h,5>hOOQO-E;z-E;zO(XQPOG27wO#3zQPOG27zO#4PQPOG27|O%mQPOG28qO#4UQPOG28qO#4ZQPO'#HrO#4bQPO,5>zOOQOG28qG28qO#4jQPOG28qO#4oQPOG28qO&qQPOG28sO#4vQPOG28sOOQOG28sG28sO#4{QPOG28sO#5QQPOG28sOOQOG28tG28tO%mQPOG28tO#5XQPOG28tOOQOG28uG28uO&qQPOG28uO#5^QPOG28uOOQOG28vG28vOOQOG28wG28wOOQOLD+fLD+fOOQO<<K[<<K[O#5cQPOLD,nOOQO7+)j7+)jOOQO7+)k7+)kOOQO1G4Q1G4QO(XQPO,5>OO!'lQPO'#H{O#5hQPO,5?^OOQOLD-aLD-aOOQO1G4S1G4SO#5pQPOLD-cO#5uQPOLD-fO#5uQPOLD-hO#5zQPOLD.]O#6PQPOLD.]O#4ZQPO,5>^OOQO,5>^,5>^OOQO-E;p-E;pO#6UQPOLD.]O#6ZQPOLD.]O#6bQPOLD._O#6gQPOLD._O#6lQPOLD._O#6qQPOLD._O#6xQPOLD.`O#6}QPOLD.`O#7SQPOLD.aO#7XQPOLD.aO#7^QPO!$(!YO#7cQPO1G3jO!'lQPO,5>gOOQO,5>g,5>gOOQO-E;y-E;yOOQO!$(!}!$(!}O#7nQPO'#HiO#7yQPO'#ItO#8RQPO!$(#QO#8WQPO!$(#SOOQO!$(#w!$(#wO#8]QPO!$(#wOOQO1G3x1G3xO%mQPO!$(#wO#8bQPO!$(#wOOQO!$(#y!$(#yO#8gQPO!$(#yO&qQPO!$(#yO#8lQPO!$(#yOOQO!$(#z!$(#zO%mQPO!$(#zOOQO!$(#{!$(#{O&qQPO!$(#{O#8qQPO!)9EtO(XQPO7+)UOOQO1G4R1G4RO(XQPO,5>TO#8vQPO'#H}O#9OQPO,5?`OOQO!)9Fl!)9FlOOQO!)9Fn!)9FnO#9WQPO!)9GcO#9]QPO!)9GcO#9bQPO!)9GcO#9gQPO!)9GeO#9lQPO!)9GeO#9qQPO!)9GeO#9vQPO!)9GfO#9{QPO!)9GgO(XQPO!.K;`OOQO<<Lp<<LpOOQO1G3o1G3oO#8vQPO,5>iOOQO,5>i,5>iOOQO-E;{-E;{O%mQPO!.K<}OOQO!.K<}!.K<}O#:QQPO!.K<}O&qQPO!.K=POOQO!.K=P!.K=PO#:VQPO!.K=POOQO!.K=Q!.K=QOOQO!.K=R!.K=RO#:[QPO!4/0zOOQO1G4T1G4TO#:aQPO!4/2iO#:fQPO!4/2iO#:kQPO!4/2kO#:pQPO!4/2kO#:uQPO!9A&fOOQO!9A(T!9A(TO%mQPO!9A(TOOQO!9A(V!9A(VO&qQPO!9A(VOOQO!?$JQ!?$JQO#:zQPO!?$KoO#;PQPO!?$KqOOQO!D6AZ!D6AZOOQO!D6A]!D6A]",
  stateData: "#;U~O&tOS#aOS~OPQOQPORTOSUOTROUSOVVOWWOXXOYYOZZObgOpjOqmOrnOsoOt^Ox[O|cO!VkO!WlO!XpO!YqO!ZrO![sO!]tO!^uO!_vO!`wO!axO!byO!czO!d{O!e|O!f}O!g!OO!h!PO!i!QO!j!RO!k!SO!l!TO!m!UO!n!YO!o!ZO!p![O!q!]O!r!^O!s!_O!t!`O!u!aO!v!bO!w!dO!x!cO!ydO!|hO!}iO#O!VO#P!WO#Q!XO#R!eO#S!fO#T!hO#U!iO#eeO&`!kO&a!lO'Q!kO~Og!rOi!qOj!qOk!sOl!tOm!tO#V!pO#W!pO#X!pO#Y!pO#Z!pO#[!pO#]!pO#^!pO#_!pO#`!pO~Of!|Og#POh#QOn#OO#V!pO#W!pO#X!pO#Y!pO#Z!pO#[!pO#]!pO#^!pO#_!pO#`!pO#e!wO#g!xO#j!zO#p!yO#{#SO#|#RO&{!xO&|!xO~Of!|O#e!wO#g!xO#j!zO#p!yO&{!xO&|!xO~O#e#fO~Ov#kOw#iO~PYOv#kOw#iO&`'YX&r'YX'Q'YX~O!U#sO#e!wO#g!xO#j#rO#p!yO&{!xO&|!xO~O#j#xO$]#yOb$}Xc$}Xd$}Xe$}X&`$}X~Ob#}Oc#zOd#{Oe#|O&`$OO~O_$QO#|$TO%V$RO~P(XO#e$XO~O#e$YO~O#e!wO#g!xO#p!yO&{!xO&|!xO~O#e$jO~O$]#yO~O&`!kO'Q!kO~O#e%SO~O#e%TO~O#e%UO~O#j%VO#q%WO#r%WO#s%WO#t%WO#u%WO#v%WO#w%WO#x%WO#k&xX~O#}&xX&`&xX&r&xX'Q&xX#f&xX!{&xX!V&xX!W&xX$]&xX$d&xX$e&xX$f&xX$g&xX$h&xXy&xX$Q&xXP&xXQ&xXR&xXS&xXT&xXU&xXV&xXW&xXX&xXY&xXZ&xXb&xXp&xXq&xXr&xXs&xXt&xXx&xXz&xX|&xX!X&xX!Y&xX!Z&xX![&xX!]&xX!^&xX!_&xX!`&xX!a&xX!b&xX!c&xX!d&xX!e&xX!f&xX!g&xX!h&xX!i&xX!j&xX!k&xX!l&xX!m&xX!n&xX!o&xX!p&xX!q&xX!r&xX!s&xX!t&xX!u&xX!v&xX!w&xX!x&xX!y&xX!|&xX!}&xX#O&xX#P&xX#Q&xX#R&xX#S&xX#T&xX#U&xX#e&xX&a&xX$P&xX~P,`O#m%ZO#j&zX#q&zX#r&zX#s&zX#t&zX#u&zX#v&zX#w&zX#x&zX#}&zX~O&`&zX&r&zX'Q&zX#f&zX$]&zX$d&zX$e&zX$f&zX$g&zX$h&zX!{&zX!V&zX!W&zX#k&zXy&zX}&zX!R&zX!S&zX!T&zXP&zXQ&zXR&zXS&zXT&zXU&zXV&zXW&zXX&zXY&zXZ&zXb&zXp&zXq&zXr&zXs&zXt&zXx&zX|&zX!X&zX!Y&zX!Z&zX![&zX!]&zX!^&zX!_&zX!`&zX!a&zX!b&zX!c&zX!d&zX!e&zX!f&zX!g&zX!h&zX!i&zX!j&zX!k&zX!l&zX!m&zX!n&zX!o&zX!p&zX!q&zX!r&zX!s&zX!t&zX!u&zX!v&zX!w&zX!x&zX!y&zX!z&zX!|&zX!}&zX#O&zX#P&zX#Q&zX#R&zX#S&zX#T&zX#U&zX#e&zX&a&zX$Q&zXz&zX$P&zX~P2cO#{%^O~P(XO#{%^O~O#{%`O~P(XO#}%bO&`'PX&r'PX'Q'PX$Q'PX~O#f%eO#}%dO~O#f%gO#}%fO~O#}%hO~O#}%iO~O#}%jO~O#}%kO~O#}%lO~O$]%mO~O{%nO~PYOu%oO~PYOu%rO~PYOu%sO~PYO#j%VO$]%tO$d%tO$e%tO$f%tO$g%tO$h%tO~Of!|O~P)bO#j!zO~P+[O!R%yO!S%yO!T%yO}$aXP$aXQ$aXR$aXS$aXT$aXU$aXV$aXW$aXX$aXY$aXZ$aXb$aXp$aXq$aXr$aXs$aXt$aXx$aX|$aX!V$aX!W$aX!X$aX!Y$aX!Z$aX![$aX!]$aX!^$aX!_$aX!`$aX!a$aX!b$aX!c$aX!d$aX!e$aX!f$aX!g$aX!h$aX!i$aX!j$aX!k$aX!l$aX!m$aX!n$aX!o$aX!p$aX!q$aX!r$aX!s$aX!t$aX!u$aX!v$aX!w$aX!x$aX!y$aX!|$aX!}$aX#O$aX#P$aX#Q$aX#R$aX#S$aX#T$aX#U$aX#e$aX&`$aX&a$aX'Q$aX&r$aX#k$aX~O}%{O~O!{%|O~O[&SO]&SO^&SO_&SO~O#j&yX#q&yX#r&yX#s&yX#t&yX#u&yX#v&yX#w&yX#x&yX#}&yX&`&yX&r&yX'Q&yX~O#j&ZO~PAbO#g&^O~O#}&_O&`'aX&r'aX'Q'aX~O#}&aO~O!V&cO!W&bO~O#}&dO~O#}&eO~O#}&fO~O#}&gO~O#}&hO~O#}&iO~O#}&jO~O#}&kO~O#}&lO~O#}&mO~O#}&nO~O#}&oO~O#}&pO~O#}&qO~O#}&rO~P;_O#}&tO~O#}&uO~O#}&vO~O#}&wO~O#}&xO~O#}&yO~O#f&zO~O#f&{O&`#da&r#da'Q#da#}#da$Q#da~O#q%WO#r%WO#s%WO#t%WO#u%WO#v%WO#w%WO#x%WO~O#}#ha&`#ha&r#ha'Q#ha#f#ha!{#ha!V#ha!W#ha$]#ha$d#ha$e#ha$f#ha$g#ha$h#ha#k#hay#ha$Q#haP#haQ#haR#haS#haT#haU#haV#haW#haX#haY#haZ#hab#hap#haq#har#has#hat#hax#haz#ha|#ha!X#ha!Y#ha!Z#ha![#ha!]#ha!^#ha!_#ha!`#ha!a#ha!b#ha!c#ha!d#ha!e#ha!f#ha!g#ha!h#ha!i#ha!j#ha!k#ha!l#ha!m#ha!n#ha!o#ha!p#ha!q#ha!r#ha!s#ha!t#ha!u#ha!v#ha!w#ha!x#ha!y#ha!|#ha!}#ha#O#ha#P#ha#Q#ha#R#ha#S#ha#T#ha#U#ha#e#ha&a#ha$P#ha~PFOO`'POa'QO~O#k'RO~O#f'TO#}#za&`#za&r#za'Q#za$Q#za~O#f'TO~O'Q'VO~P&qO#}%bO&`'Pa&r'Pa'Q'Pa$Q'Pa~O$]%tO$d%tO$e%tO$f%tO$g%tO$h%tO~P,`O#k'fO~O!R%yO!S%yO!T%yO}$aaP$aaQ$aaR$aaS$aaT$aaU$aaV$aaW$aaX$aaY$aaZ$aab$aap$aaq$aar$aas$aat$aax$aa|$aa!V$aa!W$aa!X$aa!Y$aa!Z$aa![$aa!]$aa!^$aa!_$aa!`$aa!a$aa!b$aa!c$aa!d$aa!e$aa!f$aa!g$aa!h$aa!i$aa!j$aa!k$aa!l$aa!m$aa!n$aa!o$aa!p$aa!q$aa!r$aa!s$aa!t$aa!u$aa!v$aa!w$aa!x$aa!y$aa!|$aa!}$aa#O$aa#P$aa#Q$aa#R$aa#S$aa#T$aa#U$aa#e$aa&`$aa&a$aa'Q$aa&r$aa#k$aa~O!O'jO!P'iO!Q'kO~PYO#e!wO#g!xO#j!zO#p!yO&{!xO&|!xO~P;_O!z$uX!{$uX~PYO!z'wO!{'tO~O#k'yO~O#j'zO&`'_X&r'_X'Q'_X~O#j%VO&`%Pi&r%Pi'Q%Pi~O#j%VO&`%Qi&r%Qi'Q%Qi~O#g'{O~O#j'|O~PAbO#}&_O&`'aa&r'aa'Q'aa~O_(PO%V$RO'Q'VO~P(XO$P(SO~O#e(TO~O#e([O~O_(dO#e(cO~O_(gO~P(XO$P(iO~O#}(lO~O$P(pO~P(XO#g(tO~O#g(uO~O#k(vO~O#j%VO#q&ca#r&ca#s&ca#t&ca#u&ca#v&ca#w&ca#x&ca#}&ca&`&ca&r&ca'Q&ca#f&ca!{&ca!V&ca!W&ca$]&ca$d&ca$e&ca$f&ca$g&ca$h&ca#k&cay&ca$Q&caP&caQ&caR&caS&caT&caU&caV&caW&caX&caY&caZ&cab&cap&caq&car&cas&cat&cax&caz&ca|&ca!X&ca!Y&ca!Z&ca![&ca!]&ca!^&ca!_&ca!`&ca!a&ca!b&ca!c&ca!d&ca!e&ca!f&ca!g&ca!h&ca!i&ca!j&ca!k&ca!l&ca!m&ca!n&ca!o&ca!p&ca!q&ca!r&ca!s&ca!t&ca!u&ca!v&ca!w&ca!x&ca!y&ca!|&ca!}&ca#O&ca#P&ca#Q&ca#R&ca#S&ca#T&ca#U&ca#e&ca&a&ca$P&ca~O#f(xO#}#zi&`#zi&r#zi'Q#zi$Q#zi~O#}({O~O#}(|O~O#}(}O~O#})OO~O#})PO~O#})QO~O#})RO~O#})SO~Oy)TO~O#j%VO}$ci!R$ci!S$ci!T$ciP$ciQ$ciR$ciS$ciT$ciU$ciV$ciW$ciX$ciY$ciZ$cib$cip$ciq$cir$cis$cit$cix$ci|$ci!V$ci!W$ci!X$ci!Y$ci!Z$ci![$ci!]$ci!^$ci!_$ci!`$ci!a$ci!b$ci!c$ci!d$ci!e$ci!f$ci!g$ci!h$ci!i$ci!j$ci!k$ci!l$ci!m$ci!n$ci!o$ci!p$ci!q$ci!r$ci!s$ci!t$ci!u$ci!v$ci!w$ci!x$ci!y$ci!|$ci!}$ci#O$ci#P$ci#Q$ci#R$ci#S$ci#T$ci#U$ci#e$ci&`$ci&a$ci'Q$ci&r$ci#k$ci~O!Q)VO~PYOy)YO#j%VOP$wXQ$wXR$wXS$wXT$wXU$wXV$wXW$wXX$wXY$wXZ$wXb$wXp$wXq$wXr$wXs$wXt$wXx$wX|$wX!V$wX!W$wX!X$wX!Y$wX!Z$wX![$wX!]$wX!^$wX!_$wX!`$wX!a$wX!b$wX!c$wX!d$wX!e$wX!f$wX!g$wX!h$wX!i$wX!j$wX!k$wX!l$wX!m$wX!n$wX!o$wX!p$wX!q$wX!r$wX!s$wX!t$wX!u$wX!v$wX!w$wX!x$wX!y$wX!z$wX!{$wX!|$wX!}$wX#O$wX#P$wX#Q$wX#R$wX#S$wX#T$wX#U$wX#e$wX#}$wX&`$wX&a$wX'Q$wX~O#})[OP']XQ']XR']XS']XT']XU']XV']XW']XX']XY']XZ']Xb']Xp']Xq']Xr']Xs']Xt']Xx']X|']X!V']X!W']X!X']X!Y']X!Z']X![']X!]']X!^']X!_']X!`']X!a']X!b']X!c']X!d']X!e']X!f']X!g']X!h']X!i']X!j']X!k']X!l']X!m']X!n']X!o']X!p']X!q']X!r']X!s']X!t']X!u']X!v']X!w']X!x']X!y']X!z']X!{']X!|']X!}']X#O']X#P']X#Q']X#R']X#S']X#T']X#U']X#e']X&`']X&a']X'Q']X~O!z$ua!{$ua~PYO!O)^O#e!wO#g!xO#j!zO#p!yO&{!xO&|!xO~P;_O!z$zX~PYO!z)`O~O#g)aO~O#k)bO~O#g)cO~O#}&_O&`'ai&r'ai'Q'ai~O_)dO%V$RO'Q'VO~P(XO#})gO&`'bX&r'bX'Q'bX$Q'bX~O#})iO~O#})jO~O#})kO~O#})lO~O#})mO~O#})nO~O#})oO&`'cX&r'cX'Q'cX~O#e)qO~O#})rO&`'dX&r'dX'Q'dX~O#|)vO~P+[O#})wO~O#})xO~O#})zO~O#})}O~O#}*OO~O#}*PO~O#f*QO&`#dq&r#dq'Q#dq#}#dq$Q#dq~Of!|O#g!xO#j!zO#p!yO&{!xO&|!xO~O#e*SO$P*TO~P!CtO#e*WO$P*XO~P!CtO$P*[O~P(XO$P*^O~P(XO$P*`O~O$P*aO~O}*cO~O!Q*dO~PYO#j%VOP$xaQ$xaR$xaS$xaT$xaU$xaV$xaW$xaX$xaY$xaZ$xab$xap$xaq$xar$xas$xat$xax$xa|$xa!V$xa!W$xa!X$xa!Y$xa!Z$xa![$xa!]$xa!^$xa!_$xa!`$xa!a$xa!b$xa!c$xa!d$xa!e$xa!f$xa!g$xa!h$xa!i$xa!j$xa!k$xa!l$xa!m$xa!n$xa!o$xa!p$xa!q$xa!r$xa!s$xa!t$xa!u$xa!v$xa!w$xa!x$xa!y$xa!z$xa!{$xa!|$xa!}$xa#O$xa#P$xa#Q$xa#R$xa#S$xa#T$xa#U$xa#e$xa#}$xa&`$xa&a$xa'Q$xa~O#e!wO#g!xO#j!zO#p!yO&{!xO&|!xO'Q'VO~P;_O#})[OP']aQ']aR']aS']aT']aU']aV']aW']aX']aY']aZ']ab']ap']aq']ar']as']at']ax']a|']a!V']a!W']a!X']a!Y']a!Z']a![']a!]']a!^']a!_']a!`']a!a']a!b']a!c']a!d']a!e']a!f']a!g']a!h']a!i']a!j']a!k']a!l']a!m']a!n']a!o']a!p']a!q']a!r']a!s']a!t']a!u']a!v']a!w']a!x']a!y']a!z']a!{']a!|']a!}']a#O']a#P']a#Q']a#R']a#S']a#T']a#U']a#e']a&`']a&a']a'Q']a~O!z$za~PYO#k*iO~O#k*jO~O$Q*lO~O#e*nO'Q'VO~O#})gO&`'ba&r'ba'Q'ba$Q'ba~O#e*qO~O#e*sO~O#e*uO~O_*xO#e*wO'Q'VO~O#})oO&`'ca&r'ca'Q'ca~O_*}O'Q'VO~P(XO#})rO&`'da&r'da'Q'da~O#}+QO$Q'eX~O$Q+SO~O#e+TO~O#e+UO~O#}+VO~O$P+WO~O#}+XO$Q'gX~O$Q+ZO~O#g+_O~O#}+`O~P2cO#}+cO~O#}+dO~O#}+eO~P2cO#}+gO~O#}+hO~O#f+kO#}+jO~O#f+nO#}+mO~Oz+qOP$[!RQ$[!RR$[!RS$[!RT$[!RU$[!RV$[!RW$[!RX$[!RY$[!RZ$[!Rb$[!Rp$[!Rq$[!Rr$[!Rs$[!Rt$[!Rx$[!R|$[!R!V$[!R!W$[!R!X$[!R!Y$[!R!Z$[!R![$[!R!]$[!R!^$[!R!_$[!R!`$[!R!a$[!R!b$[!R!c$[!R!d$[!R!e$[!R!f$[!R!g$[!R!h$[!R!i$[!R!j$[!R!k$[!R!l$[!R!m$[!R!n$[!R!o$[!R!p$[!R!q$[!R!r$[!R!s$[!R!t$[!R!u$[!R!v$[!R!w$[!R!x$[!R!y$[!R!|$[!R!}$[!R#O$[!R#P$[!R#Q$[!R#R$[!R#S$[!R#T$[!R#U$[!R#e$[!R&`$[!R&a$[!R'Q$[!R~O#j%VOP$yiQ$yiR$yiS$yiT$yiU$yiV$yiW$yiX$yiY$yiZ$yib$yip$yiq$yir$yis$yit$yix$yi|$yi!V$yi!W$yi!X$yi!Y$yi!Z$yi![$yi!]$yi!^$yi!_$yi!`$yi!a$yi!b$yi!c$yi!d$yi!e$yi!f$yi!g$yi!h$yi!i$yi!j$yi!k$yi!l$yi!m$yi!n$yi!o$yi!p$yi!q$yi!r$yi!s$yi!t$yi!u$yi!v$yi!w$yi!x$yi!y$yi!z$yi!{$yi!|$yi!}$yi#O$yi#P$yi#Q$yi#R$yi#S$yi#T$yi#U$yi#e$yi#}$yi&`$yi&a$yi'Q$yi~O#e+uO'Q'VO~O#}+vO~O_+xO#e+wO'Q'VO~O#e+wO~O#})oO&`'ci&r'ci'Q'ci~O_+zO'Q'VO~P(XO#})rO&`'di&r'di'Q'di~O'Q'VO~P+[O#}+QO$Q'ea~O#e,OO~O#}+XO$Q'ga~O$P,VO~O#},WO~O#},XO~O$P,YO~P(XO#},[O$Q'SX~O$Q,^O~O#e,_O~O#e,`O$P,YO~P!CtO$P,aO~P(XO$Q,cO~O#e,dO~O#e,eO$P,aO~P!CtO$Q,fO~O$P,gO~O$Q,iO~O$P,jO~O$Q,lO~O$Q,mO~O#e,qO~O#f,tO~O#},uO$Q'fX~O$Q,wO~O$P,zO~O$P,{O~O#},}O~O'Q'VO~P%mO#},[O$Q'Sa~O#}-RO~O#}-SO~P2cO#}-UO~O#}-VO~O#}-WO~P2cO#}-YO~O#}-[O~O#}-]O~O#},uO$Q'fa~O$Q-bO~O#e-cO~O$Q-gO~O#e-hO~O$P-jO~O$P-jO~P(XO$Q-lO~O#e-mO~O$P-nO~O$P-nO~P(XO$Q-pO~O$P-qO~O$Q-rO~O$P-sO~O#e-tO~O#f-uO#}&Wi$Q&Wi~O#f-wO#}&]X$Q&]X~O#}-xO$Q'hX~O$Q-zO~O$Q-{O~O#}-|O~O#}.OO~O#}.PO~O#}.RO~O#}.UO~O#e-cO'Q'VO~O#}-xO$Q'ha~O$P.[O~O$Q.]O~O#e.^O~O$P._O~O$Q.`O~O#e.aO~O$Q.bO~O$Q.cO~O#}.gO~O#}.iO~O#}.jO~O$Q.kO~O$P.lO~O$Q.mO~O$P.nO~O#e.oO~O$Q.rO~O$Q.sO~O",
  goto: "!%`'jPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP'k(RPPP(g+nPP/VP/V/VPPPPPPPPP'k2sPPP'kPP'k'k'k'k'k'k'k'k'k3VP3m4T4k4q5Q5YPPPPP5Q3m5e3m5{3m6R'k6i6u6u'k6{7P7T7T7T7Z7^'k7a7w'k'k'k7z8Q8QP'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k'k8['k'k'k'k'k'k8e'k'k8n'k9U'k'kPP9`:[:c:i;i;o;u;{<R<]<c<m<w<}=T=ZPPP=a=w>_>{G[KVPP+n! R! WP! v! y!!f!!i!!l!!o!!u'k!!{!#V!#d!#h!#r!#u!#x!#|!$V!$`!$c!$f!$i!$o!$uy!jO]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sQ!uPb+a*T*[*`,Y,g-j-q.[.lQ-P,[R-i-O'Z!|QRSTUVWXYZdghipqrsuvwxyz{|}!O!Q!R!S!T!U!X!Y!Z![!]!^!_!`!a!b!c!d!e!f!h!i!t!z!}#P#Q#S#r#x#y#}$Q%V%^%`%b%d%e%f%g%h%i%j%k%l%m&_&d&f&g&i&j&k&l&m&n&p&v&w&x&y'T'W(O(P(g(p(x({(|(})O)P)Q)T)d)i)k)m)r)}*O*P*X*^*a*{*}+W+X+`+d+e+h+k+n+q+v+z,S,V,a,j,t,u-S-W-_-n-s-u-w.U._.n'{!{QRSTUVWXYZcdghipqrsuvwxyz{|}!O!Q!R!S!T!U!X!Y!Z![!]!^!_!`!a!b!c!d!e!f!h!i!t!z!}#P#Q#S#i#k#r#s#x#y#{#|#}$Q%V%X%^%`%b%d%e%f%g%h%i%j%k%l%m%u%y%|&_&d&f&g&i&j&k&l&m&n&p&v&w&x&y'T'W'i'o't(O(P(g(p(x({(|(})O)P)Q)T)Y)[)d)i)k)m)r)}*O*P*X*^*a*f*{*}+W+X+`+d+e+h+k+n+q+v+z,S,V,a,j,t,u-S-W-_-n-s-u-w.U._.n(V!yQRSTUVWXYZcdghipqrstuvwxyz{|}!O!Q!R!S!T!U!X!Y!Z![!]!^!_!`!a!b!c!d!e!f!h!i!t!z!}#P#Q#S#i#k#r#s#x#y#{#|#}$Q%V%X%^%`%b%d%e%f%g%h%i%j%k%l%m%u%y%|&_&d&e&f&g&i&j&k&l&m&n&p&v&w&x&y'T'W'i'o't(O(P(g(i(p(x({(|(})O)P)Q)T)Y)[)d)i)k)m)r)}*O*P*X*^*a*f*{*}+Q+W+X+`+d+e+h+k+n+q+v+z+{,S,V,a,j,t,u-S-W-_-n-s-u-w.U._.nd#TQ*X*^*a,a,j-n-s._.nQ'X%bR(z'Wy]O]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sybO]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sy_O]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sQ#j^R#m_Q#vcQ%p#iQ%q#kQ%w#rR)U'i]#tc#i#k#r%y'i[#tc#i#k#r%y'iR%x#sy`O]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sQ#l^R#n_yaO]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sQ'l%{Q)X'mQ+r*cR,o+sX'k%{'m*c+sT&O#w&PT%}#w&PX'p%|'t)[*fR'x&PR'v&PyfO]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sR&U#zQ$UgR&Y#}S$Sg#}Q(Q&_R)e(OQ(j&qQ(k&rR)y(lQ,Q+WQ-`,uR-v-_y!gO]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sS-d,z,{Q.Y-xR.e.XQ!oOQ#g]Q#h^Q#o`Q#pad%R!o#g#h#o#p'm's)W)_+sQ'm%{Q's%}Q)W'jQ)_'vR+s*cS%Y!v%vR'O%YQ%c#TR'Y%cQ'W%bQ(O&_f(y'W(O*f*m*v*{+{,S-O-_.XQ*f)[Q*m)gQ*v)oQ*{)rQ+{+QQ,S+XQ-O,[Q-_,uR.X-xQ,]+aR-Q,]Q%z#uR'h%zQ&P#wR'u&PQ)]'qR*h)]Q&`$SQ'}&]T(R&`'}Q)h(TR*o)hQ)p(cS*y)p*zR*z)qQ)s(fS+O)s+PR+P)tQ+R)uR+}+RQ,v,QR-a,vQ+Y){R,U+YQ-y-dR.Z-yy!nO]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sy!mO]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sh!qP*T*[*`,Y,[,g-O-j-q.[.li!}Q%b'W*X*^*a,a,j-n-s._.nh#RQ%b'W*X*^*a,a,j-n-s._.nQ#VRQ#XSQ#ZTQ#]US#_VXS#aWYQ#eZQ#wdS$Sg#}Q$VhQ$WiQ$ZpQ$[qQ$]rQ$^sQ$`uQ$avQ$bwQ$cxQ$dyQ$ezQ$f{Q$g|Q$h}Q$i!OQ$k!QQ$l!RQ$m!SQ$n!TQ$o!UQ$p!XQ$q!YQ$r!ZQ$s![Q$t!]Q$u!^Q$v!_Q$w!`Q$x!aQ$y!bQ$z!cQ${!dQ$|!eQ$}!fQ%O!hQ%P!iQ%S!tS%[!z#rS%]!}#SQ%_#PQ%a#QQ&Q#xQ&R#yQ&]$QQ&|%VQ'S%^Q'U%`Q'Z%dQ'[%eQ']%fQ'^%gQ'_%hQ'`%iQ'a%jQ'b%kQ'c%lQ'd%mQ(Q&_Q(W&dQ(Y&fQ(Z&gQ(]&iQ(^&jQ(_&kQ(`&lQ(a&mQ(b&nQ(f&pQ(o&vQ(q&wQ(r&xQ(s&yQ(w'TS)e(O(PQ)t(gS){(p,VQ*R(xQ*U({Q*V(|Q*Y(}Q*Z)OQ*])PQ*_)QQ*b)TQ*k)dQ*p)iQ*r)kQ*t)mQ*|)rQ+[)}Q+]*OQ+^*PS+y*{*}U,P+W,u-_Q,T+XS,Z+`+dS,b+e+hQ,h+kQ,k+nQ,n+qQ,p+vQ,r+zQ,x,SQ-^,tQ-k-SQ-o-WQ.V-uQ.W-wR.d.U'W!vQRSTUVWXYZdghipqrsuvwxyz{|}!O!Q!R!S!T!U!X!Y!Z![!]!^!_!`!a!b!c!d!e!f!h!i!t!z!}#P#Q#S#x#y#}$Q%V%^%`%b%d%e%f%g%h%i%j%k%l%m&_&d&f&g&i&j&k&l&m&n&p&v&w&x&y'T'W(O(P(g(p(x({(|(})O)P)Q)T)d)i)k)m)r)}*O*P*X*^*a*{*}+W+X+`+d+e+h+k+n+q+v+z,S,V,a,j,t,u-S-W-_-n-s-u-w.U._.n[#qc#i#k#s%y'iQ%v#rQ&W#{Q&X#|Q&}%XQ'e%uW'n%|'t)[*fQ)Z'oR*e)Y'l!{QRSTUVWXYZcdhipqrsuvwxyz{|}!O!Q!R!S!T!U!X!Y!Z![!]!^!_!`!a!b!c!d!e!f!h!i!t!z!}#P#Q#S#i#k#r#s#x#y#{#|%V%X%^%`%b%d%e%f%g%h%i%j%k%l%m%u%y%|&d&f&g&i&j&k&l&m&n&p&v&w&x&y'T'W'i'o't(g(p(x({(|(})O)P)Q)T)Y)[)i)k)m)r)}*O*P*X*^*a*f*{*}+W+X+`+d+e+h+k+n+q+v+z,S,V,a,j,t,u-S-W-_-n-s-u-w.U._.nW$Pg#}&_(OQ$_tU&[$Q(P)dQ(X&eQ)u(iQ+|+QR,s+{V%X!v%Y%vQ#UQQ+f*XQ+l*^Q+p*aQ-T,aQ-Z,jQ.Q-nQ.T-sQ.h._R.q.nR#WRQ+b*TQ+i*[Q+o*`Q,|,YQ-X,gQ-}-jQ.S-qQ.f.[R.p.lR#YSR#[TR#^UQ#`VR#cXQ#bWR#dYY#uc#i#k#r'iR'g%yS%u#q%vQ&s$wX'o%|'t)[*fT'r%|'tS'q%|'tQ*g)[R+t*fR&V#zR&T#zT$Tg#}Q(U&bQ(V&cR)f(SQ(e&oQ(m&tR(n&uR(h&pR)v(iR,R+WQ)|(pR,y,VQ-e,zR-f,{x!lO]^`a!o#g#h#o#p%{%}'j'm's'v)W)_*c+sR%Q!m",
  nodeNames: "⚠ DebugKW DebuginKW I2CInKW I2COutKW SerinKW SeroutKW OwinKW OwoutKW LcdinKW LcdoutKW LcdcmdKW BitKW NibKW ByteKW WordKW LowByteKW HighByteKW DataKW VarKW PinKW ConKW CrKW StrKW RepKW NumKW SNumKW WaitStrKW SkipKW SpstrKW AscKW DoneKW ReturnKW EndKW ExitKW StopKW DoKW LoopKW WhileKW UntilKW ForKW ToKW StepKW NextKW IfKW ThenKW ElseKW ElseifKW EndifKW AndKW OrKW XorKW NotKW GotoKW GosubKW PauseKW NapKW SleepKW ButtonKW RCTimeKW PollinKW PolloutKW PollrunKW PollwaitKW PollmodeKW CompareKW HighKW LowKW ToggleKW PwmKW RandomKW InputKW OutputKW ReverseKW ConfigPinKW CountKW FreqoutKW PulsoutKW PulsinKW ReadKW WriteKW LookupKW LookdownKW GetKW PutKW RunKW StoreKW SelectKW EndselectKW CaseKW BranchKW OnKW AuxioKW MainioKW IotermKW XOutKW DTMFOutKW ShiftInKW ShiftOutKW DecKW SDecKW HexKW SHexKW IHexKW ISHexKW BinKW SBinKW IBinKW ISBinKW Comment Program Debugin InputFormatExpr Identifier \\ DecimalInt Arith ArrayIndex ( ) LowByte . HighByte Number Char Plus Minus Mult Divide Mult100 Divide100 Shl Shr Debug OutputFormatExpr ? String , Serin [ ] Serout I2CIn I2COut Owin Owout Lcdin Lcdout Lcdcmd For ForHeader = LoopUntil Loop Until Logical Not Condition > < >= <= <> Paren_Logical UntilLoop DoUntil LoopWhile While WhileLoop DoWhile If IfTail Elseif Else Select Case CaseLabel ValuePattern ComparisonPattern RangePattern CaseElse CaseElseLabel VarDecl Defident ArrayType PinDecl ConDecl DataDecl DataLit DataAlloc DataLoc @ Branch OnGosub OnGoto Return Goto Gosub End Exit Stop Pause Nap Sleep Button RCTime Pollin Pollout Pollrun Pollwait Pollmode Compare High Low Toggle PWM Random Input Output Reverse Configpin Count Auxio Mainio Ioterm Freqout Pulsout Pulsin Read Write Lookup LookupTarget Lookdown Get Put Store Run XOut XOutParam DTMFOut Assignment ArrayIndex ShiftIn ShiftArg ShiftOut Label : Preprocessor",
  maxTerm: 301,
  skippedNodes: [0,31,109],
  repeatNodeCount: 16,
  tokenData: ",t~RnXY#PYZ#[]^#[pq#Prs#gst'Wtu'ouv(Zwx(oxy)Wyz)]z{)b{|)o|})t}!O)y!O!P*O!P!Q*T!Q![*b![!]*j!^!_*o!_!`+^!`!a+c!a!b+x!b!c+}!c!},S!}#O,e#O#P,j#P#Q,o#R#S,S#T#o,S~#UQ&t~XY#Ppq#P~#aQ'Q~YZ#[]^#[~#jUOr#|s#O#|#O#P&X#P;'S#|;'S;=`'Q<%lO#|~$PVOr$frs&Ss#O$f#O#P%T#P;'S$f;'S;=`%|<%lO$f~$iVOr$frs%Os#O$f#O#P%T#P;'S$f;'S;=`%|<%lO$f~%TO#|~~%WRO;'S$f;'S;=`%a;=`O$f~%dWOr$frs%Os#O$f#O#P%T#P;'S$f;'S;=`%|;=`<%l$f<%lO$f~&PP;=`<%l$f~&XO#p~~&[RO;'S#|;'S;=`&e;=`O#|~&hWOr$frs&Ss#O$f#O#P%T#P;'S$f;'S;=`%|;=`<%l#|<%lO$f~'TP;=`<%l#|~']S&a~OY'WZ;'S'W;'S;=`'i<%lO'W~'lP;=`<%l'W~'rR!Q!['{!c!i'{#T#Z'{~(QR&|~!Q!['{!c!i'{#T#Z'{~(^Q!Q!R(d!R!S(d~(iQ&{~!Q!R(d!R!S(d~(tS#a~OY(oZ;'S(o;'S;=`)Q<%lO(o~)TP;=`<%l(o~)]O#j~~)bO#k~~)gP#s~z{)j~)oO#u~~)tO#q~~)yO#}~~*OO#r~~*TO#m~~*YP#t~z{*]~*bO#v~~*gP#g~!Q![*b~*oO&`~~*tR$e~!^!_*}!_!`+S!`!a+X~+SO#x~~+XO$g~~+^O$h~~+cO$]~~+hQ$d~!_!`+n!`!a+s~+sO$f~~+xO#w~~+}O#{~~,SO%V~~,XS#e~!Q![,S!c!},S#R#S,S#T#o,S~,jO$P~~,oO#f~~,tO$Q~",
  tokenizers: [0],
  topRules: {"Program":[0,110]},
  specialized: [{term: 113, get: (value, stack) => (keyword(value) << 1), external: keyword},{term: 113, get: (value, stack) => (format_keyword(value) << 1), external: format_keyword}],
  tokenPrec: 0
});

/**
 * The unmodified parser for PBasic
 */
const pbasic_parser = parser;
function isNonconstType(type) {
    return typeof (type) === 'string' || type.key === 'array';
}
function typeToString(type) {
    if (typeof (type) !== 'string') {
        if (type.key == 'array')
            return `${typeToString(type.type)}(${type.size})`;
        else
            return type.value.toString();
    }
    return type.toUpperCase();
}
/**
 * Get the literal text of some node.
 */
const getNodeText = (node, editor) => { var _a, _b; return editor.doc.sliceString((_a = node === null || node === void 0 ? void 0 : node.from) !== null && _a !== void 0 ? _a : 0, (_b = node === null || node === void 0 ? void 0 : node.to) !== null && _b !== void 0 ? _b : 0); };
function parseType(node, editor) {
    var _a;
    if (node.name === "ArrayType") {
        if (!node.firstChild)
            throw "unreachable";
        if (!((_a = node.lastChild) === null || _a === void 0 ? void 0 : _a.prevSibling))
            throw "unreachable";
        const type = parseType(node.firstChild, editor);
        const sizeTxt = getNodeText(node.lastChild.prevSibling, editor);
        const size = Number.parseInt(sizeTxt);
        return { key: 'array', type: type, size: size };
    }
    return getNodeText(node, editor);
}
/**
 * Extract a 'defident' if one exists within a node.
 * @returns [raw_text, ident, type, doc] if the defident was found, [null, null, null, null] otherwise
 */
function extractDefident(node, editor) {
    var _a, _b;
    let doc = null;
    if (((_a = node.prevSibling) === null || _a === void 0 ? void 0 : _a.name) === "Comment") {
        const txt = getNodeText(node.prevSibling, editor);
        if (txt.startsWith("''")) {
            doc = txt.substring(2);
        }
    }
    if (node.name === 'VarDecl') {
        if (!node.lastChild)
            throw "variable declarations must have a last child (their type)";
        const id = getNodeText(node.firstChild, editor);
        const ty = parseType(node.lastChild, editor);
        return [id, id.toLowerCase(), ty, doc, 'Var'];
    }
    if (node.name === 'PinDecl'
        || node.name === 'ConDecl') {
        const id = getNodeText(node.firstChild, editor);
        const value = getNodeText(node.lastChild, editor);
        const type = {
            key: 'const',
            type: node.name === 'PinDecl' ? 'pin' : 'con',
            value: Number.parseInt(value)
        };
        return [id, id.toLowerCase(), type, doc, node.name.substring(0, 3)];
    }
    if (node.name === 'Label') {
        const id = getNodeText(node.firstChild, editor);
        return [id, id.toLowerCase(), 'label', doc, 'Label'];
    }
    if (node.name === 'DataDecl' && ((_b = node.firstChild) === null || _b === void 0 ? void 0 : _b.name) === 'Defident') {
        const id = getNodeText(node.firstChild, editor);
        return [id, id.toLowerCase(), 'word', doc, 'Data'];
    }
    return [null, null, null, null, null];
}
/**
 * All of the predefined items which come bundled with PBasic
 */
const predefined = [
    // input variables
    { name: "in0", case_name: "IN0", type: "word" },
    { name: "in1", case_name: "IN1", type: "word" },
    { name: "in2", case_name: "IN2", type: "word" },
    { name: "in3", case_name: "IN3", type: "word" },
    { name: "in4", case_name: "IN4", type: "word" },
    { name: "in5", case_name: "IN5", type: "word" },
    { name: "in6", case_name: "IN6", type: "word" },
    { name: "in7", case_name: "IN7", type: "word" },
    { name: "in8", case_name: "IN8", type: "word" },
    { name: "in9", case_name: "IN9", type: "word" }
];
/**
 * Get all definitions that occur in a syntax node.
 */
function getDefinitions(node, editor) {
    // Prefill with predefined variables
    let defs = {};
    predefined.forEach(x => {
        defs[x.name] = Object.assign(Object.assign({}, x), { from: 0, to: 0, declarator: 'Var' });
    });
    // Internal function: implements the recursion
    function loadDefinitions(node) {
        // Check if there is a defident at this node
        const [txt, id, type, doc, decl] = extractDefident(node, editor);
        if (id && txt && type && decl) {
            // If this is a new defident, add it with this positioning
            if (!defs[id])
                defs[id] = {
                    name: id,
                    case_name: txt,
                    type: type,
                    from: node.from,
                    to: node.to,
                    doc: doc,
                    declarator: decl
                };
        }
        else {
            // Iterate through child nodes and load their definitions
            let child = node.firstChild;
            while (child !== null) {
                loadDefinitions(child);
                child = child.nextSibling;
            }
        }
    }
    loadDefinitions(node);
    return defs;
}
/**
 * Gets the set of style tags for PBasic.
 * This exists to allow for algorithmic modifications of the style tag list
 * compared to an object literal.
 */
function getStyleTags() {
    let out = {
        Identifier: tags.variableName,
        String: tags.string,
        Char: tags.string,
        Comment: tags.lineComment,
        Number: tags.number
    };
    kwTypes.forEach(x => out[x] = tags.keyword);
    formatKWTypes.forEach(x => out[x] = tags.keyword);
    return out;
}
/**
 * The PBasic language instance
 */
const PBasic = LRLanguage.define({
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
                DataLit: n => { var _a, _b; return ({ from: (_a = n.from) !== null && _a !== void 0 ? _a : 0, to: (_b = n.to) !== null && _b !== void 0 ? _b : 0 }); },
                Label: n => {
                    // TODO: understand why this code refused to run
                    let r = n;
                    console.log("AAAAAAAAAAAAAAAAAA");
                    while (r && r.name !== "Goto" && r.name !== "Return") {
                        r = r.nextSibling;
                        console.log(r);
                    }
                    if (!r)
                        return null;
                    return { from: n.from, to: r === null || r === void 0 ? void 0 : r.to };
                }
            })
        ]
    }),
    languageData: {
        commentTokens: { line: "'" }
    }
});
/**
 * The base completion map which will be added onto when definitions
 * are factored in.
 */
const pbasicCompletionMap = [
    ...kws.map(x => { return { label: x.toUpperCase(), type: "keyword" }; }),
    ...formatKWs.map(x => { return { label: x.toUpperCase(), type: "keyword" }; })
];
/**
 * The getter for all completions, including definitions, somewhere in a document.
 */
function completions(context) {
    // Do not suggest inside of a comment
    if (context.tokenBefore(['Comment']) !== null)
        return null;
    // Get the definitions. 
    // TODO: This should be memoized, if possible.
    const tree = syntaxTree(context.state);
    const definitions = getDefinitions(tree.topNode, context.state);
    // Get the completions associated with the given definitions.
    const defCompletes = Object.values(definitions).map(x => ({ label: x.case_name, type: "variable" }));
    // Return the completions using the complete from list predefined.
    return completeFromList(pbasicCompletionMap.concat(defCompletes))(context);
}
/**
 * The completion extension for PBasic.
 */
const pbasicCompletion = PBasic.data.of({
    autocomplete: completions
});
const pbasicHover = hoverTooltip((view, pos, side) => {
    // TODO: this better
    const tree = syntaxTree(view.state);
    const definitions = getDefinitions(tree.topNode, view.state);
    // Find definition containing this position.
    const node_here = tree.cursorAt(pos, side).node;
    if (node_here.name !== "Identifier")
        return null;
    const id = getNodeText(node_here, view.state).toLowerCase();
    if (!definitions[id])
        return null;
    return {
        pos: node_here.from,
        end: node_here.to,
        above: true,
        create(view) {
            let txt = definitions[id].declarator.toUpperCase() + ' '
                + definitions[id].case_name;
            if (definitions[id].type !== 'label') {
                if (isNonconstType(definitions[id].type))
                    txt += ': ';
                else
                    txt += " = ";
                txt += typeToString(definitions[id].type);
            }
            if (definitions[id].doc)
                txt += ` '' ${definitions[id].doc}`;
            return typeHoverDOMProvider.value(view.state, txt);
        }
    };
});
let typeHoverDOMProvider = {
    value(view, text) {
        let dom = document.createElement('div');
        dom.textContent = text;
        return { dom };
    }
};
/**
 * The linter extension for PBasic.
 */
const pbasicLinter = linter(view => {
    let diagnostics = [];
    // Get the definitions.
    // TODO: This should be memoized, if possible.
    const tree = syntaxTree(view.state);
    const definitions = getDefinitions(tree.topNode, view.state);
    // Iterate through the syntax tree.
    tree.cursor().iterate(node => {
        // Report invalid syntax
        if (node.name === "⚠")
            diagnostics.push({
                from: node.from,
                to: node.to,
                severity: "error",
                message: "Invalid syntax"
            });
        // Report unknown identifiers
        else if (node.name === "Identifier") {
            const id = getNodeText(node.node, view.state);
            if (!definitions[id.toLowerCase()])
                diagnostics.push({
                    from: node.from,
                    to: node.to,
                    severity: "error",
                    message: `Unknown item ${id}`
                });
        }
        // Handle all other nodes
        else {
            // If this node is a definition syntax
            const [txt, id] = extractDefident(node.node, view.state);
            if (id) {
                // Report double definitions
                if (definitions[id].from !== node.from || definitions[id].to !== node.to)
                    diagnostics.push({
                        from: node.from,
                        to: node.to,
                        severity: "error",
                        message: `Double definition of item ${txt}`
                    });
            }
        }
    });
    return diagnostics;
});
/**
 * The language support instance for PBasic.
 */
function pbasic() {
    return new LanguageSupport(PBasic, [pbasicCompletion, pbasicLinter, pbasicHover]);
}

export { PBasic, pbasic, pbasic_parser, typeHoverDOMProvider };
