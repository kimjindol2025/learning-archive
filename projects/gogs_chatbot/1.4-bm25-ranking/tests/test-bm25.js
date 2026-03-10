import tokenizer from '../tokenizer.js';
import indexBuilder from '../index-builder.js';
import bm25Scorer from '../bm25-scorer.js';
import searchBM25 from '../search-bm25.js';

console.log('\n🧪 BM25 통계 기반 랭킹 테스트 시작\n');

// 테스트 데이터
const testChunks = [
  {
    repo: 'freelang-v6',
    filePath: 'docs/spec.md',
    fileName: 'spec.md',
    version: 'v1.0',
    phase: 'Phase 1',
    chunkIndex: 0,
    totalChunks: 1,
    content: 'Memory model defines how variables are stored in memory. The memory model includes heap and stack. Variables are allocated in different regions based on their type and scope.'
  },
  {
    repo: 'freelang-v6',
    filePath: 'docs/ffi.md',
    fileName: 'ffi.md',
    version: 'v1.0',
    phase: 'Phase 2',
    chunkIndex: 0,
    totalChunks: 1,
    content: 'FFI allows external functions to be called. FFI provides bindings to C libraries. FFI is essential for integration.'
  },
  {
    repo: 'freelang-v6',
    filePath: 'docs/architecture.md',
    fileName: 'architecture.md',
    version: 'v2.0',
    phase: 'Phase 2',
    chunkIndex: 0,
    totalChunks: 1,
    content: 'System architecture redesign improves memory efficiency. The new architecture uses a unified memory model. Memory management is more efficient.'
  },
  {
    repo: 'freelang-v6',
    filePath: 'docs/api.md',
    fileName: 'api.md',
    version: 'v2.0',
    phase: 'Phase 3',
    chunkIndex: 0,
    totalChunks: 1,
    content: 'API design follows REST principles. The API provides endpoints for resource management. API versioning is supported.'
  }
];

/**
 * 테스트 1: 토큰화
 */
function testTokenization() {
  console.log('📝 테스트 1: 토큰화');

  const chunk = testChunks[0];
  const tokens = tokenizer.tokenize(chunk.content);
  const preprocessed = tokenizer.preprocess(chunk.content, { removeStops: true });

  console.log('✅ 성공');
  console.log(`   원본 토큰: ${tokens.length}개`);
  console.log(`   전처리 후: ${preprocessed.length}개`);
  console.log(`   불용어 제거됨: ${tokens.length - preprocessed.length}개`);
  console.log(`   샘플: ${tokenizer.formatTokens(preprocessed, 5)}`);
}

/**
 * 테스트 2: Chunk 전처리
 */
function testChunkPreprocessing() {
  console.log('\n📝 테스트 2: Chunk 전처리');

  const preprocessed = tokenizer.preprocessChunks(testChunks, {
    removeStops: true,
    normalize: true
  });

  console.log('✅ 성공');
  console.log(`   처리된 Chunk: ${preprocessed.length}개`);

  preprocessed.forEach((chunk, idx) => {
    console.log(`   ${idx + 1}. ${chunk.fileName}: ${chunk.termCount} 토큰, ${chunk.uniqueTerms} 고유`);
  });
}

/**
 * 테스트 3: Inverted Index 생성
 */
function testIndexBuilding() {
  console.log('\n📝 테스트 3: Inverted Index 생성');

  const preprocessed = tokenizer.preprocessChunks(testChunks);
  const index = indexBuilder.buildInvertedIndex(preprocessed);

  console.log('✅ 성공');
  console.log(`   생성된 Terms: ${Object.keys(index).length}개`);

  const sampleTerms = Object.entries(index)
    .slice(0, 3)
    .map(([term, entry]) => `${term}(df:${entry.df})`);

  console.log(`   샘플 Terms: ${sampleTerms.join(', ')}`);
}

/**
 * 테스트 4: IDF 계산
 */
