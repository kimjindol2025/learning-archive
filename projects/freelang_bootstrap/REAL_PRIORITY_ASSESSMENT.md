# 🚨 현실 평가: 진정한 Priority

**작성일**: 2026-03-03
**평가**: 거짓 없이, 확인된 사실만

---

## 현재 언어 완성도

### FreeLang v4 (Step 2.1에서 테스트한 버전)

```
✅ 작동함:
  - 기본 함수 정의: fn func(a: string): bool { ... }
  - 단순 연산자: +, -, *, /, >, <, ==
  - 논리 연산: && (작동) || (작동)
  - 배열: [1, 2, 3]
  - 문자열 비교: >=, <=
  - 함수 호출: func(arg)

❌ 작동 안 함:
  - 객체/구조체 리터럴: { key: value }
  - 주석: #comment
  - and/or 키워드: (대신 && || 사용)
  - 한글 문자 처리
```

---

## 진정한 Priority (재평가)

### Priority 1: 주석 지원 ⚠️

```
현재: ❌ 렉서가 '#' 문자 인식 불가
영향: 모든 FreeLang 코드가 주석 불가능
결과: Lexer.fl이 첫 줄에서 실패
  → "lex error: unexpected character: #"

해결 필요성: ⭐⭐⭐⭐⭐ (가장 시급)
예상 기한: 2-3일
블로커: 렉서(Lexer.ts) 수정 필요
```

### Priority 2: 객체 리터럴 ⚠️

```
현재: ❌ 파서가 { key: value } 구문 미지원
영향: Lexer.fl의 createToken() 함수 실행 불가
결과: "parse error: expected ':' for return type (got LBRACE)"

해결 필요성: ⭐⭐⭐⭐ (필수)
예상 기한: 1주
블로커: 파서(Parser.ts) 수정 필요
```

### Priority 3: and/or 키워드 ⚠️

```
현재: ❌ 파서 미정의 (대신 && || 작동함)
영향: Lexer.fl의 조건문 일부 실행 불가
결과: isDigit() 같은 함수는 && 사용하면 작동

해결 필요성: ⭐⭐⭐ (강력 권장)
예상 기한: 2-3일
블로커: 파서(Parser.ts) 수정 필요
```

---

## 즉시 해야 할 일 (우선순위 재정렬)

```
1단계 (오늘): 주석 지원 추가
   → Lexer.ts에 '#' 토큰 처리 추가
   → Lexer.fl이 첫 줄을 통과하도록

2단계 (3-4일): 객체 리터럴 추가
   → Parser.ts에서 primary() 함수 수정
   → { key: value } 파싱 구현

3단계 (병렬): and/or 키워드 추가
   → Parser.ts에 and, or 키워드 정의
   → && || 대신 사용 가능하게
```

---

## 실제 실행 계획

### 즉시 시작 (오늘)

**파일**: `/freelang-bootstrap/lexer.ts` (아직 찾음)
**작업**: 주석 문자 '#' 처리

```typescript
// lexer.ts에 추가할 코드
if (this.current === '#') {
  this.skipComment()
  return this.nextToken()
}

private skipComment() {
  while (this.current !== '\n' && !this.isAtEnd()) {
    this.advance()
  }
}
```

### 1주일 내

**파일**: `/freelang-bootstrap/parser.ts` (찾아야 함)
**작업**: ObjectLiteral 파싱

```typescript
// parser.ts의 primary() 함수에 추가
if (this.match(TokenType.LBRACE)) {
  return this.parseObjectLiteral()
}

private parseObjectLiteral() {
  const properties = []
  while (!this.check(TokenType.RBRACE)) {
    const key = this.consume(TokenType.STRING, "key").value
    this.consume(TokenType.COLON, ":")
    const value = this.parseExpr()
    properties.push({ key, value })
  }
  this.consume(TokenType.RBRACE, "}")
  return { type: 'objectLiteral', properties }
}
```

---

## 신뢰 = 행동

```
단순한 보고는 거짓이다.
행동하는 기록만이 진실이다.

지금부터:
❌ 계획만 하지 말 것
✅ 코드 수정 + 커밋 (GOGS)
✅ 테스트 + 결과 기록
✅ "이제 작동합니다" 선언
```

---

**준비 상태**: 파일 위치 확인 필요
**다음**: Lexer.ts 찾기 → 주석 처리 추가 시작
