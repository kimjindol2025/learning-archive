# Phase B-4: 완전 자체 호스팅 (Self-Hosting Compiler) 🚀

**작성일**: 2026-03-02
**기간**: 4주 (2026-03-02 ~ 2026-03-30)
**목표**: TypeScript 컴파일러 → FreeLang 컴파일러 변환

---

## 📊 **최종 목표**

```
현재: Node.js 기반 TypeScript 컴파일러
     (src/lexer.ts, src/parser.ts, src/ownership_checker.ts, src/borrow_checker.ts)

목표: FreeLang 기반 자체 호스팅 컴파일러
     (lexer.fl, parser.fl, ownership_checker.fl, borrow_checker.fl)

검증: Bare-metal 환경에서 FreeLang → Binary 컴파일
```

**의미**:
- 완전히 독립적인 프로그래밍 언어
- 자신을 자신의 언어로 컴파일할 수 있음 (자가 부스트래핑)
- 외부 의존성 **0%** (Node.js 제거)

---

## 🗓️ **4주 로드맵**

### **Week 1-2: Lexer + Parser (619줄)**

#### Week 1: Lexer.fl (229줄)
- **소스**: src/lexer.ts (229줄)
- **구조**:
  - Lexer 함수 선언
  - Token 구조 정의
  - 핵심 메서드:
    - `tokenize()`: 메인 루프
    - `readNumber()`: 숫자 파싱
    - `readString()`: 문자열 파싱
    - `readIdentifierOrKeyword()`: 식별자/키워드
    - `readOperator()`: 연산자
    - `advance()`: 위치 증가
    - `currentChar()`, `peekChar()`: 문자 접근
    - `skipWhitespaceAndComments()`: 공백/주석 스킵

- **구현 전략**:
  ```fl
  fn tokenize(source: string) -> [Token] {
    # position, line, column 추적
    # tokens 배열 유지
    # 각 문자 분류:
    #   - 숫자 → readNumber()
    #   - 문자열 → readString()
    #   - 식별자 → readIdentifierOrKeyword()
    #   - 연산자 → readOperator()
    #   - 특수문자 → addToken()
    # EOF 토큰 추가
    # tokens 반환
  }
  ```

- **완료 기준**:
  - [ ] lexer.fl 컴파일 성공 (npm run build)
  - [ ] 10개+ 테스트 통과
  - [ ] src/lexer.ts와 동등 기능

#### Week 2: Parser.fl (390줄)
- **소스**: src/parser.ts (390줄)
- **구조**:
  - Parser 함수 선언
  - AST 노드 구조
  - 파싱 메서드:
    - `parse()`: 진입점
    - `statement()`: 문장 파싱
    - `expression()`: 식 파싱 (우선순위)
    - `assignment()`: 할당
    - `or()`, `and()`, `equality()`, `comparison()`, `addition()`, `multiplication()`, `unary()`, `call()`, `primary()`: 우선순위
    - `functionDefinition()`: 함수 정의
    - `ifStatement()`, `whileStatement()`: 제어 흐름
    - `blockStatement()`: 블록
    - `arrayAccess()`, `call()`: 메서드 호출

- **완료 기준**:
  - [ ] parser.fl 컴파일 성공
  - [ ] 15개+ 테스트 통과
  - [ ] 모든 AST 노드 타입 지원

---

### **Week 3: Checkers (825줄)**

#### OwnershipChecker.fl (520줄)
- **소스**: src/ownership_checker.ts (520줄)
- **기능**:
  - 변수 소유권 추적
  - Move 감지
  - Use-after-move 에러 생성
  - Scope 기반 생명주기 관리

- **구현**:
  ```fl
  struct OwnershipState {
    variable: string
    moved: bool
    movedTo: string
    movedAt: int
    scope: int
  }

  fn check(ast) -> [OwnershipError] {
    # ownershipMap: variable → OwnershipState
    # scopeStack: scope 추적
    # 각 노드 분석
    # errors 수집 및 반환
  }
  ```

#### BorrowChecker.fl (305줄)
- **소스**: src/borrow_checker.ts (305줄)
- **기능**:
  - Shared borrow (&x) 감지
  - Mutable borrow (&mut x) 감지
  - 충돌 검증
  - Scope 기반 범위 검증

- **3가지 검증 규칙**:
  1. 여러 mutable borrow 금지
  2. Shared + Mutable 동시 존재 금지
  3. Scope 범위 검증

---

### **Week 4: Integration + Testing (종합)**

- **컴파일 통합**:
  - lexer.fl → tokens
  - parser.fl → AST
  - ownership_checker.fl → ownership errors
  - borrow_checker.fl → borrow errors
  - 에러 리포트

