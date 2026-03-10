/**
 * FreeLang Bytecode Generator
 * AST → Bytecode 변환
 */

import { ASTNode } from './types';
import { Chunk, OpCode } from './bytecode';

// ============================================================
// 컴파일러 상태
// ============================================================

interface CompileContext {
  localVariables: Map<string, number>; // 변수명 → 인덱스
  globalVariables: Map<string, number>; // 전역 변수
  localCount: number; // 로컬 변수 개수
  functions: Map<string, number>; // 함수명 → ID
}

// ============================================================
// Bytecode Generator
// ============================================================

export class BytecodeGenerator {
  private chunk: Chunk;
  private context: CompileContext;
  private functionCount = 0;

  constructor() {
    this.chunk = new Chunk();
    this.context = {
      localVariables: new Map(),
      globalVariables: new Map(),
      localCount: 0,
      functions: new Map(),
    };
  }

  /**
   * 메인 컴파일 메서드
   */
  compile(ast: ASTNode): Chunk {
    this.chunk.clear();
    this.context = {
      localVariables: new Map(),
      globalVariables: new Map(),
      localCount: 0,
      functions: new Map(),
    };

    // AST가 Block인 경우 statements 추출
    const statements: ASTNode[] = ast.type === 'block' ? (ast as any).statements : [ast];

    // 먼저 모든 함수 정의 수집
    for (const node of statements) {
      if (node.type === 'functionDef') {
        this.collectFunction(node);
      }
    }

    // 메인 코드 컴파일
    for (const node of statements) {
      this.compileStatement(node);
    }

    // 메인 종료
    this.chunk.emitInstruction(OpCode.HALT);

    return this.chunk;
  }

  /**
   * 함수 정의 수집
   */
  private collectFunction(node: any): void {
    const name = node.name;
    const id = this.functionCount++;
    this.context.functions.set(name, id);
    this.chunk.addFunction(name, this.chunk.size(), node.params.length, node.params.length);
  }

  /**
   * Statement 컴파일
   */
  private compileStatement(node: ASTNode): void {
    switch (node.type) {
      case 'assignment': {
        const n = node as any;
        this.compileExpression(n.value);
        const idx = this.context.globalVariables.size;
        this.context.globalVariables.set(n.variable, idx);
        this.chunk.addGlobal(n.variable, idx);
        this.chunk.emitInstruction(OpCode.GSTORE, idx);
        break;
      }

      case 'if': {
        const n = node as any;
        this.compileExpression(n.condition);
        const jumpFalseIdx = this.chunk.size();
        this.chunk.emitInstruction(OpCode.JMP_IF_FALSE, 0);
        this.compileStatement(n.thenBranch);
        if (n.elseBranch) {
          const jumpEndIdx = this.chunk.size();
          this.chunk.emitInstruction(OpCode.JMP, 0);
          const falseTarget = this.chunk.size();
          this.chunk.patchByte(jumpFalseIdx + 1, falseTarget);
          this.compileStatement(n.elseBranch);
          const endTarget = this.chunk.size();
          this.chunk.patchByte(jumpEndIdx + 1, endTarget);
        } else {
          const endTarget = this.chunk.size();
          this.chunk.patchByte(jumpFalseIdx + 1, endTarget);
        }
        break;
      }

      case 'while': {
        const n = node as any;
        const loopStart = this.chunk.size();
        this.compileExpression(n.condition);
        const jumpFalseIdx = this.chunk.size();
        this.chunk.emitInstruction(OpCode.JMP_IF_FALSE, 0);
        this.compileStatement(n.body);
        this.chunk.emitInstruction(OpCode.JMP, loopStart);
        const exitTarget = this.chunk.size();
        this.chunk.patchByte(jumpFalseIdx + 1, exitTarget);
        break;
      }

      case 'functionDef': {
        const n = node as any;
        const funcId = this.context.functions.get(n.name)!;
        const codeStart = this.chunk.size();
        const savedLocals = this.context.localVariables;
        const savedLocalCount = this.context.localCount;

        this.context.localVariables = new Map();
        this.context.localCount = 0;

        for (let i = 0; i < n.params.length; i++) {
          this.context.localVariables.set(n.params[i], i);
          this.context.localCount++;
        }

        this.compileStatement(n.body);

        if (!this.endsWithReturn(n.body)) {
          this.chunk.emitInstruction(OpCode.NULL);
          this.chunk.emitInstruction(OpCode.RETURN);
        }

        this.context.localVariables = savedLocals;
        this.context.localCount = savedLocalCount;
        break;
      }

      case 'return': {
        const n = node as any;
        if (n.value) {
          this.compileExpression(n.value);
        } else {
          this.chunk.emitInstruction(OpCode.NULL);
        }
        this.chunk.emitInstruction(OpCode.RETURN);
        break;
      }

      case 'block': {
        const n = node as any;
        for (const stmt of n.statements) {
          this.compileStatement(stmt);
        }
        break;
      }

      default:
        // 표현식 statement로 취급
        this.compileExpression(node);
        this.chunk.emitInstruction(OpCode.POP);
        break;
    }
  }

