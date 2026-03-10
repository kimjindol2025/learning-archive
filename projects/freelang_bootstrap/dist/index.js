"use strict";
/**
 * FreeLang Bootstrap 인터프리터
 * 메인 진입점
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
const evaluator_1 = require("./evaluator");
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
class BootstrapInterpreter {
    constructor() {
        this.evaluator = new evaluator_1.Evaluator();
    }
    /**
     * 파일 실행
     */
    runFile(filename) {
        try {
            const source = fs.readFileSync(filename, 'utf-8');
            this.execute(source);
        }
        catch (error) {
            console.error(`Error reading file: ${error.message}`);
            process.exit(1);
        }
    }
    /**
     * REPL (대화형 모드)
     */
    async runRepl() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        console.log('🚀 FreeLang Bootstrap REPL v1.0');
        console.log('📝 Type FreeLang code or "exit" to quit');
        console.log('---');
        const question = (prompt) => {
            return new Promise((resolve) => {
                rl.question(prompt, resolve);
            });
        };
        while (true) {
            const input = await question('> ');
            if (input.toLowerCase() === 'exit') {
                console.log('Goodbye!');
                rl.close();
                break;
            }
            if (input.trim()) {
                this.execute(input);
            }
        }
    }
    /**
     * 코드 실행
     */
    execute(source) {
        try {
            // 1. 렉싱
            const lexer = new lexer_1.Lexer(source);
            const tokens = lexer.tokenize();
            // 2. 파싱
            const parser = new parser_1.Parser(tokens);
            const ast = parser.parse();
            // 3. 평가
            const result = this.evaluator.evaluate(ast);
            if (result.error) {
                console.error(`❌ ${result.error}`);
            }
        }
        catch (error) {
            console.error(`❌ ${error.message}`);
        }
    }
}
// 메인
async function main() {
    const args = process.argv.slice(2);
    const interpreter = new BootstrapInterpreter();
    if (args.length === 0) {
        // REPL 모드
        await interpreter.runRepl();
    }
    else if (args[0] === '--eval' && args[1]) {
        // eval 모드
        interpreter['execute'](args[1]);
    }
    else {
        // 파일 실행
        interpreter.runFile(args[0]);
    }
}
main().catch(console.error);
