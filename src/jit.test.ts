/**
 * JIT Compiler & Executor 테스트 (메모리 최적화)
 *
 * 주의: 메모리 제약으로 성능 벤치마크는 별도 파일에서 진행
 * 기본 기능 테스트 20개만 유지
 */

import { Lexer } from './lexer';
import { Parser } from './parser';
import { BytecodeGenerator } from './bytecode_generator';
import { JITExecutor } from './jit_executor';

function compileAndExecute(source: string): any {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const generator = new BytecodeGenerator();
  const chunk = generator.compile(ast);
  const executor = new JITExecutor(chunk);
  return executor.execute();
}

describe('JIT Compiler & Executor - 기본 기능', () => {
  test('CONST: 숫자 상수', () => {
    expect(() => compileAndExecute('x = 42\nprint(x)')).not.toThrow();
  });

  test('ADD: 덧셈', () => {
    expect(() => compileAndExecute('z = 5 + 3\nprint(z)')).not.toThrow();
  });

  test('SUB: 뺄셈', () => {
    expect(() => compileAndExecute('c = 10 - 4\nprint(c)')).not.toThrow();
  });

  test('MUL: 곱셈', () => {
    expect(() => compileAndExecute('z = 6 * 7\nprint(z)')).not.toThrow();
  });

  test('DIV: 나눗셈', () => {
    expect(() => compileAndExecute('c = 20 / 4\nprint(c)')).not.toThrow();
  });

  test('EQ: 같음 비교', () => {
    expect(() => compileAndExecute('c = 5 == 5\nprint(c)')).not.toThrow();
  });

  test('LT: 미만 비교', () => {
    expect(() => compileAndExecute('c = 3 < 5\nprint(c)')).not.toThrow();
  });

  test('AND: 논리 AND', () => {
    expect(() => compileAndExecute('c = 1 && 1\nprint(c)')).not.toThrow();
  });

  test('NOT: 논리 NOT', () => {
    expect(() => compileAndExecute('b = !1\nprint(b)')).not.toThrow();
  });

  test('if: 조건문', () => {
    const source = `
      x = 10
      if (x > 5) {
        print("yes")
      } else {
        print("no")
      }
    `;
    expect(() => compileAndExecute(source)).not.toThrow();
  });

  test('while: 루프', () => {
    const source = `
      i = 0
      while (i < 3) {
        print(i)
        i = i + 1
      }
    `;
    expect(() => compileAndExecute(source)).not.toThrow();
  });

  test('배열 생성', () => {
    expect(() => compileAndExecute('arr = [1, 2, 3]\nprint(arr)')).not.toThrow();
  });

  test('배열 인덱싱', () => {
    expect(() => compileAndExecute('arr = [10, 20, 30]\nx = arr[1]\nprint(x)')).not.toThrow();
  });

  test('len(): 배열 길이', () => {
    expect(() => compileAndExecute('arr = [1, 2, 3, 4, 5]\nn = len(arr)\nprint(n)')).not.toThrow();
  });

  test('함수 호출', () => {
    const source = `
      fn add(a, b) {
        return a + b
      }
      result = add(5, 3)
      print(result)
    `;
    expect(() => compileAndExecute(source)).not.toThrow();
  });

  test('함수 반환', () => {
    const source = `
      fn square(x) {
        return x * x
      }
      y = square(7)
      print(y)
    `;
    expect(() => compileAndExecute(source)).not.toThrow();
  });

  test('factorial: 재귀', () => {
    const source = `
      fn factorial(n) {
        if (n <= 1) {
          return 1
        } else {
          return n * factorial(n - 1)
        }
      }
      result = factorial(5)
      print(result)
    `;
    expect(() => compileAndExecute(source)).not.toThrow();
  });

  test('type: 타입 확인', () => {
    expect(() => compileAndExecute('t = type(42)\nprint(t)')).not.toThrow();
  });

  test('str: 문자열 변환', () => {
    expect(() => compileAndExecute('s = str(42)\nprint(s)')).not.toThrow();
  });
});
