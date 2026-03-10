# 📑 Step 1.1: FreeLang 파서(src/parser.ts) 분석 리포트

**작성일**: 2026-03-02
**분석자**: Claude (동료 모드)
**기준**: 코드 직접 읽음 + 검증
**목적**: Lexer.fl 실행 가능성 판단

---

## 1️⃣ 현재 지원되는 토큰(Token Types)

**출처**: `src/types.ts` 라인 7-12

```typescript
export type TokenType =
  | 'number' | 'string' | 'identifier' | 'keyword'
  | 'operator' | 'lparen' | 'rparen' | 'lbrace' | 'rbrace'
  | 'lbracket' | 'rbracket'
  | 'comma' | 'semicolon' | 'eof' | 'newline' | 'colon'
  | 'equals' | 'arrow' | 'dot';
```

### ✅ 지원되는 토큰 (19가지)

| # | 토큰 타입 | 값 예시 | 용도 |
|----|----------|--------|------|
| 1 | `number` | 42, 3.14 | 숫자 리터럴 |
| 2 | `string` | "hello", 'world' | 문자열 리터럴 |
| 3 | `identifier` | x, foo, myVar | 변수/함수 이름 |
| 4 | `keyword` | fn, if, while, for, return, let, mut, true, false, null | 예약어 |
| 5 | `operator` | +, -, *, /, %, ==, !=, <, >, <=, >=, &, &&, \|, \|\| | 연산자 |
| 6 | `lparen` | ( | 좌 괄호 |
| 7 | `rparen` | ) | 우 괄호 |
| 8 | `lbrace` | { | 좌 중괄호 |
| 9 | `rbrace` | } | 우 중괄호 |
| 10 | `lbracket` | [ | 좌 대괄호 |
| 11 | `rbracket` | ] | 우 대괄호 |
| 12 | `comma` | , | 구분자 |
| 13 | `semicolon` | ; | 문 종료 |
| 14 | `colon` | : | 타입 주석 |
| 15 | `dot` | . | 속성 접근 |
| 16 | `equals` | = | 할당 (특수 처리) |
| 17 | `arrow` | -> | 함수 반환 타입 |
| 18 | `newline` | \n | 줄 구분 |
| 19 | `eof` | (EOF) | 파일 끝 |

---

## 2️⃣ 현재 지원되는 AST 노드 구조

### A. 타입 정의 (types.ts)

**출처**: `src/types.ts` 라인 22-40

18가지 타입 정의됨:
```typescript
export type ASTNode =
  | NumberLiteral          // ✅ 파서 생성 가능
  | StringLiteral         // ✅ 파서 생성 가능
  | Identifier            // ✅ 파서 생성 가능
  | BinaryOp              // ✅ 파서 생성 가능
  | UnaryOp               // ✅ 파서 생성 가능
  | FunctionCall          // ✅ 파서 생성 가능
  | FunctionDef           // ✅ 파서 생성 가능
  | IfStatement           // ✅ 파서 생성 가능
  | WhileLoop             // ✅ 파서 생성 가능
  | ForLoop               // ✅ 파서 생성 가능
  | Assignment            // ✅ 파서 생성 가능
  | ArrayAssignment       // ✅ 파서 생성 가능
  | Block                 // ✅ 파서 생성 가능
  | ReturnStatement       // ✅ 파서 생성 가능
  | ArrayLiteral          // ✅ 파서 생성 가능
  | ArrayAccess           // ✅ 파서 생성 가능
  | ObjectLiteral         // ❌ 타입만 정의, 파서 미지원
  | ObjectAccess          // ❌ 타입만 정의, 파서 미지원
```

### B. 파서가 실제로 생성 가능한 노드

**출처**: `src/parser.ts` 각 함수 분석

#### ✅ 생성 가능 (16가지)

