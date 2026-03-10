/**
 * FreeLang 경로 유틸리티
 * Node.js path 모듈을 확장한 경로 처리
 *
 * 구현:
 * - normalize(path): 경로 정규화 (../ ./ 제거)
 * - split(path): 경로 분해
 * - join(...parts): 경로 합치기
 * - isAbsolute(path): 절대 경로 확인
 * - relative(from, to): 상대 경로 계산
 * - resolve(...args): 경로 해석
 */

import * as path from 'path';

/**
 * 경로 정규화
 * ../ ./ 등을 처리하고 중복된 슬래시 제거
 */
export function normalize(pathStr: string): string {
  if (!pathStr) {
    return '.';
  }
  return path.normalize(pathStr);
}

/**
 * 경로를 부분으로 분해
 * '/home/user/file.txt' → ['home', 'user', 'file.txt']
 */
export function split(pathStr: string): string[] {
  if (!pathStr) {
    return [];
  }

  // 정규화 후 분해
  const normalized = normalize(pathStr);

  // 드라이브 레터 제거 (Windows)
  let parts = normalized.replace(/^[A-Z]:\\?/, '').split(/[\\/]+/);

  // 빈 부분 제거
  parts = parts.filter(part => part.length > 0);

  return parts;
}

/**
 * 경로 부분들을 합치기
 * ['home', 'user', 'file.txt'] → 'home/user/file.txt'
 */
export function join(...parts: string[]): string {
  if (parts.length === 0) {
    return '.';
  }
  return path.join(...parts);
}

/**
 * 절대 경로 확인
 */
export function isAbsolute(pathStr: string): boolean {
  return path.isAbsolute(pathStr);
}

/**
 * 상대 경로 계산
 * from: '/a/b/c', to: '/a/d/e'
 * 반환: '../../d/e'
 */
export function relative(from: string, to: string): string {
  return path.relative(from, to);
}

/**
 * 경로 해석 및 정규화
 * 상대 경로를 절대 경로로 변환
 */
export function resolve(...args: string[]): string {
  return path.resolve(...args);
}

/**
 * 경로에서 파일명 추출 (확장자 포함)
 */
export function basename(pathStr: string): string {
  return path.basename(pathStr);
}

/**
 * 경로에서 파일명 추출 (확장자 제외)
 */
export function basenameWithoutExt(pathStr: string): string {
  const base = path.basename(pathStr);
  const ext = path.extname(base);
  return base.slice(0, base.length - ext.length);
}

/**
 * 경로에서 디렉토리 부분 추출
 */
export function dirname(pathStr: string): string {
  return path.dirname(pathStr);
}

/**
 * 파일 확장자 추출
 */
export function extname(pathStr: string): string {
  return path.extname(pathStr);
}

/**
 * 경로 분석 결과
 */
export interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

/**
 * 경로 상세 분석
 */
export function parse(pathStr: string): ParsedPath {
  const parsed = path.parse(pathStr);
  return {
    root: parsed.root,
    dir: parsed.dir,
    base: parsed.base,
    ext: parsed.ext,
    name: parsed.name
  };
}

/**
 * 경로 유효성 확인
 */
export function isValidPath(pathStr: string): boolean {
  if (!pathStr || typeof pathStr !== 'string') {
    return false;
  }
  // 유효하지 않은 문자 확인 (Windows)
  const invalidChars = /[<>"|?*]/;
  return !invalidChars.test(pathStr);
}

/**
 * 경로가 다른 경로의 하위인지 확인
 */
export function isSubpath(parentPath: string, childPath: string): boolean {
  const parent = resolve(parentPath);
  const child = resolve(childPath);

  // 상대 경로 계산 후 ../ 로 시작하면 하위가 아님
  const rel = relative(parent, child);
  return typeof rel === 'string' && rel.length > 0 && !rel.startsWith('..');
}

/**
 * 공통 경로 찾기 (LCA - Lowest Common Ancestor)
 */
export function commonPath(paths: string[]): string {
  if (paths.length === 0) {
    return '';
  }

  if (paths.length === 1) {
    return paths[0];
  }

  // 모든 경로를 정규화 후 분해
  const splitPaths = paths.map(p => split(normalize(p)));

  let commonParts: string[] = [];

  // 첫 번째 경로의 부분과 비교
  for (let i = 0; i < splitPaths[0].length; i++) {
    const part = splitPaths[0][i];

    // 모든 경로에서 같은 부분인지 확인
    if (splitPaths.every(sp => sp[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  if (commonParts.length === 0) {
    return '';
  }

  return join(...commonParts);
}

/**
 * 경로 정리 (redundant 부분 제거)
 * '.', '..' 처리
 */
export function clean(pathStr: string): string {
  const parts = split(pathStr);
  const stack: string[] = [];

  for (const part of parts) {
    if (part === '.') {
      // 무시
      continue;
    } else if (part === '..' && stack.length > 0) {
      // 상위 디렉토리로 이동
      stack.pop();
    } else if (part !== '..') {
      // 일반 부분
      stack.push(part);
    }
  }

  const result = join(...stack);

  // 절대 경로면 /로 시작하게 보정
  if (isAbsolute(pathStr) && !result.startsWith('/')) {
    return '/' + result;
  }

  return result;
}

/**
 * 경로 통계
 */
export function getPathStats(): {
  version: string;
  features: string[];
  description: string;
} {
  return {
    version: '1.0.0-phase-b-week3',
    features: [
      'normalize - 경로 정규화',
      'split - 경로 분해',
      'join - 경로 합치기',
      'isAbsolute - 절대 경로 확인',
      'relative - 상대 경로 계산',
      'resolve - 경로 해석',
      'basename - 파일명 추출',
      'dirname - 디렉토리 부분 추출',
      'extname - 확장자 추출',
      'parse - 경로 상세 분석',
      'isValidPath - 경로 유효성 확인',
      'isSubpath - 하위 경로 확인',
      'commonPath - 공통 경로 찾기',
      'clean - 경로 정리'
    ],
    description: 'FreeLang 경로 유틸리티 v1.0'
  };
}
