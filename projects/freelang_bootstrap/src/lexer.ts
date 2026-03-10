/**
 * FreeLang Bootstrap Lexer
 * 소스 코드 → 토큰 변환
 */

import { Token, TokenType } from './types';

export class Lexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (this.position < this.source.length) {
      this.skipWhitespaceAndComments();
      if (this.position >= this.source.length) break;

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
      } else if (char === ')') {
        this.addToken('rparen', ')');
        this.advance();
      } else if (char === '{') {
        this.addToken('lbrace', '{');
        this.advance();
      } else if (char === '}') {
        this.addToken('rbrace', '}');
        this.advance();
      } else if (char === '[') {
        this.addToken('lbracket', '[');
        this.advance();
      } else if (char === ']') {
        this.addToken('rbracket', ']');
        this.advance();
      }
      // 구분자
      else if (char === ',') {
        this.addToken('comma', ',');
        this.advance();
      } else if (char === ';') {
        this.addToken('semicolon', ';');
        this.advance();
      } else if (char === ':') {
        this.addToken('colon', ':');
        this.advance();
      } else if (char === '.') {
        this.addToken('dot', '.');
        this.advance();
      } else if (char === '\n') {
        this.addToken('newline', '\n');
        this.advance();
        this.line++;
        this.column = 1;
      } else {
        throw new Error(`Unknown character: ${char} at line ${this.line}, column ${this.column}`);
      }
    }

    this.addToken('eof', '');
    return this.tokens;
  }

  private currentChar(): string {
    return this.source[this.position];
  }

  private peekChar(offset: number = 1): string | null {
    const pos = this.position + offset;
    return pos < this.source.length ? this.source[pos] : null;
  }

  private advance(): void {
    this.position++;
    this.column++;
  }

  private skipWhitespaceAndComments(): void {
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
      } else {
        break;
      }
    }
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  private isOperator(char: string): boolean {
    return /[+\-*/%=<>!&|]/.test(char);
  }

  private readNumber(): void {
    let value = '';
    while (this.position < this.source.length && (this.isDigit(this.currentChar()) || this.currentChar() === '.')) {
      value += this.currentChar();
      this.advance();
    }
    this.addToken('number', parseFloat(value));
  }

  private readString(): void {
    const quote = this.currentChar();
    this.advance(); // 시작 따옴표 건너뛰기

    let value = '';
    while (this.position < this.source.length && this.currentChar() !== quote) {
      if (this.currentChar() === '\\') {
        this.advance();
        const escaped = this.currentChar();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped;
        }
        this.advance();
      } else {
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

  private readIdentifierOrKeyword(): void {
    let value = '';
    while (this.position < this.source.length && this.isAlphaNumeric(this.currentChar())) {
      value += this.currentChar();
      this.advance();
    }

    const keywords = ['fn', 'if', 'else', 'while', 'for', 'return', 'let', 'mut', 'true', 'false', 'null'];
    const type: TokenType = keywords.includes(value) ? 'keyword' : 'identifier';
    this.addToken(type, value);
  }

  private readOperator(): void {
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
    } else if (value === '->') {
      this.addToken('arrow', value);
    } else {
      this.addToken('operator', value);
    }
  }

  private addToken(type: TokenType, value: string | number): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column
    });
  }
}
