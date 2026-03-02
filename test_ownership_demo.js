const { Lexer } = require('./dist/lexer');
const { Parser } = require('./dist/parser');
const { OwnershipChecker } = require('./dist/ownership_checker');
const { BorrowChecker } = require('./dist/borrow_checker');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  OwnershipChecker & BorrowChecker 실행 데모           ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// 테스트 1: Use After Move
console.log('📋 Test 1: Use After Move 감지');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const code1 = `
x = "hello"
y = x
print(x)
`;

console.log('코드:');
console.log(code1);

try {
  const lexer = new Lexer(code1);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const checker = new OwnershipChecker();
  const errors = checker.check(ast);

  if (errors.length > 0) {
    console.log('❌ 에러 감지됨:');
    errors.forEach(e => {
      console.log(`   Type: ${e.type}`);
      console.log(`   Variable: ${e.variable}`);
      console.log(`   Line: ${e.line}`);
      console.log(`   Message: ${e.message}`);
      if (e.suggestion) console.log(`   Suggestion: ${e.suggestion}`);
      console.log('');
    });
  } else {
    console.log('✅ 에러 없음');
  }
} catch (e) {
  console.log(`❌ 파싱 에러: ${e.message}`);
}

// 테스트 2: Multiple Mutable Borrows
console.log('\n📋 Test 2: Multiple Mutable Borrows 감지');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const code2 = `
x = [1, 2, 3]
m1 = &mut x
m2 = &mut x
`;

console.log('코드:');
console.log(code2);

try {
  const lexer = new Lexer(code2);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const borrowChecker = new BorrowChecker();
  const borrowErrors = borrowChecker.check(ast);

  if (borrowErrors.length > 0) {
    console.log('❌ 차용 에러 감지됨:');
    borrowErrors.forEach(e => {
      console.log(`   Type: ${e.type}`);
      console.log(`   Variable: ${e.variable}`);
      console.log(`   Message: ${e.message}`);
      if (e.suggestion) console.log(`   Suggestion: ${e.suggestion}`);
      console.log('');
    });
  } else {
    console.log('✅ 차용 에러 없음');
  }
} catch (e) {
  console.log(`❌ 파싱 에러: ${e.message}`);
}

// 테스트 3: Shared + Mutable Conflict
console.log('\n📋 Test 3: Shared + Mutable 충돌 감지');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const code3 = `
x = 100
s = &x
m = &mut x
`;

console.log('코드:');
console.log(code3);

try {
  const lexer = new Lexer(code3);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const borrowChecker = new BorrowChecker();
  const borrowErrors = borrowChecker.check(ast);

  if (borrowErrors.length > 0) {
    console.log('❌ 차용 충돌 감지됨:');
    borrowErrors.forEach(e => {
      console.log(`   Type: ${e.type}`);
      console.log(`   Variable: ${e.variable}`);
      console.log(`   Message: ${e.message}`);
      if (e.suggestion) console.log(`   Suggestion: ${e.suggestion}`);
      console.log('');
    });
  } else {
    console.log('✅ 충돌 없음');
  }
} catch (e) {
  console.log(`❌ 파싱 에러: ${e.message}`);
}

// 테스트 4: Valid Code (No Errors)
console.log('\n📋 Test 4: 정상 코드 (에러 없음)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const code4 = `
x = 42
y = x
print(y)
`;

console.log('코드:');
console.log(code4);

try {
  const lexer = new Lexer(code4);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const ownershipChecker = new OwnershipChecker();
  const borrowChecker = new BorrowChecker();
  
  const ownershipErrors = ownershipChecker.check(ast);
  const borrowErrors = borrowChecker.check(ast);

  if (ownershipErrors.length === 0 && borrowErrors.length === 0) {
    console.log('✅ 모든 체크 통과! (에러 없음)');
  } else {
    console.log('❌ 에러 발견:');
    ownershipErrors.forEach(e => console.log(`   Ownership: ${e.message}`));
    borrowErrors.forEach(e => console.log(`   Borrow: ${e.message}`));
  }
} catch (e) {
  console.log(`❌ 파싱 에러: ${e.message}`);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  실행 완료!                                           ║');
console.log('╚════════════════════════════════════════════════════════╝');
