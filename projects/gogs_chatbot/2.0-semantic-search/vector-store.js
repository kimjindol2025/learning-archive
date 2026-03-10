/**
 * 벡터 저장소 모듈
 * 메타데이터 유지하며 벡터 관리
 */

/**
 * 벡터 저장소 생성
 */
export function createVectorStore() {
  return {
    vectors: [],        // Embedding 벡터 및 메타데이터
    index: {},          // chunkId → 벡터 위치 인덱스
    metadata: {},       // 빠른 메타데이터 검색
    createdAt: new Date().toISOString()
  };
}

/**
 * 벡터 저장소에 Embedding 추가
 */
export function addEmbedding(store, embedding) {
  const id = embedding.chunkId;

  // 중복 확인
  if (store.index[id]) {
    console.warn(`Embedding with ID ${id} already exists, updating...`);
    const oldIndex = store.index[id];
    store.vectors[oldIndex] = embedding;
  } else {
    store.index[id] = store.vectors.length;
    store.vectors.push(embedding);
  }

  // 메타데이터 인덱스
  store.metadata[id] = {
    version: embedding.version,
    phase: embedding.phase,
    fileName: embedding.fileName,
    filePath: embedding.filePath,
    repo: embedding.repo
  };
}

/**
 * 여러 Embedding 추가
 */
export function addEmbeddings(store, embeddings) {
  for (const emb of embeddings) {
    addEmbedding(store, emb);
  }
}

/**
 * 특정 Embedding 조회
 */
export function getEmbedding(store, chunkId) {
  const vectorIndex = store.index[chunkId];
  if (vectorIndex === undefined) {
    return null;
  }

  return store.vectors[vectorIndex];
}

/**
 * 특정 벡터 조회
 */
export function getVector(store, chunkId) {
  const emb = getEmbedding(store, chunkId);
  return emb ? emb.vector : null;
}

/**
 * 메타데이터 필터링
 */
export function filterByMetadata(store, filters = {}) {
  const filtered = [];

  for (const emb of store.vectors) {
    let match = true;

    if (filters.version && emb.version !== filters.version) {
      match = false;
    }

    if (filters.phase && emb.phase !== filters.phase) {
      match = false;
    }

    if (filters.fileName && emb.fileName !== filters.fileName) {
      match = false;
    }

    if (filters.repo && emb.repo !== filters.repo) {
      match = false;
    }

    if (match) {
      filtered.push(emb);
    }
  }

  return filtered;
}

/**
 * 저장소 통계
 */
export function getStoreStatistics(store) {
  if (store.vectors.length === 0) {
    return {
      totalVectors: 0,
      vectorDimension: 0,
      totalMemory: 0,
      uniqueVersions: 0,
      uniquePhases: 0,
      uniqueFiles: 0
    };
  }

  const versions = new Set();
  const phases = new Set();
  const files = new Set();

  let totalMemory = 0;

  for (const emb of store.vectors) {
    versions.add(emb.version);
    phases.add(emb.phase);
    files.add(emb.filePath);

    // 벡터 크기 계산 (float32 기준)
    totalMemory += emb.vector.length * 4;
  }

  return {
    totalVectors: store.vectors.length,
    vectorDimension: store.vectors[0].vector.length,
    totalMemory: totalMemory,
    memoryMB: (totalMemory / 1024 / 1024).toFixed(2),
    uniqueVersions: versions.size,
    uniquePhases: phases.size,
    uniqueFiles: files.size,
    versions: Array.from(versions),
    phases: Array.from(phases)
  };
}

/**
 * 저장소 검증
 */
export function validateStore(store) {
  const validations = {
    hasVectors: store.vectors.length > 0,
    indexConsistent: Object.keys(store.index).length === store.vectors.length,
    metadataConsistent: Object.keys(store.metadata).length === store.vectors.length,
    vectorsDimensionConsistent: true
  };

  if (store.vectors.length > 0) {
    const dim = store.vectors[0].vector.length;
    validations.vectorsDimensionConsistent = store.vectors.every(
      v => v.vector.length === dim
    );
  }

  return {
    isValid: Object.values(validations).every(v => v),
    validations: validations
  };
}

/**
 * 저장소 직렬화 (저장용)
 */
export function serializeStore(store) {
  return JSON.stringify({
    vectors: store.vectors.map(v => ({
      ...v,
      vector: Array.from(v.vector)
    })),
    index: store.index,
    metadata: store.metadata,
    createdAt: store.createdAt
  });
}

/**
 * 저장소 역직렬화 (로드용)
 */
export function deserializeStore(serialized) {
  const data = JSON.parse(serialized);

  return {
    vectors: data.vectors.map(v => ({
      ...v,
      vector: v.vector
    })),
    index: data.index,
    metadata: data.metadata,
    createdAt: data.createdAt
  };
}

/**
 * 저장소 통합 (여러 저장소 병합)
 */
export function mergeStores(store1, store2) {
  const merged = createVectorStore();
  merged.vectors = [...store1.vectors, ...store2.vectors];
  merged.index = { ...store1.index, ...store2.index };
  merged.metadata = { ...store1.metadata, ...store2.metadata };

  return merged;
}

/**
 * 저장소 검색 (메타데이터 기반)
 */
export function searchStore(store, query = {}) {
  const results = filterByMetadata(store, query);

  return {
    query: query,
    results: results,
    count: results.length,
    totalVectors: store.vectors.length,
    coverage: (results.length / store.vectors.length * 100).toFixed(1)
  };
}

/**
 * 포맷팅 (테스트용)
 */
export function formatStoreInfo(stats) {
  const lines = [];

  lines.push('📊 벡터 저장소 정보');
  lines.push(`   벡터 수: ${stats.totalVectors}개`);
  lines.push(`   차원: ${stats.vectorDimension}D`);
  lines.push(`   메모리: ${stats.memoryMB} MB`);
  lines.push(`   버전: ${stats.uniqueVersions}개`);
  lines.push(`   Phase: ${stats.uniquePhases}개`);
  lines.push(`   파일: ${stats.uniqueFiles}개`);

  return lines.join('\n');
}

export default {
  createVectorStore,
  addEmbedding,
  addEmbeddings,
  getEmbedding,
  getVector,
  filterByMetadata,
  getStoreStatistics,
  validateStore,
  serializeStore,
  deserializeStore,
  mergeStores,
  searchStore,
  formatStoreInfo
};
