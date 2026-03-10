/**
 * FreeLang JIT Executor
 * Stack 기반 가상 머신으로 Bytecode 실행
 * 성능 목표: 10배 향상
 */

import { Chunk, OpCode, INSTRUCTION_INFO } from './bytecode';

// ============================================================
// 실행 프레임 (Call Stack Frame)
// ============================================================

interface Frame {
  locals: (any)[];
  pc: number; // Program Counter
  funcId: number;
}

// ============================================================
// JIT Executor
// ============================================================

export class JITExecutor {
  private chunk: Chunk;
  private stack: any[] = [];
  private globals: any[] = [];
  private frames: Frame[] = [];
  private pc: number = 0;
  private running: boolean = false;

  // 성능 측정
  private instructionCount: number = 0;
  private startTime: number = 0;

  constructor(chunk: Chunk) {
    this.chunk = chunk;
    this.initializeGlobals();
  }

  /**
   * 전역 변수 초기화
   */
  private initializeGlobals(): void {
    // 상수 풀 크기만큼 전역 변수 공간 할당
    const consts = this.chunk.getConstants();
    // 실제로는 심볼 테이블 기반으로 해야 함
    // 여기서는 대략 100개 정도 할당
    for (let i = 0; i < 100; i++) {
      this.globals.push(null);
    }
  }

  /**
   * 실행 시작
   */
  execute(): any {
    this.running = true;
    this.stack = [];
    this.pc = 0;
    this.instructionCount = 0;
    this.startTime = performance.now();

    try {
      while (this.running && this.pc < this.chunk.getCode().length) {
        this.step();
      }
    } catch (error) {
      throw error;
    }

    const elapsed = performance.now() - this.startTime;
    const result = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;

    // 성능 정보
    console.log(`[JIT] Instructions: ${this.instructionCount}, Time: ${elapsed.toFixed(2)}ms`);

    return result;
  }

  /**
   * 한 명령어 실행
   */
  private step(): void {
    const code = this.chunk.getCode();
    const opcode = code[this.pc] as OpCode;

    this.instructionCount++;

    // 명령어 실행
    switch (opcode) {
      case OpCode.PUSH:
        this.op_PUSH(code[++this.pc]);
        break;

      case OpCode.POP:
        this.op_POP();
        break;

      case OpCode.DUP:
        this.op_DUP();
        break;

      case OpCode.SWAP:
        this.op_SWAP();
        break;

      case OpCode.LOAD:
        this.op_LOAD(code[++this.pc]);
        break;

      case OpCode.STORE:
        this.op_STORE(code[++this.pc]);
        break;

      case OpCode.GLOAD:
        this.op_GLOAD(code[++this.pc]);
        break;

      case OpCode.GSTORE:
        this.op_GSTORE(code[++this.pc]);
        break;

      case OpCode.CONST:
        this.op_CONST(code[++this.pc]);
        break;

      case OpCode.NULL:
        this.op_NULL();
        break;

      case OpCode.ADD:
        this.op_ADD();
        break;

      case OpCode.SUB:
        this.op_SUB();
        break;

      case OpCode.MUL:
        this.op_MUL();
        break;

      case OpCode.DIV:
        this.op_DIV();
        break;

      case OpCode.MOD:
        this.op_MOD();
        break;

      case OpCode.EQ:
        this.op_EQ();
        break;

      case OpCode.NE:
        this.op_NE();
        break;

      case OpCode.LT:
        this.op_LT();
        break;

      case OpCode.LE:
        this.op_LE();
        break;

      case OpCode.GT:
        this.op_GT();
        break;

      case OpCode.GE:
        this.op_GE();
        break;

      case OpCode.AND:
        this.op_AND();
        break;

      case OpCode.OR:
        this.op_OR();
        break;

      case OpCode.NOT:
        this.op_NOT();
        break;

      case OpCode.JMP:
        this.op_JMP(code[++this.pc]);
        break;

      case OpCode.JMP_IF_FALSE:
        this.op_JMP_IF_FALSE(code[++this.pc]);
        break;

      case OpCode.RETURN:
        this.op_RETURN();
        break;

      case OpCode.HALT:
        this.op_HALT();
        break;

      case OpCode.CALL:
        this.op_CALL(code[++this.pc]);
        break;

      case OpCode.BUILTIN:
        this.op_BUILTIN(code[++this.pc]);
        break;

      case OpCode.ARRAY_CREATE:
        this.op_ARRAY_CREATE();
        break;

      case OpCode.ARRAY_GET:
        this.op_ARRAY_GET();
        break;

      case OpCode.ARRAY_SET:
        this.op_ARRAY_SET();
        break;

      case OpCode.ARRAY_LEN:
        this.op_ARRAY_LEN();
        break;

      case OpCode.ARRAY_PUSH:
        this.op_ARRAY_PUSH();
        break;

      case OpCode.OBJECT_CREATE:
        this.op_OBJECT_CREATE();
        break;

      case OpCode.OBJECT_GET:
        this.op_OBJECT_GET(code[++this.pc]);
        break;

      case OpCode.OBJECT_SET:
        this.op_OBJECT_SET(code[++this.pc]);
        break;

      default:
        throw new Error(`Unknown opcode: ${opcode}`);
    }

    this.pc++;
  }

