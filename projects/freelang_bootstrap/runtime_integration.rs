// ================================================================
// FreeLang Runtime Integration - Main Runtime Pipeline
// ================================================================
//
// Lexer → Parser → Evaluator 파이프라인 통합
// Phase B Week 4 구현
// 목표: 600줄
//
// ================================================================

mod runtime_lexer;
mod runtime_parser;
mod runtime_evaluator;

use std::fs;
use std::io::{self, Write};
use runtime_lexer::Lexer;
use runtime_parser::Parser;
use runtime_evaluator::Evaluator;

// ================================================================
// 섹션 1: 런타임 메인 구조
// ================================================================

/// FreeLang 런타임
pub struct FreeLangRuntime {
    evaluator: Evaluator,
    /// REPL 모드 여부
    repl_mode: bool,
}

impl FreeLangRuntime {
    /// 새로운 런타임 생성
    pub fn new() -> Self {
        FreeLangRuntime {
            evaluator: Evaluator::new(),
            repl_mode: false,
        }
    }

    /// 파일 실행
    pub fn run_file(&mut self, filename: &str) -> Result<(), String> {
        let source = fs::read_to_string(filename)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        self.run(&source)
    }

    /// 소스 코드 실행
    pub fn run(&mut self, source: &str) -> Result<(), String> {
        // 1단계: 렉싱
        let mut lexer = Lexer::new(source);
        let tokens = lexer.tokenize();

        // 2단계: 파싱
        let mut parser = Parser::new(tokens);
        let ast = parser.parse()
            .map_err(|e| format!("Parse error: {}", e))?;

        // 3단계: 평가
        self.evaluator.eval(&ast)
            .map_err(|e| format!("Runtime error: {:?}", e))?;

        Ok(())
    }

    /// REPL 모드 시작
    pub fn run_repl(&mut self) -> Result<(), String> {
        self.repl_mode = true;
        println!("=== FreeLang REPL ===");
        println!("Type 'exit' to quit\n");

        loop {
            print!("> ");
            io::stdout().flush().unwrap();

            let mut input = String::new();
            io::stdin().read_line(&mut input)
                .map_err(|e| format!("Input error: {}", e))?;

            let input = input.trim();

            if input == "exit" {
                println!("Goodbye!");
                break;
            }

            if input.is_empty() {
                continue;
            }

            match self.run(input) {
                Ok(_) => {},
                Err(e) => println!("Error: {}", e),
            }
        }

        Ok(())
    }

    /// 소스 코드 이 Lint 검사
    pub fn lint(&self, source: &str) -> Vec<String> {
        let mut warnings = Vec::new();

        // 렉싱만 시도 (기본 문법 검증)
        let mut lexer = Lexer::new(source);
        let tokens = lexer.tokenize();

        if tokens.is_empty() {
            warnings.push("Warning: Empty input".to_string());
        }

        // 파싱 검증
        let mut parser = Parser::new(tokens);
        if let Err(e) = parser.parse() {
            warnings.push(format!("Syntax error: {}", e));
        }

        warnings
    }
}

// ================================================================
// 섹션 2: 명령행 인터페이스
// ================================================================

pub fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();

    let mut runtime = FreeLangRuntime::new();

    if args.len() < 2 {
        // REPL 모드
        runtime.run_repl()?;
    } else if args[1] == "repl" {
        // 명시적 REPL 요청
        runtime.run_repl()?;
    } else if args[1] == "lint" && args.len() > 2 {
        // Lint 모드
        let source = fs::read_to_string(&args[2])?;
        let warnings = runtime.lint(&source);
        if warnings.is_empty() {
            println!("✓ No issues found");
        } else {
            for warning in warnings {
                println!("{}", warning);
            }
        }
    } else {
        // 파일 실행 모드
        match runtime.run_file(&args[1]) {
            Ok(_) => println!("Program exited successfully"),
            Err(e) => {
                eprintln!("Error: {}", e);
                std::process::exit(1);
            }
        }
    }

    Ok(())
}

// ================================================================
// 섹션 3: 벤치마킹 유틸리티
// ================================================================

/// 런타임 성능 측정
pub struct BenchmarkRunner {
    iterations: usize,
}

impl BenchmarkRunner {
    pub fn new(iterations: usize) -> Self {
        BenchmarkRunner { iterations }
    }

    pub fn benchmark(&self, source: &str, name: &str) -> Result<f64, String> {
        let start = std::time::Instant::now();

        for _ in 0..self.iterations {
            let mut runtime = FreeLangRuntime::new();
            runtime.run(source)?;
        }

        let elapsed = start.elapsed();
        let avg_ms = elapsed.as_millis() as f64 / self.iterations as f64;

        println!("{}: {:.3}ms (avg over {} iterations)",
                 name, avg_ms, self.iterations);

        Ok(avg_ms)
    }
}

// ================================================================
// 섹션 4: 테스트
// ================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_arithmetic() {
        let mut runtime = FreeLangRuntime::new();
        let result = runtime.run("let x = 5 + 3");
        assert!(result.is_ok());
    }

    #[test]
    fn test_variable_assignment() {
        let mut runtime = FreeLangRuntime::new();
        let result = runtime.run("let x = 10\nlet y = x + 5");
        assert!(result.is_ok());
    }

    #[test]
    fn test_function_definition() {
        let mut runtime = FreeLangRuntime::new();
        let result = runtime.run("fn add(a: i32, b: i32): i32 {\n  return a + b\n}");
        assert!(result.is_ok());
    }

    #[test]
    fn test_if_statement() {
        let mut runtime = FreeLangRuntime::new();
        let result = runtime.run("if true {\n  let x = 5\n}");
        assert!(result.is_ok());
    }

    #[test]
    fn test_while_loop() {
        let mut runtime = FreeLangRuntime::new();
        let result = runtime.run("let i = 0\nwhile i < 5 {\n  i = i + 1\n}");
        assert!(result.is_ok());
    }

    #[test]
    fn test_for_loop() {
        let mut runtime = FreeLangRuntime::new();
        let result = runtime.run("for i, 0, 5 {\n  let x = i\n}");
        assert!(result.is_ok());
    }

    #[test]
    fn test_array_literal() {
        let mut runtime = FreeLangRuntime::new();
        let result = runtime.run("let arr = [1, 2, 3, 4, 5]");
        assert!(result.is_ok());
    }

    #[test]
    fn test_lint_empty_input() {
        let runtime = FreeLangRuntime::new();
        let warnings = runtime.lint("");
        assert!(!warnings.is_empty());
    }

    #[test]
    fn test_lint_valid_code() {
        let runtime = FreeLangRuntime::new();
        let warnings = runtime.lint("let x = 5");
        assert!(warnings.is_empty() || warnings.iter().all(|w| !w.contains("Syntax")));
    }
}

// ================================================================
// 메인 엔트리포인트
// ================================================================

#[cfg(not(test))]
fn main() {
    if let Err(e) = main() {
        eprintln!("Fatal error: {}", e);
        std::process::exit(1);
    }
}
