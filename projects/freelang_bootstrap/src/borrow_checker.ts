/**
 * FreeLang Borrow Checker
 * 차용(Borrow) 규칙 검증 엔진
 *
 * 역할:
 * 1. Shared borrow 다중화 허용
 * 2. Mutable borrow 배타성 강제
 * 3. Shared + Mutable 혼합 방지
 * 4. 참조 범위 검증
 */

import { ASTNode } from './types';

// ============================================================
// 데이터 구조
// ============================================================

/**
 * 차용 타입
 */
type BorrowKind = 'shared' | 'mutable';

/**
 * 참조 정보
 */
interface BorrowInfo {
  kind: BorrowKind;               // shared (&T) or mutable (&mut T)
  variable: string;               // 참조 대상 변수
  line: number;                   // 차용 라인
  scope: number;                  // 시작 스코프
  endScope: number;               // 종료 스코프
  target?: string;                // 할당 대상 (있으면)
}

/**
 * 차용 에러
 */
interface BorrowError {
  type: 'multiple_mutable' | 'shared_mutable_conflict' | 'use_during_borrow' | 'borrow_out_of_scope';
  variable: string;
  line: number;
  message: string;
  conflictAt?: number;            // 충돌 위치
  suggestion?: string;
}

/**
 * 차용 맵 (변수 → 차용 목록)
 */
type BorrowMap = Map<string, BorrowInfo[]>;

// ============================================================
// Borrow Checker
// ============================================================

export class BorrowChecker {
  private borrowMap: BorrowMap = new Map();
  private errors: BorrowError[] = [];
  private currentScope: number = 0;
  private borrowCounter: number = 0;

  /**
   * 메인 검증 메서드
   */
  check(ast: ASTNode): BorrowError[] {
    this.borrowMap.clear();
    this.errors = [];
    this.currentScope = 0;
    this.borrowCounter = 0;

    // AST 분석
    const statements: ASTNode[] = ast.type === 'block' ? (ast as any).statements : [ast];
    this.analyzeStatements(statements);

    // 차용 충돌 검증
    this.validateBorrows();

    return this.errors;
  }

  /**
   * Statements 분석
   */
  private analyzeStatements(statements: ASTNode[]): void {
    for (const stmt of statements) {
      this.analyzeStatement(stmt);
    }
  }

  /**
   * 단일 Statement 분석
   */
  private analyzeStatement(node: ASTNode): void {
    switch (node.type) {
      case 'assignment': {
        const n = node as any;
        // 우측값 분석 (차용 감지)
        this.analyzeExpressionForBorrow(n.value, n.variable);
        break;
      }

      case 'arrayAssignment': {
        const n = node as any;
        // 배열 할당: arr[index] = value
        this.analyzeExpressionForBorrow(n.array);
        this.analyzeExpressionForBorrow(n.index);
        this.analyzeExpressionForBorrow(n.value);
        break;
      }

      case 'block': {
        const n = node as any;
        this.currentScope++;
        this.analyzeStatements(n.statements);
        this.currentScope--;
        break;
      }

      case 'if': {
        const n = node as any;
        this.analyzeExpressionForBorrow(n.condition);
        this.analyzeStatement(n.thenBranch);
        if (n.elseBranch) {
          this.analyzeStatement(n.elseBranch);
        }
        break;
      }

      case 'while': {
        const n = node as any;
        this.analyzeExpressionForBorrow(n.condition);
        this.analyzeStatement(n.body);
        break;
      }

      case 'functionDef': {
        const n = node as any;
        this.currentScope++;
        this.analyzeStatement(n.body);
        this.currentScope--;
        break;
      }

      default:
        this.analyzeExpressionForBorrow(node);
        break;
    }
  }

  /**
   * Expression 분석 (차용 감지)
   */
  private analyzeExpressionForBorrow(node: ASTNode, target?: string): void {
    switch (node.type) {
      case 'identifier': {
        // 일반 참조 (차용 아님)
        break;
      }

      case 'binaryOp': {
        const n = node as any;
        this.analyzeExpressionForBorrow(n.left);
        this.analyzeExpressionForBorrow(n.right);
        break;
      }

      case 'unaryOp': {
        const n = node as any;
        const un = n as any;

        // &x (shared borrow)
        if (un.operator === '&') {
          const operandName = this.getVariableName(un.operand);
          if (operandName) {
            this.registerBorrow({
              kind: 'shared',
              variable: operandName,
              line: 0,
              scope: this.currentScope,
              endScope: this.currentScope + 1,
              target
            });
          }
        }
        // &mut x (mutable borrow)
        else if (un.operator === '&mut') {
          const operandName = this.getVariableName(un.operand);
          if (operandName) {
            this.registerBorrow({
              kind: 'mutable',
              variable: operandName,
              line: 0,
              scope: this.currentScope,
              endScope: this.currentScope + 1,
              target
            });
          }
        }

        this.analyzeExpressionForBorrow(un.operand);
        break;
      }

      case 'functionCall': {
        const n = node as any;
        for (const arg of n.args) {
          this.analyzeExpressionForBorrow(arg);
        }
        break;
      }

      case 'arrayLiteral': {
        const n = node as any;
        for (const elem of n.elements) {
          this.analyzeExpressionForBorrow(elem);
        }
        break;
      }

      case 'arrayAccess': {
        const n = node as any;
        this.analyzeExpressionForBorrow(n.array);
        this.analyzeExpressionForBorrow(n.index);
        break;
      }

      default:
        break;
    }
  }

  /**
   * 차용 등록
   */
  private registerBorrow(info: BorrowInfo): void {
    const borrows = this.borrowMap.get(info.variable) || [];
    borrows.push(info);
    this.borrowMap.set(info.variable, borrows);
  }

  /**
   * 변수명 추출
   */
  private getVariableName(node: ASTNode): string | null {
    if (node.type === 'identifier') {
      return (node as any).name;
    }
    return null;
  }

  /**
   * 차용 충돌 검증
   */
  private validateBorrows(): void {
    for (const [variable, borrows] of this.borrowMap.entries()) {
      // 규칙 1: Mutable borrow는 최대 1개
      const mutables = borrows.filter(b => b.kind === 'mutable');
      if (mutables.length > 1) {
        this.errors.push({
          type: 'multiple_mutable',
          variable,
          line: mutables[1].line,
          message: `Cannot borrow '${variable}' as mutable more than once at a time`,
          conflictAt: mutables[0].line,
          suggestion: `Consider using a single mutable reference`
        });
      }

      // 규칙 2: Mutable + Shared 불가
      const shared = borrows.filter(b => b.kind === 'shared');
      if (mutables.length > 0 && shared.length > 0) {
        this.errors.push({
          type: 'shared_mutable_conflict',
          variable,
          line: shared[0].line,
          message: `Cannot borrow '${variable}' as immutable while it is borrowed as mutable`,
          conflictAt: mutables[0].line,
          suggestion: `Use either shared or mutable borrows, not both`
        });
      }
    }
  }

  /**
   * 차용 맵 반환
   */
  getBorrowMap(): BorrowMap {
    return this.borrowMap;
  }

  /**
   * 에러 반환
   */
  getErrors(): BorrowError[] {
    return this.errors;
  }
}

// ============================================================
// Type Definitions
// ============================================================

export type { BorrowInfo, BorrowError, BorrowMap, BorrowKind };
