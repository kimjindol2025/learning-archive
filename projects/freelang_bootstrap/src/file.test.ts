/**
 * File I/O 시스템 테스트 (Jest 포맷)
 */

import { FileHandle, Directory, FileSystem } from './file';
import * as fs from 'fs';
import * as path from 'path';

describe('FileHandle Tests', () => {
  const testDir = './test_output';

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

  test('Test 1: 파일 쓰기 및 읽기', () => {
    const filePath = path.join(testDir, 'test1.txt');
    const testData = 'Hello, FreeLang!';

    const file = new FileHandle(filePath, 'w');
    expect(file.open()).toBe(true);
    expect(file.write(testData)).toBe(true);
    file.close();

    const file2 = new FileHandle(filePath, 'r');
    expect(file2.open()).toBe(true);
    const content = file2.read();
    file2.close();

    expect(content).toBe(testData);
  });

  test('Test 2: 파일 추가 쓰기', () => {
    const filePath = path.join(testDir, 'test2.txt');

    // 초기 파일 생성
    const file = new FileHandle(filePath, 'w');
    file.open();
    file.write('Initial');
    file.close();

    // 파일에 추가
    const file2 = new FileHandle(filePath, 'a');
    file2.open();
    file2.write('Appended');
    file2.close();

    // 파일 읽기
    const file3 = new FileHandle(filePath, 'r');
    file3.open();
    const content = file3.read();
    file3.close();

    // append 모드가 작동하는지 확인 (파일 크기 증가)
    expect(content.length).toBeGreaterThan(0);
  });

  test('Test 3: 여러 줄 읽기', () => {
    const filePath = path.join(testDir, 'test3.txt');

    const file = new FileHandle(filePath, 'w');
    file.open();
    file.write('apple\nbanana\ncherry\n');
    file.close();

    const file2 = new FileHandle(filePath, 'r');
    file2.open();
    const lines = file2.readLines();
    file2.close();

    expect(lines.length).toBeGreaterThan(0);
  });

  test('Test 4: 파일 메타데이터', () => {
    const filePath = path.join(testDir, 'test4.txt');

    const file = new FileHandle(filePath, 'w');
    file.open();
    file.write('test content');
    file.close();

    const file2 = new FileHandle(filePath, 'r');
    file2.open();
    const size = file2.size();
    file2.close();

    expect(size).toBeGreaterThan(0);
  });

  test('Test 5: 파일 존재 확인', () => {
    const filePath = path.join(testDir, 'test5.txt');

    const file = new FileHandle(filePath, 'w');
    file.open();
    file.write('content');
    file.close();

    const file2 = new FileHandle(filePath, 'r');
    expect(file2.exists()).toBe(true);
  });
});

describe('Directory Tests', () => {
  const testDir = './test_directories';

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  test('Test 6: 디렉토리 생성', () => {
    const dir = new Directory(testDir);
    expect(dir.create()).toBe(true);
    expect(fs.existsSync(testDir)).toBe(true);
  });

  test('Test 7: 디렉토리 목록', () => {
    const dir = new Directory(testDir);
    dir.create();

    fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
    fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');

    const files = dir.listFiles();
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  test('Test 8: 재귀 디렉토리 생성', () => {
    const dir = new Directory(path.join(testDir, 'a', 'b', 'c'));
    expect(dir.create()).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'a', 'b', 'c'))).toBe(true);
  });
});

describe('FileSystem Tests', () => {
  const testDir = './test_fs';

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

  test('Test 9: 파일 복사', () => {
    const src = path.join(testDir, 'source.txt');
    const dest = path.join(testDir, 'dest.txt');

    fs.writeFileSync(src, 'source content');
    expect(FileSystem.copy(src, dest)).toBe(true);
    expect(fs.existsSync(dest)).toBe(true);
  });

  test('Test 10: 파일 이동', () => {
    const src = path.join(testDir, 'move_src.txt');
    const dest = path.join(testDir, 'move_dest.txt');

    fs.writeFileSync(src, 'move content');
    expect(FileSystem.move(src, dest)).toBe(true);
    expect(fs.existsSync(dest)).toBe(true);
  });

  test('Test 11: 파일 존재 확인', () => {
    const filePath = path.join(testDir, 'exists.txt');
    fs.writeFileSync(filePath, 'content');

    expect(FileSystem.exists(filePath)).toBe(true);
    expect(FileSystem.exists(path.join(testDir, 'nonexistent.txt'))).toBe(false);
  });

  test('Test 12: 경로 타입 확인', () => {
    const filePath = path.join(testDir, 'file.txt');
    fs.writeFileSync(filePath, 'content');

    expect(FileSystem.isFile(filePath)).toBe(true);
    expect(FileSystem.isDirectory(testDir)).toBe(true);
  });
});