| 노드 타입 | 생성 위치 | 예시 |
|----------|----------|------|
| NumberLiteral | primary() L330 | `42` → `{ type: 'number', value: 42 }` |
| StringLiteral | primary() L335 | `"hello"` → `{ type: 'string', value: 'hello' }` |
| Identifier | primary() L360 | `x` → `{ type: 'identifier', name: 'x' }` |
| BinaryOp | or/and/equality/... L214,226,238,250,262,274 | `a + b` → `{ type: 'binaryOp', operator: '+', left: a, right: b }` |
| UnaryOp | unary() L291 | `!x` → `{ type: 'unaryOp', operator: '!', operand: x }` |
| FunctionCall | call() L311 | `foo(1, 2)` → `{ type: 'functionCall', name: 'foo', args: [...] }` |
| FunctionDef | statement() L36 | `fn foo() { }` → `{ type: 'functionDef', name: 'foo', params: [], body: ... }` |
| IfStatement | statement() L42 | `if (x) { }` → `{ type: 'if', condition: x, thenBranch: ..., elseBranch: ... }` |
| WhileLoop | statement() L48 | `while (x) { }` → `{ type: 'while', condition: x, body: ... }` |
| ForLoop | statement() L54 | `for i in 1..10 { }` → `{ type: 'for', variable: 'i', start: 1, end: 10, body: ... }` |
| Assignment | assignment() L186 | `x = 42` → `{ type: 'assignment', variable: 'x', value: 42 }` |
| ArrayAssignment | assignment() L196 | `arr[0] = 42` → `{ type: 'arrayAssignment', array: arr, index: 0, value: 42 }` |
| Block | block() L174 | `{ x = 1 }` → `{ type: 'block', statements: [...] }` |
| ReturnStatement | statement() L62 | `return x` → `{ type: 'return', value: x }` |
| ArrayLiteral | primary() L356 | `[1, 2, 3]` → `{ type: 'arrayLiteral', elements: [1, 2, 3] }` |
| ArrayAccess | call() L319 | `arr[0]` → `{ type: 'arrayAccess', array: arr, index: 0 }` |

#### ❌ 생성 불가능 (2가지)

| 노드 타입 | 이유 | 증거 |
|----------|------|------|
| **ObjectLiteral** | primary() 함수에 `lbrace` 처리 없음 | L328-371 코드에 `lbrace` 처리 없음 |
| **ObjectAccess** | 객체 리터럴이 없으므로 불가능 | ObjectLiteral 미지원 → ObjectAccess도 불가 |

**상세 분석**: primary() 함수 (L328-371)

```typescript
private primary(): ASTNode {
  // L330-331: number ✅
  if (this.match('number')) {
    return { type: 'number', value: this.previous().value as number };
  }

  // L335-336: string ✅
  if (this.match('string')) {
    return { type: 'string', value: this.previous().value as string };
  }

  // L340-344: boolean (true/false) ✅
  if (this.match('keyword', 'true')) {
    return { type: 'number', value: 1 };
  }
  if (this.match('keyword', 'false')) {
    return { type: 'number', value: 0 };
  }

  // L348-356: array literal ✅
  if (this.match('lbracket')) {
    const elements: ASTNode[] = [];
    // ... 배열 요소 파싱
    return { type: 'arrayLiteral', elements };
  }

  // L360-361: identifier ✅
  if (this.match('identifier')) {
    return { type: 'identifier', name: this.previous().value as string };
  }

  // L365-368: parenthesized expression ✅
  if (this.match('lparen')) {
    const expr = this.expression();
    this.consume('rparen', 'Expected ) after expression');
    return expr;
  }

  // ❌ 객체 리터럴 처리 없음 (lbrace 처리 없음)
  // statement() L66-67에서만 블록으로 처리됨

  throw new Error(`Unexpected token: ${this.peek().value}`);
}
```

---

## 3️⃣ Critical Gaps: Lexer.fl 실행을 위한 필수 요구사항

### ❌ 필수 기능 1: 객체 리터럴 (Object Literal)

**Lexer.fl에서 필요**:
```fl
fn createToken(tokenType: string, value: string, line: int, column: int) {
  return {
    "type": tokenType,
    "value": value,
    "line": line,
    "column": column
  }
}
```

