#!/bin/bash
# 전체 통합 테스트

echo "======================================"
echo "📊 FreeLang 전체 통합 테스트"
echo "======================================"
echo ""

COMPILER="../freelang-v4/dist/main.js"
TOTAL_PASSED=0
TOTAL_FAILED=0

# 테스트 함수
run_test() {
  local name=$1
  local file=$2
  
  echo "🧪 Testing: $name"
  echo "   File: $file"
  
  if [ -f "$file" ]; then
    output=$(node $COMPILER "$file" 2>&1)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
      echo "   Result: ✅ SUCCESS"
      echo "   Output: $output"
      ((TOTAL_PASSED++))
    else
      echo "   Result: ❌ FAILED (exit code: $exit_code)"
      echo "   Output: $output" | head -5
      ((TOTAL_FAILED++))
    fi
  else
    echo "   Result: ⚠️  FILE NOT FOUND"
    ((TOTAL_FAILED++))
  fi
  echo ""
}

# 1단계: 개별 모듈 테스트
echo "=== Phase 1: Individual Module Tests ==="
echo ""

run_test "Lexer Fixed" "lexer_fixed.fl"
run_test "Standard Library" "stdlib.fl"
run_test "Simple Parser" "parser_simple.fl"

echo "=== Phase 1 Result: Passed=$TOTAL_PASSED, Failed=$TOTAL_FAILED ==="
echo ""

