/**
 * FreeLang → Z-Lang Transpiler (Phase 2 Enhanced)
 *
 * AST를 받아서 Z-Lang 소스 코드 문자열로 변환
 */

export class ZLangCodeGen {
  private indentLevel: number = 0;

  private indent(): string {
    return "  ".repeat(this.indentLevel);
  }

  /**
   * 프로그램 전체 변환
   */
  generate(ast: any): string {
    if (!ast || !ast.stmts) {
      return "";
    }

    const statements = ast.stmts
      .map((stmt: any) => this.genStmt(stmt))
      .filter((s: string) => s.length > 0)
      .join("\n");

    return statements;
  }

  /**
   * 문(Statement) 변환
   */
  private genStmt(stmt: any): string {
    if (!stmt) return "";

    switch (stmt.kind) {
      case "var_decl":
        return this.genVarDecl(stmt);
      case "fn_decl":
        return this.genFunction(stmt);
      case "if_stmt":
        return this.genIf(stmt);
      case "for_stmt":
        return this.genForIn(stmt);
      case "return_stmt":
        return this.genReturn(stmt);
      case "expr_stmt":
        return this.genExprStmt(stmt);
      case "spawn_stmt":
        return this.genSpawn(stmt);
      case "match_stmt":
        return this.genMatch(stmt);
      default:
        return `${this.indent()}// TODO: ${stmt.kind}`;
    }
  }

  /**
   * 변수 선언
   */
  private genVarDecl(stmt: any): string {
    const name = stmt.name;
    const type = this.convertType(stmt.type);
    const init = this.genExpr(stmt.init);
    return `${this.indent()}let ${name}: ${type} = ${init};`;
  }

  /**
   * 함수 정의
   */
  private genFunction(stmt: any): string {
    const name = stmt.name;
    const params = stmt.params
      .map((p: any) => `${p.name}: ${this.convertType(p.type)}`)
      .join(", ");

    const returnType = stmt.returnType ? ` -> ${this.convertType(stmt.returnType)}` : "";
    const body = this.genBlock(stmt.body, stmt.returnType);
    return `${this.indent()}fn ${name}(${params})${returnType} {\n${body}\n${this.indent()}}`;
  }

  /**
   * If 문
   */
  private genIf(stmt: any): string {
    const condition = this.genExpr(stmt.condition);
    this.indentLevel++;
    const thenBody = stmt.then
      .map((s: any) => this.genStmt(s))
      .filter((s: string) => s.length > 0)
      .join("\n");
    this.indentLevel--;

    let result = `${this.indent()}if ${condition} {\n${thenBody}\n${this.indent()}}`;

    if (stmt.else_ && stmt.else_.length > 0) {
      this.indentLevel++;
      const elseBody = stmt.else_
        .map((s: any) => this.genStmt(s))
        .filter((s: string) => s.length > 0)
        .join("\n");
      this.indentLevel--;
      result += ` else {\n${elseBody}\n${this.indent()}}`;
    }

    return result;
  }

  /**
   * For-in 루프 → While 변환
   */
  private genForIn(stmt: any): string {
    const variable = stmt.variable;
    const iterable = stmt.iterable;

    // range 패턴 인식
    if (
      iterable.kind === "call" &&
      iterable.callee &&
      iterable.callee.kind === "ident" &&
      iterable.callee.name === "range" &&
      iterable.args &&
      iterable.args.length >= 2
    ) {
      const start = this.genExpr(iterable.args[0]);
      const end = this.genExpr(iterable.args[1]);

      this.indentLevel++;
      const body = stmt.body
        .map((s: any) => this.genStmt(s))
        .filter((s: string) => s.length > 0)
        .join("\n");
      this.indentLevel--;

      return `${this.indent()}let ${variable}: i64 = ${start};\n${this.indent()}while ${variable} <= ${end} {\n${body}\n${this.indent()}  ${variable} = ${variable} + 1;\n${this.indent()}}`;
    }

    this.indentLevel++;
    const body = stmt.body
      .map((s: any) => this.genStmt(s))
      .filter((s: string) => s.length > 0)
      .join("\n");
    this.indentLevel--;

    const iterable_expr = this.genExpr(iterable);
    return `${this.indent()}// for-in array loop\n${this.indent()}for ${variable} in ${iterable_expr} {\n${body}\n${this.indent()}}`;
  }

  /**
   * Match 문
   */
  private genMatch(stmt: any): string {
    const subject = this.genExpr(stmt.subject);

    this.indentLevel++;
    const arms = stmt.arms
      .map((arm: any) => {
        const pattern = this.genPattern(arm.pattern);
        const body_expr = this.genExpr(arm.body);
        return `${this.indent()}${pattern} => ${body_expr}`;
      })
      .join(",\n");
    this.indentLevel--;

    return `${this.indent()}match ${subject} {\n${arms}\n${this.indent()}}`;
  }

