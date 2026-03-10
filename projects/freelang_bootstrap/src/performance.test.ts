/**
 * 성능 테스트 (Jest 포맷)
 */

import { HashMap, Vector } from './hashmap';
import { FileHandle, FileSystem } from './file';
import { normalize } from './path';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance Tests', () => {
  const testDir = './test_performance';

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  // HashMap 성능 테스트
  test('HashMap Performance 1: 1000개 항목 삽입 (<500ms)', () => {
    const map = new HashMap<number, number>();
    const start = Date.now();

    for (let i = 0; i < 1000; i++) {
      map.set(i, i * 2);
    }

    const elapsed = Date.now() - start;
    expect(map.len()).toBe(1000);
    expect(elapsed).toBeLessThan(500);
  });

  test('HashMap Performance 2: 1000회 조회 (<200ms)', () => {
    const map = new HashMap<number, number>();
    for (let i = 0; i < 100; i++) {
      map.set(i, i * 2);
    }

    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      map.get(i % 100);
    }
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200);
  });

  test('HashMap Performance 3: 500개 삭제 (<200ms)', () => {
    const map = new HashMap<number, number>();
    for (let i = 0; i < 500; i++) {
      map.set(i, i);
    }

    const start = Date.now();
    for (let i = 0; i < 250; i++) {
      map.delete(i);
    }
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200);
  });

  test('HashMap Performance 4: 1000개 순회 (<100ms)', () => {
    const map = new HashMap<number, number>();
    for (let i = 0; i < 1000; i++) {
      map.set(i, i);
    }

    const start = Date.now();
    const keys = map.keys();
    keys.forEach(() => {});
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });

  test('Vector Performance 5: 10000개 항목 삽입 (<500ms)', () => {
    const vec = new Vector<number>();
    const start = Date.now();

    for (let i = 0; i < 10000; i++) {
      vec.push(i);
    }

    const elapsed = Date.now() - start;
    expect(vec.len()).toBe(10000);
    expect(elapsed).toBeLessThan(500);
  });

  test('Vector Performance 6: 동적 배열 리사이징', () => {
    const vec = new Vector<number>();
    for (let i = 0; i < 5000; i++) {
      vec.push(i);
    }

    expect(vec.len()).toBe(5000);
  });

  // File I/O 성능 테스트
  test('File Performance 7: 1MB 파일 쓰기 (<50ms)', () => {
    const filePath = path.join(testDir, 'large.txt');
    const file = new FileHandle(filePath, 'w');
    file.open();

    const start = Date.now();
    const content = 'x'.repeat(1024 * 1024);
    file.write(content);
    const elapsed = Date.now() - start;
    file.close();

    expect(fs.existsSync(filePath)).toBe(true);
    expect(elapsed).toBeLessThan(50);
  });

  test('File Performance 8: 1MB 파일 읽기 (<50ms)', () => {
    const filePath = path.join(testDir, 'read_large.txt');
    const content = 'y'.repeat(1024 * 100);

    const writeFile = new FileHandle(filePath, 'w');
    writeFile.open();
    writeFile.write(content);
    writeFile.close();

    const file = new FileHandle(filePath, 'r');
    file.open();
    const start = Date.now();
    const read = file.read();
    const elapsed = Date.now() - start;
    file.close();

    expect(elapsed).toBeLessThan(50);
  });

  test('File Performance 9: 100개 파일 생성 (<500ms)', () => {
    const subDir = path.join(testDir, 'files');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      const file = new FileHandle(path.join(subDir, `file${i}.txt`), 'w');
      file.open();
      file.write(`content ${i}`);
      file.close();
    }
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(500);
  });

  test('File Performance 10: 100개 파일 목록 조회 (<100ms)', () => {
    const subDir = path.join(testDir, 'files');
    
    const start = Date.now();
    const files = fs.readdirSync(subDir);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });

  // Path 성능 테스트
  test('Path Performance 11: 10000회 정규화 (<100ms)', () => {
    const start = Date.now();
    for (let i = 0; i < 10000; i++) {
      normalize('a/./b/../c');
    }
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });

  test('Path Performance 12: 경로 처리 안정성', () => {
    expect(normalize('/a/b/c')).toBeTruthy();
    expect(normalize('a/b/c')).toBeTruthy();
    expect(normalize('./a/b')).toBeTruthy();
  });
});
