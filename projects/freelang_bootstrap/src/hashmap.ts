/**
 * FreeLang HashMap 구현
 * 자체 해시 테이블 (Rust std::collections::HashMap 대체용)
 *
 * 알고리즘:
 * - 체이닝으로 충돌 처리
 * - 동적 리사이징 (load factor > 0.75일 때)
 * - MurmurHash 간단 구현
 */

interface Entry<K, V> {
  key: K;
  value: V;
}

export class HashMap<K, V> {
  private buckets: Array<Entry<K, V>[]>;
  private size: number = 0;
  private capacity: number;
  private readonly INITIAL_CAPACITY = 16;
  private readonly LOAD_FACTOR = 0.75;

  constructor(capacity?: number) {
    this.capacity = capacity || this.INITIAL_CAPACITY;
    this.buckets = Array(this.capacity).fill(null).map(() => []);
  }

  /**
   * 값 삽입 또는 업데이트
   */
  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    // 기존 키 찾기
    for (let entry of bucket) {
      if (this.keysEqual(entry.key, key)) {
        entry.value = value;
        return;
      }
    }

    // 새 항목 추가
    bucket.push({ key, value });
    this.size++;

    // 리사이징 필요 확인
    if (this.size / this.capacity > this.LOAD_FACTOR) {
      this.resize();
    }
  }

  /**
   * 값 조회
   */
  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (let entry of bucket) {
      if (this.keysEqual(entry.key, key)) {
        return entry.value;
      }
    }

    return undefined;
  }

  /**
   * 키 존재 여부
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * 값 삭제
   */
  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (let i = 0; i < bucket.length; i++) {
      if (this.keysEqual(bucket[i].key, key)) {
        bucket.splice(i, 1);
        this.size--;
        return true;
      }
    }

    return false;
  }

  /**
   * 모든 항목 제거
   */
  clear(): void {
    this.buckets = Array(this.capacity).fill(null).map(() => []);
    this.size = 0;
  }

  /**
   * 크기 반환
   */
  len(): number {
    return this.size;
  }

  /**
   * 모든 키 반환
   */
  keys(): K[] {
    const result: K[] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push(entry.key);
      }
    }
    return result;
  }

  /**
   * 모든 값 반환
   */
  values(): V[] {
    const result: V[] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push(entry.value);
      }
    }
    return result;
  }

  /**
   * 모든 항목 반환
   */
  entries(): Array<[K, V]> {
    const result: Array<[K, V]> = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push([entry.key, entry.value]);
      }
    }
    return result;
  }

  /**
   * 각 항목에 대해 콜백 실행
   */
  forEach(callback: (value: V, key: K) => void): void {
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        callback(entry.value, entry.key);
      }
    }
  }

  /**
   * 비어있는지 확인
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * 통계 반환
   */
  stats(): {
    size: number;
    capacity: number;
    loadFactor: number;
    avgBucketSize: number;
    maxBucketSize: number;
  } {
    let maxBucket = 0;
    for (const bucket of this.buckets) {
      if (bucket.length > maxBucket) {
        maxBucket = bucket.length;
      }
    }

    return {
      size: this.size,
      capacity: this.capacity,
      loadFactor: this.size / this.capacity,
      avgBucketSize: this.size / this.capacity,
      maxBucketSize: maxBucket
    };
  }

  /**
   * 해시 함수
   */
  private hash(key: K): number {
    let hash = 0;
    const str = String(key);

    // 간단한 해시 함수 (DJB2 변형)
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }

    // 절댓값으로 변환 후 용량으로 모듈로
    return Math.abs(hash) % this.capacity;
  }

  /**
   * 키 비교 (문자열, 숫자, 객체 지원)
   */
  private keysEqual(a: K, b: K): boolean {
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return a === b;
  }

  /**
   * 용량 증가 및 리해싱
   */
  private resize(): void {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.buckets = Array(this.capacity).fill(null).map(() => []);
    this.size = 0;

    // 모든 항목을 새 테이블에 다시 삽입
    for (const bucket of oldBuckets) {
      for (const entry of bucket) {
        this.set(entry.key, entry.value);
      }
    }
  }

  /**
   * 디버그용 문자열 표현
   */
  toString(): string {
    const entries = this.entries()
      .map(([k, v]) => `${String(k)}: ${String(v)}`)
      .join(', ');
    return `HashMap { ${entries} }`;
  }
}

/**
 * 벡터/동적 배열 구현
 * Rust Vec<T> 대체용
 */
export class Vector<T> {
  private items: T[] = [];
  private capacity: number = 10;

  constructor(items?: T[]) {
    if (items) {
      this.items = [...items];
      this.capacity = Math.max(10, items.length * 2);
    }
  }

  push(item: T): void {
    if (this.items.length >= this.capacity) {
      this.capacity *= 2;
    }
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  get(index: number): T | undefined {
    if (index >= 0 && index < this.items.length) {
      return this.items[index];
    }
    return undefined;
  }

  set(index: number, value: T): void {
    if (index >= 0 && index < this.items.length) {
      this.items[index] = value;
    }
  }

  len(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
    this.capacity = 10;
  }

  toArray(): T[] {
    return [...this.items];
  }

  forEach(callback: (item: T, index: number) => void): void {
    this.items.forEach(callback);
  }

  map<U>(callback: (item: T, index: number) => U): Vector<U> {
    const result = new Vector<U>();
    this.items.forEach((item, index) => {
      result.push(callback(item, index));
    });
    return result;
  }

  filter(callback: (item: T, index: number) => boolean): Vector<T> {
    const result = new Vector<T>();
    this.items.forEach((item, index) => {
      if (callback(item, index)) {
        result.push(item);
      }
    });
    return result;
  }

  toString(): string {
    return `[${this.items.map(String).join(', ')}]`;
  }
}
