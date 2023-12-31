# PBasic Language Pack

A language pack for CodeMirror built using Lezer designed to provide insight into PBasic v2.5 code.

## Implemented Language Features
#### AST Parsing
- [x] General language syntax
  - [x] Arithmetic expressions
  - [x] Expression grouping
  - [x] Significant line endings
  - [x] Line ending stand-ins via `:`
  - [x] Pattern matching
  - [x] Compile-time if/else, select 
  *NOTE*: all compile-time information is currently shoved under the 'Preprocessor' token
- [x] `VAR / CON` declarations
  - [x] general syntax
  - [x] `BIT` / `NIB` / `BYTE` / `WORD`
  - [x] `<TYPE>(N)` arrays
- [x] `.LOWBYTE` / `.HIGHBYTE`
- [x] `AUXIO`
- [x] `BRANCH`
- [x] `BUTTON`
- [x] `COMPARE`
- [x] `CONFIGPIN`
- [x] `COUNT`
- [x] `DATA`
  - [x] named `DATA`
  - [x] `WORD`-typed `DATA`
  - [x] `@address`-ed `DATA`
  - [x] reserved `DATA`
  - [x] repeated `DATA`
  - [x] expressions in `DATA`
- [x] `DEBUG` / `SER` / `I2C` / `LCD`, `IN` and `OUT` forms
  - [x] simple `DEBUG`
  - [x] all format specifiers
  - [x] all special cases
- [x] `DO ... LOOP`
  - [x] `DO WHILE ...`
  - [x] `DO UNTIL ...`
  - [x] `DO ... LOOP WHILE`
  - [x] `DO ... LOOP UNTIL`
  - [x] `DO ... LOOP`
- [x] `DTMFOUT`
- [x] `END`
- [x] `EXIT`
- [x] `FOR ... NEXT`
- [x] `FREQOUT`
- [x] `GET`
- [x] `GOSUB`
- [x] `GOTO`
- [x] `HIGH`
- [x] `IF ... THEN ... ELSE`
  - [x] `IF ... THEN`
  - [x] `ELSEIF`
  - [x] `ELSE`
- [x] `INPUT`
- [x] `IOTERM`
- [x] `LCDCMD`
- [x] `LOOKDOWN`
- [x] `LOOKUP`
- [x] `LOW`
- [x] `MAINIO`
- [x] `NAP`
- [x] `ON ... GOSUB/GOTO`
- [x] `OUTPUT`
- [x] `OWIN`
- [x] `OWOUT`
- [x] `PAUSE`
- [x] `POLL___`
- [x] `PULSIN` 
- [x] `PULSOUT`
- [x] `PUT`
- [x] `PWM`
- [x] `RANDOM`
- [x] `RCTIME`
- [x] `READ`
- [x] `RETURN`
- [x] `REVERSE`
- [x] `RUN`
- [x] `SELECT ... CASE`
  - [x] Simple cases
  - [x] Multiple cases
  - [x] Comparison cases
  - [x] Range cases
  - [x] Else case
- [x] `SHIFTIN`
- [x] `SHIFTOUT`
- [x] `SLEEP`
- [x] `STOP`
- [x] `STORE`
- [x] `TOGGLE`
- [x] `WRITE`
- [x] `XOUT`

> Todo: test it all :D

FAQ:

- Use `syntaxTree()` to get the syntax tree from a editor state. THere is no obvious documentation which states this >:(
- Many of the necessary types for interfacing with the library are private, so sometimes using `type PrivType = Parameters<fnWithPrivType>[0];` will be necessary
