#include "CodeGenerator.h"
#include "../ast/ASTNode.h"
#include <sstream>
#include <regex>
#include <iostream>

namespace zlang {

// ============================================================================
// Constructor & Destructor
// ============================================================================

CodeGenerator::CodeGenerator()
    : context_(LLVMContextCreate()),
      module_(nullptr),
      builder_(nullptr),
      current_function_(nullptr),
      current_block_(nullptr),
      type_checker_(std::make_unique<IntegratedTypeChecker>()) {
    // LLVM 초기화
    builder_ = LLVMCreateBuilderInContext(context_);
}

CodeGenerator::~CodeGenerator() {
    if (builder_) LLVMDisposeBuilder(builder_);
    if (module_) LLVMDisposeModule(module_);
    if (context_) LLVMContextDispose(context_);
}

// ============================================================================
// AST-based Code Generation (NEW - Visitor Pattern)
// ============================================================================

/**
 * 프로그램 전체를 컴파일
 * ProgramNode → LLVMModuleRef
 */
LLVMModuleRef CodeGenerator::generate(ProgramNode* program) {
    if (!program) {
        addError("Program node is null");
        return nullptr;
    }

    // 모듈 생성
    module_ = LLVMModuleCreateWithNameInContext("zlang_module", context_);

    // 프로그램 방문
    visitProgram(program);

    if (!errors_.empty()) {
        return nullptr;
    }

    return module_;
}

/**
 * 프로그램 노드 방문
 * - 함수들 수집하여 컴파일
 */
void CodeGenerator::visitProgram(ProgramNode* node) {
    if (!node) {
        addError("Program node is null");
        return;
    }

    // 프로그램의 모든 함수 컴파일
    for (const auto& func : node->functions) {
        if (func) {
            visitFunction(func.get());
        }
    }
}

/**
 * 함수 정의 방문
 * FunctionNode → LLVMFunction 생성
 */
void CodeGenerator::visitFunction(FunctionNode* node) {
    if (!node) return;

    // 매개변수 타입 배열 생성
    std::vector<LLVMTypeRef> param_types;
    for (const auto& param : node->parameters) {
        param_types.push_back(getLLVMTypeRef(param.type.base_type, context_));
    }

    // 반환 타입
    LLVMTypeRef return_type = getLLVMTypeRef(node->return_type.base_type, context_);

    // 함수 타입 생성
    LLVMTypeRef func_type = LLVMFunctionType(
        return_type,
        param_types.data(),
        param_types.size(),
        0  // 가변 인자 없음
    );

    // 함수 생성
    current_function_ = LLVMAddFunction(module_, node->func_name.c_str(), func_type);

    // 매개변수를 변수 맵에 추가
    for (size_t i = 0; i < node->parameters.size(); ++i) {
        LLVMValueRef param = LLVMGetParam(current_function_, i);
        LLVMSetValueName(param, node->parameters[i].name.c_str());
        variables_[node->parameters[i].name] = param;
    }

    // 함수 본문 생성 (entry 블록)
    LLVMBasicBlockRef entry = LLVMAppendBasicBlockInContext(
        context_, current_function_, "entry"
    );
    LLVMPositionBuilderAtEnd(builder_, entry);
    current_block_ = entry;

    // 함수 본문 방문
    if (node->body) {
        visitBlock(node->body);
    }

    // 명시적인 return이 없으면 기본값 반환
    if (!LLVMGetBasicBlockTerminator(current_block_)) {
        if (node->return_type.base_type == "void") {
            LLVMBuildRetVoid(builder_);
        } else if (node->return_type.base_type == "i64") {
            LLVMBuildRet(builder_, LLVMConstInt(LLVMInt64TypeInContext(context_), 0, 1));
        } else {
            LLVMBuildRetVoid(builder_);
        }
    }
}

/**
 * 블록 방문 (여러 명령어 실행)
 */
void CodeGenerator::visitBlock(BlockNode* node) {
    if (!node) return;

    for (const auto& stmt : node->statements) {
        if (!stmt) continue;

        switch (stmt->type) {
            case ASTNode::NodeType::VarDecl:
                visitVarDecl(static_cast<VarDeclNode*>(stmt.get()));
                break;
            case ASTNode::NodeType::While:
                visitWhile(static_cast<WhileNode*>(stmt.get()));
                break;
            case ASTNode::NodeType::Assignment:
                visitAssignment(static_cast<AssignmentNode*>(stmt.get()));
                break;
            case ASTNode::NodeType::Return:
                visitReturn(static_cast<ReturnNode*>(stmt.get()));
                break;
            case ASTNode::NodeType::If:
                visitIf(static_cast<IfNode*>(stmt.get()));
                break;
            default:
                // 표현식도 가능
                visitExpression(stmt.get());
                break;
        }
    }
}

/**
 * 변수 선언 방문
 * let x: i64 = 42;
 */
void CodeGenerator::visitVarDecl(VarDeclNode* node) {
    if (!node) return;

    // 변수 타입
    LLVMTypeRef var_type = getLLVMTypeRef(node->declared_type.base_type, context_);

    // 스택에 할당
    LLVMValueRef alloca = LLVMBuildAlloca(builder_, var_type, node->var_name.c_str());
    variables_[node->var_name] = alloca;

    // 초기값이 있으면 저장
    if (node->init_expr) {
        LLVMValueRef init_val = visitExpression(node->init_expr.get());
        if (init_val) {
            LLVMBuildStore(builder_, init_val, alloca);
        }
    }
}

/**
 * While 루프 방문 ✨ KEY METHOD
 * while (condition) { body }
 */
void CodeGenerator::visitWhile(WhileNode* node) {
    if (!node) return;

    // 루프 관련 블록들 생성
    LLVMBasicBlockRef while_cond = LLVMAppendBasicBlockInContext(
        context_, current_function_, "while.cond"
    );
    LLVMBasicBlockRef while_body = LLVMAppendBasicBlockInContext(
        context_, current_function_, "while.body"
    );
    LLVMBasicBlockRef while_end = LLVMAppendBasicBlockInContext(
        context_, current_function_, "while.end"
    );

    // 조건 블록으로 분기
    LLVMBuildBr(builder_, while_cond);

    // ========== 조건 블록 ==========
    LLVMPositionBuilderAtEnd(builder_, while_cond);
    current_block_ = while_cond;

    // 조건 평가
    LLVMValueRef cond = visitExpression(node->condition.get());
    if (!cond) {
        addError("While condition evaluation failed");
        return;
    }

    // 조건이 i1 타입 아니면 변환
    if (LLVMTypeOf(cond) != LLVMInt1TypeInContext(context_)) {
        // i64를 i1로 변환 (0이 아니면 true)
        cond = LLVMBuildICmp(
            builder_, LLVMIntNE, cond,
            LLVMConstInt(LLVMTypeOf(cond), 0, 0),
            "cond_bool"
        );
    }

    // 조건에 따라 분기
    LLVMBuildCondBr(builder_, cond, while_body, while_end);

    // ========== 루프 본문 ==========
    LLVMPositionBuilderAtEnd(builder_, while_body);
    current_block_ = while_body;

    if (node->body) {
        visitBlock(node->body);
    }

    // 명시적인 분기가 없으면 조건 블록으로 다시 분기
    if (!LLVMGetBasicBlockTerminator(current_block_)) {
        LLVMBuildBr(builder_, while_cond);
    }

    // ========== 루프 끝 ==========
    LLVMPositionBuilderAtEnd(builder_, while_end);
    current_block_ = while_end;
}

/**
 * Assignment 방문 ✨ KEY METHOD
 * x = y + 1
 */
void CodeGenerator::visitAssignment(AssignmentNode* node) {
    if (!node) return;

    // 변수 찾기
    auto var_it = variables_.find(node->var_name);
    if (var_it == variables_.end()) {
        addError("Variable '" + node->var_name + "' not declared");
        return;
    }

    LLVMValueRef var_ptr = var_it->second;

    // 우측값 계산
    LLVMValueRef rhs_val = visitExpression(node->value.get());
    if (!rhs_val) {
        addError("Assignment RHS evaluation failed");
        return;
    }

    // 변수에 저장
    LLVMBuildStore(builder_, rhs_val, var_ptr);
}

/**
 * Return 문 방문
 */
void CodeGenerator::visitReturn(ReturnNode* node) {
    if (!node) {
        LLVMBuildRetVoid(builder_);
        return;
    }

    if (node->value) {
        LLVMValueRef ret_val = visitExpression(node->value.get());
        if (ret_val) {
            LLVMBuildRet(builder_, ret_val);
        }
    } else {
        LLVMBuildRetVoid(builder_);
    }
}

/**
 * If 문 방문
 */
void CodeGenerator::visitIf(IfNode* node) {
    if (!node) return;

    // TODO: If 문 구현
    addError("If statement not yet implemented");
}

/**
 * 이항 연산 방문
 */
LLVMValueRef CodeGenerator::visitBinaryOp(BinaryOpNode* node) {
    if (!node) return nullptr;

    // 좌측 피연산자
    LLVMValueRef left = visitExpression(node->left.get());
    if (!left) return nullptr;

    // 우측 피연산자
    LLVMValueRef right = visitExpression(node->right.get());
    if (!right) return nullptr;

    // 연산자별 처리
    switch (node->op) {
        case BinaryOp::Add:
            return LLVMBuildAdd(builder_, left, right, "add");
        case BinaryOp::Sub:
            return LLVMBuildSub(builder_, left, right, "sub");
        case BinaryOp::Mul:
            return LLVMBuildMul(builder_, left, right, "mul");
        case BinaryOp::Div:
            return LLVMBuildSDiv(builder_, left, right, "sdiv");
        case BinaryOp::Mod:
            return LLVMBuildSRem(builder_, left, right, "srem");
        case BinaryOp::Less:
            return LLVMBuildICmp(builder_, LLVMIntSLT, left, right, "cmp_lt");
        case BinaryOp::LessEq:
            return LLVMBuildICmp(builder_, LLVMIntSLE, left, right, "cmp_le");
        case BinaryOp::Greater:
            return LLVMBuildICmp(builder_, LLVMIntSGT, left, right, "cmp_gt");
        case BinaryOp::GreaterEq:
            return LLVMBuildICmp(builder_, LLVMIntSGE, left, right, "cmp_ge");
        case BinaryOp::Equal:
            return LLVMBuildICmp(builder_, LLVMIntEQ, left, right, "cmp_eq");
        case BinaryOp::NotEq:
            return LLVMBuildICmp(builder_, LLVMIntNE, left, right, "cmp_ne");
        case BinaryOp::And:
            return LLVMBuildAnd(builder_, left, right, "and");
        case BinaryOp::Or:
            return LLVMBuildOr(builder_, left, right, "or");
        default:
            addError("Unknown binary operator");
            return nullptr;
    }
}

/**
 * 식별자(변수) 방문
 */
LLVMValueRef CodeGenerator::visitIdentifier(IdentifierNode* node) {
    if (!node) return nullptr;

    auto var_it = variables_.find(node->name);
    if (var_it == variables_.end()) {
        addError("Variable '" + node->name + "' not declared");
        return nullptr;
    }

    // 메모리에서 로드
    LLVMValueRef var_ptr = var_it->second;
    return LLVMBuildLoad2(builder_, LLVMInt64TypeInContext(context_), var_ptr, node->name.c_str());
}

/**
 * 모든 표현식 방문 (디스패치)
 */
LLVMValueRef CodeGenerator::visitExpression(ASTNode* node) {
    if (!node) return nullptr;

    switch (node->type) {
        case ASTNode::NodeType::IntLiteral: {
            auto lit = static_cast<IntLiteralNode*>(node);
            return LLVMConstInt(LLVMInt64TypeInContext(context_), lit->value, 1);
        }
        case ASTNode::NodeType::FloatLiteral: {
            auto lit = static_cast<FloatLiteralNode*>(node);
            return LLVMConstReal(LLVMDoubleTypeInContext(context_), lit->value);
        }
        case ASTNode::NodeType::BoolLiteral: {
            auto lit = static_cast<BoolLiteralNode*>(node);
            return LLVMConstInt(LLVMInt1TypeInContext(context_), lit->value ? 1 : 0, 0);
        }
        case ASTNode::NodeType::BinaryOp:
            return visitBinaryOp(static_cast<BinaryOpNode*>(node));
        case ASTNode::NodeType::Identifier:
            return visitIdentifier(static_cast<IdentifierNode*>(node));
        default:
            addError("Unknown expression type");
            return nullptr;
    }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Z-Lang 타입 문자열 → LLVM 타입 레퍼런스
 */
LLVMTypeRef CodeGenerator::getLLVMTypeRef(const std::string& zlang_type, LLVMContextRef ctx) {
    if (zlang_type == "i64" || zlang_type == "i32") {
        return LLVMInt64TypeInContext(ctx);
    } else if (zlang_type == "f64" || zlang_type == "f32") {
        return LLVMDoubleTypeInContext(ctx);
    } else if (zlang_type == "bool") {
        return LLVMInt1TypeInContext(ctx);
    } else if (zlang_type == "void") {
        return LLVMVoidTypeInContext(ctx);
    }
    return LLVMInt64TypeInContext(ctx);  // 기본값
}

std::string CodeGenerator::newRegister() {
    return "%" + std::to_string(reg_counter_++);
}

std::string CodeGenerator::newBlock() {
    return "bb" + std::to_string(block_counter_++);
}

void CodeGenerator::reset() {
    reg_counter_ = 0;
    block_counter_ = 0;
    var_reg_map_.clear();
    current_ir_.clear();
    functions_.clear();
    variables_.clear();
    errors_.clear();
}

std::string CodeGenerator::getLLVMType(const std::string& zlang_type) {
    if (zlang_type == "i64") return "i64";
    if (zlang_type == "f64") return "double";
    if (zlang_type == "String") return "i8*";
    if (zlang_type == "bool") return "i1";
    if (zlang_type == "void") return "void";
    return "i64";
}

// ============================================================================
// Legacy Methods (for backward compatibility)
// ============================================================================

std::string CodeGenerator::generateExprCode(
    const std::string& expr,
    const std::string& expr_type) {
    // 리터럴 검사
    if (std::isdigit(expr[0]) || (expr[0] == '-' && expr.size() > 1)) {
        return generateLiteral(expr);
    }

    // 변수 검사
    if (expr.find('+') != std::string::npos ||
        expr.find('-') != std::string::npos ||
        expr.find('*') != std::string::npos ||
        expr.find('/') != std::string::npos) {
        std::regex op_regex(R"((\w+)\s*([\+\-\*/])\s*(.+))");
        std::smatch match;

        if (std::regex_match(expr, match, op_regex)) {
            std::string left = match[1].str();
            std::string op = match[2].str();
            std::string right = match[3].str();

            return generateBinaryOp(left, right, op, expr_type);
        }
    }

    return generateVariable(expr);
}

std::string CodeGenerator::generateBinaryOp(
    const std::string& left,
    const std::string& right,
    const std::string& op,
    const std::string& result_type) {

    std::string left_val = generateExprCode(left, result_type);
    std::string right_val = generateExprCode(right, result_type);

    std::string result = newRegister();
    std::string llvm_type = getLLVMType(result_type);

    std::string llvm_op;
    if (op == "+") llvm_op = "add";
    else if (op == "-") llvm_op = "sub";
    else if (op == "*") llvm_op = "mul";
    else if (op == "/") llvm_op = "sdiv";
    else return "";

    current_ir_ += "  " + result + " = " + llvm_op + " " + llvm_type +
                   " " + left_val + ", " + right_val + "\n";

    return result;
}

std::string CodeGenerator::generateLiteral(const std::string& literal) {
    return literal;
}

std::string CodeGenerator::generateVariable(const std::string& var_name) {
    return "%" + var_name;
}

std::string CodeGenerator::generateFunctionCode(
    const std::string& func_name,
    const std::vector<std::string>& param_names,
    const std::vector<std::string>& param_types,
    const std::string& return_type,
    const std::string& body) {

    std::ostringstream oss;

    oss << generateFunctionSignature(func_name, param_names, param_types, return_type);
    oss << "\n";

    for (size_t i = 0; i < param_names.size(); ++i) {
        type_checker_->bindVariable(param_names[i], param_types[i]);
    }

    std::string body_type = type_checker_->inferExprType(body);
    std::string body_code = generateExprCode(body, body_type);

    oss << "  ret " << getLLVMType(return_type) << " " << body_code << "\n";
    oss << "}\n\n";

    std::string func_def = oss.str();
    functions_.push_back(func_def);

    return func_def;
}

std::string CodeGenerator::generateFunctionSignature(
    const std::string& func_name,
    const std::vector<std::string>& param_names,
    const std::vector<std::string>& param_types,
    const std::string& return_type) {

    std::ostringstream oss;
    oss << "define " << getLLVMType(return_type) << " @" << func_name << "(";

    for (size_t i = 0; i < param_names.size(); ++i) {
        if (i > 0) oss << ", ";
        oss << getLLVMType(param_types[i]) << " %" << param_names[i];
    }

    oss << ") {";

    return oss.str();
}

std::string CodeGenerator::generateModule(
    const std::vector<std::string>& function_defs) {

    std::ostringstream oss;

    oss << "; Generated LLVM IR\n";
    oss << "target datalayout = \"e-m:e-i64:64-f80:128-n8:16:32:64-S128\"\n";
    oss << "target triple = \"x86_64-unknown-linux-gnu\"\n\n";

    for (const auto& func_def : function_defs) {
        oss << func_def << "\n";
    }

    return oss.str();
}

}  // namespace zlang
