# FreeLang Ownership/Borrow System - 완전 명세

**버전**: 1.0
**작성일**: 2026-03-02
**상태**: Phase E Feature 2 - Week 4 설계

---

## 📚 **목차**

1. [철학](#철학)
2. [핵심 개념](#핵심-개념)
3. [소유권 규칙](#소유권-규칙)
4. [차용 규칙](#차용-규칙)
5. [생명주기](#생명주기)
6. [에러 메시지](#에러-메시지)
7. [구현 전략](#구현-전략)

---

## 🎓 **철학**

> **"메모리는 문제가 아니라 기회다"**

FreeLang의 소유권 시스템의 핵심:
- **안전성**: 런타임 오류 없음 (컴파일 타임 검증)
- **성능**: GC 없음 (자동 메모리 해제)
- **명확성**: 코드가 의도를 명시

---

## 📖 **핵심 개념**

### 1. **Ownership (소유권)**

모든 값은 정확히 **하나의 소유자**를 가집니다.

```freelang
x = 42          // x가 42를 소유
y = x           // y로 이동 (move)
// print(x)    // 에러! x는 더 이상 42를 소유하지 않음
```

### 2. **Borrowing (차용)**

값의 **소유권을 유지하면서** 임시 접근권 부여:

```freelang
x = "hello"
y = &x          // x를 차용 (shared borrow)
z = &mut x      // x를 변경 가능하게 차용 (mutable borrow)
```

### 3. **Lifetime (생명주기)**

참조가 유효한 **범위**를 추적:

```freelang
fn get_first(arr: &[T]) -> &T {
  return &arr[0]
}
```

---

## 🔒 **소유권 규칙**

### Rule 1: 하나의 소유자

```
값 = 소유자 (1:1 관계)
```

**예제**:
```freelang
// Case 1: 이동 (Move)
x = [1, 2, 3]           // x가 배열을 소유
y = x                   // 소유권 이동 (x는 더 이상 유효하지 않음)
// x[0]                 // 에러: use after move

// Case 2: 복사 (Copy)
a = 42                  // a가 42를 소유
b = a                   // 복사 (a는 여전히 유효)
print(a)                // OK: 42
```

### Rule 2: 스코프 벗어나면 해제

```
소유권 범위 = 변수의 생명주기
```

**예제**:
```freelang
{
  x = "hello"           // x가 "hello" 소유
  // ... x 사용
}                       // 스코프 끝 → x 및 "hello" 자동 해제
// x                    // 에러: x 정의되지 않음
```

### Rule 3: 함수와 소유권

```freelang
fn take_ownership(x: String) {
  // x의 소유권을 받음
  // 함수 끝나면 x 자동 해제
}

fn borrow_string(x: &String) {
  // x를 차용만 함 (소유권 유지)
}

s = "hello"
take_ownership(s)       // s의 소유권 이동
// print(s)             // 에러: s는 더 이상 유효하지 않음

s2 = "world"
borrow_string(&s2)      // s2 차용만 함
print(s2)               // OK: "world"
```

---

## 🤝 **차용 규칙**

### Rule 1: Shared Borrow (&T)

- **여러 개 가능**: 동시에 여러 shared borrow 존재 가능
- **읽기만**: 값을 수정할 수 없음
- **동시 접근**: 스레드 안전 (읽기는 경합 없음)

```freelang
x = "shared"
r1 = &x                 // OK
r2 = &x                 // OK (여러 개 가능)
r3 = &x                 // OK
// 동시에 여러 참조 사용 가능
print(r1, r2, r3)       // OK: "shared" "shared" "shared"
```

### Rule 2: Mutable Borrow (&mut T)

- **하나만 가능**: 한 번에 하나의 mutable borrow만 존재
- **읽기/쓰기**: 값을 수정할 수 있음
- **배타적 접근**: 다른 참조와 동시 사용 불가

```freelang
x = [1, 2, 3]
mut_ref = &mut x        // OK
mut_ref[0] = 10
// r = &x               // 에러: mutable borrow 중에는 다른 borrow 불가
// print(x)             // 에러: mutable borrow 중에는 소유자 접근 불가
print(mut_ref)          // OK: [10, 2, 3]
```

### Rule 3: Borrow와 Ownership 혼합 불가

```freelang
x = 100
r1 = &x                 // shared borrow
// m = &mut x           // 에러: shared borrow 중에는 mutable borrow 불가
// x = 200              // 에러: borrow 중에는 소유자 수정 불가
print(r1)               // OK
```

---

## ⏱️ **생명주기 (Lifetime)**

### 개념: 참조의 유효 범위

```freelang
fn get_first(arr: &[int]) -> &int {
  return &arr[0]        // 반환되는 참조의 생명주기는 arr과 같음
}

a = [1, 2, 3]
first = get_first(&a)   // first는 a의 생명주기보다 길 수 없음
print(first)            // OK
// ...
// a는 여전히 유효해야 함 (first가 참조 중)
```

### 명시적 Lifetime (고급)

```freelang
// lifetime annotation
fn borrow_with_lifetime(x: &'a int) -> &'a int {
  return x              // 반환값의 생명주기는 입력값과 같음
}

// 함수형 인터페이스
fn apply(f: fn(&T) -> R, x: &T) -> R {
  return f(x)
}
```

---

## ❌ **에러 케이스 & 메시지**

### Error 1: Use After Move

```freelang
x = "hello"
y = x                   // move
print(x)                // ❌ 에러

// 에러 메시지:
// ERROR: Use after move
// Line 3: print(x)
//         ^^^
// Value 'x' moved to 'y' at line 2
// Suggestion: Use 'y' instead of 'x'
```

### Error 2: Multiple Mutable Borrows

```freelang
x = [1, 2, 3]
m1 = &mut x
m2 = &mut x             // ❌ 에러

// 에러 메시지:
// ERROR: Cannot borrow 'x' as mutable more than once at a time
// Line 3: m2 = &mut x
//         ^^^^
// First mutable borrow was at line 2
```

### Error 3: Shared + Mutable Borrow

```freelang
x = 100
r = &x                  // shared borrow
m = &mut x              // ❌ 에러

// 에러 메시지:
// ERROR: Cannot borrow 'x' as mutable while it is borrowed as immutable
// Line 3: m = &mut x
//         ^^^^
// Immutable borrow was at line 2
```

### Error 4: Lifetime Mismatch

```freelang
fn get_ref(x: &int) -> &int {
  return x              // OK: 생명주기 일치
}

fn bad_ref() -> &int {
  x = 10
  return &x             // ❌ 에러: 함수 끝나면 x 해제됨
}

// 에러 메시지:
// ERROR: Returned reference has shorter lifetime than expected
// Line 4: return &x
//         ^^^^^^
// Variable 'x' will be dropped at the end of this function
```

---

## 🛠️ **구현 전략**

### Phase 1: Ownership Analyzer (Week 5)

```typescript
class OwnershipAnalyzer {
  // 목표: 변수의 소유권 추적

  analyze(ast: ASTNode): OwnershipMap {
    // 각 변수에 대해:
    // 1. 정의 위치 기록
    // 2. 사용 위치 추적
    // 3. 이동/차용 분류
    // 4. 스코프 영역 파악
  }

  detectMoves(): MoveError[] {
    // 소유권 이동 후 사용 감지
  }
}
```

### Phase 2: Borrow Checker (Week 5)

```typescript
class BorrowChecker {
  // 목표: 차용 규칙 검증

  check(ast: ASTNode): BorrowError[] {
    // 각 참조에 대해:
    // 1. Shared vs Mutable 분류
    // 2. 동시 존재 여부 확인
    // 3. 범위 체크
    // 4. 에러 리포트
  }

  detectConflicts(): ConflictError[] {
    // mutable + mutable
    // mutable + shared
  }
}
```

### Phase 3: Lifetime Validator (Week 5)

```typescript
class LifetimeValidator {
  // 목표: 생명주기 일치성 검증

  validate(ast: ASTNode): LifetimeError[] {
    // 각 참조에 대해:
    // 1. 소유자 추적
    // 2. 생명주기 계산
    // 3. 반환 참조 검증
    // 4. 에러 리포트
  }
}
```

---

## 📋 **Type System 확장**

### 기본 타입

```
Type ::=
  | int | float | string | bool
  | [Type]                    // Array
  | {key: Type, ...}          // Object
  | fn(Type, ...) -> Type     // Function
  | &Type                     // Shared Reference
  | &mut Type                 // Mutable Reference
```

### 예제

```freelang
// 배열의 공유 참조
fn first(arr: &[int]) -> &int {
  return &arr[0]
}

// 배열의 변경 가능 참조
fn modify(arr: &mut [int]) {
  arr[0] = 42
}

// 함수 참조
fn apply(f: &fn(int) -> int, x: int) -> int {
  return f(x)
}
```

---

## ✅ **검증 체크리스트**

### Ownership Checks
- [ ] 각 변수는 정확히 하나의 소유자를 가짐
- [ ] 소유권 이동 추적
- [ ] 스코프 끝에서 자동 해제
- [ ] Move vs Copy 구분

### Borrow Checks
- [ ] Shared borrow는 여러 개 가능
- [ ] Mutable borrow는 하나만 가능
- [ ] Shared + Mutable 불가
- [ ] 참조 범위 검증

### Lifetime Checks
- [ ] 참조가 소유자를 벗어나지 않음
- [ ] 함수 반환 참조 검증
- [ ] 클로저 캡처 검증
- [ ] 순환 참조 방지

---

## 🎯 **성공 기준**

### Week 4 완료 기준
- ✅ OWNERSHIP_SPEC.md 완성 (400줄)
- ✅ Type system 확장 문서화
- ✅ 에러 메시지 20개 정의
- ✅ 테스트 케이스 틀 작성 (35개)

### Week 5 완료 기준
- ✅ OwnershipAnalyzer 구현 (500줄)
- ✅ BorrowChecker 구현 (600줄)
- ✅ 컴파일 에러 0개
- ✅ 20개 테스트 통과

### Week 6 완료 기준
- ✅ 35개 테스트 모두 통과
- ✅ 15개 에러 케이스 감지
- ✅ PHASE_E2_PROGRESS.md 완성 (800줄)
- ✅ GOGS에 커밋 완료

---

**철학**: "메모리를 관리한다" → "메모리를 이해한다" → "메모리를 통제한다"

**기록이 증명이다** 🚀
