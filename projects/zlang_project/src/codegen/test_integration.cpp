#include "TypeInference.h"
#include <cassert>
#include <iostream>
#include <string>

using namespace zlang;

// ════════════════════════════════════════════════════════════════════════════
// Test Utilities
// ════════════════════════════════════════════════════════════════════════════

int test_count = 0;
int pass_count = 0;

void assert_equal(const std::string& actual, const std::string& expected,
                 const std::string& test_name) {
    test_count++;
    if (actual == expected) {
        std::cout << "  ✓ " << test_name << ": " << actual << "\n";
        pass_count++;
    } else {
        std::cout << "  ✗ " << test_name << ": expected '" << expected
                  << "', got '" << actual << "'\n";
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Test 1: Basic Type Inference (Week 2 Core)
// ════════════════════════════════════════════════════════════════════════════

void test_basic_type_inference() {
    std::cout << "\n▌ Test 1: Basic Type Inference (기본 타입 추론)\n";
    std::cout << "════════════════════════════════════════════════════════════════\n";

    TypeInferenceEngine engine;

    // Test 1.1: Integer literal
    std::string type1 = engine.inferExprType("42");
    assert_equal(type1, "i64", "integer_literal");

    // Test 1.2: Binary operation
    engine.bindVariable("x", "i64");
    std::string type2 = engine.inferExprType("x + 10");
    assert_equal(type2, "i64", "binary_operation");

    // Test 1.3: Variable lookup
    std::string type3 = engine.inferExprType("x");
    assert_equal(type3, "i64", "variable_lookup");
}

// ════════════════════════════════════════════════════════════════════════════
// Test 2: String-based Type System
// ════════════════════════════════════════════════════════════════════════════

void test_string_based_types() {
    std::cout << "\n▌ Test 2: String-based Type System (문자열 기반 타입)\n";
    std::cout << "════════════════════════════════════════════════════════════════\n";

    TypeInferenceEngine engine;

    // Test: Type variable generation
    engine.bindVariable("x", "i64");
    std::string fresh = engine.inferExprType("unknown");
    test_count++;
    if (fresh.find("T_") == 0) {
        std::cout << "  ✓ fresh_type_variable: " << fresh << "\n";
        pass_count++;
    } else {
        std::cout << "  ✗ fresh_type_variable: should be T_X format\n";
    }

    // Test: Type representation consistency
    std::string concrete = engine.inferExprType("42");
    assert_equal(concrete, "i64", "concrete_type_i64");

    // Test: Variable binding and lookup
    auto var_type = engine.getVariableType("x");
    test_count++;
    if (var_type.has_value() && var_type.value() == "i64") {
        std::cout << "  ✓ variable_binding: x bound to i64\n";
        pass_count++;
    } else {
        std::cout << "  ✗ variable_binding: failed\n";
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Test 3: System Completeness (Week 2 전체 시스템)
// ════════════════════════════════════════════════════════════════════════════

void test_system_completeness() {
    std::cout << "\n▌ Test 3: System Completeness (시스템 완성도)\n";
    std::cout << "════════════════════════════════════════════════════════════════\n";

    // Scenario 1: Sequential variable binding and inference
    {
        TypeInferenceEngine engine;
        engine.bindVariable("a", "i64");
        engine.bindVariable("b", "i64");
        std::string type = engine.inferExprType("a + b");
        assert_equal(type, "i64", "sequential_binding");
    }

    // Scenario 2: Complex expression with reset
    {
        TypeInferenceEngine engine;
        engine.bindVariable("x", "i64");
        std::string t1 = engine.inferExprType("x + 10");
        engine.reset();
        auto reset_type = engine.getVariableType("x");
        test_count++;
        if (!reset_type.has_value()) {
            std::cout << "  ✓ reset_clears_context\n";
            pass_count++;
        } else {
            std::cout << "  ✗ reset_clears_context: failed\n";
        }
    }

    // Scenario 3: Function signatures with multiple parameters
    {
        TypeInferenceEngine engine;
        std::string sig = engine.inferFunctionSignature(
            "fn multiply(x, y) { x * y }"
        );
        test_count++;
        if (sig.find("fn") == 0 && sig.find("i64") != std::string::npos) {
            std::cout << "  ✓ multi_param_function: " << sig << "\n";
            pass_count++;
        } else {
            std::cout << "  ✗ multi_param_function: invalid\n";
        }
    }

    // Scenario 4: Mixed literals and variables
    {
        TypeInferenceEngine engine;
        engine.bindVariable("n", "i64");
        std::string type = engine.inferExprType("n + 42");
        assert_equal(type, "i64", "mixed_var_literal");
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Test 4: End-to-End Integration (전체 파이프라인)
// ════════════════════════════════════════════════════════════════════════════

void test_end_to_end_integration() {
    std::cout << "\n▌ Test 4: End-to-End Integration (엔드-투-엔드)\n";
    std::cout << "════════════════════════════════════════════════════════════════\n";

    // Step 1: Use TypeInference to infer literal types
    TypeInferenceEngine engine;
    std::string lit_type = engine.inferExprType("42");
    assert_equal(lit_type, "i64", "step1_literal_inference");

    // Step 2: Use TypeInference for complex expression
    engine.bindVariable("a", "i64");
    engine.bindVariable("b", "i64");
    std::string expr_type = engine.inferExprType("a + b");
    assert_equal(expr_type, "i64", "step2_expression_inference");

    // Step 3: Use TypeInference for function signature
    std::string sig = engine.inferFunctionSignature("fn add(a, b) { a + b }");
    test_count++;
    if (sig.find("fn") != std::string::npos && sig.find("i64") != std::string::npos) {
        std::cout << "  ✓ step3_function_signature: " << sig << "\n";
        pass_count++;
    } else {
        std::cout << "  ✗ step3_function_signature: invalid\n";
    }

    // Step 4: Control flow inference
    std::string if_type = engine.inferExprType("if (true) { 10 } else { 20 }");
    assert_equal(if_type, "i64", "step4_control_flow");

    // Step 5: Reset and reuse engine
    engine.reset();
    std::string reset_type = engine.inferExprType("100");
    assert_equal(reset_type, "i64", "step5_engine_reset");
}

// ════════════════════════════════════════════════════════════════════════════
// Test 5: Complex Type Scenarios (복잡한 타입 시나리오)
// ════════════════════════════════════════════════════════════════════════════

void test_complex_types() {
    std::cout << "\n▌ Test 5: Complex Type Scenarios (복잡한 타입)\n";
    std::cout << "════════════════════════════════════════════════════════════════\n";

    TypeInferenceEngine engine;

    // Test: Nested expressions
    engine.bindVariable("x", "i64");
    engine.bindVariable("y", "i64");
    std::string nested = engine.inferExprType("x + y");
    assert_equal(nested, "i64", "nested_expression");

    // Test: Comparison resulting in bool
    std::string comp = engine.inferExprType("x > y");
    assert_equal(comp, "bool", "comparison_bool");

    // Test: While loop returns void
    std::string loop = engine.inferExprType("while (true) { x = x + 1 }");
    assert_equal(loop, "void", "while_loop_void");

    // Test: Generic-like behavior with fresh variables
    engine.reset();
    std::string fresh = engine.inferExprType("unknown_var");
    test_count++;
    if (fresh.find("T_") == 0) {
        std::cout << "  ✓ fresh_type_variable: " << fresh << "\n";
        pass_count++;
    } else {
        std::cout << "  ✗ fresh_type_variable: should be T_X\n";
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Test 6: Type System Consistency (타입 일관성)
// ════════════════════════════════════════════════════════════════════════════

void test_type_consistency() {
    std::cout << "\n▌ Test 6: Type System Consistency (타입 일관성)\n";
    std::cout << "════════════════════════════════════════════════════════════════\n";

    TypeInferenceEngine engine1, engine2;

    // Same inputs should produce same outputs
    std::string t1 = engine1.inferExprType("42");
    std::string t2 = engine2.inferExprType("42");
    assert_equal(t1, t2, "consistent_integer");

    // Type preservation across operations
    engine1.bindVariable("x", "i64");
    std::string op1 = engine1.inferExprType("x + 0");
    assert_equal(op1, "i64", "type_preservation");

    // Variable context independence
    TypeInferenceEngine engine3;
    auto var1 = engine3.getVariableType("unbound");
    test_count++;
    if (!var1.has_value()) {
        std::cout << "  ✓ unbound_variable: correctly unbound\n";
        pass_count++;
    } else {
        std::cout << "  ✗ unbound_variable: should be unbound\n";
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Main Test Runner
// ════════════════════════════════════════════════════════════════════════════

int main() {
    std::cout << "\n";
    std::cout << "======================================================================\n";
    std::cout << "   Z-Lang LLVM 1.4: Week 2 Step 5 - Integration Tests\n";
    std::cout << "======================================================================\n";
    std::cout << "Testing Week 2 TypeInference System - Full Integration\n";

    // Run all test suites
    test_basic_type_inference();
    test_string_based_types();
    test_system_completeness();
    test_end_to_end_integration();
    test_complex_types();
    test_type_consistency();

    // Print summary
    std::cout << "\n";
    std::cout << "======================================================================\n";
    std::cout << "Integration Test Summary:\n";
    std::cout << "  Total Tests:        " << test_count << "\n";
    std::cout << "  Passed:             " << pass_count << " ✓\n";
    std::cout << "  Failed:             " << (test_count - pass_count) << "\n";
    if (test_count > 0) {
        std::cout << "  Pass Rate:          " << (pass_count * 100 / test_count) << "%\n";
    }
    std::cout << "======================================================================\n\n";

    return (pass_count == test_count) ? 0 : 1;
}
