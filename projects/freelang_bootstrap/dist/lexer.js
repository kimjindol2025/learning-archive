"use strict";
/**
 * FreeLang Bootstrap Lexer
 * 소스 코드 → 토큰 변환
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
class Lexer {
    constructor(source) {
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.source = source;
    }
    tokenize() {
        while (this.position < this.source.length) {
            this.skipWhitespaceAndComments();
            if (this.position >= this.source.length)
                break;
            const char = this.currentChar();
            // 숫자
            if (this.isDigit(char)) {
                this.readNumber();
            }
            // 문자열
            else if (char === '"' || char === "'") {
                this.readString();
            }
            // 식별자 또는 키워드
            else if (this.isAlpha(char)) {
                this.readIdentifierOrKeyword();
            }
            // 연산자 및 기호
            else if (this.isOperator(char)) {
                this.readOperator();
            }
            // 괄호
            else if (char === '(') {
                this.addToken('lparen', '(');
                this.advance();
            }
            else if (char === ')') {
                this.addToken('rparen', ')');
                this.advance();
            }
            else if (char === '{') {
                this.addToken('lbrace', '{');
                this.advance();
            }
            else if (char === '}') {
                this.addToken('rbrace', '}');
                this.advance();
            }
            else if (char === '[') {
                this.addToken('lbracket', '[');
                this.advance();
            }
            else if (char === ']') {
                this.addToken('rbracket', ']');
                this.advance();
            }
            // 구분자
            else if (char === ',') {
                this.addToken('comma', ',');
                this.advance();
            }
            else if (char === ';') {
                this.addToken('semicolon', ';');
                this.advance();
            }
            else if (char === ':') {
                this.addToken('colon', ':');
                this.advance();
            }
            else if (char === '.') {
                this.addToken('dot', '.');
                this.advance();
            }
            else if (char === '\n') {
                this.addToken('newline', '\n');
                this.advance();
                this.line++;
                this.column = 1;
            }
            else {
                throw new Error(`Unknown character: ${char} at line ${this.line}, column ${this.column}`);
            }
        }
        this.addToken('eof', '');
        return this.tokens;
    }
    currentChar() {
        return this.source[this.position];
    }
    peekChar(offset = 1) {
        const pos = this.position + offset;
        return pos < this.source.length ? this.source[pos] : null;
    }
    advance() {
        this.position++;
        this.column++;
    }
    skipWhitespaceAndComments() {
        while (this.position < this.source.length) {
            const char = this.currentChar();
            // 공백 건너뛰기
            if (char === ' ' || char === '\t' || char === '\r') {
                this.advance();
            }
            // 주석 건너뛰기
            else if (char === '#') {
                while (this.position < this.source.length && this.currentChar() !== '\n') {
                    this.advance();
                }
            }
            else {
                break;
            }
        }
    }
    isDigit(char) {
        return /[0-9]/.test(char);
    }
    isAlpha(char) {
        return /[a-zA-Z_]/.test(char);
    }
    isAlphaNumeric(char) {
        return /[a-zA-Z0-9_]/.test(char);
    }
    isOperator(char) {
        return /[+\-*/%=<>!&|]/.test(char);
    }
    readNumber() {
        let value = '';
        while (this.position < this.source.length && (this.isDigit(this.currentChar()) || this.currentChar() === '.')) {
            value += this.currentChar();
            this.advance();
        }
        this.addToken('number', parseFloat(value));
    }
    readString() {
        const quote = this.currentChar();
        this.advance(); // 시작 따옴표 건너뛰기
        let value = '';
        while (this.position < this.source.length && this.currentChar() !== quote) {
            if (this.currentChar() === '\\') {
                this.advance();
                const escaped = this.currentChar();
                switch (escaped) {
                    case 'n':
                        value += '\n';
                        break;
                    case 't':
                        value += '\t';
                        break;
                    case 'r':
                        value += '\r';
                        break;
                    case '\\':
                        value += '\\';
                        break;
                    case '"':
                        value += '"';
                        break;
                    case "'":
                        value += "'";
                        break;
                    default: value += escaped;
                }
                this.advance();
            }
            else {
                value += this.currentChar();
                this.advance();
            }
        }
        if (this.position >= this.source.length) {
            throw new Error(`Unterminated string at line ${this.line}`);
        }
        this.advance(); // 끝 따옴표 건너뛰기
        this.addToken('string', value);
    }
    readIdentifierOrKeyword() {
        let value = '';
        while (this.position < this.source.length && this.isAlphaNumeric(this.currentChar())) {
            value += this.currentChar();
            this.advance();
        }
        const keywords = ['fn', 'if', 'else', 'while', 'for', 'return', 'let', 'mut', 'true', 'false', 'null'];
        const type = keywords.includes(value) ? 'keyword' : 'identifier';
        this.addToken(type, value);
    }
    readOperator() {
        let value = this.currentChar();
        this.advance();
        // 2자 연산자 확인
        if (this.position < this.source.length) {
            const next = this.currentChar();
            if ((value === '=' && next === '=') ||
                (value === '!' && next === '=') ||
                (value === '<' && next === '=') ||
                (value === '>' && next === '=') ||
                (value === '&' && next === '&') ||
                (value === '|' && next === '|') ||
                (value === '-' && next === '>')) {
                value += next;
                this.advance();
            }
        }
        // 특수 연산자 처리
        if (value === '=') {
            this.addToken('equals', value);
        }
        else if (value === '->') {
            this.addToken('arrow', value);
        }
        else {
            this.addToken('operator', value);
        }
    }
    addToken(type, value) {
        this.tokens.push({
            type,
            value,
            line: this.line,
            column: this.column
        });
    }
}
exports.Lexer = Lexer;
