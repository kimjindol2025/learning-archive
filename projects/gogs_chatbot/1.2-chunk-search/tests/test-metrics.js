import chunk from '../chunk.js';
import scorer from '../scorer.js';
import metrics from '../metrics.js';

console.log('\n🧪 검증 지표 테스트 시작\n');

// 테스트 데이터
const testDocuments = [
  {
    path: 'docs/architecture.md',
    name: 'architecture.md',
    repo: 'project-v1',
    version: 'v1.2',
    phase: 'Phase 3',
    content: `# System Architecture

The system uses a microservices architecture with the following components:

## API Gateway
The API Gateway handles all incoming requests and routes them to appropriate services.

## Authentication Service
Manages user authentication using JWT tokens.

## Data Service
Handles all data operations including CRUD.

## Cache Layer
Redis-based caching for performance optimization.

## Message Queue
Kafka-based message queue for async operations.
`
  },
  {
    path: 'docs/installation.md',
    name: 'installation.md',
    repo: 'project-v1',
    version: 'v1.2',
    phase: 'Phase 1',
    content: `# Installation Guide

## Prerequisites
- Node.js 16+
- npm or yarn
- Docker (optional)

## Setup Steps
1. Clone the repository
2. Install dependencies: npm install
3. Configure environment variables
4. Run migrations: npm run migrate
5. Start the server: npm start

## Verification
Run tests to verify installation:
npm test
`
  },
  {
    path: 'docs/api-reference.md',
    name: 'api-reference.md',
    repo: 'project-v1',
    version: 'v1.3',
    phase: 'Phase 2',
    content: `# API Reference

## Authentication
POST /auth/login - User login
GET /auth/logout - User logout

## Users
GET /users - List users
POST /users - Create user
GET /users/:id - Get user details

## Data
GET /data - List data
POST /data - Create data
PUT /data/:id - Update data
DELETE /data/:id - Delete data

## Health
GET /health - System health check
`
  }
];

// Chunk 생성 및 인덱싱
const allChunks = chunk.createChunksFromFiles(testDocuments);
console.log(`📦 ${allChunks.length}개 Chunk 생성됨\n`);

/**
 * 테스트 1: 검색 및 메트릭 기본
 */
function testBasicMetrics() {
  console.log('📝 테스트 1: 기본 메트릭');

  const query = 'authentication setup';
  const searchResult = scorer.searchChunks(allChunks, query, {
    topK: 5,
    diversify: false,
    returnScores: true
  });

  console.log('✅ 성공');
  console.log(`   쿼리: "${query}"`);
  console.log(`   매치: ${searchResult.totalMatches}개`);
  console.log(`   선택: ${searchResult.selectedCount}개`);
  console.log(`   점수 범위: ${searchResult.statistics.min} ~ ${searchResult.statistics.max}`);
}

/**
 * 테스트 2: 정확도 지표
 */
function testAccuracyMetrics() {
  console.log('\n📝 테스트 2: 정확도 지표');

  const query = 'install dependencies npm';
  const searchResult = scorer.searchChunks(allChunks, query, { topK: 5, returnScores: true });
  const selectedChunks = searchResult.results.map(item => item.chunk);

  const relevance = metrics.calculateRelevanceScore(selectedChunks, query);
  const errorRate = metrics.calculateErrorRate(selectedChunks, query);
  const topKPerf = metrics.calculateTopKAccuracy(searchResult);

  console.log('✅ 성공');
  console.log(`   관련성 점수: ${relevance.toFixed(1)}%`);
  console.log(`   오류율: ${errorRate.toFixed(1)}%`);
  console.log(`   Top-5 평균 점수: ${topKPerf.avgScore}`);
  console.log(`   Top-5 최고 점수: ${topKPerf.maxScore}`);
}

/**
 * 테스트 3: 다양성 지표
 */
function testDiversityMetrics() {
  console.log('\n📝 테스트 3: 다양성 지표');

  const query = 'API service';
  const searchResult = scorer.searchChunks(allChunks, query, { topK: 5, returnScores: true });
  const selectedChunks = searchResult.results.map(item => item.chunk);

  const diversity = metrics.calculateDiversity(selectedChunks);

  console.log('✅ 성공');
  console.log(`   고유 파일: ${diversity.uniqueFiles}개 (${diversity.fileDiversity.toFixed(1)}%)`);
  console.log(`   고유 버전: ${diversity.uniqueVersions}개`);
  console.log(`   고유 Phase: ${diversity.uniquePhases}개`);
}

/**
 * 테스트 4: 커버리지 지표
 */
function testCoverageMetrics() {
  console.log('\n📝 테스트 4: 커버리지 지표');

  const query = 'database redis cache';
  const searchResult = scorer.searchChunks(allChunks, query, { topK: 5, returnScores: true });
  const selectedChunks = searchResult.results.map(item => item.chunk);

  const coverage = metrics.calculateCoverage(selectedChunks, allChunks);

  console.log('✅ 성공');
  console.log(`   Chunk 커버리지: ${coverage.chunkCoverage.toFixed(1)}%`);
  console.log(`   파일 커버리지: ${coverage.fileCoverage.toFixed(1)}%`);
}