  // ============================================================
  // 명령어 구현
  // ============================================================

  private op_PUSH(value: number): void {
    this.stack.push(value);
  }

  private op_POP(): void {
    this.stack.pop();
  }

  private op_DUP(): void {
    const top = this.stack[this.stack.length - 1];
    this.stack.push(top);
  }

  private op_SWAP(): void {
    const len = this.stack.length;
    [this.stack[len - 1], this.stack[len - 2]] = [this.stack[len - 2], this.stack[len - 1]];
  }

  private op_LOAD(index: number): void {
    const frame = this.currentFrame();
    this.stack.push(frame.locals[index]);
  }

  private op_STORE(index: number): void {
    const frame = this.currentFrame();
    const value = this.stack.pop();
    frame.locals[index] = value;
  }

  private op_GLOAD(index: number): void {
    this.stack.push(this.globals[index]);
  }

  private op_GSTORE(index: number): void {
    const value = this.stack.pop();
    this.globals[index] = value;
  }

  private op_CONST(index: number): void {
    const value = this.chunk.getConstants()[index];
    this.stack.push(value);
  }

  private op_NULL(): void {
    this.stack.push(null);
  }

  private op_ADD(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a + b);
  }

  private op_SUB(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a - b);
  }

  private op_MUL(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a * b);
  }

  private op_DIV(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a / b);
  }

  private op_MOD(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a % b);
  }

  private op_EQ(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a === b ? 1 : 0);
  }

  private op_NE(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a !== b ? 1 : 0);
  }

  private op_LT(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a < b ? 1 : 0);
  }

  private op_LE(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a <= b ? 1 : 0);
  }

  private op_GT(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a > b ? 1 : 0);
  }

  private op_GE(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a >= b ? 1 : 0);
  }

  private op_AND(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a && b ? 1 : 0);
  }

  private op_OR(): void {
    const b = this.stack.pop();
    const a = this.stack.pop();
    this.stack.push(a || b ? 1 : 0);
  }

  private op_NOT(): void {
    const a = this.stack.pop();
    this.stack.push(!a ? 1 : 0);
  }

  private op_JMP(target: number): void {
    this.pc = target - 1; // -1 because pc will be incremented in step()
  }

  private op_JMP_IF_FALSE(target: number): void {
    const value = this.stack.pop();
    if (!value) {
      this.pc = target - 1;
    }
  }

  private op_RETURN(): void {
    if (this.frames.length > 0) {
      const frame = this.frames.pop()!;
      this.pc = frame.pc - 1; // 호출 위치로 복귀
    } else {
      this.running = false;
    }
  }

  private op_HALT(): void {
    this.running = false;
  }

  private op_CALL(funcId: number): void {
    // 현재 PC 저장
    const returnPC = this.pc;

    // 함수 진입
    const func = this.chunk.getFunctionById(funcId);
    if (!func) {
      throw new Error(`Function not found: ${funcId}`);
    }

    // 새 프레임 생성
    const frame: Frame = {
      locals: new Array(func.numLocals).fill(null),
      pc: returnPC,
      funcId: funcId,
    };

    // 스택에서 인자 팝해서 로컬 변수로 설정
    for (let i = func.numParams - 1; i >= 0; i--) {
      frame.locals[i] = this.stack.pop();
    }

    this.frames.push(frame);

    // 함수 코드로 점프
    this.pc = func.codeOffset - 1;
  }

  private op_BUILTIN(constIndex: number): void {
    const name = this.chunk.getConstants()[constIndex] as string;

    switch (name) {
      case 'print': {
        const value = this.stack.pop();
        console.log(this.valueToString(value));
        this.stack.push(null);
        break;
      }

      case 'println': {
        const value = this.stack.pop();
        console.log(this.valueToString(value));
        this.stack.push(null);
        break;
      }

      case 'len': {
        const value = this.stack.pop();
        if (Array.isArray(value)) {
          this.stack.push(value.length);
        } else if (typeof value === 'string') {
          this.stack.push(value.length);
        } else {
          this.stack.push(0);
        }
        break;
      }

      case 'type': {
        const value = this.stack.pop();
        let type: string = typeof value;
        if (Array.isArray(value)) type = 'array';
        else if (value === null) type = 'null';
        this.stack.push(type);
        break;
      }

      case 'str': {
        const value = this.stack.pop();
        this.stack.push(this.valueToString(value));
        break;
      }

      case 'num': {
        const value = this.stack.pop();
        this.stack.push(Number(value));
        break;
      }

      default:
        throw new Error(`Unknown builtin: ${name}`);
    }
  }

  private op_ARRAY_CREATE(): void {
    const len = this.stack.pop() as number;
    this.stack.push(new Array(len).fill(null));
  }

  private op_ARRAY_GET(): void {
    const index = this.stack.pop() as number;
    const array = this.stack.pop() as any[];
    if (!Array.isArray(array)) {
      throw new Error('Cannot index non-array');
    }
    this.stack.push(array[index] ?? null);
  }

  private op_ARRAY_SET(): void {
    const value = this.stack.pop();
    const index = this.stack.pop() as number;
    const array = this.stack.pop() as any[];
    if (!Array.isArray(array)) {
      throw new Error('Cannot index non-array');
    }
    array[index] = value;
    this.stack.push(array); // 배열 반환
  }

  private op_ARRAY_LEN(): void {
    const array = this.stack.pop();
    if (Array.isArray(array)) {
      this.stack.push(array.length);
    } else {
      throw new Error('len() requires array');
    }
  }

  private op_ARRAY_PUSH(): void {
    const value = this.stack.pop();
    const array = this.stack.pop() as any[];
    if (!Array.isArray(array)) {
      throw new Error('push() requires array');
    }
    array.push(value);
    this.stack.push(array);
  }

  private op_OBJECT_CREATE(): void {
    this.stack.push({});
  }

  private op_OBJECT_GET(keyIndex: number): void {
    const key = this.chunk.getConstants()[keyIndex] as string;
    const obj = this.stack.pop() as any;
    this.stack.push(obj[key] ?? null);
  }

  private op_OBJECT_SET(keyIndex: number): void {
    const key = this.chunk.getConstants()[keyIndex] as string;
    const value = this.stack.pop();
    const obj = this.stack.pop() as any;
    obj[key] = value;
    this.stack.push(obj);
  }

  // ============================================================
  // 헬퍼 메서드
  // ============================================================

  private currentFrame(): Frame {
    if (this.frames.length === 0) {
      // 메인 프레임
      if (!this.frames[0]) {
        this.frames[0] = {
          locals: [],
          pc: 0,
          funcId: -1,
        };
      }
      return this.frames[0];
    }
    return this.frames[this.frames.length - 1];
  }

  private valueToString(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      return `[${value.map((v) => this.valueToString(v)).join(', ')}]`;
    }
    return String(value);
  }

  /**
   * 성능 정보 반환
   */
  getStats(): { instructions: number; stackDepth: number } {
    return {
      instructions: this.instructionCount,
      stackDepth: this.stack.length,
    };
  }
}
