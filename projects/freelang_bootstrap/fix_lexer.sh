#!/bin/bash
# Fix lexer.fl: add return types and int -> i32

# Backup
cp lexer.fl lexer.fl.backup

# 1. int -> i32
sed -i 's/: int/: i32/g' lexer.fl

# 2. Add return types to functions (pattern matching)
sed -i 's/^fn createLexerState(source: string) {/fn createLexerState(source: string): string {/g' lexer.fl
sed -i 's/^fn createToken(tokenType: string, value: string, line: i32, column: i32) {/fn createToken(tokenType: string, value: string, line: i32, column: i32): string {/g' lexer.fl
sed -i 's/^fn isDigit(c: string) {/fn isDigit(c: string): bool {/g' lexer.fl
sed -i 's/^fn isAlpha(c: string) {/fn isAlpha(c: string): bool {/g' lexer.fl
sed -i 's/^fn isAlphaNumeric(c: string) {/fn isAlphaNumeric(c: string): bool {/g' lexer.fl
sed -i 's/^fn isOperator(c: string) {/fn isOperator(c: string): bool {/g' lexer.fl
sed -i 's/^fn isWhitespace(c: string) {/fn isWhitespace(c: string): bool {/g' lexer.fl
sed -i 's/^fn tokenize(source: string) {/fn tokenize(source: string): string {/g' lexer.fl
sed -i 's/^fn skipWhitespaceAndComments(state: {}) {/fn skipWhitespaceAndComments(state: string): string {/g' lexer.fl
sed -i 's/^fn readNumber(state: {}) {/fn readNumber(state: string): string {/g' lexer.fl
sed -i 's/^fn readString(state: {}, quote: string) {/fn readString(state: string, quote: string): string {/g' lexer.fl
sed -i 's/^fn readIdentifierOrKeyword(state: {}) {/fn readIdentifierOrKeyword(state: string): string {/g' lexer.fl
sed -i 's/^fn readOperator(state: {}) {/fn readOperator(state: string): string {/g' lexer.fl
sed -i 's/^fn addTokenState(state: {}, tokenType: string, value: string) {/fn addTokenState(state: string, tokenType: string, value: string): string {/g' lexer.fl
sed -i 's/^fn testLexer() {/fn testLexer(): string {/g' lexer.fl

echo "✅ Fixed lexer.fl"
echo "Changes:"
echo "  - int → i32"
echo "  - Added return types to all functions"

# Show diff
diff -u lexer.fl.backup lexer.fl | head -50