/**
 * 테스트 5: 효율성 지표
 */
function testEfficiencyMetrics() {
  console.log('\n📝 테스트 5: 효율성 지표');

  const query = 'authentication jwt tokens';
  const searchResult = scorer.searchChunks(allChunks, query, { topK: 5, returnScores: true });
  const selectedChunks = searchResult.results.map(item => item.chunk);

  const efficiency = metrics.calculateEfficiency(selectedChunks);

  console.log('✅ 성공');
  console.log(`   총 바이트: ${efficiency.totalBytes}b`);
  console.log(`   총 단어: ${efficiency.totalWords}개`);
  console.log(`   예상 토큰: ${efficiency.estimatedTokens}개`);
  console.log(`   평균 Chunk 크기: ${efficiency.avgChunkSize}b`);
  console.log(`   토큰 효율성: ${efficiency.tokenEfficiency}%`);
}

/**
 * 테스트 6: 종합 메트릭 보고서
 */
function testComprehensiveReport() {
  console.log('\n📝 테스트 6: 종합 메트릭 보고서');

  const query = 'installation setup npm dependencies';
  const searchResult = scorer.searchChunks(allChunks, query, { topK: 5, returnScores: true });

  const report = metrics.generateMetricsReport(searchResult, allChunks, query);

  console.log('✅ 성공');
  console.log(metrics.formatMetricsReport(report));
}

/**
 * 테스트 7: 메트릭 비교
 */
function testMetricsComparison() {
  console.log('\n📝 테스트 7: 메트릭 비교 (두 검색 결과)');

  // 첫 번째 검색
  const query1 = 'authentication';
  const result1 = scorer.searchChunks(allChunks, query1, { topK: 5, returnScores: true });
  const report1 = metrics.generateMetricsReport(result1, allChunks, query1);

  // 두 번째 검색 (더 구체적)
  const query2 = 'JWT authentication tokens service';
  const result2 = scorer.searchChunks(allChunks, query2, { topK: 5, returnScores: true });
  const report2 = metrics.generateMetricsReport(result2, allChunks, query2);

  const comparison = metrics.compareMetrics(report1, report2);

  console.log('✅ 성공');
  console.log(`   검색 1: "${comparison.query1}"`);
  console.log(`   검색 2: "${comparison.query2}"`);
  console.log(`\n   비교 결과:`);
  console.log(`   정확도: ${comparison.comparison.accuracy.delta > 0 ? '+' : ''}${comparison.comparison.accuracy.delta}% (${comparison.comparison.accuracy.improved ? '개선' : '악화'})`);
  console.log(`   오류율: ${comparison.comparison.errorRate.delta > 0 ? '+' : ''}${comparison.comparison.errorRate.delta}% (${comparison.comparison.errorRate.improved ? '개선' : '악화'})`);
  console.log(`   종합점수: ${comparison.comparison.overall.delta > 0 ? '+' : ''}${comparison.comparison.overall.delta} (${comparison.comparison.overall.improved ? '개선' : '악화'})`);
}

/**
 * 테스트 8: 다양성 검색 vs 순서 검색
 */
function testDiversifyComparison() {
  console.log('\n📝 테스트 8: 다양성 검색 vs 순서 검색');

  const query = 'API service';

  // 순서대로 선택
  const result1 = scorer.searchChunks(allChunks, query, {
    topK: 5,
    diversify: false,
    returnScores: true
  });
  const chunks1 = result1.results.map(item => item.chunk);
  const diversity1 = metrics.calculateDiversity(chunks1);

  // 다양성 고려
  const result2 = scorer.searchChunks(allChunks, query, {
    topK: 5,
    diversify: true,
    returnScores: true
  });
  const chunks2 = result2.results.map(item => item.chunk);
  const diversity2 = metrics.calculateDiversity(chunks2);

  console.log('✅ 성공');
  console.log(`   순서대로 선택:`);
  console.log(`   - 파일 다양성: ${diversity1.fileDiversity.toFixed(1)}%`);
  console.log(`   - Phase 다양성: ${diversity1.phaseDiversity.toFixed(1)}%`);

  console.log(`\n   다양성 고려:`);
  console.log(`   - 파일 다양성: ${diversity2.fileDiversity.toFixed(1)}%`);
  console.log(`   - Phase 다양성: ${diversity2.phaseDiversity.toFixed(1)}%`);

  console.log(`\n   개선: 파일 +${(diversity2.fileDiversity - diversity1.fileDiversity).toFixed(1)}%`);
}

/**
 * 모든 테스트 실행
 */
function runAllTests() {
  testBasicMetrics();
  testAccuracyMetrics();
  testDiversityMetrics();
  testCoverageMetrics();
  testEfficiencyMetrics();
  testComprehensiveReport();
  testMetricsComparison();
  testDiversifyComparison();

  console.log('\n✨ 모든 테스트 완료\n');
}

// 테스트 실행
runAllTests();
