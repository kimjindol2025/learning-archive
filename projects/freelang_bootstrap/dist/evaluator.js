"use strict";
/**
 * FreeLang Bootstrap Evaluator
 * AST 실행
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Evaluator = void 0;
class Evaluator {
    constructor() {
        this.globalEnv = this.createGlobalEnvironment();
        this.currentEnv = this.globalEnv;
    }
    evaluate(ast) {
        try {
            const value = this.eval(ast, this.currentEnv);
            return { value };
        }
        catch (error) {
            return {
                value: null,
                error: error.message
            };
        }
    }
    eval(node, env) {
        switch (node.type) {
            case 'number':
                return node.value;
            case 'string':
                return node.value;
            case 'identifier':
                return this.getVariable(node.name, env);
            case 'binaryOp':
                return this.evalBinaryOp(node, env);
            case 'unaryOp':
                return this.evalUnaryOp(node, env);
            case 'functionCall':
                return this.evalFunctionCall(node, env);
            case 'assignment':
                return this.evalAssignment(node, env);
            case 'if':
                return this.evalIf(node, env);
            case 'while':
                return this.evalWhile(node, env);
            case 'for':
                return this.evalFor(node, env);
            case 'block':
                return this.evalBlock(node, env);
            case 'return':
                throw { type: 'return', value: this.eval(node.value, env) };
            case 'functionDef':
                return this.evalFunctionDef(node, env);
            case 'arrayLiteral':
                return this.evalArrayLiteral(node, env);
            case 'arrayAccess':
                return this.evalArrayAccess(node, env);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }
    evalBinaryOp(node, env) {
        const left = this.eval(node.left, env);
        const right = this.eval(node.right, env);
        switch (node.operator) {
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    return String(left) + String(right);
                }
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return left / right;
            case '%':
                return left % right;
            case '==':
                return left === right ? 1 : 0;
            case '!=':
                return left !== right ? 1 : 0;
            case '<':
                return left < right ? 1 : 0;
            case '>':
                return left > right ? 1 : 0;
            case '<=':
                return left <= right ? 1 : 0;
            case '>=':
                return left >= right ? 1 : 0;
            case '&&':
                return (left && right) ? 1 : 0;
            case '||':
                return (left || right) ? 1 : 0;
            default:
                throw new Error(`Unknown operator: ${node.operator}`);
        }
    }
    evalUnaryOp(node, env) {
        const operand = this.eval(node.operand, env);
        switch (node.operator) {
            case '-':
                return -operand;
            case '!':
                return operand ? 0 : 1;
            default:
                throw new Error(`Unknown unary operator: ${node.operator}`);
        }
    }
    evalFunctionCall(node, env) {
        // 내장 함수
        if (this.isBuiltinFunction(node.name)) {
            return this.callBuiltin(node.name, node.args, env);
        }
        // 사용자 정의 함수
        const func = env.functions.get(node.name);
        if (!func) {
            throw new Error(`Undefined function: ${node.name}`);
        }
        const args = node.args.map((arg) => this.eval(arg, env));
        // 새 환경 생성
        const callEnv = {
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
        }
        catch (e) {
            if (e.type === 'return') {
                return e.value;
            }
            throw e;
        }
    }
    evalAssignment(node, env) {
        const value = this.eval(node.value, env);
        env.variables.set(node.variable, value);
        return value;
    }
    evalIf(node, env) {
        const condition = this.eval(node.condition, env);
        if (condition) {
            return this.eval(node.thenBranch, env);
        }
        else if (node.elseBranch) {
            return this.eval(node.elseBranch, env);
        }
        return null;
    }
    evalWhile(node, env) {
        let result = null;
        while (this.eval(node.condition, env)) {
            result = this.eval(node.body, env);
        }
        return result;
    }
    evalFor(node, env) {
        const start = this.eval(node.start, env);
        const end = this.eval(node.end, env);
        let result = null;
        for (let i = start; i < end; i++) {
            env.variables.set(node.variable, i);
            result = this.eval(node.body, env);
        }
        return result;
    }
    evalBlock(node, env) {
        let result = null;
        for (const statement of node.statements) {
            result = this.eval(statement, env);
        }
        return result;
    }
    evalFunctionDef(node, env) {
        env.functions.set(node.name, node);
        return null;
    }
    evalArrayLiteral(node, env) {
        return node.elements.map((elem) => this.eval(elem, env));
    }
    evalArrayAccess(node, env) {
        const array = this.eval(node.array, env);
        const index = this.eval(node.index, env);
        if (!Array.isArray(array)) {
            throw new Error('Cannot access index of non-array');
        }
        if (index < 0 || index >= array.length) {
            return null;
        }
        return array[index] ?? null;
    }
    isBuiltinFunction(name) {
        const builtins = [
            'print', 'println', 'len', 'type', 'str', 'num',
            'keys', 'values', 'push', 'pop'
        ];
        return builtins.includes(name);
    }
    callBuiltin(name, args, env) {
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
                    return values[0].length;
                }
                else if (Array.isArray(values[0])) {
                    return values[0].length;
                }
                else if (typeof values[0] === 'object' && values[0] !== null) {
                    return Object.keys(values[0]).length;
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
                    return Object.keys(values[0]);
                }
                throw new Error('keys() requires object');
            case 'values':
                if (typeof values[0] === 'object' && !Array.isArray(values[0])) {
                    return Object.values(values[0]);
                }
                throw new Error('values() requires object');
            case 'push':
                if (Array.isArray(values[0])) {
                    values[0].push(...values.slice(1));
                    return values[0];
                }
                throw new Error('push() requires array');
            case 'pop':
                if (Array.isArray(values[0])) {
                    return values[0].pop() ?? null;
                }
                throw new Error('pop() requires array');
            default:
                throw new Error(`Unknown builtin function: ${name}`);
        }
    }
    getVariable(name, env) {
        let current = env;
        while (current) {
            if (current.variables.has(name)) {
                return current.variables.get(name);
            }
            current = current.parent;
        }
        throw new Error(`Undefined variable: ${name}`);
    }
    stringify(value) {
        if (value === null)
            return 'null';
        if (typeof value === 'string')
            return value;
        if (typeof value === 'number')
            return String(value);
        if (Array.isArray(value))
            return '[' + value.map(v => this.stringify(v)).join(', ') + ']';
        if (typeof value === 'object') {
            const pairs = Object.entries(value).map(([k, v]) => `${k}: ${this.stringify(v)}`);
            return '{' + pairs.join(', ') + '}';
        }
        return String(value);
    }
    createGlobalEnvironment() {
        return {
            variables: new Map(),
            functions: new Map()
        };
    }
}
exports.Evaluator = Evaluator;
