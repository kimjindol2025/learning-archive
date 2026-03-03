// ================================================================
// FreeLang Runtime Parser - Rust Implementation
// ================================================================
//
// 토큰 시퀀스를 AST로 변환
// Phase B Week 4 구현
// 목표: 500줄
//
// ================================================================

use super::{ASTNode, Token, TokenType};

/// 파서 에러
#[derive(Clone, Debug)]
pub enum ParseError {
    UnexpectedToken(String),
    UnexpectedEof,
    InvalidExpression,
    InvalidStatement,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseError::UnexpectedToken(msg) => write!(f, "Unexpected token: {}", msg),
            ParseError::UnexpectedEof => write!(f, "Unexpected end of file"),
            ParseError::InvalidExpression => write!(f, "Invalid expression"),
            ParseError::InvalidStatement => write!(f, "Invalid statement"),
        }
    }
}

pub type ParseResult<T> = Result<T, ParseError>;

/// 재귀 하강 파서
pub struct Parser {
    tokens: Vec<Token>,
    position: usize,
}

impl Parser {
    /// 새로운 파서 생성
    pub fn new(tokens: Vec<Token>) -> Self {
        Parser {
            tokens,
            position: 0,
        }
    }

    /// 파싱 시작
    pub fn parse(&mut self) -> ParseResult<ASTNode> {
        let mut statements = Vec::new();

        while !self.is_at_end() {
            statements.push(self.parse_statement()?);
        }

        if statements.len() == 1 {
            Ok(statements.into_iter().next().unwrap())
        } else {
            Ok(ASTNode::Block(statements))
        }
    }

    /// 문 파싱
    fn parse_statement(&mut self) -> ParseResult<ASTNode> {
        match &self.current_token().token_type {
            TokenType::Let => self.parse_let_statement(),
            TokenType::Fn => self.parse_function_definition(),
            TokenType::If => self.parse_if_statement(),
            TokenType::While => self.parse_while_statement(),
            TokenType::For => self.parse_for_statement(),
            TokenType::Return => self.parse_return_statement(),
            TokenType::LeftBrace => self.parse_block(),
            _ => self.parse_expression_statement(),
        }
    }

    /// let 문 파싱
    fn parse_let_statement(&mut self) -> ParseResult<ASTNode> {
        self.expect(&TokenType::Let)?;

        let name = self.parse_identifier()?;

        self.expect(&TokenType::Equal)?;

        let value = self.parse_expression()?;

        Ok(ASTNode::Assignment {
            name,
            value: Box::new(value),
        })
    }

    /// 함수 정의 파싱
    fn parse_function_definition(&mut self) -> ParseResult<ASTNode> {
        self.expect(&TokenType::Fn)?;

        let name = self.parse_identifier()?;

        self.expect(&TokenType::LeftParen)?;

        let mut params = Vec::new();
        if !self.check(&TokenType::RightParen) {
            loop {
                params.push(self.parse_identifier()?);
                if !self.match_token(&TokenType::Comma) {
                    break;
                }
            }
        }

        self.expect(&TokenType::RightParen)?;
        self.expect(&TokenType::Colon)?;

        // 반환 타입은 무시
        self.parse_type()?;

        self.expect(&TokenType::LeftBrace)?;

        let body = self.parse_block_contents()?;

        Ok(ASTNode::FunctionDef {
            name,
            params,
            body: Box::new(body),
        })
    }

    /// if 문 파싱
    fn parse_if_statement(&mut self) -> ParseResult<ASTNode> {
        self.expect(&TokenType::If)?;

        let condition = self.parse_expression()?;

        self.expect(&TokenType::LeftBrace)?;
        let then_body = self.parse_block_contents()?;

        let else_body = if self.match_token(&TokenType::Else) {
            self.expect(&TokenType::LeftBrace)?;
            Some(Box::new(self.parse_block_contents()?))
        } else {
            None
        };

        Ok(ASTNode::If {
            condition: Box::new(condition),
            then_body: Box::new(then_body),
            else_body,
        })
    }

    /// while 루프 파싱
    fn parse_while_statement(&mut self) -> ParseResult<ASTNode> {
        self.expect(&TokenType::While)?;

        let condition = self.parse_expression()?;

        self.expect(&TokenType::LeftBrace)?;
        let body = self.parse_block_contents()?;

        Ok(ASTNode::While {
            condition: Box::new(condition),
            body: Box::new(body),
        })
    }

    /// for 루프 파싱
    fn parse_for_statement(&mut self) -> ParseResult<ASTNode> {
        self.expect(&TokenType::For)?;

        let var = self.parse_identifier()?;

        self.expect(&TokenType::In)?;

        let from = self.parse_expression()?;

        self.expect(&TokenType::Comma)?;

        let to = self.parse_expression()?;

        self.expect(&TokenType::LeftBrace)?;
        let body = self.parse_block_contents()?;

        Ok(ASTNode::For {
            var,
            from: Box::new(from),
            to: Box::new(to),
            body: Box::new(body),
        })
    }

