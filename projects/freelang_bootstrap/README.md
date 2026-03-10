# 🚀 FreeLang Bootstrap

**최소한의 부트스트랩 FreeLang 인터프리터 (Phase B 기초)**

**버전**: 1.0.0
**상태**: ✅ Phase B 시작점
**목표**: FreeLang 자체 런타임 구현을 위한 임시 실행 환경

---

## 📋 개요

이것은 FreeLang을 **진정으로 독립적인 프로그래밍 언어**로 만들기 위한 첫 번째 단계입니다.

### 문제

```
FreeLang이 "언어 독립"이려면:
  → 자신으로 자신을 컴파일해야 함
  → 호스트 언어에 의존하지 않아야 함

하지만 현재:
  → Rust/TypeScript로만 구현됨
  → 자체 호스팅 불가능
```

### 해결책

```
1. 최소한의 부트스트랩 인터프리터 작성 (이것!)
   → 기본적인 FreeLang 코드 실행 가능

2. FreeLang 자체 런타임을 FreeLang으로 작성
   → HashMap, File I/O, Path 등 자체 구현

3. 부트스트랩 컴파일러 (FreeLang으로)
   → FreeLang을 컴파일하는 컴파일러를 FreeLang으로 작성

4. 자체 호스팅 달성
   → FreeLang 컴파일러로 자신을 컴파일
```

---

## 🛠️ 구조

### 컴포넌트

| 파일 | 역할 | 줄수 |
|------|------|------|
| `lexer.ts` | 소스 코드 → 토큰 | ~200 |
| `parser.ts` | 토큰 → AST | ~300 |
| `evaluator.ts` | AST 실행 | ~250 |
| `types.ts` | 타입 정의 | ~80 |
| `index.ts` | 메인 진입점 | ~80 |

**총**: ~910줄 (TypeScript)

### 지원하는 기능

#### 데이터 타입
- ✅ 숫자 (number)
- ✅ 문자열 (string)
- ✅ 배열 (array)
- ✅ 객체 (object)

#### 연산
- ✅ 산술: `+`, `-`, `*`, `/`, `%`
- ✅ 비교: `==`, `!=`, `<`, `>`, `<=`, `>=`
- ✅ 논리: `&&`, `||`, `!`

#### 제어 흐름
- ✅ 조건: `if`, `else`
- ✅ 반복: `while`, `for ... in`
- ✅ 함수: `fn` 정의

#### 내장 함수
- ✅ `print()`, `println()` - 출력
- ✅ `len()` - 길이
- ✅ `type()` - 타입
- ✅ `str()` - 문자열 변환
- ✅ `num()` - 숫자 변환
- ✅ `keys()`, `values()` - 객체 작업
- ✅ `push()`, `pop()` - 배열 작업

---

## 📝 예제

### 기본 사용

```bash
# 파일 실행
npm run build
node dist/index.js hello.fl

# REPL 모드
node dist/index.js

# eval 모드
node dist/index.js --eval "print(1 + 2)"
```

### FreeLang 코드 예제

#### 1. 기본 연산
```freelang
print(1 + 2)      # 3
print("Hello")    # Hello
```

#### 2. 함수
```freelang
fn add(a, b)
  return a + b

print(add(5, 3))  # 8
```

#### 3. 조건문
```freelang
fn abs(x)
  if x < 0
    return -x
  else
    return x

print(abs(-10))   # 10
```

#### 4. 반복
```freelang
fn sum(n)
  result = 0
  for i in 0..n
    result = result + i
  return result

print(sum(10))    # 45
```

#### 5. 배열 및 객체
```freelang
arr = [1, 2, 3]
print(len(arr))   # 3

obj = {x: 10, y: 20}
print(len(obj))   # 2
```

---

## 🎯 Phase B 목표

이 부트스트랩을 사용하여 **FreeLang 자체 런타임**을 작성합니다.

### 구현 항목

```
Week 1: 기본 라이브러리
  - HashMap 구현 (해시 테이블)
  - 동적 배열 구현

Week 2: 파일 시스템
  - File struct 정의
  - open(), read(), write(), close()

Week 3: 유틸리티
  - Path 처리
  - String 확장 메서드
  - Math 함수들

Week 4: 통합 및 테스트
  - 모든 모듈 통합
  - 50+ 테스트 케이스
  - 성능 최적화
```

### 예상 결과

```
현재:
  runtime/mod.fl (Rust import)
    use std::path::Path;
    use std::fs;
    use std::collections::HashMap;

Phase B 완료 후:
  runtime.fl (FreeLang만)
    # FreeLang으로 작성된 완전한 런타임
    # 외부 import 없음
```

---

## ⚠️ 제한사항

이 부트스트랩은 **최소한**의 구현입니다:

- ❌ 고급 타입 시스템 없음
- ❌ 제네릭 미지원
- ❌ 매크로 미지원
- ❌ 고급 오류 처리 없음

**목적**: FreeLang 자체를 구현할 수 있는 **충분한** 기능만 제공

---

## 🚀 다음 단계

### 지금 (Phase B)
```
✅ 부트스트랩 완성 (이것)
⏳ FreeLang 자체 런타임 작성 (진행 중)
⏳ 50+ 테스트 케이스
```

### 4주 후 (Phase C)
```
⏳ 부트스트랩 컴파일러 작성
⏳ FreeLang → Rust 코드 생성
⏳ 자체 호스팅 준비
```

### 8주 후 (Phase D)
```
⏳ 자체 호스팅 완성
⏳ Rust 호스트 언어 제거
⏳ 완전한 독립성 달성
```

---

## 📊 진행 상황

| 항목 | 상태 | 비고 |
|------|------|------|
| Lexer | ✅ 완성 | 토큰화 |
| Parser | ✅ 완성 | AST 생성 |
| Evaluator | ✅ 완성 | 기본 실행 |
| 내장 함수 | ✅ 완성 | 10개 함수 |
| REPL | ✅ 완성 | 대화형 모드 |
| 테스트 | 🔄 진행 중 | 기본 테스트 |

---

## 💡 철학

```
"언어 독립" = 자신으로 자신을 컴파일할 수 있는 언어

부트스트랩:
  1. 최소 도구 만들기 (이것)
  2. 그 도구로 더 나은 도구 만들기
  3. 반복하여 완전한 도구 만들기
  4. 더 이상 호스트 언어 필요 없음
```

---

## 🎯 성공 기준

Phase B가 완료되면:

```
❌ 현재:
  - Rust std 라이브러리에 의존
  - .fl 파일인데 Rust import
  - 자체 호스팅 불가능

✅ 목표:
  - FreeLang으로만 작성된 런타임
  - 외부 import 없음
  - 자체 호스팅 준비 완료
```

---

**시작일**: 2026-03-02
**기한**: 2026-04-02 (4주)
**도전**: 진정한 프로그래밍 언어 만들기 🚀