- **테스트 통합**:
  - 40개+ 통합 테스트
  - 모든 에러 케이스 검증

- **Bare-metal 검증**:
  - freelang-bare-metal 환경에서 실행
  - 자가 컴파일 테스트 (Lexer/Parser 가 자신을 컴파일)

---

## 📈 **코드량 예상**

```
Week 1: Lexer.fl          229줄
Week 2: Parser.fl         390줄
Week 3: Checkers.fl       825줄 (OwnershipChecker 520 + BorrowChecker 305)
Week 4: Tests + Docs      300줄

총: 1,744줄 (원본 1,445줄 비교, 코드 정리로 약간 감소)
```

---

## 🔧 **기술적 과제**

### **Challenge 1: 타입 시스템**
- **문제**: FreeLang은 TypeScript처럼 강한 타입이 아님
- **해결**:
  - 동적 타입 사용
  - 구조체로 Token, AST 노드 정의
  - 타입 안전성을 런타임 검사로 보완

### **Challenge 2: 정규식 대신 문자 분류**
- **문제**: FreeLang은 정규식 미지원 (regex)
- **해결**:
  ```fl
  fn isDigit(c: string) -> bool {
    return c >= "0" and c <= "9"
  }

  fn isAlpha(c: string) -> bool {
    return (c >= "a" and c <= "z") or
           (c >= "A" and c <= "Z") or
           c == "_"
  }
  ```

### **Challenge 3: 배열 동적 크기**
- **문제**: FreeLang 배열은 고정 크기
- **해결**: 배열 + 동적 추가 (push 구현)
  ```fl
  tokens = []  # 시작
  # ...
  tokens = tokens + [newToken]  # 추가
  ```

### **Challenge 4: 에러 처리**
- **문제**: TypeScript throws vs FreeLang error handling
- **해결**: 에러를 구조체로 반환
  ```fl
  struct Error {
    message: string
    line: int
    column: int
  }
  ```

---

## ✅ **성공 기준**

### **Week 1 완료**
- [ ] lexer.fl 컴파일 성공
- [ ] 모든 토큰 타입 지원 (13가지)
- [ ] 10개+ 테스트 통과
- [ ] src/lexer.ts와 동등 기능 검증

### **Week 2 완료**
- [ ] parser.fl 컴파일 성공
- [ ] 모든 AST 노드 타입 지원 (12가지+)
- [ ] 15개+ 테스트 통과
- [ ] 우선순위 파싱 정확성 검증

### **Week 3 완료**
- [ ] ownership_checker.fl 컴파일 성공
- [ ] borrow_checker.fl 컴파일 성공
- [ ] 20개+ 에러 케이스 감지
- [ ] src/ownership_checker.ts와 동등 기능

### **Week 4 완료**
- [ ] 전체 파이프라인 통합 (Lexer → Parser → Checkers)
- [ ] 40개+ 통합 테스트 통과
- [ ] Bare-metal에서 자가 컴파일 성공
- [ ] Phase B-4 완료 보고서 생성
- [ ] GOGS 최종 커밋

---

## 🎯 **마이너스톤**

| 주차 | 목표 | 상태 | 파일 | 줄수 |
|------|------|------|------|------|
| 1 | Lexer.fl | ⏳ | lexer.fl | 229 |
| 2 | Parser.fl | ⏳ | parser.fl | 390 |
| 3 | Checkers.fl | ⏳ | checkers.fl | 825 |
| 4 | 통합 + 검증 | ⏳ | tests.fl | 300 |

---

## 🚀 **최종 의미**

이 4주의 작업을 통해:

1. **단계 1**: 외부 컴파일러(TypeScript 컴파일러)에서 독립 ✅
2. **단계 2**: FreeLang 컴파일러 완성 → FreeLang으로 구현
3. **단계 3**: 자가 부스트래핑 (self-bootstrapping) 달성
4. **단계 4**: **100% 자체 호스팅** = 완전 독립 언어 탄생

```
Node.js + TypeScript
       ↓
FreeLang (bootstrap)
       ↓
FreeLang (self-hosted)
       ↓
Bare-metal CPU
```

---

## 📝 **철학**

**"기록이 증명이다"**

- 모든 단계가 Git 커밋으로 기록됨
- 매일 진행 상황 업데이트 (이 문서)
- 주마다 완료 보고서 작성
- 최종: PHASE_B4_FINAL_REPORT.md

---

**시작 일시**: 2026-03-02
**예상 완료**: 2026-03-30
**최종 목표**: 완전 자체 호스팅 FreeLang 컴파일러 ✨
