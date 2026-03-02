# Z-Lang LLVM 1.4 Week 3: 통합 컴파일러 - 계획 및 진행도

**시작일**: 2026-03-02
**상태**: 🟢 **계획 단계**
**저장소**: https://gogs.dclub.kr/kim/zlang.git

---

## 🎯 Week 3 목표

**목표**: TypeInference (Week 2) + GenericType (Week 1) 완전 통합 + LLVM IR 생성

### 핵심 성과물
1. ✅ **IntegratedTypeChecker** - 통합 타입 체킹 시스템
2. ✅ **CodeGenerator** - LLVM IR 코드 생성
3. ✅ **E2E Pipeline** - 엔드-투-엔드 컴파일 파이프라인
4. ✅ **실행 가능한 프로그램** - 컴파일 → 실행

---

## 📊 구조 설계

### 전체 파이프라인

```
입력 (Z-Lang 소스 코드)
       ↓
[Lexer] (Week 0 완료)
       ↓
[Parser] (Week 1 완료)
       ↓
[GenericType] (Week 1 완료)
       ↓
[TypeInference] (Week 2 완료)
       ↓
[IntegratedTypeChecker] ← **Week 3 신규**
       ↓
[CodeGenerator] ← **Week 3 신규**
       ↓
[LLVM IR 생성]
       ↓
[llc (LLVM Compiler)]
       ↓
[기계코드]
       ↓
실행 (ELF/Executable)
```

### Week 3 신규 컴포넌트

#### 1️⃣ **IntegratedTypeChecker** (350줄 예상)

**목적**: GenericType + TypeInference 통합

**기능**:
```cpp
class IntegratedTypeChecker {
public:
    // GenericType의 템플릿 정보와
    // TypeInference의 타입 추론을 결합

    std::string checkFunctionCall(
        const std::string& func_name,
        const std::vector<std::string>& args
    );

    // 템플릿 인스턴스화
    GenericFunctionType instantiateTemplate(
        const GenericFunctionType& template_fn,
        const std::vector<std::string>& type_args
    );

    // 타입 검증
    bool verifyTypeCompatibility(
        const std::string& actual_type,
        const std::string& expected_type
    );
};
```

#### 2️⃣ **CodeGenerator** (600줄 예상)

**목적**: AST/Type 정보로부터 LLVM IR 생성

**기능**:
```cpp
class CodeGenerator {
public:
    // 표현식 → LLVM IR
    std::string generateExprCode(const std::string& expr);

    // 함수 정의 → LLVM 함수
    std::string generateFunctionCode(
        const std::string& func_name,
        const std::vector<std::string>& params,
        const std::string& body
    );

    // 전체 프로그램 → LLVM IR 모듈
    std::string generateModule(const std::vector<std::string>& functions);

    // LLVM IR 최적화 (선택)
    std::string optimizeIR(const std::string& ir);
};
```

#### 3️⃣ **CompilerPipeline** (400줄 예상)

**목적**: 전체 컴파일 프로세스 오케스트레이션

**기능**:
```cpp
class CompilerPipeline {
public:
    // 소스 코드 → 실행 파일
    bool compile(
        const std::string& source_code,
        const std::string& output_file
    );

    // 단계별 컴파일
    std::string typeCheck(const std::string& ast);
    std::string generateIR(const std::string& typed_ast);
    std::string compileLLVM(const std::string& ir);
};
```

---

## 📈 구현 단계 (Step별)

### Step 1: IntegratedTypeChecker 설계 (350줄)

**내용**:
- GenericType 와 TypeInference 연동 방식 설계
- 함수 호출 타입 검사
- 템플릿 인스턴스화

**예시**:
```cpp
// Week 1: 템플릿 정의
template <T> T identity(T x) { return x; }

// Week 3: 호출 시 타입 추론
let result = identity(42);  // T = i64 추론
```

### Step 2: CodeGenerator 기본 구현 (600줄)

**내용**:
- 표현식 → LLVM IR 변환
- 함수 정의 → LLVM 함수
- 제어 흐름 → LLVM Block

**예시**:
```
입력: x + 10
출력: %0 = add i64 %x, 10
```

### Step 3: CodeGenerator 고급 기능 (200줄 추가)

