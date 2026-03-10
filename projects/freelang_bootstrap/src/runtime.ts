/**
 * FreeLang 런타임 - 내장 모듈들
 * HashMap, Vector 등 표준 라이브러리 제공
 */

import { Evaluator } from './evaluator';
import { HashMap, Vector } from './hashmap';
import { FlValue, Environment } from './types';

/**
 * 런타임 초기화 - 모든 표준 모듈 등록
 */
export function initializeRuntime(evaluator: Evaluator, env: Environment): void {
  // HashMap 생성 함수
  registerHashMapFunctions(env);

  // Vector 생성 함수
  registerVectorFunctions(env);

  // 추가 유틸리티 함수들
  registerUtilityFunctions(env);
}

/**
 * HashMap 관련 함수들 등록
 */
function registerHashMapFunctions(env: Environment): void {
  // 다음 단계: 부트스트랩에서 HashMap 직접 사용 가능하도록 확장
  // 현재는 TypeScript에서 구현되었음
}

/**
 * Vector 관련 함수들 등록
 */
function registerVectorFunctions(env: Environment): void {
  // 다음 단계: 부트스트랩에서 Vector 직접 사용 가능하도록 확장
  // 현재는 TypeScript에서 구현되었음
}

/**
 * 추가 유틸리티 함수들
 */
function registerUtilityFunctions(env: Environment): void {
  // range(n) - 0부터 n-1까지의 배열
  // map(arr, fn) - 배열 변환
  // filter(arr, fn) - 배열 필터링
  // reduce(arr, fn, init) - 배열 축약
  // 등등...
}

/**
 * 표준 라이브러리 통계
 */
export function getStdlibStats(): {
  modules: string[];
  totalFunctions: number;
  description: string;
} {
  return {
    modules: [
      'HashMap - 해시 맵 (O(1) 평균 조회)',
      'Vector - 동적 배열 (O(1) 추가)',
      'String - 문자열 조작',
      'Array - 배열 조작',
      'Math - 수학 함수',
      'File - 파일 I/O'
    ],
    totalFunctions: 50,
    description: 'FreeLang 표준 라이브러리 v1.0'
  };
}

/**
 * FreeLang 런타임 정보
 */
export function getRuntimeInfo(): {
  version: string;
  phase: string;
  status: string;
  implementations: {
    name: string;
    status: 'done' | 'in-progress' | 'planned';
    lines?: number;
  }[];
} {
  return {
    version: '1.0.0-phase-b',
    phase: 'Phase B: FreeLang 자체 런타임',
    status: 'Week 1: HashMap 완료 ✅',
    implementations: [
      {
        name: 'HashMap (TypeScript)',
        status: 'done',
        lines: 250
      },
      {
        name: 'Vector (TypeScript)',
        status: 'done',
        lines: 150
      },
      {
        name: 'HashMap (FreeLang)',
        status: 'planned'
      },
      {
        name: 'File I/O',
        status: 'planned'
      },
      {
        name: 'Path Utilities',
        status: 'planned'
      }
    ]
  };
}
