// ================================================================
// FreeLang Runtime Lexer - Rust Implementation
// ================================================================
//
// 소스 코드를 토큰으로 변환
// Phase B Week 4 구현
// 목표: 400줄
//
// ================================================================

/// 토큰의 종류
#[derive(Clone, Debug, PartialEq)]
pub enum TokenType {
    // 리터럴
    Number(i32),
    String(String),
    Identifier(String),

    // 키워드
    True,
    False,
    Null,
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

/// 토큰 구조
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

/// 렉서 (토크나이저)
pub struct Lexer {
    input: Vec<char>,
    position: usize,
    line: usize,
    column: usize,
}

impl Lexer {
    /// 새로운 렉서 생성
    pub fn new(input: &str) -> Self {
        Lexer {
            input: input.chars().collect(),
            position: 0,
            line: 1,
            column: 1,
        }
    }

    /// 모든 토큰 토크나이즈
    pub fn tokenize(&mut self) -> Vec<Token> {
        let mut tokens = Vec::new();

        loop {
            self.skip_whitespace_and_comments();

            if self.is_at_end() {
                tokens.push(Token::new(TokenType::Eof, self.line, self.column));
                break;
            }

            if let Some(token) = self.next_token() {
                tokens.push(token);
            }
        }

        tokens
    }

    /// 다음 토큰 반환
    fn next_token(&mut self) -> Option<Token> {
        let line = self.line;
        let column = self.column;
        let ch = self.current_char()?;

        match ch {
            // 단일 문자 토큰
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

            // 문자열
            '"' => Some(self.scan_string(line, column)),

            // 숫자
            '0'..='9' => Some(self.scan_number(line, column)),

            // 식별자 & 키워드
            'a'..='z' | 'A'..='Z' | '_' => Some(self.scan_identifier(line, column)),

            _ => {
                self.advance();
                None
            }
        }
    }

    /// 문자열 스캔
    fn scan_string(&mut self, line: usize, column: usize) -> Token {
        self.advance(); // opening quote
        let mut value = String::new();

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
            } else {
                if let Some(ch) = self.current_char() {
                    value.push(ch);
                }
            }

            if self.current_char() == Some('\n') {
                self.line += 1;
                self.column = 0;
            }

            self.advance();
        }

        if self.current_char() == Some('"') {
            self.advance(); // closing quote
        }

        Token::new(TokenType::String(value), line, column)
    }

    /// 숫자 스캔
    fn scan_number(&mut self, line: usize, column: usize) -> Token {
        let mut number_str = String::new();

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

    /// 식별자 & 키워드 스캔
    fn scan_identifier(&mut self, line: usize, column: usize) -> Token {
        let mut ident = String::new();

        while let Some(ch) = self.current_char() {
            if ch.is_alphanumeric() || ch == '_' {
                ident.push(ch);
                self.advance();
            } else {
                break;
            }
        }

        let token_type = match ident.as_str() {
            "true" => TokenType::True,
            "false" => TokenType::False,
            "null" => TokenType::Null,
            "let" => TokenType::Let,
            "fn" => TokenType::Fn,
            "if" => TokenType::If,
            "else" => TokenType::Else,
            "while" => TokenType::While,
            "for" => TokenType::For,
            "in" => TokenType::In,
            "return" => TokenType::Return,
            "and" => TokenType::And,
            "or" => TokenType::Or,
            "not" => TokenType::Not,
            _ => TokenType::Identifier(ident),
        };

        Token::new(token_type, line, column)
    }

    /// 공백 & 주석 스킵
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

    /// 현재 문자
    fn current_char(&self) -> Option<char> {
        if self.position < self.input.len() {
            Some(self.input[self.position])
        } else {
            None
        }
    }

    /// 다음 문자
    fn peek_char(&self) -> Option<char> {
        if self.position + 1 < self.input.len() {
            Some(self.input[self.position + 1])
        } else {
            None
        }
    }

    /// 다음으로 이동
    fn advance(&mut self) {
        self.position += 1;
        self.column += 1;
    }

    /// 끝 도달 확인
    fn is_at_end(&self) -> bool {
        self.position >= self.input.len()
    }
}

