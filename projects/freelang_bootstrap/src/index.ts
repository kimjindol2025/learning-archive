/**
 * FreeLang Bootstrap 인터프리터
 * 메인 진입점
 */

import { Lexer } from './lexer';
import { Parser } from './parser';
import { Evaluator } from './evaluator';
import * as fs from 'fs';
import * as readline from 'readline';

class BootstrapInterpreter {
  private evaluator: Evaluator;

  constructor() {
    this.evaluator = new Evaluator();
  }

  /**
   * 파일 실행
   */
  runFile(filename: string): void {
    try {
      const source = fs.readFileSync(filename, 'utf-8');
      this.execute(source);
    } catch (error: any) {
      console.error(`Error reading file: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * REPL (대화형 모드)
   */
  async runRepl(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🚀 FreeLang Bootstrap REPL v1.0');
    console.log('📝 Type FreeLang code or "exit" to quit');
    console.log('---');

    const question = (prompt: string): Promise<string> => {
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
  private execute(source: string): void {
    try {
      // 1. 렉싱
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      // 2. 파싱
      const parser = new Parser(tokens);
      const ast = parser.parse();

      // 3. 평가
      const result = this.evaluator.evaluate(ast);

      if (result.error) {
        console.error(`❌ ${result.error}`);
      }
    } catch (error: any) {
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
  } else if (args[0] === '--eval' && args[1]) {
    // eval 모드
    interpreter['execute'](args[1]);
  } else {
    // 파일 실행
    interpreter.runFile(args[0]);
  }
}

main().catch(console.error);
