/**
 * FreeLang Bytecode 정의
 * Stack 기반 가상 머신을 위한 중간 표현
 */

// ============================================================
// Bytecode 명령어 열거형
// ============================================================

export enum OpCode {
  // 스택 조작 (4)
  PUSH = 0x00,
  POP = 0x01,
  DUP = 0x02,
  SWAP = 0x03,

  // 변수 (4)
  LOAD = 0x04,
  STORE = 0x05,
  GLOAD = 0x06,
  GSTORE = 0x07,

  // 상수 (2)
  CONST = 0x08,
  NULL = 0x09,

  // 산술 연산 (5)
  ADD = 0x0A,
  SUB = 0x0B,
  MUL = 0x0C,
  DIV = 0x0D,
  MOD = 0x0E,

  // 비교 연산 (6)
  EQ = 0x0F,
  NE = 0x10,
  LT = 0x11,
  LE = 0x12,
  GT = 0x13,
  GE = 0x14,

  // 논리 연산 (3)
  AND = 0x15,
  OR = 0x16,
  NOT = 0x17,

  // 제어 흐름 (4)
  JMP = 0x18,
  JMP_IF_FALSE = 0x19,
  RETURN = 0x1A,
  HALT = 0x1B,

  // 함수 호출 (2)
  CALL = 0x1C,
  BUILTIN = 0x1D,

  // 배열 (5)
  ARRAY_CREATE = 0x1E,
  ARRAY_GET = 0x1F,
  ARRAY_SET = 0x20,
  ARRAY_LEN = 0x21,
  ARRAY_PUSH = 0x22,

  // 객체 (3)
  OBJECT_CREATE = 0x23,
  OBJECT_GET = 0x24,
  OBJECT_SET = 0x25,
}

// ============================================================
// 명령어 정보
// ============================================================

export interface InstructionInfo {
  opcode: OpCode
  name: string
  operands: number
}

export const INSTRUCTION_INFO: Map<OpCode, InstructionInfo> = new Map([
  // 스택 조작
  [OpCode.PUSH, { opcode: OpCode.PUSH, name: 'PUSH', operands: 1 }],
  [OpCode.POP, { opcode: OpCode.POP, name: 'POP', operands: 0 }],
  [OpCode.DUP, { opcode: OpCode.DUP, name: 'DUP', operands: 0 }],
  [OpCode.SWAP, { opcode: OpCode.SWAP, name: 'SWAP', operands: 0 }],

  // 변수
  [OpCode.LOAD, { opcode: OpCode.LOAD, name: 'LOAD', operands: 1 }],
  [OpCode.STORE, { opcode: OpCode.STORE, name: 'STORE', operands: 1 }],
  [OpCode.GLOAD, { opcode: OpCode.GLOAD, name: 'GLOAD', operands: 1 }],
  [OpCode.GSTORE, { opcode: OpCode.GSTORE, name: 'GSTORE', operands: 1 }],

  // 상수
  [OpCode.CONST, { opcode: OpCode.CONST, name: 'CONST', operands: 1 }],
  [OpCode.NULL, { opcode: OpCode.NULL, name: 'NULL', operands: 0 }],

  // 산술
  [OpCode.ADD, { opcode: OpCode.ADD, name: 'ADD', operands: 0 }],
  [OpCode.SUB, { opcode: OpCode.SUB, name: 'SUB', operands: 0 }],
  [OpCode.MUL, { opcode: OpCode.MUL, name: 'MUL', operands: 0 }],
  [OpCode.DIV, { opcode: OpCode.DIV, name: 'DIV', operands: 0 }],
  [OpCode.MOD, { opcode: OpCode.MOD, name: 'MOD', operands: 0 }],

  // 비교
  [OpCode.EQ, { opcode: OpCode.EQ, name: 'EQ', operands: 0 }],
  [OpCode.NE, { opcode: OpCode.NE, name: 'NE', operands: 0 }],
  [OpCode.LT, { opcode: OpCode.LT, name: 'LT', operands: 0 }],
  [OpCode.LE, { opcode: OpCode.LE, name: 'LE', operands: 0 }],
  [OpCode.GT, { opcode: OpCode.GT, name: 'GT', operands: 0 }],
  [OpCode.GE, { opcode: OpCode.GE, name: 'GE', operands: 0 }],

  // 논리
  [OpCode.AND, { opcode: OpCode.AND, name: 'AND', operands: 0 }],
  [OpCode.OR, { opcode: OpCode.OR, name: 'OR', operands: 0 }],
  [OpCode.NOT, { opcode: OpCode.NOT, name: 'NOT', operands: 0 }],

  // 제어
  [OpCode.JMP, { opcode: OpCode.JMP, name: 'JMP', operands: 1 }],
  [OpCode.JMP_IF_FALSE, { opcode: OpCode.JMP_IF_FALSE, name: 'JMP_IF_FALSE', operands: 1 }],
  [OpCode.RETURN, { opcode: OpCode.RETURN, name: 'RETURN', operands: 0 }],
  [OpCode.HALT, { opcode: OpCode.HALT, name: 'HALT', operands: 0 }],

  // 함수
  [OpCode.CALL, { opcode: OpCode.CALL, name: 'CALL', operands: 1 }],
  [OpCode.BUILTIN, { opcode: OpCode.BUILTIN, name: 'BUILTIN', operands: 1 }],

  // 배열
  [OpCode.ARRAY_CREATE, { opcode: OpCode.ARRAY_CREATE, name: 'ARRAY_CREATE', operands: 1 }],
  [OpCode.ARRAY_GET, { opcode: OpCode.ARRAY_GET, name: 'ARRAY_GET', operands: 0 }],
  [OpCode.ARRAY_SET, { opcode: OpCode.ARRAY_SET, name: 'ARRAY_SET', operands: 0 }],
  [OpCode.ARRAY_LEN, { opcode: OpCode.ARRAY_LEN, name: 'ARRAY_LEN', operands: 0 }],
  [OpCode.ARRAY_PUSH, { opcode: OpCode.ARRAY_PUSH, name: 'ARRAY_PUSH', operands: 0 }],

  // 객체
  [OpCode.OBJECT_CREATE, { opcode: OpCode.OBJECT_CREATE, name: 'OBJECT_CREATE', operands: 0 }],
  [OpCode.OBJECT_GET, { opcode: OpCode.OBJECT_GET, name: 'OBJECT_GET', operands: 1 }],
  [OpCode.OBJECT_SET, { opcode: OpCode.OBJECT_SET, name: 'OBJECT_SET', operands: 1 }],
]);