// ================================================================
// 테스트
// ================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_numbers() {
        let mut lexer = Lexer::new("42 100 1");
        let tokens = lexer.tokenize();

        assert_eq!(tokens[0].token_type, TokenType::Number(42));
        assert_eq!(tokens[1].token_type, TokenType::Number(100));
        assert_eq!(tokens[2].token_type, TokenType::Number(1));
    }

    #[test]
    fn test_strings() {
        let mut lexer = Lexer::new("\"hello\" \"world\"");
        let tokens = lexer.tokenize();

        match &tokens[0].token_type {
            TokenType::String(s) => assert_eq!(s, "hello"),
            _ => panic!("Expected string"),
        }
        match &tokens[1].token_type {
            TokenType::String(s) => assert_eq!(s, "world"),
            _ => panic!("Expected string"),
        }
    }

    #[test]
    fn test_identifiers_and_keywords() {
        let mut lexer = Lexer::new("let x = 5 if true");
        let tokens = lexer.tokenize();

        assert_eq!(tokens[0].token_type, TokenType::Let);
        match &tokens[1].token_type {
            TokenType::Identifier(s) => assert_eq!(s, "x"),
            _ => panic!("Expected identifier"),
        }
        assert_eq!(tokens[2].token_type, TokenType::Equal);
        assert_eq!(tokens[3].token_type, TokenType::Number(5));
        assert_eq!(tokens[4].token_type, TokenType::If);
        assert_eq!(tokens[5].token_type, TokenType::True);
    }

    #[test]
    fn test_operators() {
        let mut lexer = Lexer::new("+ - * / % == != < > <= >=");
        let tokens = lexer.tokenize();

        assert_eq!(tokens[0].token_type, TokenType::Plus);
        assert_eq!(tokens[1].token_type, TokenType::Minus);
        assert_eq!(tokens[2].token_type, TokenType::Star);
        assert_eq!(tokens[3].token_type, TokenType::Slash);
        assert_eq!(tokens[4].token_type, TokenType::Percent);
        assert_eq!(tokens[5].token_type, TokenType::EqualEqual);
        assert_eq!(tokens[6].token_type, TokenType::NotEqual);
        assert_eq!(tokens[7].token_type, TokenType::Less);
        assert_eq!(tokens[8].token_type, TokenType::Greater);
        assert_eq!(tokens[9].token_type, TokenType::LessEqual);
        assert_eq!(tokens[10].token_type, TokenType::GreaterEqual);
    }

    #[test]
    fn test_punctuation() {
        let mut lexer = Lexer::new("( ) { } [ ] , . ; : ->");
        let tokens = lexer.tokenize();

        assert_eq!(tokens[0].token_type, TokenType::LeftParen);
        assert_eq!(tokens[1].token_type, TokenType::RightParen);
        assert_eq!(tokens[2].token_type, TokenType::LeftBrace);
        assert_eq!(tokens[3].token_type, TokenType::RightBrace);
        assert_eq!(tokens[4].token_type, TokenType::LeftBracket);
        assert_eq!(tokens[5].token_type, TokenType::RightBracket);
        assert_eq!(tokens[6].token_type, TokenType::Comma);
        assert_eq!(tokens[7].token_type, TokenType::Dot);
        assert_eq!(tokens[8].token_type, TokenType::Semicolon);
        assert_eq!(tokens[9].token_type, TokenType::Colon);
        assert_eq!(tokens[10].token_type, TokenType::Arrow);
    }

    #[test]
    fn test_comments() {
        let mut lexer = Lexer::new("let x = 5 # comment\nlet y = 10");
        let tokens = lexer.tokenize();

        // 주석은 무시되고 토큰 수는 적음
        assert_eq!(tokens[0].token_type, TokenType::Let);
        match &tokens[1].token_type {
            TokenType::Identifier(s) => assert_eq!(s, "x"),
            _ => panic!("Expected identifier"),
        }
    }
}
