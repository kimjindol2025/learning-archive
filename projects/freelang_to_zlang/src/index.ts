#!/usr/bin/env ts-node

/**
 * FreeLang → Z-Lang Transpiler CLI
 *
 * 사용법:
 *   npx ts-node src/index.ts <input.fl> [-o <output.z>]
 */

import * as fs from "fs";
import * as path from "path";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import ZLangCodeGen from "./transpiler";

interface CliOptions {
  inputFile: string;
  outputFile: string;
  verbose: boolean;
}

interface TranspilationResult {
  success: boolean;
  zlangCode: string;
  errors: string[];
  warnings: string[];
  stats: {
    inputLines: number;
    outputLines: number;
    statementsCount: number;
  };
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const options: CliOptions = {
    inputFile: "",
    outputFile: "",
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-o" || arg === "--output") {
      options.outputFile = args[++i];
    } else if (arg === "-v" || arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (!options.inputFile) {
      options.inputFile = arg;
    }
  }

  if (!options.inputFile) {
    console.error("Error: input file required");
    printUsage();
    process.exit(1);
  }

  if (!options.outputFile) {
    options.outputFile = options.inputFile.replace(/\.fl$/, ".z");
  }

  return options;
}

function printUsage(): void {
  console.log(`
FreeLang → Z-Lang Transpiler v2.0

Usage:
  npx ts-node src/index.ts <input.fl> [-o <output.z>] [-v]

Options:
  -o, --output FILE    Output Z-Lang file (default: input.z)
  -v, --verbose        Verbose output
  -h, --help          Show this help

Examples:
  npx ts-node src/index.ts hello.fl
  npx ts-node src/index.ts factorial.fl -o /tmp/factorial.z
  npx ts-node src/index.ts fizzbuzz.fl -v
`);
}

function transpile(sourceCode: string, options: CliOptions): TranspilationResult {
  const result: TranspilationResult = {
    success: false,
    zlangCode: "",
    errors: [],
    warnings: [],
    stats: {
      inputLines: sourceCode.split("\n").length,
      outputLines: 0,
      statementsCount: 0,
    },
  };

  try {
    // 1. Lexing
    if (options.verbose) {
      console.log(`[*] Lexing...`);
    }
    const lexer = new Lexer(sourceCode);
    const tokens = lexer.tokenize();
    if (options.verbose) {
      console.log(`    → ${tokens.length} tokens`);
    }

    // 2. Parsing
    if (options.verbose) {
      console.log(`[*] Parsing...`);
    }
    const parser = new Parser(tokens);
    const parseResult = parser.parse();
    result.stats.statementsCount = parseResult.program.stmts.length;

    if (parseResult.errors.length > 0) {
      result.warnings = parseResult.errors.map(
        (e) => `Parse warning at ${e.line}:${e.col}: ${e.message}`
      );
    }
    if (options.verbose) {
      console.log(`    → ${result.stats.statementsCount} statements`);
    }

    // 3. Code Generation
    if (options.verbose) {
      console.log(`[*] Code generation...`);
    }
    const codegen = new ZLangCodeGen();
    const zlangCode = codegen.generate(parseResult.program);

    result.stats.outputLines = zlangCode.split("\n").length;
    if (options.verbose) {
      console.log(`    → ${result.stats.outputLines} lines of Z-Lang code`);
    }

    result.zlangCode = zlangCode;
    result.success = true;

  } catch (error) {
    result.success = false;
    result.errors.push(`Transpilation failed: ${(error as Error).message}`);
  }

  return result;
}

async function main(): Promise<void> {
  try {
    const options = parseArgs();

    // 1. Read input file
    if (!fs.existsSync(options.inputFile)) {
      console.error(`Error: Input file not found: ${options.inputFile}`);
      process.exit(1);
    }

    if (options.verbose) {
      console.log(`📄 Reading ${options.inputFile}...`);
    }
    const sourceCode = fs.readFileSync(options.inputFile, "utf-8");

    // 2. Transpile
    if (options.verbose) {
      console.log(`🔄 Transpiling FreeLang → Z-Lang...`);
      console.log("");
    }
    const result = transpile(sourceCode, options);

    // 3. Output
    if (!result.success) {
      console.error("❌ Transpilation failed:");
      result.errors.forEach((err) => console.error(`  ${err}`));
      process.exit(1);
    }

    // Show warnings if any
    if (result.warnings.length > 0) {
      console.warn("⚠️  Warnings:");
      result.warnings.forEach((warn) => console.warn(`  ${warn}`));
      console.warn("");
    }

    // Write output file
    fs.writeFileSync(options.outputFile, result.zlangCode, "utf-8");

    // Print summary
    console.log(`✅ Transpilation successful!`);
    console.log("");
    console.log(`📊 Statistics:`);
    console.log(`  Input:      ${result.stats.inputLines} lines`);
    console.log(`  Statements: ${result.stats.statementsCount}`);
    console.log(`  Output:     ${result.stats.outputLines} lines of Z-Lang`);
    console.log("");
    console.log(`📁 Output: ${options.outputFile}`);

  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Main
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
