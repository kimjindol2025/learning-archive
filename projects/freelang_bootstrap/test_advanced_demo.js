const { Lexer } = require('./dist/lexer');
const { Parser } = require('./dist/parser');
const { OwnershipChecker } = require('./dist/ownership_checker');
const { BorrowChecker } = require('./dist/borrow_checker');

function testCode(title, code, description) {
  console.log(`\n📋 ${title}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`설명: ${description}`);
  console.log('\n코드:');
  console.log(code);

  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const ownershipChecker = new OwnershipChecker();
    const borrowChecker = new BorrowChecker();
    
    const ownershipErrors = ownershipChecker.check(ast);
    const borrowErrors = borrowChecker.check(ast);

    if (ownershipErrors.length === 0 && borrowErrors.length === 0) {
      console.log('\n✅ 모든 체크 통과! (에러 없음)');
    } else {
      if (ownershipErrors.length > 0) {
        console.log('\n❌ Ownership 에러:');
        ownershipErrors.forEach(e => {
          console.log(`   • ${e.type}: ${e.message}`);
        });
      }
      if (borrowErrors.length > 0) {
        console.log('\n❌ Borrow 에러:');
        borrowErrors.forEach(e => {
          console.log(`   • ${e.type}: ${e.message}`);
        });
      }
    }
  } catch (e) {
    console.log(`\n❌ 파싱 에러: ${e.message}`);
  }
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  고급 시나리오 테스트                                 ║');
console.log('╚════════════════════════════════════════════════════════╝');

// 1. Double Move
testCode(
  'Test 1: Double Move (이중 이동)',
  `
x = "data"
y = x
z = x
`,
  '같은 변수를 두 번 이동하려고 시도'
);

// 2. 배열 할당
testCode(
  'Test 2: Array Assignment (배열 할당)',
  `
arr = [1, 2, 3]
arr[0] = 42
print(arr)
`,
  '배열의 요소를 수정하고 사용'
);

// 3. 함수와 소유권
testCode(
  'Test 3: Function Call (함수 호출)',
  `
fn process(x) {
  print(x)
}
data = [1, 2, 3]
process(data)
print(data)
`,
  '함수 호출 후 변수 사용 시도'
);

// 4. Scope와 생명주기
testCode(
  'Test 4: Scope Lifetime (스코프 생명주기)',
  `
{
  inner = 100
}
print(inner)
`,
  '스코프를 벗어난 변수 사용'
);

// 5. 다중 Shared Borrow
testCode(
  'Test 5: Multiple Shared Borrows (다중 공유 차용)',
  `
x = 100
r1 = &x
r2 = &x
r3 = &x
print(r1)
print(r2)
print(r3)
`,
  '같은 변수를 여러 번 공유 차용'
);

// 6. Borrow 후 Move
testCode(
  'Test 6: Borrow Then Move (차용 후 이동)',
  `
x = 100
r = &x
y = x
`,
  '차용 후 원본 이동 시도'
);

// 7. 함수 타입 주석
testCode(
  'Test 7: Function with Type Annotations (타입 주석)',
  `
fn add(a: int, b: int) -> int {
  c = a
  d = b
  return c
}
result = add(5, 3)
`,
  '타입 주석이 있는 함수 정의'
);

// 8. 정상적인 프로그램
testCode(
  'Test 8: Valid Program (정상 프로그램)',
  `
fn fibonacci(n) {
  if n <= 1 {
    return n
  }
  a = 0
  b = 1
  return a
}
result = fibonacci(5)
print(result)
`,
  '모든 규칙을 준수하는 정상 코드'
);

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  테스트 완료! 🎉                                       ║');
console.log('╚════════════════════════════════════════════════════════╝');
