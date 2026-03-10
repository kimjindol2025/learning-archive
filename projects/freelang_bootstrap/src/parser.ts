/**
 * FreeLang Bootstrap Parser
 * 토큰 → AST 변환
 */

import { Token, ASTNode } from './types';

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const statements: ASTNode[] = [];

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

  private statement(): ASTNode {
    // 함수 정의
    if (this.checkKeyword('fn')) {
      this.advance();
      return this.functionDefinition();
    }

    // if 문
    if (this.checkKeyword('if')) {
      this.advance();
      return this.ifStatement();
    }

    // while 루프
    if (this.checkKeyword('while')) {
      this.advance();
      return this.whileLoop();
    }

    // for 루프
    if (this.checkKeyword('for')) {
      this.advance();
      return this.forLoop();
    }

    // return 문
    if (this.checkKeyword('return')) {
      this.advance();
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

  private functionDefinition(): ASTNode {
    const name = this.consume('identifier', 'Expected function name').value as string;
    this.consume('lparen', 'Expected ( after function name');

    const params: string[] = [];
    if (!this.check('rparen')) {
      do {
        const paramName = this.consume('identifier', 'Expected parameter name').value as string;
        params.push(paramName);

        // 타입 주석이 있으면 건너뛰기: x: int 또는 x: &T
        if (this.match('colon')) {
          // 타입 이름 읽기
          if (!this.check('rparen') && !this.check('comma')) {
            // &, &mut 처리
            if (this.match('operator', '&')) {
              if (this.match('keyword', 'mut')) {
                // &mut T
              }
            }
            // 타입 이름
            if (this.check('identifier') || this.check('lbracket')) {
              this.advance();
              // [T] 형태 처리
              if (this.previous().type === 'lbracket') {
                this.advance(); // T
                this.consume('rbracket', 'Expected ] in type');
              }
            }
          }
        }
      } while (this.match('comma'));
    }
    this.consume('rparen', 'Expected ) after parameters');

    // 반환 타입 주석이 있으면 건너뛰기: -> Type
    if (this.match('arrow')) {
      // 반환 타입 읽기 (생략)
      if (this.check('identifier')) {
        this.advance();
      } else if (this.check('lbracket')) {
        // [Type] 형태
        this.advance(); // [
        if (this.check('identifier')) {
          this.advance();
        }
        if (this.check('rbracket')) {
          this.advance();
        }
      }
    }

    const body = this.statement();

    return { type: 'functionDef', name, params, body };
  }

  private ifStatement(): ASTNode {
    const condition = this.expression();
    const thenBranch = this.statement();

    let elseBranch: ASTNode | undefined;
    if (this.match('keyword', 'else')) {
      elseBranch = this.statement();
    }

    return { type: 'if', condition, thenBranch, elseBranch };
  }

  private whileLoop(): ASTNode {
    const condition = this.expression();
    const body = this.statement();
    return { type: 'while', condition, body };
  }

  private forLoop(): ASTNode {
    const variable = this.consume('identifier', 'Expected variable name').value as string;
    this.consume('keyword', 'Expected "in" in for loop');
    const start = this.expression();
    this.consume('operator', 'Expected ".." in for loop');
    const end = this.expression();
    const body = this.statement();

    return { type: 'for', variable, start, end, body };
  }

  private block(): ASTNode {
    this.consume('lbrace', 'Expected {');
    const statements: ASTNode[] = [];

    while (!this.check('rbrace') && !this.isAtEnd()) {
      this.skipNewlines();
      if (!this.check('rbrace')) {
        statements.push(this.statement());
      }
    }

    this.consume('rbrace', 'Expected }');
    return { type: 'block', statements };
  }

  private expression(): ASTNode {
    return this.assignment();
  }

  private assignment(): ASTNode {
    let expr = this.or();

    if (this.match('equals')) {
      if (expr.type === 'identifier') {
        const value = this.assignment();
        return {
          type: 'assignment',
          variable: (expr as any).name,
          value
        };
      } else if (expr.type === 'arrayAccess') {
        // 배열 할당: arr[0] = 42
        const value = this.assignment();
        return {
          type: 'arrayAssignment',
          array: (expr as any).array,
          index: (expr as any).index,
          value
        };
      }
      throw new Error('Invalid assignment target');
    }

    return expr;
  }

  private or(): ASTNode {
    let expr = this.and();

    while (this.match('operator', '||')) {
      const operator = this.previous().value as string;
      const right = this.and();
      expr = { type: 'binaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private and(): ASTNode {
    let expr = this.equality();

    while (this.match('operator', '&&')) {
      const operator = this.previous().value as string;
      const right = this.equality();
      expr = { type: 'binaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private equality(): ASTNode {
    let expr = this.comparison();

    while (this.match('operator', '==', '!=')) {
      const operator = this.previous().value as string;
      const right = this.comparison();
      expr = { type: 'binaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private comparison(): ASTNode {
    let expr = this.term();

    while (this.match('operator', '<', '>', '<=', '>=')) {
      const operator = this.previous().value as string;
      const right = this.term();
      expr = { type: 'binaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private term(): ASTNode {
    let expr = this.factor();

    while (this.match('operator', '+', '-')) {
      const operator = this.previous().value as string;
      const right = this.factor();
      expr = { type: 'binaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private factor(): ASTNode {
    let expr = this.unary();

    while (this.match('operator', '*', '/', '%')) {
      const operator = this.previous().value as string;
      const right = this.unary();
      expr = { type: 'binaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private unary(): ASTNode {
    if (this.match('operator', '-', '!', '&')) {
      const operator = this.previous().value as string;

      // &mut 처리
      let finalOperator = operator;
      if (operator === '&' && this.match('keyword', 'mut')) {
        finalOperator = '&mut';
      }

      const operand = this.unary();
      return { type: 'unaryOp', operator: finalOperator, operand };
    }

    return this.call();
  }

  private call(): ASTNode {
    let expr = this.primary();

    while (true) {
      if (this.match('lparen')) {
        // 함수 호출
        if (expr.type === 'identifier') {
          const args: ASTNode[] = [];
          if (!this.check('rparen')) {
            do {
              args.push(this.expression());
            } while (this.match('comma'));
          }
          this.consume('rparen', 'Expected ) after arguments');
          expr = { type: 'functionCall', name: (expr as any).name, args };
        } else {
          throw new Error('Can only call functions');
        }
      } else if (this.match('lbracket')) {
        // 배열 인덱싱
        const index = this.expression();
        this.consume('rbracket', 'Expected ] after array index');
        expr = { type: 'arrayAccess', array: expr, index };
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): ASTNode {
    // 숫자
    if (this.match('number')) {
      return { type: 'number', value: this.previous().value as number };
    }

    // 문자열
    if (this.match('string')) {
      return { type: 'string', value: this.previous().value as string };
    }

    // 불린
    if (this.match('keyword', 'true')) {
      return { type: 'number', value: 1 }; // true = 1
    }
    if (this.match('keyword', 'false')) {
      return { type: 'number', value: 0 }; // false = 0
    }

    // 배열 리터럴
    if (this.match('lbracket')) {
      const elements: ASTNode[] = [];
      if (!this.check('rbracket')) {
        do {
          elements.push(this.expression());
        } while (this.match('comma'));
      }
      this.consume('rbracket', 'Expected ] after array elements');
      return { type: 'arrayLiteral', elements };
    }

    // 식별자
    if (this.match('identifier')) {
      return { type: 'identifier', name: this.previous().value as string };
    }

    // 괄호 식
    if (this.match('lparen')) {
      const expr = this.expression();
      this.consume('rparen', 'Expected ) after expression');
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek().value}`);
  }

  private match(...patterns: any[]): boolean {
    for (const pattern of patterns) {
      if (typeof pattern === 'string') {
        if (this.check(pattern)) {
          this.advance();
          return true;
        }
      } else {
        if (this.check(pattern[0], pattern[1])) {
          this.advance();
          return true;
        }
      }
    }
    return false;
  }

  private check(type: string, value?: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value && token.value !== value) return false;
    return true;
  }

  private checkKeyword(keyword: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return token.type === 'keyword' && token.value === keyword;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'eof';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: string, message: string, value?: string): Token {
    if (this.check(type, value)) return this.advance();
    throw new Error(`${message} at line ${this.peek().line}`);
  }

  private skipSemicolon(): void {
    this.match('semicolon');
  }

  private skipNewlines(): void {
    while (this.match('newline')) {}
  }
}
