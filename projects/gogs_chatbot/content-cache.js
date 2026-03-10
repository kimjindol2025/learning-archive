#!/usr/bin/env node

/**
 * Gogs 콘텐츠 캐시 시스템
 * - Gogs 저장소 콘텐츠 수집
 * - 로컬 파일로 저장
 * - 메타데이터 기록
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '.cache');
const METADATA_FILE = path.join(CACHE_DIR, 'metadata.json');

// ===== 콘텐츠 캐시 관리자 =====
export class ContentCache {
  constructor() {
    this.ensureCacheDir();
    this.metadata = this.loadMetadata();
  }

  ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log(`📁 캐시 디렉토리 생성: ${CACHE_DIR}`);
    }
  }

  loadMetadata() {
    try {
      if (fs.existsSync(METADATA_FILE)) {
        return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
      }
    } catch (e) {
      console.warn('⚠️  메타데이터 로드 실패');
    }
    return {
      version: '1.0',
      lastUpdated: null,
      totalDocuments: 0,
      totalSize: 0,
      documents: []
    };
  }

  saveMetadata() {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(this.metadata, null, 2));
  }

  /**
   * 콘텐츠 수집 및 캐싱
   */
  collectAndCache(repoRoot) {
    console.log('\n📚 Gogs 콘텐츠 수집 시작...');
    console.log('='.repeat(50));

    const files = this.discoverFiles(repoRoot);
    const now = new Date().toISOString();
    let totalSize = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file.fullPath, 'utf-8');
        const size = Buffer.byteLength(content, 'utf-8');

        // 캐시 파일로 저장
        const cacheFile = this.getCacheFilePath(file.relativePath);
        const cacheDir = path.dirname(cacheFile);

        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }

        fs.writeFileSync(cacheFile, content);

        // 메타데이터 기록
        const docMeta = {
          id: `doc_${this.metadata.documents.length + 1}`,
          name: file.name,
          path: file.relativePath,
          size: size,
          lines: content.split('\n').length,
          cached: cacheFile,
          timestamp: now,
          hash: this.hashContent(content)
        };

        this.metadata.documents.push(docMeta);
        totalSize += size;

        console.log(`✅ ${file.name} (${(size/1024).toFixed(1)}KB)`);
      } catch (e) {
        console.warn(`⚠️  ${file.name}: ${e.message}`);
      }
    }

    // 메타데이터 업데이트
    this.metadata.lastUpdated = now;
    this.metadata.totalDocuments = this.metadata.documents.length;
    this.metadata.totalSize = totalSize;
    this.saveMetadata();

    console.log('='.repeat(50));
    console.log(`✅ 수집 완료`);
    console.log(`   문서: ${this.metadata.documents.length}개`);
    console.log(`   크기: ${(totalSize/1024).toFixed(1)}KB`);
    console.log(`   저장: ${CACHE_DIR}`);

    return this.metadata.documents;
  }

  /**
   * 파일 발견
   */
  discoverFiles(repoRoot) {
    const files = [];
    const extensions = ['.md', '.js', '.json', '.txt'];
    const ignores = ['.git', 'node_modules', '.cache', 'dist'];

    const walk = (dir, relPath = '') => {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          if (ignores.includes(entry)) continue;

          const fullPath = path.join(dir, entry);
          const rel = path.join(relPath, entry);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            walk(fullPath, rel);
          } else if (stat.isFile() && extensions.some(ext => entry.endsWith(ext))) {
            files.push({
              name: entry,
              fullPath: fullPath,
              relativePath: rel,
              size: stat.size
            });
          }
        }
      } catch (e) {
        // 접근 권한 없음
      }
    };

    walk(repoRoot);
    return files.sort((a, b) => a.name.localeCompare(b.name));
  }

  getCacheFilePath(relativePath) {
    const fileName = path.basename(relativePath);
    const dirName = path.dirname(relativePath).substring(0, 20);
    return path.join(CACHE_DIR, `${dirName}_${fileName}`);
  }

  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 캐시된 콘텐츠 조회
   */
  getDocument(id) {
    const doc = this.metadata.documents.find(d => d.id === id);
    if (doc && fs.existsSync(doc.cached)) {
      return {
        ...doc,
        content: fs.readFileSync(doc.cached, 'utf-8')
      };
    }
    return null;
  }

  /**
   * 모든 캐시된 콘텐츠 목록
   */
  listAll() {
    return this.metadata.documents.map(d => ({
      id: d.id,
      name: d.name,
      path: d.path,
      size: d.size,
      lines: d.lines,
      timestamp: d.timestamp
    }));
  }

  /**
   * 캐시 통계
   */
  getStats() {
    return {
      version: this.metadata.version,
      lastUpdated: this.metadata.lastUpdated,
      totalDocuments: this.metadata.totalDocuments,
      totalSize: `${(this.metadata.totalSize / 1024).toFixed(1)}KB`,
      cacheDir: CACHE_DIR,
      documents: this.metadata.documents.length
    };
  }

  /**
   * 캐시 초기화
   */
  clear() {
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    }
    this.ensureCacheDir();
    this.metadata = {
      version: '1.0',
      lastUpdated: null,
      totalDocuments: 0,
      totalSize: 0,
      documents: []
    };
    this.saveMetadata();
    console.log('✅ 캐시 초기화됨');
  }
}

// ===== 사용 예제 =====
if (import.meta.url === `file://${process.argv[1]}`) {
  const cache = new ContentCache();

  if (process.argv[2] === 'collect') {
    const repoRoot = process.argv[3] || '..';
    cache.collectAndCache(repoRoot);
  } else if (process.argv[2] === 'list') {
    console.log('\n📚 캐시된 문서:');
    console.log(cache.listAll());
  } else if (process.argv[2] === 'stats') {
    console.log('\n📊 캐시 통계:');
    console.log(cache.getStats());
  } else if (process.argv[2] === 'clear') {
    cache.clear();
  } else {
    console.log(`
사용법:
  node content-cache.js collect [path]  - 콘텐츠 수집
  node content-cache.js list             - 문서 목록
  node content-cache.js stats            - 통계
  node content-cache.js clear            - 캐시 초기화
    `);
  }
}

export default ContentCache;
