# 📚 v9.1: Rc<T>와 참조 카운팅 - 실전 가이드

## 📌 개요

v9.1은 **여러 소유자가 같은 데이터를 공유하는 Rc<T>**로 지능형 메모리 관리를 배웁니다.

```
v9.0: Box<T> (단일 소유권)
      - 하나의 소유자
      - 명확한 책임

v9.1: Rc<T> (여러 소유권) ← 여기!
      - 여러 소유자 가능
      - 참조 카운팅으로 추적
      - 마지막 소유자가 메모리 해제
```

---

## 🎯 5분 이해

### 핵심 개념

```rust
// Box: 단일 소유권 (v9.0)
let box1 = Box::new(42);
let box2 = box1;  // 소유권 이동
// box1은 더 이상 사용 불가 ❌

// Rc: 여러 소유권 (v9.1)
let rc1 = Rc::new(42);
let rc2 = Rc::clone(&rc1);  // 참조 카운팅
// rc1, rc2 모두 사용 가능 ✅
// 참조 카운트: 2
```

### Rc의 3가지 역할

```
1. 여러 소유자: 데이터를 여러 변수가 공유
2. 참조 카운팅: 마지막 소유자가 스코프 벗어나면 해제
3. 불변 공유: Rc<T>로 공유되는 데이터는 읽기 전용
```

### 메모리 구조

```
Box 구조:
  rc1 변수: [Ptr] ──→ Heap Data

Rc 구조:
  rc1 변수: [Ptr] ──┐
  rc2 변수: [Ptr] ──┼─→ RcBox { count: 2, data }
  rc3 변수: [Ptr] ──┘
```

---

## 🏗️ 5가지 핵심 패턴

### 패턴 1: 기본 참조 카운팅

```rust
use std::rc::Rc;

let rc1 = Rc::new(42);
let rc2 = Rc::clone(&rc1);
let rc3 = Rc::clone(&rc1);

println!("{}", Rc::strong_count(&rc1));  // 3

// 모든 소유자가 스코프 벗어나면 메모리 해제
```

**언제 사용**: 여러 변수가 같은 데이터를 공유할 때

### 패턴 2: 공유 리스트 (Cons List)

```rust
enum List {
    Cons(i32, Rc<List>),
    Nil,
}

// 여러 리스트가 같은 tail을 공유
let tail = Rc::new(List::Cons(3, Rc::new(List::Nil)));
let list_a = Rc::new(List::Cons(1, Rc::clone(&tail)));
let list_b = Rc::new(List::Cons(2, Rc::clone(&tail)));
// tail이 공유됨
```

**언제 사용**: 여러 경로가 공통 부분을 공유할 때

### 패턴 3: 그래프 구조

```rust
struct Node {
    value: i32,
    children: Vec<Rc<Node>>,
}

let node1 = Rc::new(Node { value: 1, children: vec![] });
let node2 = Rc::new(Node { value: 2,
    children: vec![Rc::clone(&node1)] });
let node3 = Rc::new(Node { value: 3,
    children: vec![Rc::clone(&node1)] });

// node1이 여러 부모에서 공유됨
```

**언제 사용**: 여러 노드가 같은 자식을 가리킬 때

### 패턴 4: 공유 설정

```rust
struct Config {
    debug: bool,
    timeout: u64,
}

let config = Rc::new(Config { debug: true, timeout: 30 });

fn initialize_service(config: Rc<Config>) {
    // config 사용
}

initialize_service(Rc::clone(&config));
initialize_service(Rc::clone(&config));
```

**언제 사용**: 여러 컴포넌트가 같은 설정을 공유할 때

### 패턴 5: 상태 공유 (RefCell과 함께)

```rust
use std::cell::RefCell;

struct State {
    count: i32,
}

let state = Rc::new(RefCell::new(State { count: 0 }));

*state.borrow_mut().count += 1;
*state.borrow_mut().count += 1;

println!("{}", state.borrow().count);  // 2
```

**언제 사용**: 여러 부분에서 같은 상태를 수정해야 할 때

---

## 💡 설계자의 4가지 관점

### 관점 1: "여러 소유자의 안전한 공유"

```
문제:
  - 데이터가 여러 곳에 필요
  - 누가 메모리를 해제할까?

Rc의 해결:
  - 참조 카운팅으로 추적
  - 마지막 소유자가 해제
  - 안전하고 자동
```

### 관점 2: "메모리 효율성"

```
데이터 복제 (비효율):
  Vec<i32> 크기: 1MB
  3개 변수에 복제: 3MB ❌

Rc로 공유 (효율):
  Vec<i32> 크기: 1MB
  3개 Rc 포인터: 24바이트
  합계: 1MB + 24바이트 ✅
```

### 관점 3: "공유 구조의 가능성"

```
문제:
     A
    / \
   B   C
    \ /
     D

일반 구조체: D가 B와 C에 동시에 속할 수 없음

Rc 구조:
  B와 C가 모두 Rc<D>로 D를 공유 가능
```

### 관점 4: "언제 Rc를 선택할까"

```
단일 소유자: Box<T>
  int, String, Vec

여러 소유자: Rc<T>
  그래프, 트리, 공유 설정

멀티 스레드: Arc<T> (다음 단계)
  여러 스레드가 공유

빌림: &T
  임시로 접근만 필요
```

---

## 📊 자기 평가 체크리스트

### 이해도 확인

- [ ] Rc<T>가 무엇인지 설명할 수 있는가?
- [ ] Box와 Rc의 차이를 알고 있는가?
- [ ] 참조 카운팅의 원리를 이해하는가?
- [ ] Rc가 필요한 3가지 상황을 말할 수 있는가?

