/**
 * FreeLang Ownership Checker - Week 5 완전 구현
 * 소유권 규칙 검증 엔진
 *
 * 역할:
 * 1. 변수 소유권 추적 (정의, 이동, 복사)
 * 2. Move 감지 (소유권 이동 후 사용)
 * 3. 스코프 기반 생명주기 관리
 * 4. 함수 소유권 이전 검증
 */

import { ASTNode } from './types';

// ============================================================
// 데이터 구조
// ============================================================

/**
 * 변수의 소유권 상태
 */
interface OwnershipState {
  variable: string;
  definedAt: number;              // 정의 라인
  definedScope: number;           // 정의 스코프
  ownedBy: string;                // 현재 소유자
  type: 'value' | 'reference';    // 값 타입 vs 참조 타입
  moved: boolean;                 // 소유권 이동됨?
  movedAt?: number;               // 이동 라인
  movedTo?: string;               // 이동 대상
  copies: Array<{
    line: number;
    target: string;
  }>;
  validScopes: Array<{
    start: number;
    end: number;
  }>;
}

/**
 * 소유권 에러
 */
interface OwnershipError {
  type: 'use_after_move' | 'use_after_free' | 'invalid_scope' | 'double_move';
  variable: string;
  line: number;
  message: string;
  suggestion?: string;
}

/**
 * 소유권 맵 (변수 → 상태)
 */
type OwnershipMap = Map<string, OwnershipState>;

// ============================================================
// Ownership Checker
// ============================================================

export class OwnershipChecker {
  private ownershipMap: OwnershipMap = new Map();
  private errors: OwnershipError[] = [];
  private scopeStack: Array<{ id: number; variables: Set<string>; start: number }> = [];
  private currentScope: number = 0;
  private scopeCounter: number = 0;
  private lineCounter: number = 1;

  /**
   * 메인 검증 메서드
   */
  check(ast: ASTNode): OwnershipError[] {
    this.reset();

    // AST 분석
    const statements: ASTNode[] = ast.type === 'block' ? (ast as any).statements : [ast];
    this.analyzeStatements(statements);

    return this.errors;
  }

  /**
   * 상태 초기화
   */
  private reset(): void {
    this.ownershipMap.clear();
    this.errors = [];
    this.scopeStack = [{ id: 0, variables: new Set(), start: 0 }];
    this.currentScope = 0;
    this.scopeCounter = 1;
    this.lineCounter = 1;
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
        const varName = n.variable;

        // 우측값 분석 (이동 감지)
        this.analyzeExpressionForMove(n.value, varName);

        // 변수 정의 또는 업데이트
        if (!this.ownershipMap.has(varName)) {
          const currentScopeObj = this.scopeStack[this.scopeStack.length - 1];
          currentScopeObj.variables.add(varName);

          this.ownershipMap.set(varName, {
            variable: varName,
            definedAt: this.lineCounter,
            definedScope: this.currentScope,
            ownedBy: varName,
            type: 'value',
            moved: false,
            copies: [],
            validScopes: [{ start: this.currentScope, end: 999 }]
          });
        }
        this.lineCounter++;
        break;
      }

      case 'block': {
        const n = node as any;
        this.enterScope();
        this.analyzeStatements(n.statements);
        this.exitScope();
        break;
      }

      case 'if': {
        const n = node as any;
        this.analyzeExpression(n.condition);
        this.analyzeStatement(n.thenBranch);
        if (n.elseBranch) {
          this.analyzeStatement(n.elseBranch);
        }
        this.lineCounter++;
        break;
      }

      case 'while': {
        const n = node as any;
        this.analyzeExpression(n.condition);
        this.analyzeStatement(n.body);
        this.lineCounter++;
        break;
      }

      case 'functionDef': {
        const n = node as any;
        this.enterScope();

        // 파라미터 등록
        const params = (n.params || []) as string[];
        for (const param of params) {
          this.ownershipMap.set(param, {
            variable: param,
            definedAt: this.lineCounter,
            definedScope: this.currentScope,
            ownedBy: param,
            type: 'value',
            moved: false,
            copies: [],
            validScopes: [{ start: this.currentScope, end: 999 }]
          });
        }

        this.analyzeStatement(n.body);
        this.exitScope();
        this.lineCounter++;
        break;
      }

      case 'return': {
        const n = node as any;
        if (n.value) {
          this.analyzeExpression(n.value);
        }
        this.lineCounter++;
        break;
      }

