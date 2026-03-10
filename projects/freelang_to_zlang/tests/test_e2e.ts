/**
 * E2E (End-to-End) Tests
 *
 * FreeLang 파일 → 파싱 → 변환 → Z-Lang 코드 검증
 */

import * as fs from "fs";
import * as path from "path";
import { Lexer } from "../src/lexer";
import { Parser } from "../src/parser";
import ZLangCodeGen from "../src/transpiler";

describe("E2E Transpilation Tests", () => {
  const examplesDir = path.join(__dirname, "../examples");

  function transpileFile(filename: string): { success: boolean; code: string; errors: string[] } {
    try {
      const filePath = path.join(examplesDir, filename);
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          code: "",
          errors: [`File not found: ${filePath}`],
        };
      }

      const sourceCode = fs.readFileSync(filePath, "utf-8");

      // Lexing
      const lexer = new Lexer(sourceCode);
      const lexResult = lexer.tokenize();

      // Parsing
      const parser = new Parser(lexResult.tokens);
      const parseResult = parser.parse();

      // Code Generation
      const codegen = new ZLangCodeGen();
      const zlangCode = codegen.generate(parseResult.program);

      return {
        success: true,
        code: zlangCode,
        errors: parseResult.errors.map((e: any) => `${e.line}:${e.col}: ${e.message}`),
      };
    } catch (error) {
      return {
        success: false,
        code: "",
        errors: [(error as Error).message],
      };
    }
  }

  function validateZLangSyntax(code: string): boolean {
    // Basic Z-Lang syntax validation
    const hasMain = /fn\s+main\s*\(/.test(code);
    const hasMatchingBraces =
      (code.match(/\{/g) || []).length === (code.match(/\}/g) || []).length;

    return hasMain && hasMatchingBraces;
  }

  test("hello.fl transpiles correctly", () => {
    const result = transpileFile("hello.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("fn main");
    expect(result.code).toContain("print");
  });

  test("factorial.fl transpiles correctly", () => {
    const result = transpileFile("factorial.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("fn factorial");
    expect(result.code).toContain("fn main");
  });

  test("fizzbuzz.fl transpiles correctly", () => {
    const result = transpileFile("fizzbuzz.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("fn fizzbuzz");
    expect(result.code).toContain("while");
  });

  test("sum.fl transpiles correctly", () => {
    const result = transpileFile("sum.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("let sum: i32");
    expect(result.code).toContain("while");
  });

  test("fibonacci.fl transpiles correctly", () => {
    const result = transpileFile("fibonacci.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("fn fib");
  });

  test("gcd.fl transpiles correctly", () => {
    const result = transpileFile("gcd.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("fn gcd");
  });

  test("array_ops.fl transpiles correctly", () => {
    const result = transpileFile("array_ops.fl");
    expect(result.success).toBe(true);
  });

  test("nested_if.fl transpiles correctly", () => {
    const result = transpileFile("nested_if.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("if ");
  });

  test("power.fl transpiles correctly", () => {
    const result = transpileFile("power.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("fn power");
  });

  test("even_odd.fl transpiles correctly", () => {
    const result = transpileFile("even_odd.fl");
    expect(result.success).toBe(true);
    expect(result.code).toContain("fn is_even");
  });

  // Syntax validation tests
  test("hello.fl produces valid Z-Lang syntax", () => {
    const result = transpileFile("hello.fl");
    expect(validateZLangSyntax(result.code)).toBe(true);
  });

  test("factorial.fl produces valid Z-Lang syntax", () => {
    const result = transpileFile("factorial.fl");
    expect(validateZLangSyntax(result.code)).toBe(true);
  });

  test("output files can be generated", () => {
    const exampleFiles = fs.readdirSync(examplesDir).filter((f) => f.endsWith(".fl"));
    expect(exampleFiles.length).toBeGreaterThan(0);

    exampleFiles.forEach((filename) => {
      const result = transpileFile(filename);
      expect(result.code.length).toBeGreaterThan(0);
    });
  });
});
