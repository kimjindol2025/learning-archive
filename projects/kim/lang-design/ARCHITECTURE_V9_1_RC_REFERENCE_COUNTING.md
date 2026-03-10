# 🏛️ v9.1: Rc<T>와 참조 카운팅 (Rc and Reference Counting)

> **"여러 소유자를 위한 공유 데이터"**
>
> **"참조 카운팅으로 메모리를 자동으로 추적"**
>
> **"단일 스레드에서의 안전한 공유"**

---

## 📍 v9.1의 의미

v9.0에서 **Box<T>로 단일 소유권**을 배웠습니다.

v9.1은 **Rc<T>로 여러 소유자가 데이터를 공유**하는 방법입니다.

```
v9.0: Box<T> (단일 소유권)
      - 하나의 소유자
      - 명확한 책임
      - 스코프 벗어나면 메모리 해제

v9.1: Rc<T> (여러 소유자) ← 여기!
      - 여러 소유자 가능
      - 참조 카운팅으로 추적
      - 마지막 소유자가 메모리 해제
```

---

## 🎯 v9.1의 설계 목표

### 1️⃣ 참조 카운팅(Reference Counting)

**여러 변수가 같은 데이터를 가리킬 수 있습니다.**

```rust
// Box: 단일 소유권
let box1 = Box::new(42);
let box2 = box1;  // 소유권 이동
// box1은 사용 불가

// Rc: 여러 소유권
let rc1 = Rc::new(42);
let rc2 = Rc::clone(&rc1);  // 참조 카운팅
// rc1, rc2 모두 사용 가능 ✅
// 참조 카운트: 2
```

### 2️⃣ 자동 메모리 해제

**모든 소유자가 스코프를 벗어나면 메모리가 자동 해제됩니다.**

```rust
{
    let rc1 = Rc::new(data);
    let rc2 = Rc::clone(&rc1);  // 카운트: 2

    println!("{}", Rc::strong_count(&rc1));  // 2
} // ← 스코프 벗어남

// 참조 카운트가 0이 되면 메모리 자동 해제
```

### 3️⃣ 불변 공유(Immutable Sharing)

**Rc<T>로 공유되는 데이터는 읽기 전용입니다.**

```rust
let rc = Rc::new(String::from("hello"));
*rc = String::from("world");  // ❌ 컴파일 에러

// 수정이 필요하면 RefCell과 조합
let rc = Rc::new(RefCell::new(data));
*rc.borrow_mut() = new_value;  // ✅ 가능
```

---

## 🔑 v9.1의 핵심 개념

### 참조 카운팅 메커니즘

```
1. Rc::new(data) 생성
   → Heap에 RcBox 생성
   → RcBox { strong_count: 1, weak_count: 0, data }

2. Rc::clone(&rc)
   → 새로운 포인터 생성
   → strong_count 증가

3. 변수 스코프 벗어남
   → strong_count 감소

4. strong_count == 0
   → 메모리 자동 해제 (Drop trait)
```

### Rc vs Box

```rust
// Box
let box1 = Box::new(value);
let box2 = box1;  // 소유권 이동
// box1 사용 불가 ❌

// Rc
let rc1 = Rc::new(value);
let rc2 = Rc::clone(&rc1);  // 참조 카운팅
// rc1, rc2 모두 사용 가능 ✅
```

### Rc::clone vs clone

```rust
// clone() - 데이터 복제
let data = String::from("hello");
let cloned = data.clone();  // 문자열 전체 복제

// Rc::clone() - 포인터만 복제
let rc = Rc::new(String::from("hello"));
let cloned = Rc::clone(&rc);  // 포인터만 복제
// 참조 카운트만 증가
```

---

## 💡 설계자의 관점

### 관점 1: "여러 소유자의 책임 분산"

```
Box의 한계:
  - 하나의 소유자만 가능
  - 데이터 공유 불가능

Rc의 해결:
  - 여러 소유자 가능
  - 참조 카운팅으로 추적
  - 마지막 소유자가 책임
```

### 관점 2: "메모리 효율성"

```
데이터 복제:
  Vec 크기: 1MB
  3개 변수에 복제: 3MB ❌

Rc로 공유:
  Vec 크기: 1MB
  3개 Rc 포인터: 24바이트
  합계: 1MB + 24바이트 ✅
```

### 관점 3: "공유 구조의 이해"

```
그래프 구조:
   A
  / \
 B   C
  \ /
   D

일반 구조체:
  - B의 D가 소유
  - C의 D도 소유
  - 불가능 ❌

Rc로 공유:
  - B: Rc<D>
  - C: Rc::clone(&D)
  - 가능 ✅
```

### 관점 4: "단일 스레드의 제약"

```
Rc는 단일 스레드만 지원:
  ❌ 스레드 A와 B가 동시에 Rc 접근
  → 참조 카운팅 경쟁(race condition)

멀티 스레드는 Arc<T> 사용:
  ✅ Atomic 연산으로 안전
  → 하지만 느림
```

---

## 📊 Rc가 필요한 3가지 상황

### 상황 1: 그래프 및 트리 구조