// ============================================================
// 상수 풀 (Constant Pool)
// ============================================================

export class ConstantPool {
  private constants: (number | string | boolean | null)[] = [];
  private indexMap: Map<string, number> = new Map();

  /**
   * 상수를 상수 풀에 추가
   * 중복 제거: 같은 값이 이미 있으면 그 인덱스 반환
   */
  addConstant(value: number | string | boolean | null): number {
    const key = JSON.stringify(value);

    if (this.indexMap.has(key)) {
      return this.indexMap.get(key)!;
    }

    const index = this.constants.length;
    this.constants.push(value);
    this.indexMap.set(key, index);
    return index;
  }

  /**
   * 인덱스로 상수 조회
   */
  getConstant(index: number): number | string | boolean | null {
    return this.constants[index];
  }

  /**
   * 모든 상수 반환
   */
  getAll(): (number | string | boolean | null)[] {
    return [...this.constants];
  }

  /**
   * 상수 풀 크기
   */
  size(): number {
    return this.constants.length;
  }

  /**
   * 상수 풀 초기화
   */
  clear(): void {
    this.constants = [];
    this.indexMap.clear();
  }
}

// ============================================================
// 심볼 테이블
// ============================================================

export interface FunctionSymbol {
  id: number
  name: string
  codeOffset: number
  numLocals: number
  numParams: number
}

export interface GlobalSymbol {
  id: number
  name: string
  index: number
}

export interface BuiltinSymbol {
  name: string
  arity: number // -1 = 가변
}

export class SymbolTable {
  private functions: Map<string, FunctionSymbol> = new Map();
  private globals: Map<string, GlobalSymbol> = new Map();
  private builtins: Map<string, BuiltinSymbol> = new Map();

  private functionId = 0;
  private globalId = 0;

  /**
   * 함수 등록
   */
  addFunction(name: string, codeOffset: number, numLocals: number, numParams: number): number {
    const id = this.functionId++;
    this.functions.set(name, { id, name, codeOffset, numLocals, numParams });
    return id;
  }

  /**
   * 함수 조회
   */
  getFunction(name: string): FunctionSymbol | undefined {
    return this.functions.get(name);
  }

  /**
   * 함수 ID로 조회
   */
  getFunctionById(id: number): FunctionSymbol | undefined {
    for (const sym of this.functions.values()) {
      if (sym.id === id) return sym;
    }
    return undefined;
  }

  /**
   * 전역 변수 등록
   */
  addGlobal(name: string, index: number): number {
    const id = this.globalId++;
    this.globals.set(name, { id, name, index });
    return id;
  }

