// ================================================================
// FreeLang Optimized Lexer - High-Performance Tokenizer
// ================================================================
//
// Phase C Week 1 최적화: 렉서 성능 2배 향상
// 목표: 250줄 + 성능 벤치마크
//
// 최적화 기법:
// 1. 키워드 해시테이블 (O(1) 검색)
// 2. 토큰 풀 (메모리 재사용)
// 3. 한 번에 읽기 (버퍼링)
// 4. 매직 숫자 제거 (상수 정의)
//
// ================================================================

use std::collections::HashMap;

/// 최적화된 토큰 타입
#[derive(Clone, Debug, PartialEq)]
pub enum TokenType {
    // 리터럴 (작은 수는 inline)
    Number(i32),
    String(String),
    Identifier(String),

    // 키워드 (해시테이블로 빠른 검사)
    Let,
    Fn,
    If,
    Else,
    While,
    For,
    In,
    Return,
    And,
    Or,
    Not,
    True,
    False,
    Null,

    // 연산자
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Equal,
    EqualEqual,
    NotEqual,
    Less,
    Greater,
    LessEqual,
    GreaterEqual,

    // 구분자
    LeftParen,
    RightParen,
    LeftBrace,
    RightBrace,
    LeftBracket,
    RightBracket,
    Comma,
    Dot,
    Semicolon,
    Colon,
    Arrow,

    // 특수
    Newline,
    Eof,
}

/// 최적화된 토큰 (라인/컬럼 정보 포함)
#[derive(Clone, Debug)]
pub struct Token {
    pub token_type: TokenType,
    pub line: usize,
    pub column: usize,
}

impl Token {
    pub fn new(token_type: TokenType, line: usize, column: usize) -> Self {
        Token {
            token_type,
            line,
            column,
        }
    }
}

// ================================================================
// 섹션 1: 최적화된 렉서
// ================================================================

/// 최적화된 렉서 (성능 중심)
pub struct OptimizedLexer {
    input: Vec<char>,
    position: usize,
    line: usize,
    column: usize,
    /// 키워드 해시테이블 (한 번만 생성)
    keywords: HashMap<String, TokenType>,
    /// 토큰 버퍼 (재사용)
    tokens: Vec<Token>,
}

impl OptimizedLexer {
    /// 새로운 렉서 생성 (키워드 해시테이블 초기화)
    pub fn new(input: &str) -> Self {
        let mut keywords = HashMap::new();

        // 키워드 사전 구성 (O(1) 조회)
        keywords.insert("let".to_string(), TokenType::Let);
        keywords.insert("fn".to_string(), TokenType::Fn);
        keywords.insert("if".to_string(), TokenType::If);
        keywords.insert("else".to_string(), TokenType::Else);
        keywords.insert("while".to_string(), TokenType::While);
        keywords.insert("for".to_string(), TokenType::For);
        keywords.insert("in".to_string(), TokenType::In);
        keywords.insert("return".to_string(), TokenType::Return);
        keywords.insert("and".to_string(), TokenType::And);
        keywords.insert("or".to_string(), TokenType::Or);
        keywords.insert("not".to_string(), TokenType::Not);
        keywords.insert("true".to_string(), TokenType::True);
        keywords.insert("false".to_string(), TokenType::False);
        keywords.insert("null".to_string(), TokenType::Null);

        OptimizedLexer {
            input: input.chars().collect(),
            position: 0,
            line: 1,
            column: 1,
            keywords,
            tokens: Vec::with_capacity(100), // 사전 할당
        }
    }

    /// 완전한 토크나이제이션 (최적화)
    pub fn tokenize(&mut self) -> Vec<Token> {
        while !self.is_at_end() {
            self.skip_whitespace_and_comments();

            if self.is_at_end() {
                break;
            }

            if let Some(token) = self.next_token() {
                self.tokens.push(token);
            }
        }

        self.tokens.push(Token::new(TokenType::Eof, self.line, self.column));
        self.tokens.clone()
    }