  /**
   * Expression 컴파일
   */
  private compileExpression(node: ASTNode): void {
    switch (node.type) {
      case 'number': {
        const n = node as any;
        const index = this.chunk.addConstant(n.value);
        this.chunk.emitInstruction(OpCode.CONST, index);
        break;
      }

      case 'string': {
        const n = node as any;
        const index = this.chunk.addConstant(n.value);
        this.chunk.emitInstruction(OpCode.CONST, index);
        break;
      }

      case 'identifier': {
        const n = node as any;
        if (this.context.localVariables.has(n.name)) {
          const idx = this.context.localVariables.get(n.name)!;
          this.chunk.emitInstruction(OpCode.LOAD, idx);
        } else if (this.context.globalVariables.has(n.name)) {
          const idx = this.context.globalVariables.get(n.name)!;
          this.chunk.emitInstruction(OpCode.GLOAD, idx);
        } else if (this.context.functions.has(n.name)) {
          const funcId = this.context.functions.get(n.name)!;
          const index = this.chunk.addConstant(funcId);
          this.chunk.emitInstruction(OpCode.CONST, index);
        } else {
          throw new Error(`Undefined variable: ${n.name}`);
        }
        break;
      }

      case 'binaryOp': {
        const n = node as any;
        this.compileExpression(n.left);
        this.compileExpression(n.right);
        this.compileBinaryOp(n.operator);
        break;
      }

      case 'unaryOp': {
        const n = node as any;
        this.compileExpression(n.operand);
        this.compileUnaryOp(n.operator);
        break;
      }

      case 'functionCall': {
        const n = node as any;
        if (this.chunk.getBuiltin(n.name)) {
          for (const arg of n.args) {
            this.compileExpression(arg);
          }
          const index = this.chunk.addConstant(n.name);
          this.chunk.emitInstruction(OpCode.BUILTIN, index);
        } else if (this.context.functions.has(n.name)) {
          const funcId = this.context.functions.get(n.name)!;
          for (const arg of n.args) {
            this.compileExpression(arg);
          }
          this.chunk.emitInstruction(OpCode.CALL, funcId);
        } else {
          throw new Error(`Undefined function: ${n.name}`);
        }
        break;
      }

      case 'arrayLiteral': {
        const n = node as any;
        const len = n.elements.length;
        const lenIdx = this.chunk.addConstant(len);
        this.chunk.emitInstruction(OpCode.CONST, lenIdx);
        this.chunk.emitInstruction(OpCode.ARRAY_CREATE);

        for (let i = 0; i < len; i++) {
          this.chunk.emitInstruction(OpCode.DUP);
          const idxConst = this.chunk.addConstant(i);
          this.chunk.emitInstruction(OpCode.CONST, idxConst);
          this.compileExpression(n.elements[i]);
          this.chunk.emitInstruction(OpCode.ARRAY_SET);
        }
        break;
      }

      case 'arrayAccess': {
        const n = node as any;
        this.compileExpression(n.array);
        this.compileExpression(n.index);
        this.chunk.emitInstruction(OpCode.ARRAY_GET);
        break;
      }

      default:
        throw new Error(`Unknown expression type: ${(node as any).type}`);
    }
  }

  /**
   * 이항 연산 명령어 생성
   */
  private compileBinaryOp(operator: string): void {
    switch (operator) {
      case '+':
        this.chunk.emitInstruction(OpCode.ADD);
        break;
      case '-':
        this.chunk.emitInstruction(OpCode.SUB);
        break;
      case '*':
        this.chunk.emitInstruction(OpCode.MUL);
        break;
      case '/':
        this.chunk.emitInstruction(OpCode.DIV);
        break;
      case '%':
        this.chunk.emitInstruction(OpCode.MOD);
        break;
      case '==':
        this.chunk.emitInstruction(OpCode.EQ);
        break;
      case '!=':
        this.chunk.emitInstruction(OpCode.NE);
        break;
      case '<':
        this.chunk.emitInstruction(OpCode.LT);
        break;
      case '<=':
        this.chunk.emitInstruction(OpCode.LE);
        break;
      case '>':
        this.chunk.emitInstruction(OpCode.GT);
        break;
      case '>=':
        this.chunk.emitInstruction(OpCode.GE);
        break;
      case '&&':
        this.chunk.emitInstruction(OpCode.AND);
        break;
      case '||':
        this.chunk.emitInstruction(OpCode.OR);
        break;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * 단항 연산 명령어 생성
   */
  private compileUnaryOp(operator: string): void {
    switch (operator) {
      case '-':
        // 음수화: 0 - x
        const zeroIdx = this.chunk.addConstant(0);
        this.chunk.emitInstruction(OpCode.CONST, zeroIdx);
        this.chunk.emitInstruction(OpCode.SWAP);
        this.chunk.emitInstruction(OpCode.SUB);
        break;
      case '!':
        this.chunk.emitInstruction(OpCode.NOT);
        break;
      default:
        throw new Error(`Unknown unary operator: ${operator}`);
    }
  }

  /**
   * 문장이 return으로 끝나는지 확인
   */
  private endsWithReturn(node: ASTNode): boolean {
    if (node.type === 'return') return true;
    if (node.type === 'block') {
      const stmts = (node as any).statements;
      return stmts.length > 0 && this.endsWithReturn(stmts[stmts.length - 1]);
    }
    if (node.type === 'if') {
      const ifNode = node as any;
      const thenEnds = this.endsWithReturn(ifNode.thenBranch);
      const elseEnds = ifNode.elseBranch && this.endsWithReturn(ifNode.elseBranch);
      return thenEnds && elseEnds;
    }
    return false;
  }
}
