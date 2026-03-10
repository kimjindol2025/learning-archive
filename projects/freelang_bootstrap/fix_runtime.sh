#!/bin/bash
# Runtime에서 and/or 함수명 변경

sed -i 's/^fn and(/fn andOp(/g' runtime_v2.fl
sed -i 's/^fn or(/fn orOp(/g' runtime_v2.fl
sed -i 's/^fn not(/fn notOp(/g' runtime_v2.fl

# 함수 호출도 변경
sed -i 's/return a and b  # ✅ and 키워드/return a and b  # ✅ and operator/g' runtime_v2.fl
sed -i 's/return a or b   # ✅ or 키워드/return a or b   # ✅ or operator/g' runtime_v2.fl

# 테스트에서도 변경
sed -i 's/let l1 = and(/let l1 = andOp(/g' runtime_v2.fl
sed -i 's/let l2 = or(/let l2 = orOp(/g' runtime_v2.fl
sed -i 's/let l3 = not(/let l3 = notOp(/g' runtime_v2.fl

echo "✅ Fixed function names"