function testIDFCalculation() {
  console.log('\n📝 테스트 4: IDF 계산');

  const preprocessed = tokenizer.preprocessChunks(testChunks);
  const index = indexBuilder.buildInvertedIndex(preprocessed);
  const idf = indexBuilder.calculateIDF(index, preprocessed.length);

  console.log('✅ 성공');
  console.log(`   계산된 IDF: ${Object.keys(idf).length}개`);

  const topIDFs = Object.entries(idf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  topIDFs.forEach(([term, value]) => {
    console.log(`   - ${term}: ${value.toFixed(2)}`);
  });
}

/**
 * 테스트 5: 인덱스 통계
 */
function testIndexStatistics() {
  console.log('\n📝 테스트 5: 인덱스 통계');

  const preprocessed = tokenizer.preprocessChunks(testChunks);
  const index = indexBuilder.buildInvertedIndex(preprocessed);
  const avgLength = indexBuilder.calculateAverageLength(preprocessed);
  const stats = indexBuilder.getIndexStatistics(index, preprocessed, avgLength);

  console.log('✅ 성공');
  console.log(indexBuilder.formatIndexStats(stats));
}

/**
 * 테스트 6: 단일 Term 점수
 */
function testSingleTermScore() {
  console.log('\n📝 테스트 6: 단일 Term 점수 (BM25)');

  const preprocessed = tokenizer.preprocessChunks(testChunks);
  const index = indexBuilder.buildInvertedIndex(preprocessed);
  const idf = indexBuilder.calculateIDF(index, preprocessed.length);
  const avgLength = indexBuilder.calculateAverageLength(preprocessed);

  // "memory" 단어의 점수
  const term = 'memory';
  const idfValue = idf[term];

  const chunk1 = preprocessed[0];
  const tf1 = chunk1.tfMap[term] || 0;

  if (tf1 > 0 && idfValue) {
    const score = bm25Scorer.scoreTerm(term, tf1, idfValue, chunk1.termCount, avgLength);
    console.log('✅ 성공');
    console.log(`   Term: "${term}"`);
    console.log(`   TF: ${tf1}`);
    console.log(`   IDF: ${idfValue.toFixed(2)}`);
    console.log(`   BM25 Score: ${score.toFixed(2)}`);
  }
}

/**
 * 테스트 7: Chunk 점수 계산
 */
function testChunkScoring() {
  console.log('\n📝 테스트 7: Chunk 점수 계산 (BM25)');

  const preprocessed = tokenizer.preprocessChunks(testChunks);
  const completeIndex = indexBuilder.buildCompleteIndex(preprocessed);
  const { index, idf, avgLength } = completeIndex;

  const queryTerms = ['memory', 'model'];
  const scored = bm25Scorer.scoreChunks(
    queryTerms,
    preprocessed,
    index,
    idf,
    avgLength
  );

  console.log('✅ 성공');
  console.log(`   쿼리 Terms: ${queryTerms.join(', ')}`);
  console.log(`   매치된 Chunk: ${scored.length}개`);

  scored.forEach((item, idx) => {
    console.log(`   ${idx + 1}. ${item.chunk.fileName}: ${item.score.toFixed(2)}`);
  });
}

/**
 * 테스트 8: 점수 분석
 */
function testScoreAnalysis() {
  console.log('\n📝 테스트 8: 점수 분석 (통계)');

  const preprocessed = tokenizer.preprocessChunks(testChunks);
  const completeIndex = indexBuilder.buildCompleteIndex(preprocessed);
  const { index, idf, avgLength } = completeIndex;

  const scored = bm25Scorer.scoreChunks(
    ['memory', 'architecture', 'ffi'],
    preprocessed,
    index,
    idf,
    avgLength
  );

  const analysis = bm25Scorer.analyzeScores(scored);

  console.log('✅ 성공');
  console.log(`   매치: ${analysis.count}개`);
  console.log(`   최소: ${analysis.min.toFixed(2)}`);
  console.log(`   최대: ${analysis.max.toFixed(2)}`);
  console.log(`   평균: ${analysis.avg.toFixed(2)}`);
  console.log(`   중앙: ${analysis.median.toFixed(2)}`);
  console.log(`   표준편차: ${analysis.stdDev.toFixed(2)}`);
}

/**
 * 테스트 9: Top-K 선택
 */
function testTopKSelection() {
  console.log('\n📝 테스트 9: Top-K 선택');

  const preprocessed = tokenizer.preprocessChunks(testChunks);
  const completeIndex = indexBuilder.buildCompleteIndex(preprocessed);
  const { index, idf, avgLength } = completeIndex;

  const scored = bm25Scorer.scoreChunks(
    ['memory', 'model'],
    preprocessed,
    index,
    idf,
    avgLength
  );

  const topK = bm25Scorer.selectTopK(scored, 3);

  console.log('✅ 성공');
  console.log(`   선택: ${topK.length}개 (K=3)`);

  topK.forEach((item, idx) => {
    console.log(`   ${idx + 1}. ${item.chunk.fileName}: ${item.score.toFixed(2)}`);
  });
}

/**
 * 테스트 10: 전체 BM25 검색
 */
function testCompleteBM25Search() {
  console.log('\n📝 테스트 10: 전체 BM25 검색 파이프라인');

  const result = searchBM25.searchBM25(testChunks, 'memory model', {
    k1: 1.5,
    b: 0.75,
    topK: 3,
    removeStops: true
  });

  console.log('✅ 성공');
  console.log(`   쿼리: "${result.query}"`);
  console.log(`   쿼리 Terms: ${result.queryTerms.join(', ')}`);
  console.log(`   총 매치: ${result.statistics.totalMatches}개`);
  console.log(`   선택: ${result.statistics.selectedCount}개`);

  result.results.forEach((item, idx) => {
    console.log(`   ${idx + 1}. ${item.chunk.fileName}: ${item.score.toFixed(2)}`);
  });
}

/**
 * 테스트 11: 필터 + BM25 검색
 */
function testFilteredBM25Search() {
  console.log('\n📝 테스트 11: 필터 + BM25 검색');

  const result = searchBM25.searchBM25WithFilters(
    testChunks,
    'memory architecture',
    { version: 'v2.0' },
    { topK: 3 }
  );

  console.log('✅ 성공');
  console.log(`   필터: version=v2.0`);
  console.log(`   총 Chunk: ${result.filterStatistics.totalChunks}개`);
  console.log(`   필터 후: ${result.filterStatistics.filteredChunks}개`);
  console.log(`   매치: ${result.statistics.totalMatches}개`);
}

/**
 * 테스트 12: Term 기여도 분석
 */
function testTermContributions() {
  console.log('\n📝 테스트 12: Term 기여도 분석');

  const preprocessed = tokenizer.preprocessChunks(testChunks);
  const completeIndex = indexBuilder.buildCompleteIndex(preprocessed);
  const { index, idf, avgLength } = completeIndex;

  const queryTerms = ['memory', 'model', 'ffi'];
  const scored = bm25Scorer.scoreChunks(
    queryTerms,
    preprocessed,
    index,
    idf,
    avgLength
  );

  const topChunks = scored.slice(0, 3);
  const contribs = bm25Scorer.analyzeTermContributions(
    queryTerms,
    topChunks,
    idf,
    avgLength
  );

  console.log('✅ 성공');

  Object.entries(contribs)
    .sort((a, b) => b[1].totalScore - a[1].totalScore)
    .forEach(([term, contrib]) => {
      console.log(`   ${term}:`);
      console.log(`   - IDF: ${contrib.idf.toFixed(2)}`);
      console.log(`   - 기여도: ${contrib.totalScore.toFixed(2)}`);
      console.log(`   - 나타난 Chunk: ${contrib.chunkCount}개`);
    });
}

/**
 * 모든 테스트 실행
 */
function runAllTests() {
  testTokenization();
  testChunkPreprocessing();
  testIndexBuilding();
  testIDFCalculation();
  testIndexStatistics();
  testSingleTermScore();
  testChunkScoring();
  testScoreAnalysis();
  testTopKSelection();
  testCompleteBM25Search();
  testFilteredBM25Search();
  testTermContributions();

  console.log('\n✨ 모든 테스트 완료\n');
}

// 테스트 실행
runAllTests();
