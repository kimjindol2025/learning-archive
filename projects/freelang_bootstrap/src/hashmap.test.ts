/**
 * HashMap & Vector 테스트 (Jest 포맷)
 */

import { HashMap, Vector } from './hashmap';

describe('HashMap Tests', () => {
  test('Test 1: 기본 삽입 및 조회', () => {
    const map = new HashMap<string, number>();
    map.set('apple', 5);
    map.set('banana', 3);
    map.set('cherry', 8);

    expect(map.get('apple')).toBe(5);
    expect(map.get('banana')).toBe(3);
  });

  test('Test 2: 크기 확인', () => {
    const map = new HashMap<string, string>();
    map.set('a', 'apple');
    map.set('b', 'banana');
    map.set('c', 'cherry');

    expect(map.len()).toBe(3);
  });

  test('Test 3: 삭제', () => {
    const map = new HashMap<string, number>();
    map.set('x', 10);
    map.set('y', 20);

    map.delete('x');
    expect(map.get('x')).toBeUndefined();
    expect(map.len()).toBe(1);
  });

  test('Test 4: 존재 확인', () => {
    const map = new HashMap<string, string>();
    map.set('key', 'value');

    expect(map.has('key')).toBe(true);
    expect(map.has('missing')).toBe(false);
  });

  test('Test 5: 전체 초기화', () => {
    const map = new HashMap<string, number>();
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);

    map.clear();
    expect(map.len()).toBe(0);
    expect(map.get('a')).toBeUndefined();
  });

  test('Test 6: 키 목록', () => {
    const map = new HashMap<string, number>();
    map.set('x', 1);
    map.set('y', 2);
    map.set('z', 3);

    const keys = map.keys();
    expect(keys).toContain('x');
    expect(keys).toContain('y');
    expect(keys).toContain('z');
    expect(keys.length).toBe(3);
  });

  test('Test 7: 값 목록', () => {
    const map = new HashMap<string, number>();
    map.set('a', 10);
    map.set('b', 20);

    const values = map.values();
    expect(values).toContain(10);
    expect(values).toContain(20);
    expect(values.length).toBe(2);
  });

  test('Test 8: 엔트리 목록', () => {
    const map = new HashMap<string, string>();
    map.set('name', 'Alice');
    map.set('role', 'Engineer');

    const entries = map.entries();
    expect(entries.length).toBe(2);
  });

  test('Test 9: 동적 리사이징', () => {
    const map = new HashMap<number, number>();
    for (let i = 0; i < 1000; i++) {
      map.set(i, i * 2);
    }

    expect(map.len()).toBe(1000);
    expect(map.get(500)).toBe(1000);
  });

  test('Test 10: 충돌 처리', () => {
    const map = new HashMap<string, number>();
    map.set('key1', 1);
    map.set('key2', 2);
    map.set('key3', 3);
    map.set('key4', 4);

    expect(map.get('key2')).toBe(2);
    expect(map.get('key4')).toBe(4);
  });

  test('Test 11: 값 업데이트', () => {
    const map = new HashMap<string, number>();
    map.set('count', 5);
    map.set('count', 10);

    expect(map.get('count')).toBe(10);
    expect(map.len()).toBe(1);
  });

  test('Test 12: 빈 맵 확인', () => {
    const map = new HashMap<string, string>();
    expect(map.isEmpty()).toBe(true);

    map.set('item', 'value');
    expect(map.isEmpty()).toBe(false);
  });
});

describe('Vector Tests', () => {
  test('Vector: push와 get', () => {
    const vec = new Vector<number>();
    vec.push(1);
    vec.push(2);
    vec.push(3);

    expect(vec.get(0)).toBe(1);
    expect(vec.get(1)).toBe(2);
    expect(vec.get(2)).toBe(3);
  });

  test('Vector: length', () => {
    const vec = new Vector<string>();
    vec.push('a');
    vec.push('b');

    expect(vec.len()).toBe(2);
  });

  test('Vector: pop', () => {
    const vec = new Vector<number>();
    vec.push(10);
    vec.push(20);

    const popped = vec.pop();
    expect(popped).toBe(20);
    expect(vec.len()).toBe(1);
  });

  test('Vector: map', () => {
    const vec = new Vector<number>();
    vec.push(1);
    vec.push(2);
    vec.push(3);

    const mapped = vec.map(x => x * 2);
    expect(mapped.get(0)).toBe(2);
    expect(mapped.get(1)).toBe(4);
    expect(mapped.get(2)).toBe(6);
  });

  test('Vector: filter', () => {
    const vec = new Vector<number>();
    vec.push(1);
    vec.push(2);
    vec.push(3);
    vec.push(4);

    const filtered = vec.filter(x => x > 2);
    expect(filtered.len()).toBe(2);
    expect(filtered.get(0)).toBe(3);
    expect(filtered.get(1)).toBe(4);
  });
});