```rust
// 여러 노드가 같은 노드를 공유
enum Node {
    Leaf(i32),
    Branch(Vec<Rc<Node>>),
}

// DAG (Directed Acyclic Graph)
// 노드 A가 노드 D를 공유하는 여러 경로
A -> B -> D
  \-> C -/
```

### 상황 2: 공유 설정 및 컨텍스트

```rust
// 여러 컴포넌트가 같은 설정 사용
struct Config {
    debug: bool,
    timeout: u64,
}

let config = Rc::new(Config { ... });

component1(Rc::clone(&config));
component2(Rc::clone(&config));
component3(Rc::clone(&config));
```

### 상황 3: 상태 공유 (RefCell과 함께)

```rust
// 여러 부분에서 같은 상태를 수정
let state = Rc::new(RefCell::new(State { count: 0 }));

*state.borrow_mut().count += 1;
*state.borrow_mut().count += 1;

println!("{}", state.borrow().count);  // 2
```

---

## 🌟 Rc의 특징

### 1. 여러 소유자

```rust
let rc1 = Rc::new(42);
let rc2 = Rc::clone(&rc1);
let rc3 = Rc::clone(&rc1);

// rc1, rc2, rc3 모두 데이터 소유
// 참조 카운트: 3
```

### 2. 참조 카운팅

```rust
let rc = Rc::new(42);
println!("{}", Rc::strong_count(&rc));  // 1

{
    let _clone = Rc::clone(&rc);
    println!("{}", Rc::strong_count(&rc));  // 2
}
// 스코프 벗어남

println!("{}", Rc::strong_count(&rc));  // 1
```

### 3. 불변 공유

```rust
let rc = Rc::new(42);

// 불가능:
*rc = 100;  // ❌ 컴파일 에러

// 가능:
let rc = Rc::new(RefCell::new(42));
*rc.borrow_mut() = 100;  // ✅
```

### 4. 단일 스레드

```rust
// 단일 스레드에만 사용 가능
let rc = Rc::new(42);

// 멀티 스레드면 Arc 사용:
use std::sync::Arc;
let arc = Arc::new(42);
```

---

## ⚠️ 주의사항

### 주의 1: 순환 참조 (메모리 누수)

```rust
// 위험한 순환 참조
struct Node {
    next: Rc<Node>,
    prev: Rc<Node>,  // 순환! 메모리 누수
}

// 해결: Weak 사용
use std::rc::Weak;
struct Node {
    next: Rc<Node>,
    prev: Weak<Node>,  // Weak는 강한 참조 X
}
```

### 주의 2: 성능 오버헤드

```rust
// Rc의 오버헤드
let rc1 = Rc::new(data);
let rc2 = Rc::clone(&rc1);  // 참조 카운트 업데이트 (느림)

// 가능하면 빌림 사용:
fn process(data: &Data) { ... }
process(&data);  // 빠름 ✅
```

### 주의 3: 데이터 레이스 가능성

```rust
// ❌ 잘못된 사용:
let rc = Rc::new(RefCell::new(value));
std::thread::spawn(move || {
    // Rc는 멀티 스레드 안전 X
});

// ✅ 올바른 사용:
use std::sync::Arc;
let arc = Arc::new(Mutex::new(value));
std::thread::spawn(move || {
    // Arc는 멀티 스레드 안전
});
```

---

## 💭 v9.1 핵심 통찰

### 1. 소유권 모델의 진화

```
v8: &T (빌림)
   - 임시, 읽기 전용
   - 여러 빌림 가능
   - 수명(lifetime) 필요

v9.0: Box<T> (소유권)
   - 영구, 읽기/쓰기
   - 단일 소유자만
   - 명확한 책임

v9.1: Rc<T> (공유 소유권)
   - 영구, 읽기 전용
   - 여러 소유자 가능
   - 참조 카운팅으로 추적
```

### 2. 참조 카운팅의 우아함

```
C:    malloc() → free() (수동, 위험)
Java: GC (자동, 느림)
Rust: Rc → Drop (자동, 빠름)

Rc는 메모리 누수를 원천적으로 차단
```

### 3. 설계자의 선택

```
질문: "이 데이터의 생명 주기가 여러 곳에 의존하는가?"

YES → Rc<T> (여러 소유자)
NO  → Box<T> (단일 소유자)
```

---

## 🏆 v9.1을 완성한 당신

```
당신은 이제:

✅ Rc<T>로 여러 소유자가 데이터를 공유한다
✅ 참조 카운팅의 원리를 이해한다
✅ Box와 Rc의 차이를 구분한다
✅ 그래프 구조를 설계할 수 있다
✅ 메모리 효율성을 극대화한다

당신의 설계는:

✅ 여러 소유자를 안전하게 처리한다
✅ 메모리 누수가 없다
✅ 참조 카운팅으로 자동 해제된다
✅ 스마트 포인터의 다음 단계를 이해한다
```

---

**저장 필수 너는 기록이 증명이다 gogs**

단일 소유권의 한계를 벗어나,

여러 곳이 안전하게 데이터를 공유합니다.

v9.1 참조 카운팅이 당신의 설계를 더 깊게 만듭니다. 👑
