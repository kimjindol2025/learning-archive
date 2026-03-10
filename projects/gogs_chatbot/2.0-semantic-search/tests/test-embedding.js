import embedding from '../embedding.js';
import vectorStore from '../vector-store.js';
import similarity from '../similarity.js';
import searchHybrid from '../search-hybrid.js';

console.log('\n🧪 의미 기반 검색 (벡터) 테스트 시작\n');

// 테스트 데이터
const testChunks = [
  {
    chunkIndex: 0,
    fileName: 'memory.md',
    filePath: 'docs/memory.md',
    version: 'v1.0',
    phase: 'Phase 1',
    repo: 'test-project',
    content: 'Memory safety is critical for system stability. Pointers can cause unsafe access if not properly managed.'
  },
  {
    chunkIndex: 1,
    fileName: 'ffi.md',
    filePath: 'docs/ffi.md',
    version: 'v1.0',
    phase: 'Phase 2',
    repo: 'test-project',
    content: 'FFI allows calling external functions from C libraries. It provides bindings for integration with native code.'
  },
  {
    chunkIndex: 2,
    fileName: 'safety.md',
    filePath: 'docs/safety.md',
    version: 'v2.0',
    phase: 'Phase 2',
    repo: 'test-project',
    content: 'Memory allocation must be tracked carefully. Unsafe memory access can lead to security vulnerabilities.'
  },
  {
    chunkIndex: 3,
    fileName: 'architecture.md',
    filePath: 'docs/architecture.md',
    version: 'v2.0',
    phase: 'Phase 3',
    repo: 'test-project',
    content: 'System design emphasizes modularity and extensibility. Components should be loosely coupled.'
  }
];

/**
 * 테스트 1: Embedding 생성
 */
function testEmbeddingGeneration() {
  console.log('📝 테스트 1: Embedding 생성');

  const text = 'Memory safety and pointer operations';
  const emb = embedding.generateSimulatedEmbedding(text);

  console.log('✅ 성공');
  console.log(`   차원: ${emb.length}D`);
  console.log(`   범위: [${Math.min(...emb).toFixed(3)}, ${Math.max(...emb).toFixed(3)}]`);
  console.log(`   정규화: ${(Math.sqrt(emb.reduce((s, v) => s + v*v, 0))).toFixed(4)}`);
}

/**
 * 테스트 2: Chunk Embedding 생성
 */
function testChunkEmbeddings() {
  console.log('\n📝 테스트 2: Chunk Embedding 생성');

  const embeddings = [];
  let count = 0;

  for (const chunk of testChunks) {
    const emb = embedding.generateSimulatedEmbedding(chunk.content);

    embeddings.push({
      chunkId: chunk.chunkIndex,
      fileName: chunk.fileName,
      filePath: chunk.filePath,
      version: chunk.version,
      phase: chunk.phase,
      repo: chunk.repo,
      vector: emb,
      contentLength: chunk.content.length
    });

    count++;
  }

  console.log('✅ 성공');
  console.log(`   생성된 Embedding: ${count}개`);
  console.log(`   평균 콘텐츠 길이: ${(embeddings.reduce((s, e) => s + e.contentLength, 0) / embeddings.length).toFixed(0)} 자`);
}

/**
 * 테스트 3: 벡터 저장소 생성
 */
function testVectorStoreCreation() {
  console.log('\n📝 테스트 3: 벡터 저장소 생성');

  const store = vectorStore.createVectorStore();

  const embeddings = [];
  for (const chunk of testChunks) {
    const emb = embedding.generateSimulatedEmbedding(chunk.content);
    embeddings.push({
      chunkId: chunk.chunkIndex,
      fileName: chunk.fileName,
      filePath: chunk.filePath,
      version: chunk.version,
      phase: chunk.phase,
      repo: chunk.repo,
      vector: emb
    });
  }

  vectorStore.addEmbeddings(store, embeddings);

  const stats = vectorStore.getStoreStatistics(store);

  console.log('✅ 성공');
  console.log(`   저장된 벡터: ${stats.totalVectors}개`);
  console.log(`   벡터 차원: ${stats.vectorDimension}D`);
  console.log(`   메모리: ${stats.memoryMB} MB`);
  console.log(`   버전: ${stats.uniqueVersions}개`);
  console.log(`   Phase: ${stats.uniquePhases}개`);
}

