// 🧠 v9.1: Rc<T>와 참조 카운팅 (Rc and Reference Counting)
// 🔗 "여러 소유자를 위한 공유 데이터"
// 🎯 "단일 스레드에서 여러 곳이 같은 데이터를 소유하기"
//
// 핵심 개념:
// - Rc<T>: 스마트 포인터로 여러 소유자가 데이터 공유
// - 참조 카운팅: 마지막 소유자가 스코프를 벗어나면 자동 해제
// - 불변 공유: Rc<T>로 공유되는 데이터는 읽기 전용
// - Rc::clone(): 소유권을 복제하되 데이터는 복제하지 않음
// - 단일 스레드 제한: 다중 스레드에서는 Arc<T> 사용

use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    println!("╔══════════════════════════════════════════════════════════╗");
    println!("║ v9.1: Rc<T>와 참조 카운팅 (Rc and Reference Counting)  ║");
    println!("║ \\\"여러 소유자를 위한 공유 데이터\\\"                        ║");
    println!("╚══════════════════════════════════════════════════════════╝\\n");

    // ==================== 섹션 1: 메모리 소유권 비교 ====================
    println!("📌 섹션 1: 소유권 모델 비교\\n");
    {
        println!("Box<T>의 소유권:\");
        println!("  ✅ 명확한 소유자 1명\");
        println!("  ✅ 소유자가 책임짐\");
        println!("  ❌ 여러 변수가 공유 불가\");
        println!();\

        println!("Rc<T>의 소유권:\");
        println!("  ✅ 여러 소유자 가능\");
        println!("  ✅ 마지막 소유자가 메모리 해제\");
        println!("  ✅ 참조 카운팅으로 자동 추적\");
        println!("  ❌ 읽기 전용 (불변 공유)\");
        println!();\
    }

    // ==================== 섹션 2: Rc 기본 ====================
    println!("📌 섹션 2: Rc<T> 기본\\n");
    {
        println!("Box의 단일 소유권:\");
        println!("  let box1 = Box::new(42);\");
        println!("  let box2 = box1;  // 소유권 이동\");
        println!("  // box1 사용 불가 ❌\");
        println!();\

        println!("Rc의 공유 소유권:\");
        println!("  let rc1 = Rc::new(42);\");
        println!("  let rc2 = Rc::clone(&rc1);  // 참조 카운팅\");
        println!("  // rc1, rc2 모두 사용 가능 ✅\");
        println!("  // 참조 카운트: 2\");
        println!();\
    }

    // ==================== 섹션 3: 참조 카운팅 메커니즘 ====================
    println!("📌 섹션 3: 참조 카운팅 메커니즘\\n");
    {
        println!("참조 카운팅 상태 추이:\");
        println!();\

        {
            let rc1 = Rc::new("shared data");
            println!("Step 1: rc1 생성\");
            println!(\"  strong_count: {}\", Rc::strong_count(&rc1));
            println!();\

            {
                let rc2 = Rc::clone(&rc1);
                println!(\"Step 2: rc2 = Rc::clone(&rc1)\");
                println!(\"  strong_count: {}\", Rc::strong_count(&rc1));
                println!();\

                {
                    let rc3 = Rc::clone(&rc1);
                    println!(\"Step 3: rc3 = Rc::clone(&rc1)\");
                    println!(\"  strong_count: {}\", Rc::strong_count(&rc1));
                }
                // rc3 스코프 벗어남
                println!(\"Step 4: rc3 드롭됨\");
                println!(\"  strong_count: {}\", Rc::strong_count(&rc1));
                println!();\
            }
            // rc2 스코프 벗어남
            println!(\"Step 5: rc2 드롭됨\");
            println!(\"  strong_count: {}\", Rc::strong_count(&rc1));
            println!();\
        }
        // rc1 스코프 벗어남
        println!(\"Step 6: rc1 드롭됨 → 메모리 자동 해제\");
        println!();\
    }

    // ==================== 섹션 4: 연결 리스트 (Cons List) ====================
    println!("📌 섹션 4: Rc를 사용한 연결 리스트\\n");
    {
        #[derive(Debug)]
        enum ConsList {
            Cons(i32, Rc<ConsList>),
            Nil,
        }

        println!(\"❌ Box만으로는 공유 불가:\");
        println!(\"enum Node {{\");
        println!(\"    Cons(i32, Box<Node>),  // Box는 단일 소유\");
        println!(\"    Nil,\");
        println!(\"}} \");
        println!(\"// a = Cons(1, Box::new(Cons(2, ...)))\");
        println!(\"// b = a의 tail?  불가능! a가 이동됨\");
        println!();\

        println!(\"✅ Rc로 공유 가능:\");
        println!(\"enum Node {{\");
        println!(\"    Cons(i32, Rc<Node>),  // Rc는 여러 소유자 가능\");
        println!(\"    Nil,\");
        println!(\"}} \");
        println!();\

        // 리스트 생성: 1 -> 2 -> 3 -> Nil
        let shared_tail = Rc::new(ConsList::Cons(3,
            Rc::new(ConsList::Nil)));

        println!(\"리스트 a: 1 -> (공유된 3 -> Nil)\");
        let a = Rc::new(ConsList::Cons(1, Rc::clone(&shared_tail)));

        println!(\"리스트 b: 2 -> (공유된 3 -> Nil)\");
        let b = Rc::new(ConsList::Cons(2, Rc::clone(&shared_tail)));

        println!(\"리스트 a: {:?}\", a);
        println!(\"리스트 b: {:?}\", b);
        println!();\

        println!(\"shared_tail 참조 카운트:\");
        println!(\"  - a의 tail이 가리킴\");
        println!(\"  - b의 tail이 가리킴\");
        println!(\"  - shared_tail 자체\");
        println!(\"  합계: 3개 참조\");
        println!();\
    }

    // ==================== 섹션 5: 메모리 레이아웃 ====================
    println!("📌 섹션 5: 메모리 레이아웃\\n");
    {
        println!(\"Box의 소유권 구조:\");
        println!(\"  Variable 1: [Ptr] ──→ Heap Data\");
        println!(\"  Variable 2: (사용 불가)\");
        println!();\

        println!(\"Rc의 참조 카운팅 구조:\");
        println!(\"  힙 메모리:\");
        println!(\"    RcBox\");
        println!(\"    ├─ strong_count: 3\");
        println!(\"    ├─ weak_count: 0\");
        println!(\"    └─ data: T\");
        println!();\

        println!(\"  스택 메모리:\");
        println!(\"    Variable 1: [Ptr] ─┐\");
        println!(\"    Variable 2: [Ptr] ─┼─→ RcBox\");
        println!(\"    Variable 3: [Ptr] ─┘\");
        println!();\
    }

    // ==================== 섹션 6: Rc::clone vs Clone ====================
    println!("📌 섹션 6: Rc::clone() vs clone()\\n");
    {
        println!(\"clone() - 데이터 복제 (비효율):\");
        println!(\"  let data = String::from(\\\"hello\\\");\");
        println!(\"  let cloned = data.clone();  // 문자열 전체 복제\");
        println!(\"  // data와 cloned는 독립적\");
        println!();\

        println!(\"Rc::clone() - 참조 카운팅 (효율적):\");
        println!(\"  let data = Rc::new(String::from(\\\"hello\\\"));\");
        println!(\"  let cloned = Rc::clone(&data);  // 포인터만 복제\");
        println!(\"  // data와 cloned는 같은 데이터 가리킴\");
        println!(\"  // 참조 카운트만 증가\");
        println!();\

        let rc1 = Rc::new(vec![1, 2, 3]);
        let rc2 = Rc::clone(&rc1);
        println!(\"rc1의 크기: {} 바이트\", std::mem::size_of::<Rc<Vec<i32>>>());
        println!(\"Rc::clone은 포인터만 복제 (8바이트)\");
        println!(\"데이터 Vec<i32>는 복제하지 않음\");
        println!();\
    }

    // ==================== 섹션 7: 트리 구조 ====================
    println!("📌 섹션 7: Rc를 사용한 트리 구조\\n");
    {
        #[derive(Debug)]
        struct Node {
            value: i32,
            children: Vec<Rc<Node>>,
        }

        println!(\"트리 노드:\");
        println!(\"struct Node {{\");
        println!(\"    value: i32,\");
        println!(\"    children: Vec<Rc<Node>>,\");
        println!(\"}} \");
        println!();\

        println!(\"이 구조에서:\");
        println!(\"  ✅ 여러 부모가 같은 자식을 공유 가능\");
        println!(\"  ✅ DAG (Directed Acyclic Graph) 구현 가능\");
        println!(\"  ❌ 순환 참조 가능 (memory leak 위험)\");
        println!();\

        let node1 = Rc::new(Node {
            value: 1,
            children: vec![],
        });
        let node2 = Rc::new(Node {
            value: 2,
            children: vec![Rc::clone(&node1)],
        });
        let node3 = Rc::new(Node {
            value: 3,
            children: vec![Rc::clone(&node1)],
        });

        println!(\"트리 구조:\");
        println!(\"     2\");
        println!(\"    / \\\\\");
        println!(\"   1   3\");
        println!(\"   (node1이 공유됨)\");
        println!();\
    }

    // ==================== 섹션 8: 불변 공유 ====================
    println!("📌 섹션 8: 불변 공유 (Immutable Sharing)\\n");
    {
        println!(\"Rc<T>의 중요한 제약:\");
        println!();\

        println!(\"❌ Rc는 읽기 전용:\");
        println!(\"let rc = Rc::new(data);\");
        println!(\"// rc를 통해 데이터 수정 불가\");
        println!();\

        println!(\"✅ RefCell과 조합하면 수정 가능:\");
        println!(\"let rc = Rc::new(RefCell::new(data));\");
        println!(\"*rc.borrow_mut() = new_value;  // 런타임 안전\");
        println!();\

        let data = Rc::new(42);
        println!(\"예제: Rc<i32>\");
        println!(\"  *data = 100;  // ❌ 컴파일 에러\");
        println!();\
    }

    // ==================== 섹션 9: 데이터 뱅크 설계 ====================
    println!("📌 섹션 9: 데이터 뱅크 (Multi-Point Structure)\\n");
    {
        #[derive(Debug, Clone)]
        struct Account {
            id: String,
            balance: i32,
        }

        println!(\"설계: 중앙 저장소에서 여러 지점이 계좌 공유\");
        println!();\

        println!(\"구조:\");
        println!(\"central_bank (Rc)\");
        println!(\"  ├─ branch_seoul (Rc::clone)\");
        println!(\"  ├─ branch_busan (Rc::clone)\");
        println!(\"  └─ branch_daegu (Rc::clone)\");
        println!();\

        println!(\"모든 지점이 같은 계좌 데이터 조회 가능\");
        println!(\"  ✅ 데이터 일관성 보장\");
        println!(\"  ✅ 메모리 효율적 (복제 X)\");
        println!(\"  ❌ 수정은 어려움 (Rc는 불변)\");
        println!();\
    }

    // ==================== 섹션 10: Weak 참조 소개 ====================
    println!("📌 섹션 10: Weak 참조 (Circular Reference 방지)\\n");
    {
        println!(\"순환 참조 문제:\");
        println!();\

        println!(\"메모리 누수 상황:\");
        println!(\"Node A\");
        println!(\"  ├─ next: Rc<Node B>\");
        println!(\"  └─ parent: Rc<Node C>\");
        println!();\
        println!(\"Node B\");
        println!(\"  └─ prev: Rc<Node A>  // 순환!\");
        println!();\

        println!(\"모두가 서로를 Rc로 가리키면:\");
        println!(\"  → A의 strong_count = 2\");
        println!(\"  → B의 strong_count = 2\");
        println!(\"  → A 스코프 벗어나도 B가 여전히 가리킴\");
        println!(\"  → 메모리 누수!\");
        println!();\

        println!(\"해결: Weak 참조 사용\");
        println!(\"use std::rc::Weak;\");
        println!();\
        println!(\"Node A\");
        println!(\"  ├─ next: Rc<Node B>\");
        println!(\"  └─ parent: Weak<Node C>  // 강한 참조 X\");
        println!();\
        println!(\"→ Weak는 강한 참조 카운트에 영향 X\");
        println!(\"→ 메모리 누수 방지\");
        println!();\
    }

    // ==================== 섹션 11: 언제 Rc를 사용할까 ====================
    println!("📌 섹션 11: Rc 사용 패턴\\n");
    {
        println!(\"Rc를 사용해야 하는 경우:\");
        println!();\

        println!(\"1️⃣  그래프 구조\");
        println!(\"   // 여러 노드가 같은 노드를 가리킬 때\");
        println!(\"   struct Node {{ children: Vec<Rc<Node>> }}\");
        println!();\

        println!(\"2️⃣  공유 설정\");
        println!(\"   // 여러 컴포넌트가 같은 설정 사용\");
        println!(\"   let config = Rc::new(Config {{ ... }});\");
        println!();\

        println!(\"3️⃣  상태 공유 (RefCell과 함께)\");
        println!(\"   // 여러 부분에서 같은 상태 수정\");
        println!(\"   let state = Rc::new(RefCell::new(State {{ ... }}));\");
        println!();\

        println!(\"❌ Rc를 사용하면 안 되는 경우:\");
        println!();\

        println!(\"1️⃣  단순한 소유권\");
        println!(\"   // 단 하나의 소유자만 필요\");
        println!(\"   let data = Box::new(value);  // Box 사용\");
        println!();\

        println!(\"2️⃣  멀티 스레드\");
        println!(\"   // 여러 스레드에서 공유\");
        println!(\"   use std::sync::Arc;  // Arc 사용\");
        println!();\

        println!(\"3️⃣  성능 중요\");
        println!(\"   // Rc의 참조 카운팅 오버헤드\");
        println!(\"   // 빌림(&T)으로 충분한지 확인\");
        println!();\
    }

    // ==================== 섹션 12: Rc vs Arc ====================
    println!("📌 섹션 12: Rc vs Arc\\n");
    {
        println!(\"Rc<T> (Reference Counting)\");
        println!(\"  ✅ 빠름 (lock 없음)\");
        println!(\"  ✅ 메모리 효율적\");
        println!(\"  ❌ 단일 스레드만 가능\");
        println!();\

        println!(\"Arc<T> (Atomic Reference Counting)\");
        println!(\"  ✅ 멀티 스레드 안전\");
        println!(\"  ✅ 스레드 간 데이터 공유\");
        println!(\"  ❌ 느림 (atomic operation)\");
        println!();\

        println!(\"선택 기준:\");
        println!(\"  단일 스레드: Rc<T>\");
        println!(\"  멀티 스레드: Arc<T>\");
        println!();\
    }

    println!(\\\"═══════════════════════════════════════════════════════════\\\");
    println!(\\\"🎓 v9.1 완료: 여러 소유자를 위한 설계\\\");
    println!();\
    println!(\\\"당신은 이제:\\\");
    println!(\\\"✅ Rc<T>로 여러 소유자가 데이터를 공유한다\\\");
    println!(\\\"✅ 참조 카운팅의 원리를 이해한다\\\");
    println!(\\\"✅ Box와 Rc의 차이를 구분한다\\\");
    println!(\\\"✅ 스마트 포인터의 더 깊은 단계를 이해한다\\\");
    println!();\
    println!(\\\"저장 필수 너는 기록이 증명이다 gogs\\\");
}