  /**
   * 패턴
   */
  private genPattern(pattern: any): string {
    if (!pattern) return "_";
    switch (pattern.kind) {
      case "ident":
        return pattern.name;
      case "literal":
        return this.genExpr(pattern.value);
      case "ok":
        return `Ok(${this.genPattern(pattern.inner)})`;
      case "err":
        return `Err(${this.genPattern(pattern.inner)})`;
      case "some":
        return `Some(${this.genPattern(pattern.inner)})`;
      case "none":
        return "None";
      case "wildcard":
        return "_";
      default:
        return "_";
    }
  }

  /**
   * Spawn
   */
  private genSpawn(stmt: any): string {
    this.indentLevel++;
    const body = stmt.body
      .map((s: any) => this.genStmt(s))
      .filter((s: string) => s.length > 0)
      .join("\n");
    this.indentLevel--;

    return `${this.indent()}// spawn task\n${this.indent()}{\n${body}\n${this.indent()}}`;
  }

  /**
   * Return 문
   */
  private genReturn(stmt: any): string {
    if (stmt.value) {
      const value = this.genExpr(stmt.value);
      return `${this.indent()}return ${value};`;
    } else {
      return `${this.indent()}return;`;
    }
  }

  /**
   * 표현식 문
   */
  private genExprStmt(stmt: any): string {
    const expr = this.genExpr(stmt.expr);
    return `${this.indent()}${expr};`;
  }

  /**
   * 블록
   */
  private genBlock(stmts: any[], returnType?: any): string {
    if (!stmts || stmts.length === 0) {
      return "";
    }

    this.indentLevel++;
    const lines: string[] = [];

    for (let i = 0; i < stmts.length - 1; i++) {
      const line = this.genStmt(stmts[i]);
      if (line.length > 0) {
        lines.push(line);
      }
    }

    const lastStmt = stmts[stmts.length - 1];
    if (lastStmt) {
      if (returnType && returnType.kind !== "void" && lastStmt.kind === "expr_stmt") {
        const expr = this.genExpr(lastStmt.expr);
        lines.push(`${this.indent()}return ${expr};`);
      } else {
        const line = this.genStmt(lastStmt);
        if (line.length > 0) {
          lines.push(line);
        }
      }
    }

    this.indentLevel--;
    return lines.join("\n");
  }

  /**
   * 표현식
   */
  private genExpr(expr: any): string {
    if (!expr) return "null";

    switch (expr.kind) {
      case "int_lit":
        return expr.value.toString();
      case "float_lit":
        return expr.value.toString();
      case "string_lit":
        return `"${this.escapeString(expr.value)}"`;
      case "bool_lit":
        return expr.value ? "true" : "false";
      case "ident":
        return expr.name;
      case "binary":
        return `(${this.genExpr(expr.left)} ${expr.op} ${this.genExpr(expr.right)})`;
      case "unary":
        return `${expr.op}${this.genExpr(expr.operand)}`;
      case "call":
        const args = expr.args.map((a: any) => this.genExpr(a)).join(", ");
        return `${this.genExpr(expr.callee)}(${args})`;
      case "index":
        return `${this.genExpr(expr.object)}[${this.genExpr(expr.index)}]`;
      case "field_access":
        return `${this.genExpr(expr.object)}.${expr.field}`;
      case "assign":
        return `${this.genExpr(expr.target)} = ${this.genExpr(expr.value)}`;
      case "try":
        return `${this.genExpr(expr.operand)}?`;
      case "if_expr":
        return `(if ${this.genExpr(expr.condition)} { ... })`;
      case "match_expr":
        return `(match ...)`;
      case "array_lit":
        return `[${expr.elements.map((e: any) => this.genExpr(e)).join(", ")}]`;
      case "struct_lit":
        return `{ ${expr.fields.map((f: any) => `${f.name}: ${this.genExpr(f.value)}`).join(", ")} }`;
      default:
        return `/* ${expr.kind} */`;
    }
  }

  /**
   * 타입 변환
   */
  private convertType(type: any): string {
    if (!type) return "i64";

    switch (type.kind) {
      case "i32":
      case "i64":
      case "f64":
      case "bool":
      case "string":
      case "void":
        return type.kind;
      case "array":
        return `[${this.convertType(type.element)}]`;
      case "channel":
        return `channel<${this.convertType(type.element)}>`;
      case "option":
        return `option<${this.convertType(type.element)}>`;
      case "result":
        return `result<${this.convertType(type.ok)}, ${this.convertType(type.err)}>`;
      default:
        return "i64";
    }
  }

  /**
   * 문자열 이스케이핑
   */
  private escapeString(str: string): string {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t")
      .replace(/\r/g, "\\r");
  }
}

export default ZLangCodeGen;