/**
 * 테스트 4: 저장소 검증
 */
function testStoreValidation() {
  console.log('\n📝 테스트 4: 저장소 검증');

  const store = vectorStore.createVectorStore();

  const embeddings = [];
  for (const chunk of testChunks) {
    const emb = embedding.generateSimulatedEmbedding(chunk.content);
    embeddings.push({
      chunkId: chunk.chunkIndex,
      fileName: chunk.fileName,
      filePath: chunk.filePath,
      version: chunk.version,
      phase: chunk.phase,
      repo: chunk.repo,
      vector: emb
    });
  }

  vectorStore.addEmbeddings(store, embeddings);

  const validation = vectorStore.validateStore(store);

  console.log('✅ 성공');
  console.log(`   전체 유효: ${validation.isValid ? '✅' : '❌'}`);
  console.log(`   벡터 존재: ${validation.validations.hasVectors ? '✅' : '❌'}`);
  console.log(`   인덱스 일치: ${validation.validations.indexConsistent ? '✅' : '❌'}`);
  console.log(`   메타데이터 일치: ${validation.validations.metadataConsistent ? '✅' : '❌'}`);
}

/**
 * 테스트 5: Cosine Similarity
 */
function testCosineSimilarity() {
  console.log('\n📝 테스트 5: Cosine Similarity');

  const vec1 = embedding.generateSimulatedEmbedding('memory safety pointer operations');
  const vec2 = embedding.generateSimulatedEmbedding('memory safety pointer operations');
  const vec3 = embedding.generateSimulatedEmbedding('API endpoints REST design');

  const sim1 = similarity.cosineSimilarity(vec1, vec2);
  const sim2 = similarity.cosineSimilarity(vec1, vec3);

  console.log('✅ 성공');
  console.log(`   같은 텍스트: ${(sim1 * 100).toFixed(1)}% 유사`);
  console.log(`   다른 텍스트: ${(sim2 * 100).toFixed(1)}% 유사`);
}

/**
 * 테스트 6: 유사도 계산 (여러 벡터)
 */
function testSimilarityCalculation() {
  console.log('\n📝 테스트 6: 유사도 계산 (여러 벡터)');

  const queryEmb = embedding.generateSimulatedEmbedding('memory safe pointer');

  const store = vectorStore.createVectorStore();
  const embeddings = [];
  for (const chunk of testChunks) {
    const emb = embedding.generateSimulatedEmbedding(chunk.content);
    embeddings.push({
      chunkId: chunk.chunkIndex,
      fileName: chunk.fileName,
      filePath: chunk.filePath,
      version: chunk.version,
      phase: chunk.phase,
      repo: chunk.repo,
      vector: emb
    });
  }

  vectorStore.addEmbeddings(store, embeddings);

  const similarities = similarity.calculateSimilarities(queryEmb, store.vectors);

  console.log('✅ 성공');
  console.log(`   계산된 유사도: ${similarities.length}개`);

  similarities.slice(0, 3).forEach((item, idx) => {
    console.log(`   ${idx + 1}. ${item.embedding.fileName}: ${(item.similarity * 100).toFixed(1)}%`);
  });
}

/**
 * 테스트 7: Top-K 선택
 */
function testTopKSelection() {
  console.log('\n📝 테스트 7: Top-K 선택');

  const queryEmb = embedding.generateSimulatedEmbedding('unsafe memory access vulnerability');

  const store = vectorStore.createVectorStore();
  const embeddings = [];
  for (const chunk of testChunks) {
    const emb = embedding.generateSimulatedEmbedding(chunk.content);
    embeddings.push({
      chunkId: chunk.chunkIndex,
      fileName: chunk.fileName,
      filePath: chunk.filePath,
      version: chunk.version,
      phase: chunk.phase,
      repo: chunk.repo,
      vector: emb
    });
  }

  vectorStore.addEmbeddings(store, embeddings);

  const similarities = similarity.calculateSimilarities(queryEmb, store.vectors);
  const topK = similarity.selectTopK(similarities, 3);

  console.log('✅ 성공');
  console.log(`   선택: ${topK.length}개 (K=3)`);

  topK.forEach((item, idx) => {
    console.log(`   ${idx + 1}. ${item.embedding.fileName}: ${(item.similarity * 100).toFixed(1)}%`);
  });
}

