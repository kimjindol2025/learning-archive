#ifndef CODE_GENERATOR_H
#define CODE_GENERATOR_H

#include "IntegratedTypeChecker.h"
#include "../ast/ASTNode.h"
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

// LLVM C API
#include <llvm-c/Core.h>

namespace zlang {

// Forward declarations
class ASTNode;
class ProgramNode;
class FunctionNode;
class BlockNode;
class WhileNode;
class AssignmentNode;
class BinaryOpNode;
class IfNode;
class ReturnNode;
class VarDeclNode;
class IdentifierNode;

/**
 * CodeGenerator: AST를 LLVM IR로 변환
 *
 * Visitor 패턴으로 각 노드 타입을 방문하며 코드 생성
 * - 변수: LLVM Value로 저장 (스택 할당)
 * - 표현식: 계산 결과를 Value로 반환
 * - 문: 제어 흐름 생성
 */
class CodeGenerator {
private:
    // LLVM 컨텍스트 및 모듈
    LLVMContextRef context_;
    LLVMModuleRef module_;
    LLVMBuilderRef builder_;

    // 현재 함수 및 블록
    LLVMValueRef current_function_;
    LLVMBasicBlockRef current_block_;

    // 변수 맵 (이름 → LLVM Value)
    std::unordered_map<std::string, LLVMValueRef> variables_;

    // 레지스터/블록 카운터
    int reg_counter_ = 0;
    int block_counter_ = 0;

    // 오류 메시지
    std::vector<std::string> errors_;

    // 레거시 코드 생성 관련 (호환성)
    std::unique_ptr<IntegratedTypeChecker> type_checker_;
    std::string current_ir_;
    std::vector<std::string> functions_;
    std::unordered_map<std::string, int> var_reg_map_;

public:
    CodeGenerator();
    ~CodeGenerator();

    // ========================================================================
    // AST 기반 코드 생성 (NEW - Visitor 패턴)
    // ========================================================================

    /**
     * 프로그램 생성 (엔트리 포인트)
     */
    LLVMModuleRef generate(ProgramNode* program);

    /**
     * 노드 방문 메서드들 (Visitor 패턴)
     */
    void visitProgram(ProgramNode* node);
    void visitFunction(FunctionNode* node);
    void visitBlock(BlockNode* node);
    void visitVarDecl(VarDeclNode* node);
    void visitWhile(WhileNode* node);           // ✨ NEW
    void visitAssignment(AssignmentNode* node); // ✨ NEW
    void visitReturn(ReturnNode* node);
    void visitIf(IfNode* node);
    LLVMValueRef visitBinaryOp(BinaryOpNode* node);
    LLVMValueRef visitIdentifier(IdentifierNode* node);
    LLVMValueRef visitExpression(ASTNode* node);  // 모든 표현식

    /**
     * 에러 처리
     */
    const std::vector<std::string>& getErrors() const { return errors_; }
    void addError(const std::string& message) { errors_.push_back(message); }

    // ========================================================================
    // 레거시 메서드들 (호환성 유지)
    // ========================================================================

    // Expression code generation
    std::string generateExprCode(
        const std::string& expr,
        const std::string& expr_type
    );

    std::string generateBinaryOp(
        const std::string& left,
        const std::string& right,
        const std::string& op,
        const std::string& result_type
    );

    std::string generateLiteral(const std::string& literal);
    std::string generateVariable(const std::string& var_name);

    // Function code generation
    std::string generateFunctionCode(
        const std::string& func_name,
        const std::vector<std::string>& param_names,
        const std::vector<std::string>& param_types,
        const std::string& return_type,
        const std::string& body
    );

    std::string generateFunctionSignature(
        const std::string& func_name,
        const std::vector<std::string>& param_names,
        const std::vector<std::string>& param_types,
        const std::string& return_type
    );

    // Module generation
    std::string generateModule(
        const std::vector<std::string>& function_defs
    );

    const std::vector<std::string>& getGeneratedFunctions() const {
        return functions_;
    }

    // ========================================================================
    // Utilities
    // ========================================================================

    std::string newRegister();
    std::string newBlock();
    void reset();
    static std::string getLLVMType(const std::string& zlang_type);
    static LLVMTypeRef getLLVMTypeRef(const std::string& zlang_type, LLVMContextRef ctx);
};

}  // namespace zlang

#endif  // CODE_GENERATOR_H