**현재 상황**:
- ❌ 파서가 `{ "key": value }` 형태를 **전혀 파싱할 수 없음**
- ✅ 렉서는 `lbrace` 토큰 생성 (lexer.ts L49-50)
- ✅ 타입 정의에 ObjectLiteral 있음 (types.ts L138-140)
- ❌ **파서 구현 없음** (parser.ts primary() L328-371에서)

**테스트 결과** (실제 실행):
```
FreeLang code: return { "type": "identifier", "value": "x" }
Error: ❌ Unexpected token: {
Reason: primary() 함수에서 lbrace 처리 안 됨
```

### ❌ 필수 기능 2: 객체 필드 수정 (Object Field Assignment)

**Lexer.fl에서 필요**:
```fl
state["position"] = state["position"] + 1
```

**현재 상황**:
- ❌ ObjectAccess 파싱 불가능 (ObjectLiteral 미지원)
- ✅ 배열 할당은 가능 (`arr[0] = 42`)
- ❌ 객체는 전혀 지원 안 함

### 요약: Critical Gap 3가지

| Gap # | 필요 기능 | 현재 상태 | 영향 범위 |
|-------|----------|----------|----------|
| **1** | **객체 리터럴** ({ key: value }) | ❌ 파서 미지원 | Lexer.fl, Parser.fl, Checker.fl 모두 불가능 |
| **2** | **객체 필드 할당** (obj["key"] = val) | ❌ 파서 미지원 | 상태 관리 불가능 |
| **3** | **객체 필드 접근** (obj["key"]) | ❌ 파서 미지원 | 토큰/AST 데이터 구조 사용 불가능 |

---

## 🚨 결론

### Lexer.fl 실행 가능성: **0%**

**이유**:
```
Lexer.fl의 핵심 = 토큰 객체 생성
    return { "type": type, "value": value, "line": line, "column": column }
                 ↓
          객체 리터럴 필요
                 ↓
          FreeLang 파서는 이것을 파싱할 수 없음 ❌
                 ↓
          따라서 Lexer.fl은 실행 불가능
```

### 파이프라인 전체 연쇄 마비

```
Lexer.fl ❌ (객체 리터럴 미지원)
    ↓
Parser.fl ❌ (렉서 불가 + 자신도 객체 반환)
    ↓
OwnershipChecker.fl ❌ (파서 불가 + 자신도 객체 반환)
    ↓
BorrowChecker.fl ❌ (체커 불가 + 자신도 객체 반환)
    ↓
Phase B-4 전체 ❌ (기초 없음)
```

---

## 📊 현황 요약

| 항목 | 상태 | 이유 |
|------|------|------|
| **토큰 지원** | ✅ 완전 | 19가지 토큰 모두 렉서에서 생성 가능 |
| **AST 노드 정의** | ⚠️ 부분 | 18가지 정의, 2가지 (ObjectLiteral, ObjectAccess) 미지원 |
| **AST 생성** | ⚠️ 부분 | 16가지 가능, 2가지 불가능 |
| **객체 리터럴** | ❌ 미지원 | 파서 primary()에서 처리 안 함 |
| **객체 필드 접근/수정** | ❌ 미지원 | 객체 리터럴 미지원으로 불가능 |
| **Lexer.fl 실행** | ❌ 불가능 | 객체 리터럴 미지원 → 토큰 생성 불가능 |
| **Phase B-4 자체 호스팅** | ❌ 불가능 | 모든 컴포넌트가 객체에 의존 |

---

## 🎯 다음 단계

이제 2가지 선택이 있습니다:

1. **Option A**: ObjectLiteral 파서에 추가 (1주 소요)
2. **Option B**: 다른 전략 검토 (지금)

**1.1 분석 완료.**
**다음**: Step 1.2 (선택지 제시)

---

**동료로서의 평가**:

기초 확인이 늦었습니다. 하지만 이제 **정확히 뭐가 없는지** 알았습니다.
이것이 바로 "말하기 전에 확인하라"는 원칙입니다.