    /// return 문 파싱
    fn parse_return_statement(&mut self) -> ParseResult<ASTNode> {
        self.expect(&TokenType::Return)?;

        if self.check(&TokenType::Semicolon) || self.check(&TokenType::RightBrace) {
            Ok(ASTNode::Return(Box::new(ASTNode::Null)))
        } else {
            let value = self.parse_expression()?;
            Ok(ASTNode::Return(Box::new(value)))
        }
    }

    /// 블록 파싱
    fn parse_block(&mut self) -> ParseResult<ASTNode> {
        self.expect(&TokenType::LeftBrace)?;
        self.parse_block_contents()
    }

    /// 블록 내용 파싱
    fn parse_block_contents(&mut self) -> ParseResult<ASTNode> {
        let mut statements = Vec::new();

        while !self.check(&TokenType::RightBrace) && !self.is_at_end() {
            statements.push(self.parse_statement()?);
        }

        self.expect(&TokenType::RightBrace)?;

        if statements.is_empty() {
            Ok(ASTNode::Null)
        } else if statements.len() == 1 {
            Ok(statements.into_iter().next().unwrap())
        } else {
            Ok(ASTNode::Block(statements))
        }
    }

    /// 표현식 문 파싱
    fn parse_expression_statement(&mut self) -> ParseResult<ASTNode> {
        self.parse_expression()
    }

    /// 표현식 파싱
    fn parse_expression(&mut self) -> ParseResult<ASTNode> {
        self.parse_or()
    }

    /// OR 표현식 파싱
    fn parse_or(&mut self) -> ParseResult<ASTNode> {
        let mut expr = self.parse_and()?;

        while self.match_token(&TokenType::Or) {
            let right = self.parse_and()?;
            expr = ASTNode::BinaryOp {
                left: Box::new(expr),
                op: "or".to_string(),
                right: Box::new(right),
            };
        }

        Ok(expr)
    }

    /// AND 표현식 파싱
    fn parse_and(&mut self) -> ParseResult<ASTNode> {
        let mut expr = self.parse_comparison()?;

        while self.match_token(&TokenType::And) {
            let right = self.parse_comparison()?;
            expr = ASTNode::BinaryOp {
                left: Box::new(expr),
                op: "and".to_string(),
                right: Box::new(right),
            };
        }

        Ok(expr)
    }

    /// 비교 표현식 파싱
    fn parse_comparison(&mut self) -> ParseResult<ASTNode> {
        let mut expr = self.parse_addition()?;

        loop {
            let op = if self.match_token(&TokenType::EqualEqual) {
                "=="
            } else if self.match_token(&TokenType::NotEqual) {
                "!="
            } else if self.match_token(&TokenType::Less) {
                "<"
            } else if self.match_token(&TokenType::Greater) {
                ">"
            } else if self.match_token(&TokenType::LessEqual) {
                "<="
            } else if self.match_token(&TokenType::GreaterEqual) {
                ">="
            } else {
                break;
            };

            let right = self.parse_addition()?;
            expr = ASTNode::BinaryOp {
                left: Box::new(expr),
                op: op.to_string(),
                right: Box::new(right),
            };
        }

        Ok(expr)
    }

    /// 덧셈/뺄셈 표현식 파싱
    fn parse_addition(&mut self) -> ParseResult<ASTNode> {
        let mut expr = self.parse_multiplication()?;

        loop {
            let op = if self.match_token(&TokenType::Plus) {
                "+"
            } else if self.match_token(&TokenType::Minus) {
                "-"
            } else {
                break;
            };

            let right = self.parse_multiplication()?;
            expr = ASTNode::BinaryOp {
                left: Box::new(expr),
                op: op.to_string(),
                right: Box::new(right),
            };
        }

        Ok(expr)
    }

    /// 곱셈/나눗셈 표현식 파싱
    fn parse_multiplication(&mut self) -> ParseResult<ASTNode> {
        let mut expr = self.parse_unary()?;

        loop {
            let op = if self.match_token(&TokenType::Star) {
                "*"
            } else if self.match_token(&TokenType::Slash) {
                "/"
            } else if self.match_token(&TokenType::Percent) {
                "%"
            } else {
                break;
            };

            let right = self.parse_unary()?;
            expr = ASTNode::BinaryOp {
                left: Box::new(expr),
                op: op.to_string(),
                right: Box::new(right),
            };
        }

        Ok(expr)
    }

    /// 단항 표현식 파싱
    fn parse_unary(&mut self) -> ParseResult<ASTNode> {
        if self.match_token(&TokenType::Not) {
            let operand = self.parse_unary()?;
            return Ok(ASTNode::UnaryOp {
                op: "!".to_string(),
                operand: Box::new(operand),
            });
        }

        if self.match_token(&TokenType::Minus) {
            let operand = self.parse_unary()?;
            return Ok(ASTNode::UnaryOp {
                op: "-".to_string(),
                operand: Box::new(operand),
            });
        }

        self.parse_postfix()
    }

