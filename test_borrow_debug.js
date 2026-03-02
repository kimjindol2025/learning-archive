const { Lexer } = require('./dist/lexer');
const { Parser } = require('./dist/parser');
const { BorrowChecker } = require('./dist/borrow_checker');

const code = `
x = 100
m1 = &mut x
m2 = &mut x
`;

try {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  console.log('\nTokens:');
  tokens.forEach((t, i) => {
    if (i < 20) console.log(`  ${i}: ${t.type} = "${t.value}"`);
  });
  
  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log('\nAST type:', ast.type);
  console.log('Statements:', ast.statements?.length);
  if (ast.statements) {
    ast.statements.forEach((s, i) => {
      console.log(`  ${i}: ${s.type}`);
      if (s.value) console.log(`     value.type: ${s.value.type}`);
    });
  }
  
  const checker = new BorrowChecker();
  const errors = checker.check(ast);
  console.log('\nBorrow errors:', errors.length);
  errors.forEach(e => console.log(' ', e));
} catch (e) {
  console.error('Error:', e.message);
  console.error(e.stack);
}
