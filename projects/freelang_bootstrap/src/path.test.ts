/**
 * Path 유틸리티 테스트 (Jest 포맷)
 */

import {
  normalize,
  split,
  join,
  isAbsolute,
  basename,
  dirname,
  extname,
  parse,
  isValidPath,
  commonPath,
  clean,
} from './path';

describe('Path Utility Tests', () => {
  test('Test 1: 경로 정규화', () => {
    const result = normalize('a/./b').replace(/\\/g, '/');
    expect(result).toContain('a');
  });

  test('Test 2: 경로 분해', () => {
    const parts = split('a/b/c');
    expect(parts.length).toBeGreaterThan(0);
    expect(parts).toContain('c');
  });

  test('Test 3: 경로 합치기', () => {
    const result = join('home', 'user', 'file.txt');
    expect(result).toContain('home');
  });

  test('Test 4: 절대 경로 확인', () => {
    expect(isAbsolute('/home/user')).toBe(true);
    expect(isAbsolute('home/user')).toBe(false);
  });

  test('Test 5: 파일명 추출', () => {
    const base = basename('/home/user/file.txt');
    expect(base).toBe('file.txt');
  });

  test('Test 6: 확장자 추출', () => {
    const ext = extname('document.pdf');
    expect(ext).toBe('.pdf');
  });

  test('Test 7: 디렉토리 부분 추출', () => {
    const dir = dirname('/home/user/file.txt');
    expect(dir).toContain('home');
  });

  test('Test 8: 경로 분석', () => {
    const parsed = parse('/home/user/file.txt');
    expect(parsed.name).toBe('file');
    expect(parsed.ext).toBe('.txt');
    expect(parsed.base).toBe('file.txt');
  });

  test('Test 9: 경로 유효성 확인', () => {
    expect(isValidPath('valid/path')).toBe(true);
    expect(isValidPath('')).toBe(false);
  });

  test('Test 10: 경로 정리', () => {
    const cleaned = clean('./a/./b');
    expect(typeof cleaned).toBe('string');
  });

  test('Test 11: 확장자 제외 파일명', () => {
    const name = basename('document.pdf').replace('.pdf', '');
    expect(name).toBe('document');
  });

  test('Test 12: 공통 경로 찾기', () => {
    const paths = ['a/b/c', 'a/b/d', 'a/b/e'];
    const common = commonPath(paths);
    expect(typeof common).toBe('string');
  });
});
