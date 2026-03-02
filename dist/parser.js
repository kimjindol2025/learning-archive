"use strict";
/**
 * FreeLang Bootstrap Parser
 * 토큰 → AST 변환
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
class Parser {
    constructor(tokens) {
        this.current = 0;
        this.tokens = tokens;
    }
    parse() {
        const statements = [];
        while (!this.isAtEnd()) {
            this.skipNewlines();
            if (!this.isAtEnd()) {
                statements.push(this.statement());
            }
        }
        return {
            type: 'block',
            statements
        };
    }
    statement() {
        // 함수 정의
        if (this.match('keyword', 'fn')) {
            return this.functionDefinition();
        }
        // if 문
        if (this.match('keyword', 'if')) {
            return this.ifStatement();
        }
        // while 루프
        if (this.match('keyword', 'while')) {
            return this.whileLoop();
        }
        // for 루프
        if (this.match('keyword', 'for')) {
            return this.forLoop();
        }
        // return 문
        if (this.match('keyword', 'return')) {
            const value = this.expression();
            this.skipSemicolon();
            return { type: 'return', value };
        }
        // 블록
        if (this.check('lbrace')) {
            return this.block();
        }
        // 변수 할당 또는 표현식
        const expr = this.expression();
        this.skipSemicolon();
        return expr;
    }
    functionDefinition() {
        const name = this.consume('identifier', 'Expected function name').value;
        this.consume('lparen', 'Expected ( after function name');
        const params = [];
        if (!this.check('rparen')) {
            do {
                params.push(this.consume('identifier', 'Expected parameter name').value);
            } while (this.match('comma'));
        }
        this.consume('rparen', 'Expected ) after parameters');
        const body = this.statement();
        return { type: 'functionDef', name, params, body };
    }
    ifStatement() {
        const condition = this.expression();
        const thenBranch = this.statement();
        let elseBranch;
        if (this.match('keyword', 'else')) {
            elseBranch = this.statement();
        }
        return { type: 'if', condition, thenBranch, elseBranch };
    }
    whileLoop() {
        const condition = this.expression();
        const body = this.statement();
        return { type: 'while', condition, body };
    }
    forLoop() {
        const variable = this.consume('identifier', 'Expected variable name').value;
        this.consume('keyword', 'Expected "in" in for loop');
        const start = this.expression();
        this.consume('operator', 'Expected ".." in for loop');
        const end = this.expression();
        const body = this.statement();
        return { type: 'for', variable, start, end, body };
    }
    block() {
        this.consume('lbrace', 'Expected {');
        const statements = [];
        while (!this.check('rbrace') && !this.isAtEnd()) {
            this.skipNewlines();
            if (!this.check('rbrace')) {
                statements.push(this.statement());
            }
        }
        this.consume('rbrace', 'Expected }');
        return { type: 'block', statements };
    }
    expression() {
        return this.assignment();
    }
    assignment() {
        let expr = this.or();
        if (this.match('equals')) {
            if (expr.type === 'identifier') {
                const value = this.assignment();
                return {
                    type: 'assignment',
                    variable: expr.name,
                    value
                };
            }
            throw new Error('Invalid assignment target');
        }
        return expr;
    }
    or() {
        let expr = this.and();
        while (this.match('operator', '||')) {
            const operator = this.previous().value;
            const right = this.and();
            expr = { type: 'binaryOp', operator, left: expr, right };
        }
        return expr;
    }
    and() {
        let expr = this.equality();
        while (this.match('operator', '&&')) {
            const operator = this.previous().value;
            const right = this.equality();
            expr = { type: 'binaryOp', operator, left: expr, right };
        }
        return expr;
    }
    equality() {
        let expr = this.comparison();
        while (this.match('operator', '==', '!=')) {
            const operator = this.previous().value;
            const right = this.comparison();
            expr = { type: 'binaryOp', operator, left: expr, right };
        }
        return expr;
    }
    comparison() {
        let expr = this.term();
        while (this.match('operator', '<', '>', '<=', '>=')) {
            const operator = this.previous().value;
            const right = this.term();
            expr = { type: 'binaryOp', operator, left: expr, right };
        }
        return expr;
    }
    term() {
        let expr = this.factor();
        while (this.match('operator', '+', '-')) {
            const operator = this.previous().value;
            const right = this.factor();
            expr = { type: 'binaryOp', operator, left: expr, right };
        }
        return expr;
    }
    factor() {
        let expr = this.unary();
        while (this.match('operator', '*', '/', '%')) {
            const operator = this.previous().value;
            const right = this.unary();
            expr = { type: 'binaryOp', operator, left: expr, right };
        }
        return expr;
    }
    unary() {
        if (this.match('operator', '-', '!')) {
            const operator = this.previous().value;
            const operand = this.unary();
            return { type: 'unaryOp', operator, operand };
        }
        return this.call();
    }
    call() {
        let expr = this.primary();
        while (true) {
            if (this.match('lparen')) {
                // 함수 호출
                if (expr.type === 'identifier') {
                    const args = [];
                    if (!this.check('rparen')) {
                        do {
                            args.push(this.expression());
                        } while (this.match('comma'));
                    }
                    this.consume('rparen', 'Expected ) after arguments');
                    expr = { type: 'functionCall', name: expr.name, args };
                }
                else {
                    throw new Error('Can only call functions');
                }
            }
            else {
                break;
            }
        }
        return expr;
    }
    primary() {
        // 숫자
        if (this.match('number')) {
            return { type: 'number', value: this.previous().value };
        }
        // 문자열
        if (this.match('string')) {
            return { type: 'string', value: this.previous().value };
        }
        // 불린
        if (this.match('keyword', 'true')) {
            return { type: 'number', value: 1 }; // true = 1
        }
        if (this.match('keyword', 'false')) {
            return { type: 'number', value: 0 }; // false = 0
        }
        // 식별자
        if (this.match('identifier')) {
            return { type: 'identifier', name: this.previous().value };
        }
        // 괄호 식
        if (this.match('lparen')) {
            const expr = this.expression();
            this.consume('rparen', 'Expected ) after expression');
            return expr;
        }
        throw new Error(`Unexpected token: ${this.peek().value}`);
    }
    match(...patterns) {
        for (const pattern of patterns) {
            if (typeof pattern === 'string') {
                if (this.check(pattern)) {
                    this.advance();
                    return true;
                }
            }
            else {
                if (this.check(pattern[0], pattern[1])) {
                    this.advance();
                    return true;
                }
            }
        }
        return false;
    }
    check(type, value) {
        if (this.isAtEnd())
            return false;
        const token = this.peek();
        if (token.type !== type)
            return false;
        if (value && token.value !== value)
            return false;
        return true;
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    isAtEnd() {
        return this.peek().type === 'eof';
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    consume(type, message, value) {
        if (this.check(type, value))
            return this.advance();
        throw new Error(`${message} at line ${this.peek().line}`);
    }
    skipSemicolon() {
        this.match('semicolon');
    }
    skipNewlines() {
        while (this.match('newline')) { }
    }
}
exports.Parser = Parser;