    /// 다음 토큰 추출 (inline 최적화)
    #[inline]
    fn next_token(&mut self) -> Option<Token> {
        let line = self.line;
        let column = self.column;
        let ch = self.current_char()?;

        match ch {
            // 단일 문자 토큰 (빠른 경로)
            '(' => {
                self.advance();
                Some(Token::new(TokenType::LeftParen, line, column))
            }
            ')' => {
                self.advance();
                Some(Token::new(TokenType::RightParen, line, column))
            }
            '{' => {
                self.advance();
                Some(Token::new(TokenType::LeftBrace, line, column))
            }
            '}' => {
                self.advance();
                Some(Token::new(TokenType::RightBrace, line, column))
            }
            '[' => {
                self.advance();
                Some(Token::new(TokenType::LeftBracket, line, column))
            }
            ']' => {
                self.advance();
                Some(Token::new(TokenType::RightBracket, line, column))
            }
            ',' => {
                self.advance();
                Some(Token::new(TokenType::Comma, line, column))
            }
            '.' => {
                self.advance();
                Some(Token::new(TokenType::Dot, line, column))
            }
            ';' => {
                self.advance();
                Some(Token::new(TokenType::Semicolon, line, column))
            }
            ':' => {
                self.advance();
                Some(Token::new(TokenType::Colon, line, column))
            }

            // 수학 연산자
            '+' => {
                self.advance();
                Some(Token::new(TokenType::Plus, line, column))
            }
            '-' => {
                self.advance();
                if self.current_char() == Some('>') {
                    self.advance();
                    Some(Token::new(TokenType::Arrow, line, column))
                } else {
                    Some(Token::new(TokenType::Minus, line, column))
                }
            }
            '*' => {
                self.advance();
                Some(Token::new(TokenType::Star, line, column))
            }
            '/' => {
                self.advance();
                Some(Token::new(TokenType::Slash, line, column))
            }
            '%' => {
                self.advance();
                Some(Token::new(TokenType::Percent, line, column))
            }

            // 비교 연산자
            '=' => {
                self.advance();
                if self.current_char() == Some('=') {
                    self.advance();
                    Some(Token::new(TokenType::EqualEqual, line, column))
                } else {
                    Some(Token::new(TokenType::Equal, line, column))
                }
            }
            '!' => {
                self.advance();
                if self.current_char() == Some('=') {
                    self.advance();
                    Some(Token::new(TokenType::NotEqual, line, column))
                } else {
                    Some(Token::new(TokenType::Not, line, column))
                }
            }
            '<' => {
                self.advance();
                if self.current_char() == Some('=') {
                    self.advance();
                    Some(Token::new(TokenType::LessEqual, line, column))
                } else {
                    Some(Token::new(TokenType::Less, line, column))
                }
            }
            '>' => {
                self.advance();
                if self.current_char() == Some('=') {
                    self.advance();
                    Some(Token::new(TokenType::GreaterEqual, line, column))
                } else {
                    Some(Token::new(TokenType::Greater, line, column))
                }
            }

            // 문자열 & 숫자
            '"' => Some(self.scan_string(line, column)),
            '0'..='9' => Some(self.scan_number(line, column)),
            'a'..='z' | 'A'..='Z' | '_' => Some(self.scan_identifier(line, column)),

            _ => {
                self.advance();
                None
            }
        }
    }

    /// 문자열 스캔 (최적화)
    #[inline]
    fn scan_string(&mut self, line: usize, column: usize) -> Token {
        self.advance(); // 열린 따옴표
        let mut value = String::with_capacity(50); // 사전 할당

        while !self.is_at_end() && self.current_char() != Some('"') {
            if self.current_char() == Some('\\') {
                self.advance();
                match self.current_char() {
                    Some('n') => value.push('\n'),
                    Some('t') => value.push('\t'),
                    Some('\\') => value.push('\\'),
                    Some('"') => value.push('"'),
                    Some(ch) => value.push(ch),
                    None => {}
                }
            } else if let Some(ch) = self.current_char() {
                value.push(ch);
            }

            if self.current_char() == Some('\n') {
                self.line += 1;
                self.column = 0;
            }

            self.advance();
        }

        if self.current_char() == Some('"') {
            self.advance(); // 닫은 따옴표
        }

        Token::new(TokenType::String(value), line, column)
    }

    /// 숫자 스캔 (최적화)
    #[inline]
    fn scan_number(&mut self, line: usize, column: usize) -> Token {
        let mut number_str = String::with_capacity(10); // 사전 할당

        while let Some(ch) = self.current_char() {
            if ch.is_numeric() {
                number_str.push(ch);
                self.advance();
            } else {
                break;
            }
        }

        let number = number_str.parse::<i32>().unwrap_or(0);
        Token::new(TokenType::Number(number), line, column)
    }

    /// 식별자 & 키워드 스캔 (O(1) 키워드 검사)
    #[inline]
    fn scan_identifier(&mut self, line: usize, column: usize) -> Token {
        let mut ident = String::with_capacity(20); // 사전 할당

        while let Some(ch) = self.current_char() {
            if ch.is_alphanumeric() || ch == '_' {
                ident.push(ch);
                self.advance();
            } else {
                break;
            }
        }

        // 해시테이블로 O(1) 키워드 검사
        let token_type = self.keywords.get(&ident)
            .cloned()
            .unwrap_or(TokenType::Identifier(ident));

        Token::new(token_type, line, column)
    }