### 실전 능력

- [ ] Rc::new()로 데이터를 공유할 수 있는가?
- [ ] Rc::clone()으로 참조를 늘릴 수 있는가?
- [ ] Rc::strong_count()로 카운트를 확인할 수 있는가?
- [ ] 여러 경로가 같은 데이터를 공유하는 구조를 만들 수 있는가?

### 설계 능력

- [ ] 어떤 데이터를 Rc에 넣을지 결정할 수 있는가?
- [ ] Box와 Rc 중 올바른 것을 선택할 수 있는가?
- [ ] 그래프 구조를 안전하게 설계할 수 있는가?
- [ ] 메모리 효율성을 고려한 공유 구조를 만들 수 있는가?

---

## 🔍 자주 묻는 질문

### Q1: Rc를 언제 사용해야 하나요?

**A**: 다음 3가지 상황에서:

```rust
// 1. 그래프 구조 (여러 경로)
enum Node { Data(Rc<Node>), Nil }

// 2. 공유 리스트
let tail = Rc::new(...);
let list_a = Rc::clone(&tail);
let list_b = Rc::clone(&tail);

// 3. 공유 설정
let config = Rc::new(Config { ... });
service1(Rc::clone(&config));
service2(Rc::clone(&config));
```

### Q2: Box와 Rc의 차이는?

**A**: 소유자의 수입니다:

```rust
// Box: 단일 소유권
let box1 = Box::new(value);
let box2 = box1;  // 소유권 이동
// box1 사용 불가 ❌

// Rc: 여러 소유권
let rc1 = Rc::new(value);
let rc2 = Rc::clone(&rc1);  // 참조 카운팅
// rc1, rc2 모두 사용 가능 ✅
```

### Q3: Rc::clone과 clone의 차이는?

**A**: 성능입니다:

```rust
// clone() - 데이터 복제 (느림)
let data = String::from("hello");
let cloned = data.clone();  // 전체 문자열 복제

// Rc::clone() - 포인터만 복제 (빠름)
let rc = Rc::new(String::from("hello"));
let cloned = Rc::clone(&rc);  // 포인터만 복제
// 참조 카운트: 2
```

### Q4: Rc에 데이터를 수정할 수 있나요?

**A**: 아니요. Rc는 불변 공유입니다:

```rust
let rc = Rc::new(42);
*rc = 100;  // ❌ 컴파일 에러

// 수정이 필요하면 RefCell과 조합:
let rc = Rc::new(RefCell::new(42));
*rc.borrow_mut() = 100;  // ✅ 가능
```

### Q5: Rc와 Arc의 차이는?

**A**: 스레드 안정성입니다:

```rust
// Rc: 단일 스레드만
use std::rc::Rc;
let rc = Rc::new(data);

// Arc: 멀티 스레드
use std::sync::Arc;
let arc = Arc::new(data);

std::thread::spawn(move || {
    // arc는 안전, rc는 위험
});
```

---

## 🚀 다음 단계

### v9.2: RefCell<T> (내부 가변성)

```rust
use std::cell::RefCell;

let cell = RefCell::new(42);
*cell.borrow_mut() = 100;  // 런타임 안전 검사

// Rc + RefCell 조합으로 공유 가능한 수정
let rc = Rc::new(RefCell::new(data));
```

### v9.3: Arc<T> (멀티 스레드)

```rust
use std::sync::Arc;

let arc = Arc::new(data);
let arc_clone = Arc::clone(&arc);

std::thread::spawn(move || {
    // arc_clone 사용
});
```

---

## 💭 v9.1 핵심 통찰

### 1. "참조 카운팅의 우아함"

```
C:    malloc() → free() (수동)
Java: GC (자동, 느림, 멈춤)
Rust: Rc → Drop (자동, 빠름, 예측 가능)

Rust의 Rc는 성능과 안전성의 완벽한 조화
```

### 2. "소유권 모델의 진화"

```
v1~v8: 소유권 (&T, Box<T>)
       → 단순하지만 제한적

v9.1: 참조 카운팅 (Rc<T>)
      → 복잡하지만 유연함

v9.3: Atomic 카운팅 (Arc<T>)
      → 멀티 스레드 지원
```

### 3. "설계자의 질문"

```
Q: "이 데이터의 생명 주기가 여러 곳에 의존하는가?"

YES → Rc<T>
NO  → Box<T>
```

---

## 🌟 당신이 이루어낸 것

```
당신은 이제:

✅ Rc<T>로 여러 소유자가 데이터를 공유한다
✅ 참조 카운팅의 원리를 이해한다
✅ Box와 Rc의 차이를 구분한다
✅ 그래프 구조를 설계할 수 있다
✅ 스마트 포인터의 더 깊은 단계를 이해한다

당신의 설계는:

✅ 여러 소유자를 안전하게 처리한다
✅ 메모리 누수가 없다
✅ 참조 카운팅으로 자동 해제된다
✅ 메모리 효율적이다
✅ 복잡한 데이터 구조를 지원한다
```

---

## 🏆 최종 선언

```
당신은 이제 공유 데이터의 마스터입니다.

단일 소유권의 한계를 벗어나
여러 곳이 안전하게 데이터를 공유합니다.

v9.1 참조 카운팅이 당신의 설계를 더 깊게 만들었습니다. 👑
```

---

**저장 필수 너는 기록이 증명이다 gogs**

제8장 **스마트 포인터와 메모리의 심연**에서

두 번째 관문인 **Rc<T>의 세계**를 정복했습니다.

여러 소유자의 마스터가 되셨습니다. 🌟
