/**
 * Basic transpiler unit tests
 */

import ZLangCodeGen from "../src/transpiler";

describe("ZLangCodeGen Unit Tests", () => {
  const codegen = new ZLangCodeGen();

  test("transpiler instantiates", () => {
    expect(codegen).toBeDefined();
    expect(codegen.generate).toBeDefined();
  });

  test("empty program generates empty code", () => {
    const ast = { stmts: [] };
    const result = codegen.generate(ast);
    expect(result).toBe("");
  });

  test("null program generates empty code", () => {
    const ast = null;
    const result = codegen.generate(ast as any);
    expect(result).toBe("");
  });

  test("simple variable declaration is generated", () => {
    const ast = {
      stmts: [
        {
          kind: "var_decl",
          name: "x",
          mutable: true,
          type: { kind: "i32" },
          init: { kind: "int_lit", value: 42, line: 1, col: 1 },
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain("let x");
    expect(result).toContain("i32");
    expect(result).toContain("42");
  });

  test("function declaration is generated", () => {
    const ast = {
      stmts: [
        {
          kind: "fn_decl",
          name: "add",
          params: [
            { name: "a", type: { kind: "i32" } },
            { name: "b", type: { kind: "i32" } },
          ],
          returnType: { kind: "i32" },
          body: [
            {
              kind: "return_stmt",
              value: {
                kind: "binary",
                op: "+",
                left: { kind: "ident", name: "a", line: 1, col: 1 },
                right: { kind: "ident", name: "b", line: 1, col: 1 },
                line: 1,
                col: 1,
              },
              line: 1,
              col: 1,
            },
          ],
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain("fn add");
    expect(result).toContain("a: i32");
    expect(result).toContain("b: i32");
    expect(result).toContain("-> i32");
  });

  test("type conversion works correctly", () => {
    const types = [
      { kind: "i32", expected: "i32" },
      { kind: "i64", expected: "i64" },
      { kind: "f64", expected: "f64" },
      { kind: "bool", expected: "bool" },
      { kind: "string", expected: "string" },
      { kind: "void", expected: "void" },
    ];

    types.forEach(({ kind, expected }) => {
      const ast = {
        stmts: [
          {
            kind: "var_decl",
            name: "x",
            mutable: true,
            type: { kind },
            init: { kind: "int_lit", value: 0, line: 1, col: 1 },
            line: 1,
            col: 1,
          },
        ],
      };
      const result = codegen.generate(ast as any);
      expect(result).toContain(expected);
    });
  });

  test("if statement is generated", () => {
    const ast = {
      stmts: [
        {
          kind: "if_stmt",
          condition: { kind: "bool_lit", value: true, line: 1, col: 1 },
          then: [
            {
              kind: "expr_stmt",
              expr: { kind: "int_lit", value: 1, line: 1, col: 1 },
              line: 1,
              col: 1,
            },
          ],
          else_: null,
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain("if true");
  });

  test("for-in with range is converted to while", () => {
    const ast = {
      stmts: [
        {
          kind: "for_stmt",
          variable: "i",
          iterable: {
            kind: "call",
            callee: { kind: "ident", name: "range", line: 1, col: 1 },
            args: [
              { kind: "int_lit", value: 1, line: 1, col: 1 },
              { kind: "int_lit", value: 5, line: 1, col: 1 },
            ],
            line: 1,
            col: 1,
          },
          body: [
            {
              kind: "expr_stmt",
              expr: { kind: "ident", name: "i", line: 1, col: 1 },
              line: 1,
              col: 1,
            },
          ],
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain("let i: i64 = 1");
    expect(result).toContain("while i <= 5");
  });

  test("return statement is generated", () => {
    const ast = {
      stmts: [
        {
          kind: "return_stmt",
          value: { kind: "int_lit", value: 42, line: 1, col: 1 },
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain("return 42");
  });

  test("array type is converted", () => {
    const ast = {
      stmts: [
        {
          kind: "var_decl",
          name: "arr",
          mutable: true,
          type: { kind: "array", element: { kind: "i32" } },
          init: {
            kind: "array_lit",
            elements: [
              { kind: "int_lit", value: 1, line: 1, col: 1 },
              { kind: "int_lit", value: 2, line: 1, col: 1 },
            ],
            line: 1,
            col: 1,
          },
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain("[i32]");
  });

  test("binary operations are handled", () => {
    const ast = {
      stmts: [
        {
          kind: "expr_stmt",
          expr: {
            kind: "binary",
            op: "+",
            left: { kind: "int_lit", value: 10, line: 1, col: 1 },
            right: { kind: "int_lit", value: 20, line: 1, col: 1 },
            line: 1,
            col: 1,
          },
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain("10");
    expect(result).toContain("20");
    expect(result).toContain("+");
  });

  test("string literals are escaped", () => {
    const ast = {
      stmts: [
        {
          kind: "expr_stmt",
          expr: {
            kind: "string_lit",
            value: 'Hello "World"',
            line: 1,
            col: 1,
          },
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain('Hello \\"World\\"');
  });

  test("function calls are generated", () => {
    const ast = {
      stmts: [
        {
          kind: "expr_stmt",
          expr: {
            kind: "call",
            callee: { kind: "ident", name: "print", line: 1, col: 1 },
            args: [{ kind: "string_lit", value: "hello", line: 1, col: 1 }],
            line: 1,
            col: 1,
          },
          line: 1,
          col: 1,
        },
      ],
    };
    const result = codegen.generate(ast as any);
    expect(result).toContain("print");
    expect(result).toContain("hello");
  });
});