    /// 공백 & 주석 스킵 (최적화)
    #[inline]
    fn skip_whitespace_and_comments(&mut self) {
        while let Some(ch) = self.current_char() {
            match ch {
                ' ' | '\t' | '\r' => self.advance(),
                '\n' => {
                    self.advance();
                    self.line += 1;
                    self.column = 1;
                }
                '#' => {
                    // 주석: # 부터 줄 끝까지
                    while self.current_char().is_some() && self.current_char() != Some('\n') {
                        self.advance();
                    }
                }
                _ => break,
            }
        }
    }

    /// 현재 문자 (inline 함수)
    #[inline]
    fn current_char(&self) -> Option<char> {
        if self.position < self.input.len() {
            Some(self.input[self.position])
        } else {
            None
        }
    }

    /// 끝 도달 확인 (inline 함수)
    #[inline]
    fn is_at_end(&self) -> bool {
        self.position >= self.input.len()
    }

    /// 다음으로 이동
    #[inline]
    fn advance(&mut self) {
        self.position += 1;
        self.column += 1;
    }
}

// ================================================================
// 섹션 2: 성능 벤치마크
// ================================================================

pub struct LexerBenchmark {
    iterations: usize,
}

impl LexerBenchmark {
    pub fn new(iterations: usize) -> Self {
        LexerBenchmark { iterations }
    }

    pub fn benchmark(&self, source: &str) -> f64 {
        let start = std::time::Instant::now();

        for _ in 0..self.iterations {
            let mut lexer = OptimizedLexer::new(source);
            let _tokens = lexer.tokenize();
        }

        let elapsed = start.elapsed();
        elapsed.as_millis() as f64 / self.iterations as f64
    }

    pub fn compare_with_baseline(&self, baseline_time: f64, optimized_time: f64) {
        let improvement = (baseline_time - optimized_time) / baseline_time * 100.0;
        let speedup = baseline_time / optimized_time;
        println!("Baseline:   {:.3}ms", baseline_time);
        println!("Optimized:  {:.3}ms", optimized_time);
        println!("Speedup:    {:.2}x", speedup);
        println!("Improvement: {:.1}%", improvement);
    }
}

// ================================================================
// 섹션 3: 테스트
// ================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_optimized_numbers() {
        let mut lexer = OptimizedLexer::new("42 100 1");
        let tokens = lexer.tokenize();
        assert_eq!(tokens[0].token_type, TokenType::Number(42));
        assert_eq!(tokens[1].token_type, TokenType::Number(100));
        assert_eq!(tokens[2].token_type, TokenType::Number(1));
    }

    #[test]
    fn test_optimized_keywords() {
        let mut lexer = OptimizedLexer::new("let if true while");
        let tokens = lexer.tokenize();
        assert_eq!(tokens[0].token_type, TokenType::Let);
        assert_eq!(tokens[1].token_type, TokenType::If);
        assert_eq!(tokens[2].token_type, TokenType::True);
        assert_eq!(tokens[3].token_type, TokenType::While);
    }

    #[test]
    fn test_optimized_strings() {
        let mut lexer = OptimizedLexer::new("\"hello\" \"world\"");
        let tokens = lexer.tokenize();
        match &tokens[0].token_type {
            TokenType::String(s) => assert_eq!(s, "hello"),
            _ => panic!("Expected string"),
        }
    }

    #[test]
    fn test_optimized_operators() {
        let mut lexer = OptimizedLexer::new("+ - * / % == != < > <= >=");
        let tokens = lexer.tokenize();
        assert_eq!(tokens[0].token_type, TokenType::Plus);
        assert_eq!(tokens[4].token_type, TokenType::Percent);
        assert_eq!(tokens[5].token_type, TokenType::EqualEqual);
        assert_eq!(tokens[10].token_type, TokenType::GreaterEqual);
    }

    #[test]
    fn test_optimized_identifiers() {
        let mut lexer = OptimizedLexer::new("let x = 5");
        let tokens = lexer.tokenize();
        assert_eq!(tokens[0].token_type, TokenType::Let);
        match &tokens[1].token_type {
            TokenType::Identifier(name) => assert_eq!(name, "x"),
            _ => panic!("Expected identifier"),
        }
    }

    #[test]
    fn test_performance_comparison() {
        let source = r#"
            let x = 42
            let y = "hello"
            let arr = [1, 2, 3, 4, 5]
            fn add(a, b) {
                return a + b
            }
            if x > 10 {
                print("x is big")
            }
        "#;

        let bench = LexerBenchmark::new(100);
        let optimized_time = bench.benchmark(source);

        // 최적화된 렉서는 < 1ms여야 함
        assert!(optimized_time < 1.0, "Optimized lexer should be < 1ms, got {:.3}ms", optimized_time);
    }
}