    /// 후위 표현식 파싱 (함수 호출, 배열 인덱싱)
    fn parse_postfix(&mut self) -> ParseResult<ASTNode> {
        let mut expr = self.parse_primary()?;

        loop {
            if self.match_token(&TokenType::LeftParen) {
                // 함수 호출
                let mut args = Vec::new();
                if !self.check(&TokenType::RightParen) {
                    loop {
                        args.push(self.parse_expression()?);
                        if !self.match_token(&TokenType::Comma) {
                            break;
                        }
                    }
                }
                self.expect(&TokenType::RightParen)?;

                expr = ASTNode::Call {
                    callee: Box::new(expr),
                    args,
                };
            } else if self.match_token(&TokenType::LeftBracket) {
                // 배열 인덱싱
                let index = self.parse_expression()?;
                self.expect(&TokenType::RightBracket)?;

                expr = ASTNode::Index {
                    array: Box::new(expr),
                    index: Box::new(index),
                };
            } else {
                break;
            }
        }

        Ok(expr)
    }

    /// 기본 표현식 파싱
    fn parse_primary(&mut self) -> ParseResult<ASTNode> {
        match &self.current_token().token_type.clone() {
            TokenType::Number(n) => {
                let n = *n;
                self.advance();
                Ok(ASTNode::Number(n))
            }
            TokenType::String(s) => {
                let s = s.clone();
                self.advance();
                Ok(ASTNode::String(s))
            }
            TokenType::True => {
                self.advance();
                Ok(ASTNode::Bool(true))
            }
            TokenType::False => {
                self.advance();
                Ok(ASTNode::Bool(false))
            }
            TokenType::Null => {
                self.advance();
                Ok(ASTNode::Null)
            }
            TokenType::Identifier(name) => {
                let name = name.clone();
                self.advance();
                Ok(ASTNode::Identifier(name))
            }
            TokenType::LeftParen => {
                self.advance();
                let expr = self.parse_expression()?;
                self.expect(&TokenType::RightParen)?;
                Ok(expr)
            }
            TokenType::LeftBracket => {
                self.advance();
                let mut elements = Vec::new();
                if !self.check(&TokenType::RightBracket) {
                    loop {
                        elements.push(self.parse_expression()?);
                        if !self.match_token(&TokenType::Comma) {
                            break;
                        }
                    }
                }
                self.expect(&TokenType::RightBracket)?;
                Ok(ASTNode::Array(elements))
            }
            _ => Err(ParseError::InvalidExpression),
        }
    }

    /// 식별자 파싱
    fn parse_identifier(&mut self) -> ParseResult<String> {
        match &self.current_token().token_type {
            TokenType::Identifier(name) => {
                let name = name.clone();
                self.advance();
                Ok(name)
            }
            _ => Err(ParseError::UnexpectedToken("Expected identifier".to_string())),
        }
    }

    /// 타입 파싱 (간단한 버전)
    fn parse_type(&mut self) -> ParseResult<String> {
        match &self.current_token().token_type {
            TokenType::Identifier(name) => {
                let name = name.clone();
                self.advance();
                Ok(name)
            }
            _ => Ok("any".to_string()),
        }
    }

    // 유틸리티 메서드
    fn current_token(&self) -> Token {
        self.tokens
            .get(self.position)
            .cloned()
            .unwrap_or_else(|| Token::new(TokenType::Eof, 0, 0))
    }

    fn advance(&mut self) {
        if !self.is_at_end() {
            self.position += 1;
        }
    }

    fn check(&self, token_type: &TokenType) -> bool {
        std::mem::discriminant(&self.current_token().token_type)
            == std::mem::discriminant(token_type)
    }

    fn match_token(&mut self, token_type: &TokenType) -> bool {
        if self.check(token_type) {
            self.advance();
            true
        } else {
            false
        }
    }

    fn expect(&mut self, token_type: &TokenType) -> ParseResult<()> {
        if self.check(token_type) {
            self.advance();
            Ok(())
        } else {
            Err(ParseError::UnexpectedToken(format!(
                "Expected {:?}",
                token_type
            )))
        }
    }

    fn is_at_end(&self) -> bool {
        self.check(&TokenType::Eof)
    }
}

// ================================================================
// 테스트
// ================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_number() {
        let tokens = vec![Token::new(TokenType::Number(42), 1, 1)];
        let mut parser = Parser::new(tokens);
        let ast = parser.parse().unwrap();
        assert_eq!(ast, ASTNode::Number(42));
    }

    #[test]
    fn test_parse_string() {
        let tokens = vec![Token::new(TokenType::String("hello".to_string()), 1, 1)];
        let mut parser = Parser::new(tokens);
        let ast = parser.parse().unwrap();
        assert_eq!(ast, ASTNode::String("hello".to_string()));
    }

    #[test]
    fn test_parse_boolean() {
        let tokens = vec![Token::new(TokenType::True, 1, 1)];
        let mut parser = Parser::new(tokens);
        let ast = parser.parse().unwrap();
        assert_eq!(ast, ASTNode::Bool(true));
    }
}