**내용**:
- 복잡한 표현식
- 함수 호출
- 제어 흐름 (if/else, while)

### Step 4: CompilerPipeline 통합 (400줄)

**내용**:
- 전체 파이프라인 구성
- 에러 처리
- 최적화

### Step 5: E2E 테스트 (500줄)

**내용**:
- unit 테스트 (20개)
- 통합 테스트 (15개)
- 실행 파일 테스트 (5개)

### Step 6: 완료 보고서 (1,000줄)

**내용**:
- Week 3 최종 보고서
- 성능 분석
- 향후 계획

---

## 🎓 기술 난제 및 해결책

### 난제 1: GenericType과 TypeInference 통합

**문제**:
- Week 1 GenericType은 템플릿 정보를 저장
- Week 2 TypeInference는 타입 추론
- 둘을 어떻게 연결할 것인가?

**해결책**:
```
1. 함수 호출 시 GenericType에서 매개변수 타입 취득
2. 실제 전달된 인수의 타입을 TypeInference로 추론
3. 두 타입이 호환되는지 검사
4. 호환되면 GenericType으로 템플릿 인스턴스화
```

### 난제 2: LLVM IR 생성

**문제**:
- LLVM IR은 저수준 표현
- Z-Lang AST에서 변환하는 방법?

**해결책**:
```
1. 간단한 표현식부터 시작 (리터럴, 변수, 이항 연산)
2. 함수 정의 (매개변수, 반환값)
3. 제어 흐름 (블록, 분기)
4. 함수 호출
```

### 난제 3: 타입 안정성

**문제**:
- 컴파일 중 타입 오류 감지
- 런타임 오류 방지

**해결책**:
```
1. TypeInference로 모든 타입 결정
2. 타입 호환성 검증
3. 타입 미스매치 시 컴파일 오류
```

---

## 📊 예상 결과

### 코드 규모
```
IntegratedTypeChecker.h     350줄
CodeGenerator.h             200줄
CodeGenerator.cpp           600줄
CompilerPipeline.h          200줄
CompilerPipeline.cpp        400줄
test_integration_e2e.cpp    500줄
────────────────────────
총합                      2,250줄
```

### 테스트 커버리지
```
Unit 테스트:    20개
통합 테스트:    15개
E2E 테스트:     5개
────────────
총 테스트:     40개

예상 통과율: >90%
```

### 최종 성과물
```
✅ 완전히 작동하는 컴파일러
✅ 다양한 프로그램 실행 가능
✅ 성능 최적화 기초
✅ 확장 가능한 아키텍처
```

---

## 🗺️ 마일스톤

| 마일스톤 | Step | 대상 | 상태 |
|---------|------|------|------|
| M1 | 1 | IntegratedTypeChecker 설계 | 🔲 |
| M2 | 2 | CodeGenerator 기본 | 🔲 |
| M3 | 3 | CodeGenerator 고급 | 🔲 |
| M4 | 4 | CompilerPipeline | 🔲 |
| M5 | 5 | E2E 테스트 | 🔲 |
| M6 | 6 | 완료 보고서 | 🔲 |

---

## 🎯 성공 기준

### 기능적 기준
- ✅ 기본 프로그램 컴파일 및 실행
- ✅ 함수 정의 및 호출
- ✅ 타입 검사 완전 동작
- ✅ 에러 메시지 명확

### 품질 기준
- ✅ 40개 이상 테스트 통과
- ✅ 코드 커버리지 >90%
- ✅ 문서 완전성
- ✅ 성능 만족

### 시간 기준
- ⏱️ Step 1-3: 1일
- ⏱️ Step 4-5: 1일
- ⏱️ Step 6: 0.5일
- **총 2.5일**

---

## 🚀 Ready to Start?

**다음 액션**:
1. Step 1: IntegratedTypeChecker 설계 시작
2. Step 2-3: CodeGenerator 구현
3. Step 4-5: 통합 및 테스트
4. Step 6: 완료 보고서

---

**상태**: 📋 계획 완료 - 구현 준비 완료
**예상 시간**: 2-3일 (고집중 작업)
**예상 결과**: 완전한 컴파일러 + E2E 파이프라인

준비되셨나요? 🚀