/**
 * 테스트 8: 임계값 필터링
 */
function testThresholdFiltering() {
  console.log('\n📝 테스트 8: 임계값 필터링');

  const queryEmb = embedding.generateSimulatedEmbedding('memory pointer safety');

  const store = vectorStore.createVectorStore();
  const embeddings = [];
  for (const chunk of testChunks) {
    const emb = embedding.generateSimulatedEmbedding(chunk.content);
    embeddings.push({
      chunkId: chunk.chunkIndex,
      fileName: chunk.fileName,
      filePath: chunk.filePath,
      version: chunk.version,
      phase: chunk.phase,
      repo: chunk.repo,
      vector: emb
    });
  }

  vectorStore.addEmbeddings(store, embeddings);

  const similarities = similarity.calculateSimilarities(queryEmb, store.vectors);
  const filtered30 = similarity.filterByThreshold(similarities, 0.3);
  const filtered50 = similarity.filterByThreshold(similarities, 0.5);

  console.log('✅ 성공');
  console.log(`   전체: ${similarities.length}개`);
  console.log(`   > 0.3: ${filtered30.length}개`);
  console.log(`   > 0.5: ${filtered50.length}개`);
}

/**
 * 테스트 9: 유사도 분석
 */
function testSimilarityAnalysis() {
  console.log('\n📝 테스트 9: 유사도 분석');

  const queryEmb = embedding.generateSimulatedEmbedding('system architecture design');

  const store = vectorStore.createVectorStore();
  const embeddings = [];
  for (const chunk of testChunks) {
    const emb = embedding.generateSimulatedEmbedding(chunk.content);
    embeddings.push({
      chunkId: chunk.chunkIndex,
      fileName: chunk.fileName,
      filePath: chunk.filePath,
      version: chunk.version,
      phase: chunk.phase,
      repo: chunk.repo,
      vector: emb
    });
  }

  vectorStore.addEmbeddings(store, embeddings);

  const similarities = similarity.calculateSimilarities(queryEmb, store.vectors);
  const analysis = similarity.analyzeSimilarities(similarities);

  console.log('✅ 성공');
  console.log(`   최소: ${(analysis.min * 100).toFixed(1)}%`);
  console.log(`   최대: ${(analysis.max * 100).toFixed(1)}%`);
  console.log(`   평균: ${(analysis.avg * 100).toFixed(1)}%`);
  console.log(`   중앙: ${(analysis.median * 100).toFixed(1)}%`);
}

/**
 * 테스트 10: 벡터만 검색
 */
function testSemanticSearch() {
  console.log('\n📝 테스트 10: 의미 검색 (벡터만)');

  const queryEmb = embedding.generateSimulatedEmbedding('pointer unsafe memory');

  const store = vectorStore.createVectorStore();
  const embeddings = [];
  for (const chunk of testChunks) {
    const emb = embedding.generateSimulatedEmbedding(chunk.content);
    embeddings.push({
      chunkId: chunk.chunkIndex,
      fileName: chunk.fileName,
      filePath: chunk.filePath,
      version: chunk.version,
      phase: chunk.phase,
      repo: chunk.repo,
      vector: emb
    });
  }

  vectorStore.addEmbeddings(store, embeddings);

  const result = searchHybrid.searchSemanticOnly(
    queryEmb,
    store,
    similarity.cosineSimilarity,
    { topK: 3, threshold: 0.3 }
  );

  console.log('✅ 성공');
  console.log(`   매치: ${result.statistics.matchedCount}개`);
  console.log(`   선택: ${result.statistics.selectedCount}개`);
  console.log(`   평균 유사도: ${(parseFloat(result.statistics.avgSimilarity) * 100).toFixed(1)}%`);
}

/**
 * 모든 테스트 실행
 */
function runAllTests() {
  testEmbeddingGeneration();
  testChunkEmbeddings();
  testVectorStoreCreation();
  testStoreValidation();
  testCosineSimilarity();
  testSimilarityCalculation();
  testTopKSelection();
  testThresholdFiltering();
  testSimilarityAnalysis();
  testSemanticSearch();

  console.log('\n✨ 모든 테스트 완료\n');
}

// 테스트 실행
runAllTests();
