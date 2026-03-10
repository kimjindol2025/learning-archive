/**
 * FreeLang Bootstrap 타입 정의
 * 부트스트랩 인터프리터의 핵심 타입들
 */

// 토큰 타입
export type TokenType =
  | 'number' | 'string' | 'identifier' | 'keyword'
  | 'operator' | 'lparen' | 'rparen' | 'lbrace' | 'rbrace'
  | 'lbracket' | 'rbracket'
  | 'comma' | 'semicolon' | 'eof' | 'newline' | 'colon'
  | 'equals' | 'arrow' | 'dot';

export interface Token {
  type: TokenType;
  value: string | number;
  line: number;
  column: number;
}

// AST 노드 타입
export type ASTNode =
  | NumberLiteral
  | StringLiteral
  | Identifier
  | BinaryOp
  | UnaryOp
  | FunctionCall
  | FunctionDef
  | IfStatement
  | WhileLoop
  | ForLoop
  | Assignment
  | ArrayAssignment
  | Block
  | ReturnStatement
  | ArrayLiteral
  | ArrayAccess
  | ObjectLiteral
  | ObjectAccess;

export interface NumberLiteral {
  type: 'number';
  value: number;
}

export interface StringLiteral {
  type: 'string';
  value: string;
}

export interface Identifier {
  type: 'identifier';
  name: string;
}

export interface BinaryOp {
  type: 'binaryOp';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOp {
  type: 'unaryOp';
  operator: string;
  operand: ASTNode;
}

export interface FunctionCall {
  type: 'functionCall';
  name: string;
  args: ASTNode[];
}

export interface FunctionDef {
  type: 'functionDef';
  name: string;
  params: string[];
  body: ASTNode;
}

export interface IfStatement {
  type: 'if';
  condition: ASTNode;
  thenBranch: ASTNode;
  elseBranch?: ASTNode;
}

export interface WhileLoop {
  type: 'while';
  condition: ASTNode;
  body: ASTNode;
}

export interface ForLoop {
  type: 'for';
  variable: string;
  start: ASTNode;
  end: ASTNode;
  body: ASTNode;
}

export interface Assignment {
  type: 'assignment';
  variable: string;
  value: ASTNode;
}

export interface ArrayAssignment {
  type: 'arrayAssignment';
  array: ASTNode;
  index: ASTNode;
  value: ASTNode;
}

export interface Block {
  type: 'block';
  statements: ASTNode[];
}

export interface ReturnStatement {
  type: 'return';
  value: ASTNode;
}

export interface ArrayLiteral {
  type: 'arrayLiteral';
  elements: ASTNode[];
}

export interface ArrayAccess {
  type: 'arrayAccess';
  array: ASTNode;
  index: ASTNode;
}

export interface ObjectLiteral {
  type: 'objectLiteral';
  properties: Array<{ key: string; value: ASTNode }>;
}

export interface ObjectAccess {
  type: 'objectAccess';
  object: ASTNode;
  property: string;
}

// 값 타입
export type FlValue =
  | number
  | string
  | boolean
  | null
  | { [key: string]: FlValue }
  | FlValue[];

// 실행 환경
export interface Environment {
  variables: Map<string, FlValue>;
  parent?: Environment;
  functions: Map<string, FunctionDef>;
}

// 실행 결과
export interface ExecutionResult {
  value: FlValue;
  error?: string;
  line?: number;
}
