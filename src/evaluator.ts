/**
 * FreeLang Bootstrap Evaluator
 * AST 실행
 */

import { ASTNode, Environment, FlValue, FunctionDef, ExecutionResult } from './types';

export class Evaluator {
  private globalEnv: Environment;
  private currentEnv: Environment;

  constructor() {
    this.globalEnv = this.createGlobalEnvironment();
    this.currentEnv = this.globalEnv;
  }

  evaluate(ast: ASTNode): ExecutionResult {
    try {
      const value = this.eval(ast, this.currentEnv);
      return { value };
    } catch (error: any) {
      return {
        value: null,
        error: error.message
      };
    }
  }

  private eval(node: ASTNode, env: Environment): FlValue {
    switch (node.type) {
      case 'number':
        return (node as any).value;

      case 'string':
        return (node as any).value;

      case 'identifier':
        return this.getVariable((node as any).name, env);

      case 'binaryOp':
        return this.evalBinaryOp(node as any, env);

      case 'unaryOp':
        return this.evalUnaryOp(node as any, env);

      case 'functionCall':
        return this.evalFunctionCall(node as any, env);

      case 'assignment':
        return this.evalAssignment(node as any, env);

      case 'if':
        return this.evalIf(node as any, env);

      case 'while':
        return this.evalWhile(node as any, env);

      case 'for':
        return this.evalFor(node as any, env);

      case 'block':
        return this.evalBlock(node as any, env);

      case 'return':
        throw { type: 'return', value: this.eval((node as any).value, env) };

      case 'functionDef':
        return this.evalFunctionDef(node as any, env);

      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }

  private evalBinaryOp(node: any, env: Environment): FlValue {
    const left = this.eval(node.left, env);
    const right = this.eval(node.right, env);

    switch (node.operator) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        return (left as number) + (right as number);

      case '-':
        return (left as number) - (right as number);

      case '*':
        return (left as number) * (right as number);

      case '/':
        return (left as number) / (right as number);

      case '%':
        return (left as number) % (right as number);

      case '==':
        return left === right ? 1 : 0;

      case '!=':
        return left !== right ? 1 : 0;

      case '<':
        return (left as number) < (right as number) ? 1 : 0;

      case '>':
        return (left as number) > (right as number) ? 1 : 0;

      case '<=':
        return (left as number) <= (right as number) ? 1 : 0;

      case '>=':
        return (left as number) >= (right as number) ? 1 : 0;

      case '&&':
        return (left && right) ? 1 : 0;

      case '||':
        return (left || right) ? 1 : 0;

      default:
        throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  private evalUnaryOp(node: any, env: Environment): FlValue {
    const operand = this.eval(node.operand, env);

    switch (node.operator) {
      case '-':
        return -(operand as number);

      case '!':
        return operand ? 0 : 1;

      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  private evalFunctionCall(node: any, env: Environment): FlValue {
    // 내장 함수
    if (this.isBuiltinFunction(node.name)) {
      return this.callBuiltin(node.name, node.args, env);
    }

    // 사용자 정의 함수
    const func = env.functions.get(node.name);
    if (!func) {
      throw new Error(`Undefined function: ${node.name}`);
    }

    const args = node.args.map((arg: ASTNode) => this.eval(arg, env));

    // 새 환경 생성
    const callEnv: Environment = {
      variables: new Map(),
      parent: env,
      functions: env.functions
    };

    // 매개변수 바인딩
    for (let i = 0; i < func.params.length; i++) {
      callEnv.variables.set(func.params[i], args[i] ?? null);
    }

    try {
      this.eval(func.body, callEnv);
      return null;
    } catch (e: any) {
      if (e.type === 'return') {
        return e.value;
      }
      throw e;
    }
  }

  private evalAssignment(node: any, env: Environment): FlValue {
    const value = this.eval(node.value, env);
    env.variables.set(node.variable, value);
    return value;
  }

  private evalIf(node: any, env: Environment): FlValue {
    const condition = this.eval(node.condition, env);

    if (condition) {
      return this.eval(node.thenBranch, env);
    } else if (node.elseBranch) {
      return this.eval(node.elseBranch, env);
    }

    return null;
  }

  private evalWhile(node: any, env: Environment): FlValue {
    let result: FlValue = null;

    while (this.eval(node.condition, env)) {
      result = this.eval(node.body, env);
    }

    return result;
  }

  private evalFor(node: any, env: Environment): FlValue {
    const start = this.eval(node.start, env) as number;
    const end = this.eval(node.end, env) as number;
    let result: FlValue = null;

    for (let i = start; i < end; i++) {
      env.variables.set(node.variable, i);
      result = this.eval(node.body, env);
    }

    return result;
  }

  private evalBlock(node: any, env: Environment): FlValue {
    let result: FlValue = null;

    for (const statement of node.statements) {
      result = this.eval(statement, env);
    }

    return result;
  }

  private evalFunctionDef(node: any, env: Environment): FlValue {
    env.functions.set(node.name, node as FunctionDef);
    return null;
  }

  private isBuiltinFunction(name: string): boolean {
    const builtins = [
      'print', 'println', 'len', 'type', 'str', 'num',
      'keys', 'values', 'push', 'pop'
    ];
    return builtins.includes(name);
  }

  private callBuiltin(name: string, args: ASTNode[], env: Environment): FlValue {
    const values = args.map(arg => this.eval(arg, env));

    switch (name) {
      case 'print':
        console.log(...values.map(v => this.stringify(v)));
        return null;

      case 'println':
        console.log(...values.map(v => this.stringify(v)));
        return null;

      case 'len':
        if (typeof values[0] === 'string') {
          return (values[0] as string).length;
        } else if (Array.isArray(values[0])) {
          return (values[0] as any[]).length;
        } else if (typeof values[0] === 'object' && values[0] !== null) {
          return Object.keys(values[0] as object).length;
        }
        throw new Error('len() requires string, array, or object');

      case 'type':
        return typeof values[0] === 'number' ? 'number' :
               typeof values[0] === 'string' ? 'string' :
               Array.isArray(values[0]) ? 'array' :
               typeof values[0] === 'object' ? 'object' :
               'unknown';

      case 'str':
        return this.stringify(values[0]);

      case 'num':
        return Number(values[0]);

      case 'keys':
        if (typeof values[0] === 'object' && !Array.isArray(values[0])) {
          return Object.keys(values[0] as object);
        }
        throw new Error('keys() requires object');

      case 'values':
        if (typeof values[0] === 'object' && !Array.isArray(values[0])) {
          return Object.values(values[0] as object);
        }
        throw new Error('values() requires object');

      case 'push':
        if (Array.isArray(values[0])) {
          (values[0] as any[]).push(...values.slice(1));
          return values[0];
        }
        throw new Error('push() requires array');

      case 'pop':
        if (Array.isArray(values[0])) {
          return (values[0] as any[]).pop() ?? null;
        }
        throw new Error('pop() requires array');

      default:
        throw new Error(`Unknown builtin function: ${name}`);
    }
  }

  private getVariable(name: string, env: Environment): FlValue {
    let current: Environment | undefined = env;
    while (current) {
      if (current.variables.has(name)) {
        return current.variables.get(name)!;
      }
      current = current.parent;
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  private stringify(value: FlValue): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return '[' + value.map(v => this.stringify(v)).join(', ') + ']';
    if (typeof value === 'object') {
      const pairs = Object.entries(value).map(([k, v]) => `${k}: ${this.stringify(v)}`);
      return '{' + pairs.join(', ') + '}';
    }
    return String(value);
  }

  private createGlobalEnvironment(): Environment {
    return {
      variables: new Map(),
      functions: new Map()
    };
  }
}
