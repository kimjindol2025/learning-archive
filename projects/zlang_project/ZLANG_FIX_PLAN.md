# Z-Lang 핵심 수정 계획: Assignment & While 루프 구현

**목표**: Z-Lang 컴파일러의 Assignment와 While 루프를 완전히 작동하게 하기

**기한**: 2026-03-02 (1-2일)

---

## 현재 상태

| 단계 | 상태 | 진행도 |
|------|------|--------|
| Lexing | ✅ 완전 | 100% |
| Parsing | ⚠️ 부분 | 85% (While ✅, Assignment ⚠️) |
| AST | ✅ 완전 | 100% |
| **CodeGen** | ❌ **심각** | **0%** (메서드 자체 없음!) |
| WCET | ✅ 완전 | 100% |

---

## 해결할 3가지 핵심 문제

### Problem 1: CodeGenerator 메서드 누락

**파일**: `src/codegen/CodeGenerator.h`

현재: 문자열 기반 인터페이스만 존재
```cpp
// 존재하는 것 (문자열만 다룸)
std::string generateExprCode(const std::string& expr, ...);
std::string generateBinaryOp(const std::string& left, ...);

// 부재한 것 (AST 파싱)
LLVMModuleRef generate(ProgramNode* ast);     // ❌ 없음!
std::vector<std::string> getErrors();         // ❌ 없음!
```

**해결책**: AST 방문자 패턴(Visitor Pattern) 추가
```cpp
class CodeGenerator {
public:
    // AST 노드 처리 메서드들
    void visit(ProgramNode* node);
    void visit(FunctionDefNode* node);
    void visit(WhileNode* node);           // ✨ NEW
    void visit(AssignmentNode* node);      // ✨ NEW
    void visit(BinaryOpNode* node);
    void visit(VariableNode* node);

    // 엔트리 포인트
    LLVMModuleRef generate(ProgramNode* ast);
    std::vector<std::string> getErrors() const;
};
```

---

### Problem 2: Assignment 처리 방식 오류

**파일**: `src/parser/Parser.cpp` (라인 272)

현재 (잘못된) 코드:
```cpp
// Assignment를 BinaryOp으로 잘못 생성!
return std::make_shared<BinaryOpNode>(BinaryOp::Assign, expr, right);
```

**해결책**: AssignmentNode 직접 생성
```cpp
std::shared_ptr<ASTNode> Parser::parseAssignment() {
    auto expr = parsePrimary();  // 변수명

    if (match(TokenType::ASSIGN)) {
        auto value = parseExpression();  // 우측값
        // ✅ AssignmentNode 직접 생성!
        return std::make_shared<AssignmentNode>(
            static_cast<VariableNode*>(expr.get())->name,
            value
        );
    }
    return expr;
}
```

---

### Problem 3: While 루프 LLVM IR 생성 로직 부재

**파일**: `src/codegen/CodeGenerator.cpp`

현재: While 루프 처리 전혀 없음

**해결책**: LLVM 블록 기반 루프 생성
```cpp
void CodeGenerator::visit(WhileNode* node) {
    // 1. 루프 조건 블록 생성
    LLVMBasicBlockRef cond_block = LLVMAppendBasicBlock(current_func, "while.cond");

    // 2. 루프 본문 블록 생성
    LLVMBasicBlockRef body_block = LLVMAppendBasicBlock(current_func, "while.body");

    // 3. 루프 이후 블록 생성
    LLVMBasicBlockRef end_block = LLVMAppendBasicBlock(current_func, "while.end");

    // 4. 조건 블록에 조건 평가 로직
    // 5. 루프 본문 실행
    // 6. 본문 끝에서 조건 블록으로 분기
    // 7. 조건 거짓시 end_block으로 분기
}
```

---

## 3단계 구현 계획

### **Step A: CodeGenerator에 Visitor 패턴 추가** (30분)

**수정 파일**: `src/codegen/CodeGenerator.h`

```cpp
// 추가할 내용
private:
    LLVMModuleRef module;
    LLVMBuilderRef builder;
    std::map<std::string, LLVMValueRef> variables;

public:
    // 방문자 메서드들
    void visit(ProgramNode* node);
    void visit(FunctionDefNode* node);
    void visit(BlockNode* node);
    void visit(WhileNode* node);           // ✨ 새로 추가
    void visit(AssignmentNode* node);      // ✨ 새로 추가
    void visit(BinaryOpNode* node);
    void visit(IfExprNode* node);

    // 엔트리 포인트
    LLVMModuleRef generate(ProgramNode* ast);
```

### **Step B: Parser에서 AssignmentNode 올바르게 생성** (15분)

**수정 파일**: `src/parser/Parser.cpp` (라인 267-276)

```cpp
// 기존 (❌ 잘못됨)
return std::make_shared<BinaryOpNode>(BinaryOp::Assign, expr, right);

// 변경 (✅ 올바름)
if (auto var = std::dynamic_pointer_cast<VariableNode>(expr)) {
    return std::make_shared<AssignmentNode>(var->name, right);
} else {
    throw std::runtime_error("Assignment target must be a variable");
}
```

### **Step C: CodeGenerator에 visit 메서드 구현** (1시간)

**수정 파일**: `src/codegen/CodeGenerator.cpp`

```cpp
// While 루프 예제
void CodeGenerator::visit(WhileNode* node) {
    // 조건 평가
    // 본문 실행
    // 루프 분기 로직
}

// Assignment 예제
void CodeGenerator::visit(AssignmentNode* node) {
    // 우측값 계산
    // 변수에 저장
}
```

---

## 구현 순서

1. **Step A**: CodeGenerator.h에 메서드 선언 (메서드 시그니처)
2. **Step B**: Parser.cpp에서 AssignmentNode 올바르게 생성하도록 수정
3. **Step C**: CodeGenerator.cpp에 메서드 구현체 추가

---

## 검증 단계

### 테스트 1: 간단한 Assignment
```z
fn main() -> i64 {
    let x: i64 = 42;
    x = x + 1;
    return x;
}
// 예상: Exit code 43
```

### 테스트 2: While 루프
```z
fn main() -> i64 {
    let sum: i64 = 0;
    let i: i64 = 1;
    while i <= 5 {
        sum = sum + i;
        i = i + 1;
    }
    return sum;  // 1+2+3+4+5 = 15
}
// 예상: Exit code 15
```

---

## 예상 산출물

- ✅ Assignment 완전 지원
- ✅ While 루프 완전 지원
- ✅ 루프 제어 흐름 정확 구현
- ✅ 3개 테스트 모두 통과
- ✅ Z-Lang을 완전히 작동하는 언어로 격상

---

## 일정

| 단계 | 작업 | 예상시간 |
|------|------|---------|
| A | Visitor 패턴 추가 | 30분 |
| B | Parser 수정 | 15분 |
| C | CodeGen 구현 | 1시간 |
| 테스트 | 테스트 및 디버깅 | 30분 |
| **총** | | **2시간 15분** |

---

**상태**: 📋 계획 수립 완료, 구현 준비 완료 ✅
