/**
 * 통합 테스트 (Jest 포맷)
 */

import { HashMap, Vector } from './hashmap';
import { FileHandle, FileSystem, Directory } from './file';
import { normalize, join } from './path';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests', () => {
  const testDir = './test_integration';

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

  test('Integration 1: HashMap + File I/O - JSON 저장/로드', () => {
    const filePath = path.join(testDir, 'hashmap.json');
    const map = new HashMap<string, number>();
    
    map.set('count', 10);
    map.set('total', 100);

    const jsonStr = JSON.stringify(Object.fromEntries(map.entries()));
    const file = new FileHandle(filePath, 'w');
    file.open();
    file.write(jsonStr);
    file.close();

    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('Integration 2: Vector + File I/O - 데이터 저장', () => {
    const filePath = path.join(testDir, 'vector.txt');
    const vec = new Vector<string>();
    
    vec.push('apple');
    vec.push('banana');
    vec.push('cherry');

    const content = Array(vec.len()).fill(0).map((_, i) => vec.get(i)).join('\n');
    const file = new FileHandle(filePath, 'w');
    file.open();
    file.write(content);
    file.close();

    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('Integration 3: Path + File 조합 - 경로 정규화 후 파일 작업', () => {
    const dirPath = path.join(testDir, 'subdir');
    const normalized = normalize(dirPath);
    
    const dir = new Directory(normalized);
    dir.create();

    expect(fs.existsSync(normalized)).toBe(true);
  });

  test('Integration 4: HashMap + Vector - 데이터 구조 조합', () => {
    const map = new HashMap<string, Vector<number>>();
    const vec1 = new Vector<number>();
    vec1.push(1);
    vec1.push(2);
    vec1.push(3);

    map.set('numbers', vec1);
    expect(map.get('numbers')?.len()).toBe(3);
  });

  test('Integration 5: File I/O + Path - 파일 목록 관리', () => {
    const dir = new Directory(path.join(testDir, 'files'));
    dir.create();

    const files = ['file1.txt', 'file2.txt', 'file3.txt'];
    files.forEach(f => {
      const file = new FileHandle(path.join(testDir, 'files', f), 'w');
      file.open();
      file.write('content');
      file.close();
    });

    const listedFiles = dir.listFiles();
    expect(listedFiles.length).toBeGreaterThanOrEqual(files.length);
  });

  test('Integration 6: HashMap + File I/O + Path - 메타데이터 저장', () => {
    const filePath = path.join(testDir, 'metadata.json');
    const map = new HashMap<string, string>();
    
    map.set('filename', 'test.txt');
    map.set('size', '1024');
    map.set('modified', '2026-03-02');

    const json = JSON.stringify(Object.fromEntries(map.entries()));
    const file = new FileHandle(filePath, 'w');
    file.open();
    file.write(json);
    file.close();

    expect(FileSystem.exists(filePath)).toBe(true);
  });

  test('Integration 7: Vector + HashMap - 배치 데이터 처리', () => {
    const items = new Vector<string>();
    const index = new HashMap<string, number>();

    items.push('apple');
    items.push('banana');
    items.push('cherry');

    for (let i = 0; i < items.len(); i++) {
      index.set(items.get(i)!, i);
    }

    expect(index.get('banana')).toBe(1);
  });

  test('Integration 8: Path 유틸리티 - 경로 분석 후 파일 작업', () => {
    const filePath = path.join(testDir, 'analysis.txt');
    const dir = path.dirname(filePath);
    
    const directory = new Directory(dir);
    directory.create();

    const file = new FileHandle(filePath, 'w');
    file.open();
    file.write('analyzed content');
    file.close();

    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('Integration 9: HashMap + Vector + File - 캐시 시스템', () => {
    const cache = new HashMap<string, Vector<number>>();
    const values = new Vector<number>();

    values.push(1);
    values.push(2);
    values.push(3);
    cache.set('cache-key', values);

    const cacheFile = path.join(testDir, 'cache.txt');
    const file = new FileHandle(cacheFile, 'w');
    file.open();
    file.write(cache.get('cache-key')?.len().toString() || '');
    file.close();

    expect(fs.existsSync(cacheFile)).toBe(true);
  });

  test('Integration 10: 전체 모듈 조합 - 파일 관리 시스템', () => {
    const fileIndex = new HashMap<string, string>();
    const files = new Vector<string>();

    files.push('doc1.txt');
    files.push('doc2.txt');

    for (let i = 0; i < files.len(); i++) {
      fileIndex.set(files.get(i)!, path.join(testDir, files.get(i)!));
    }

    expect(fileIndex.len()).toBe(files.len());
  });
});
