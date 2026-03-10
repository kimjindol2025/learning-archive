const { Lexer } = require('./dist/lexer');
const { Parser } = require('./dist/parser');

const code = `
m1 = &mut x
`;

try {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  
  const parser = new Parser(tokens);
  const ast = parser.parse();
  
  const stmt = ast.statements[0];
  console.log('Statement:', JSON.stringify(stmt, null, 2).substring(0, 500));
} catch (e) {
  console.error('Error:', e.message);
}