      default:
        // 표현식 statement
        this.analyzeExpression(node);
        this.lineCounter++;
        break;
    }
  }

  /**
   * Expression 분석 (일반)
   */
  private analyzeExpression(node: ASTNode): void {
    switch (node.type) {
      case 'identifier': {
        const n = node as any;
        const state = this.ownershipMap.get(n.name);
        if (state && state.moved) {
          // use_after_move 에러 생성
          this.errors.push({
            type: 'use_after_move',
            variable: n.name,
            line: this.lineCounter,
            message: `Variable '${n.name}' was already moved`,
            suggestion: `Variable '${n.name}' moved to '${state.movedTo}' at line ${state.movedAt}`
          });
        }
        break;
      }

      case 'binaryOp': {
        const n = node as any;
        this.analyzeExpression(n.left);
        this.analyzeExpression(n.right);
        break;
      }

      case 'unaryOp': {
        const n = node as any;
        this.analyzeExpression(n.operand);
        break;
      }

      case 'functionCall': {
        const n = node as any;
        for (const arg of n.args) {
          this.analyzeExpression(arg);
        }
        break;
      }

      case 'arrayLiteral': {
        const n = node as any;
        for (const elem of n.elements) {
          this.analyzeExpression(elem);
        }
        break;
      }

      case 'arrayAccess': {
        const n = node as any;
        this.analyzeExpression(n.array);
        this.analyzeExpression(n.index);
        break;
      }

      default:
        break;
    }
  }

  /**
   * Expression 분석 (Move 감지)
   */
  private analyzeExpressionForMove(node: ASTNode, targetVar: string): void {
    // 할당 대상이 identifier이면 move
    if (node.type === 'identifier') {
      const srcVar = (node as any).name;
      if (srcVar !== targetVar) {
        this.recordMove(srcVar, targetVar);
        return;
      }
    }

    // 복합 표현식 분석
    switch (node.type) {
      case 'binaryOp': {
        const n = node as any;
        this.analyzeExpression(n.left);
        this.analyzeExpression(n.right);
        break;
      }

      case 'unaryOp': {
        const n = node as any;
        this.analyzeExpressionForMove(n.operand, targetVar);
        break;
      }

      case 'functionCall': {
        const n = node as any;
        for (const arg of n.args) {
          this.analyzeExpression(arg);
        }
        break;
      }

      case 'arrayLiteral': {
        const n = node as any;
        for (const elem of n.elements) {
          this.analyzeExpression(elem);
        }
        break;
      }

      case 'arrayAccess': {
        const n = node as any;
        this.analyzeExpression(n.array);
        this.analyzeExpression(n.index);
        break;
      }

      default:
        break;
    }
  }

  /**
   * Move 기록
   */
  private recordMove(fromVar: string, toVar: string): void {
    const state = this.ownershipMap.get(fromVar);
    if (state) {
      if (state.moved) {
        this.errors.push({
          type: 'double_move',
          variable: fromVar,
          line: this.lineCounter,
          message: `Variable '${fromVar}' was already moved`,
          suggestion: `Cannot move the same variable twice`
        });
      } else {
        state.moved = true;
        state.movedAt = this.lineCounter;
        state.movedTo = toVar;
      }
    }
  }

  /**
   * 스코프 진입
   */
  private enterScope(): void {
    const newScope = this.scopeCounter++;
    this.scopeStack.push({
      id: newScope,
      variables: new Set(),
      start: this.lineCounter
    });
    this.currentScope = newScope;
  }

  /**
   * 스코프 퇴출
   */
  private exitScope(): void {
    const scope = this.scopeStack.pop();
    if (scope) {
      // 이 스코프의 변수들 생명주기 종료
      for (const varName of scope.variables) {
        const state = this.ownershipMap.get(varName);
        if (state) {
          state.validScopes[0].end = this.lineCounter;
        }
      }
    }
    const parentScope = this.scopeStack[this.scopeStack.length - 1];
    this.currentScope = parentScope ? parentScope.id : 0;
  }

  /**
   * 소유권 맵 반환
   */
  getOwnershipMap(): OwnershipMap {
    return this.ownershipMap;
  }

  /**
   * 에러 반환
   */
  getErrors(): OwnershipError[] {
    return this.errors;
  }
}

// ============================================================
// Type Definitions
// ============================================================

export type { OwnershipState, OwnershipError, OwnershipMap };
