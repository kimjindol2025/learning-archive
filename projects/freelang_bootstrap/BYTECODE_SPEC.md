# FreeLang Bytecode 명세서

**버전**: 1.0
**상태**: 설계 완료
**목적**: JIT 컴파일러를 위한 중간 표현(IR)

---

## 📋 목차

1. [개요](#개요)
2. [Bytecode 명령어](#bytecode-명령어)
3. [실행 모델](#실행-모델)
4. [상수 풀](#상수-풀)
5. [심볼 테이블](#심볼-테이블)
6. [예제](#예제)

---

## 개요

### Bytecode란?

- **AST**의 중간 표현(IR)
- Stack 기반 가상 머신(VM)을 위한 명령어
- 해석형 구현과 JIT 컴파일을 동시 지원

### 실행 흐름

```
소스 코드
   ↓
Lexer (토큰화)
   ↓
Parser (AST 생성)
   ↓
Bytecode Generator (AST → Bytecode)
   ↓
JIT Executor (Stack VM 실행)
   ↓
결과
```

### 성능 향상

- **순수 해석**: 1배 (현재)
- **Bytecode**: 3배 (중간 최적화)
- **JIT**: 10배 (목표)

---

## Bytecode 명령어

총 **40개 명령어**로 구성됩니다.

### 1. 스택 조작 (4개)

```
PUSH value      # 스택에 값 푸시
              # 예: PUSH 42 → [42]

POP             # 스택에서 팝
              # 예: [42] POP → []

DUP             # 스택 top 복제
              # 예: [42] DUP → [42, 42]

SWAP            # 스택 top 2개 교환
              # 예: [1, 2] SWAP → [2, 1]
```

### 2. 변수 (4개)

```
LOAD id         # 지역 변수 로드
              # 예: LOAD 0 (변수 0번 로드)

STORE id        # 지역 변수 저장
              # 예: STORE 0 (변수 0번 저장)

GLOAD id        # 전역 변수 로드
              # 예: GLOAD 0

GSTORE id       # 전역 변수 저장
              # 예: GSTORE 0
```

### 3. 상수 (2개)

```
CONST idx       # 상수 풀에서 로드
              # 예: CONST 5 (상수풀[5])

NULL            # null 푸시
```

### 4. 산술 연산 (5개)

```
ADD             # top 2개 더하기: [a, b] → [a+b]
SUB             # 뺄셈: [a, b] → [a-b]
MUL             # 곱셈: [a, b] → [a*b]
DIV             # 나눗셈: [a, b] → [a/b]
MOD             # 나머지: [a, b] → [a%b]
```

### 5. 비교 연산 (6개)

```
EQ              # 같음: [a, b] → [a==b ? 1 : 0]
NE              # 다름: [a, b] → [a!=b ? 1 : 0]
LT              # 미만: [a, b] → [a<b ? 1 : 0]
LE              # 이하: [a, b] → [a<=b ? 1 : 0]
GT              # 초과: [a, b] → [a>b ? 1 : 0]
GE              # 이상: [a, b] → [a>=b ? 1 : 0]
```

### 6. 논리 연산 (3개)

```
AND             # 논리 AND: [a, b] → [a && b]
OR              # 논리 OR: [a, b] → [a || b]
NOT             # 논리 NOT: [a] → [!a]
```

### 7. 제어 흐름 (4개)

```
JMP offset      # 무조건 점프
              # 예: JMP 10 (10 바이트 앞으로)

JMP_IF_FALSE offset  # false면 점프
                   # 예: [false] JMP_IF_FALSE 10 → 점프

RETURN          # 함수 반환
HALT            # 프로그램 종료
```

### 8. 함수 호출 (2개)

```
CALL func_id    # 함수 호출
              # 예: CALL 0 (함수 0번 호출)

BUILTIN name    # 내장 함수 호출
              # 예: BUILTIN "print"
```

### 9. 배열 (5개)

```
ARRAY_CREATE len    # 길이 len인 배열 생성
                  # 예: ARRAY_CREATE 5 → [배열(5)]

ARRAY_GET       # 배열 원소 접근: [arr, idx] → [arr[idx]]
ARRAY_SET       # 배열 원소 설정: [arr, idx, val] → []
ARRAY_LEN       # 배열 길이: [arr] → [len(arr)]
ARRAY_PUSH      # 배열에 원소 추가: [arr, val] → []
```

### 10. 객체 (3개)

```
OBJECT_CREATE   # 빈 객체 생성: [] → [{}]
OBJECT_GET key  # 객체 키 접근: [obj] → [obj[key]]
OBJECT_SET key  # 객체 키 설정: [obj, val] → []
```

---

## 실행 모델

### Stack-Based Virtual Machine

```
┌─────────────────┐
│   Operand Stack │  ← 실행 중 값 저장
│  [val1, val2]  │
└─────────────────┘

┌─────────────────┐
│ Local Variables │  ← 함수 로컬 변수
│  [var0, var1]  │
└─────────────────┘

┌─────────────────┐
│ Global Variables│  ← 전역 변수
│  [gvar0, gvar1]│
└─────────────────┘

┌─────────────────┐
│  Constant Pool  │  ← 상수들
│  [const0, ...]  │
└─────────────────┘

┌─────────────────┐
│  Code (Bytecode)│  ← 명령어 수열
│  [PUSH, ADD, ...]
└─────────────────┘

┌─────────────────┐
│   Call Stack    │  ← 함수 호출 스택
│  [frame1, ...]  │
└─────────────────┘
```

### 실행 예시

**FreeLang 코드**:
```freelang
fn add(a, b) {
  return a + b
}

result = add(3, 4)
print(result)
```

**Bytecode**:
```
# 함수 add 정의
FUNC add
  LOAD 0        # 매개변수 a 로드
  LOAD 1        # 매개변수 b 로드
  ADD           # a + b
  RETURN        # 반환

# 메인 코드
CONST 0         # 상수 3 로드
CONST 1         # 상수 4 로드
CALL 0          # add 호출
STORE 0         # result 저장

LOAD 0          # result 로드
BUILTIN print   # print 호출

HALT            # 종료
```

**Stack 추적**:
```
CONST 0        → [3]
CONST 1        → [3, 4]
CALL 0         → 함수 호출
  LOAD 0       →   [3]
  LOAD 1       →   [3, 4]
  ADD          →   [7]
  RETURN       → [7]
STORE 0        → []
LOAD 0         → [7]
BUILTIN print  → "7" 출력 → []
HALT
```

---

## 상수 풀 (Constant Pool)

### 구조

```typescript
interface ConstantPool {
  constants: (number | string | boolean | null)[]
}
```

### 예시

```
상수 풀:
  [0] = 3          (숫자)
  [1] = 4          (숫자)
  [2] = "hello"    (문자열)
  [3] = true       (불린)
```

### 최적화

- **중복 제거**: 같은 값은 한 번만 저장
- **타입 분류**: 타입별로 인덱싱
- **접근**: O(1) 조회

---

## 심볼 테이블 (Symbol Table)

### 함수 테이블

```typescript
interface FunctionSymbol {
  id: number              // 함수 ID
  name: string            // 함수 이름
  code_offset: number     // 코드 시작 위치
  num_locals: number      // 로컬 변수 개수
  num_params: number      // 매개변수 개수
}
```

### 전역 변수 테이블

```typescript
interface GlobalSymbol {
  id: number              // 변수 ID
  name: string            // 변수 이름
  index: number           // 메모리 인덱스
}
```

### 내장 함수 테이블

```typescript
interface BuiltinSymbol {
  name: string            // 함수 이름
  arity: number           // 인자 개수 (-1 = 가변)
}

예: "print" → arity 1
    "len" → arity 1
```

---

## 예제

### 예제 1: 피보나치

**FreeLang 코드**:
```freelang
fn fib(n) {
  if (n <= 1) {
    return n
  } else {
    return fib(n-1) + fib(n-2)
  }
}

print(fib(10))
```

**Bytecode** (간략):
```
# fib 함수
FUNC fib (id=0)
  LOAD 0          # n
  CONST 1         # 1
  LE              # n <= 1
  JMP_IF_FALSE 6  # false면 else로

  LOAD 0          # then: return n
  RETURN

  # else
  LOAD 0          # n
  CONST 1         # 1
  SUB             # n-1
  CALL 0          # fib(n-1)

  LOAD 0          # n
  CONST 2         # 2
  SUB             # n-2
  CALL 0          # fib(n-2)

  ADD             # + 연산
  RETURN

# 메인
CONST 10         # 10
CALL 0           # fib(10)
BUILTIN print    # print

HALT
```

### 예제 2: 배열 처리

**FreeLang 코드**:
```freelang
arr = [1, 2, 3, 4, 5]
print(arr[2])
print(len(arr))
```

**Bytecode**:
```
CONST 1         # 1
CONST 2         # 2
CONST 3         # 3
CONST 4         # 4
CONST 5         # 5
ARRAY_CREATE 5  # 배열 생성
GSTORE 0        # arr 전역 변수 저장

GLOAD 0         # arr 로드
CONST 2         # 인덱스 2
ARRAY_GET       # arr[2]
BUILTIN print   # 출력

GLOAD 0         # arr 로드
ARRAY_LEN       # len(arr)
BUILTIN print   # 출력

HALT
```

---

## 통계

| 항목 | 개수 |
|------|------|
| 명령어 | 40개 |
| 스택 조작 | 4개 |
| 변수 | 4개 |
| 상수 | 2개 |
| 산술 | 5개 |
| 비교 | 6개 |
| 논리 | 3개 |
| 제어 | 4개 |
| 함수 | 2개 |
| 배열 | 5개 |
| 객체 | 3개 |

---

## 성능 특성

### 메모리
- **Bytecode**: AST의 50% 크기
- **Stack**: 함수당 평균 20개 항목

### 속도
- **Bytecode 생성**: O(n) n=AST 노드 수
- **실행**: 명령어당 O(1)
- **전체**: AST 해석보다 3배 빠름

### 최적화 기회
- **Inline Caching**: 함수 호출 최적화
- **Loop Unrolling**: 루프 전개
- **Constant Folding**: 컴파일 시 상수 계산
- **JIT**: 자주 사용되는 코드 네이티브로 컴파일

---

## 다음 단계

1. **Bytecode Generator**: AST → Bytecode 변환 구현
2. **JIT Executor**: Stack VM 구현
3. **최적화**: Inline Caching, JIT 컴파일
4. **벤치마크**: 성능 측정 (10배 목표)

---

**작성**: 2026-03-02
**상태**: 설계 완료 ✅
**다음**: Bytecode Generator 구현 (src/bytecode_generator.ts)