  /**
   * 전역 변수 조회
   */
  getGlobal(name: string): GlobalSymbol | undefined {
    return this.globals.get(name);
  }

  /**
   * 내장 함수 등록
   */
  addBuiltin(name: string, arity: number): void {
    this.builtins.set(name, { name, arity });
  }

  /**
   * 내장 함수 조회
   */
  getBuiltin(name: string): BuiltinSymbol | undefined {
    return this.builtins.get(name);
  }

  /**
   * 초기화
   */
  clear(): void {
    this.functions.clear();
    this.globals.clear();
    this.builtins.clear();
    this.functionId = 0;
    this.globalId = 0;
  }
}

// ============================================================
// Bytecode 청크 (Chunk)
// ============================================================

export class Chunk {
  private code: number[] = [];
  private constants: ConstantPool = new ConstantPool();
  private symbols: SymbolTable = new SymbolTable();
  private lines: number[] = [];

  constructor() {
    // 기본 내장 함수 등록
    this.registerBuiltins();
  }

  /**
   * 바이트코드 추가
   */
  emit(byte: number, line: number = 0): void {
    this.code.push(byte);
    this.lines.push(line);
  }

  /**
   * 명령어 + 피연산자 추가
   */
  emitInstruction(opcode: OpCode, operand?: number, line: number = 0): void {
    this.emit(opcode, line);
    if (operand !== undefined) {
      this.emit(operand, line);
    }
  }

  /**
   * 상수 추가 및 인덱스 반환
   */
  addConstant(value: number | string | boolean | null): number {
    return this.constants.addConstant(value);
  }

  /**
   * 함수 등록
   */
  addFunction(name: string, codeOffset: number, numLocals: number, numParams: number): number {
    return this.symbols.addFunction(name, codeOffset, numLocals, numParams);
  }

  /**
   * 전역 변수 등록
   */
  addGlobal(name: string, index: number): number {
    return this.symbols.addGlobal(name, index);
  }

  /**
   * 함수 조회
   */
  getFunction(name: string) {
    return this.symbols.getFunction(name);
  }

  /**
   * 함수 ID로 조회
   */
  getFunctionById(id: number) {
    return this.symbols.getFunctionById(id);
  }

  /**
   * 전역 변수 조회
   */
  getGlobal(name: string) {
    return this.symbols.getGlobal(name);
  }

  /**
   * 내장 함수 조회
   */
  getBuiltin(name: string) {
    return this.symbols.getBuiltin(name);
  }

  /**
   * 코드 조회
   */
  getCode(): number[] {
    return [...this.code];
  }

  /**
   * 상수 풀 조회
   */
  getConstants(): (number | string | boolean | null)[] {
    return this.constants.getAll();
  }

  /**
   * 청크 크기
   */
  size(): number {
    return this.code.length;
  }

  /**
   * 마지막 바이트 인덱스
   */
  lastIndex(): number {
    return this.code.length - 1;
  }

  /**
   * 바이트코드 수정 (점프 오프셋 업데이트용)
   */
  patchByte(index: number, byte: number): void {
    this.code[index] = byte;
  }

  /**
   * 내장 함수 등록
   */
  private registerBuiltins(): void {
    this.symbols.addBuiltin('print', 1);
    this.symbols.addBuiltin('println', 1);
    this.symbols.addBuiltin('len', 1);
    this.symbols.addBuiltin('type', 1);
    this.symbols.addBuiltin('str', 1);
    this.symbols.addBuiltin('num', 1);
  }

  /**
   * 청크 초기화
   */
  clear(): void {
    this.code = [];
    this.constants.clear();
    this.symbols.clear();
    this.lines = [];
    this.registerBuiltins();
  }

  /**
   * 디버그 정보 출력
   */
  disassemble(name: string = 'Chunk'): string {
    let output = `== ${name} ==\n`;

    output += '\n--- Bytecode ---\n';
    for (let i = 0; i < this.code.length; i++) {
      const opcode = this.code[i];
      const info = INSTRUCTION_INFO.get(opcode as OpCode);

      if (info) {
        output += `${i.toString().padStart(4, '0')} ${info.name}`;

        if (info.operands > 0 && i + 1 < this.code.length) {
          const operand = this.code[++i];
          output += ` ${operand}`;
        }
        output += '\n';
      }
    }

    output += '\n--- Constants ---\n';
    const consts = this.constants.getAll();
    consts.forEach((c, i) => {
      output += `${i} ${JSON.stringify(c)}\n`;
    });

    return output;
  }
}
