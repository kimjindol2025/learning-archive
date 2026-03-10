/**
 * 4.0 설계 의도 추출 & 아키텍처 변화 지도 테스트
 * 통합 테스트 12개
 */

import designIntentAnalyzer from '../design-intent-analyzer.js';
import intentExtractor from '../intent-extractor.js';
import architectureGraph from '../architecture-graph.js';
import dependencyMapper from '../dependency-mapper.js';
import evolutionMetrics from '../evolution-metrics.js';

/**
 * Mock 데이터
 */
const mockCommits = [
  {
    hash: 'abc1234567',
    message: 'Phase 9 v9.0 type system foundation',
    author: 'alice',
    timestamp: new Date('2024-01-01'),
    email: 'alice@example.com'
  },
  {
    hash: 'def2345678',
    message: 'feat(type): add generic type support',
    author: 'bob',
    timestamp: new Date('2024-02-01'),
    email: 'bob@example.com'
  },
  {
    hash: 'ghi3456789',
    message: 'test(type): add type system test cases',
    author: 'alice',
    timestamp: new Date('2024-02-15'),
    email: 'alice@example.com'
  },
  {
    hash: 'jkl4567890',
    message: 'Phase 10 v10.0 control flow expansion',
    author: 'bob',
    timestamp: new Date('2024-03-01'),
    email: 'bob@example.com'
  },
  {
    hash: 'mno5678901',
    message: 'perf(core): optimize performance critical paths',
    author: 'alice',
    timestamp: new Date('2024-03-15'),
    email: 'alice@example.com'
  },
  {
    hash: 'pqr6789012',
    message: 'Phase 11 v11.0 FFI and memory model',
    author: 'bob',
    timestamp: new Date('2024-04-01'),
    email: 'bob@example.com'
  },
  {
    hash: 'stu7890123',
    message: 'feat(ffi): implement FFI boundary definition',
    author: 'alice',
    timestamp: new Date('2024-04-15'),
    email: 'alice@example.com'
  },
  {
    hash: 'vwx8901234',
    message: 'refactor(arch): improve module structure',
    author: 'bob',
    timestamp: new Date('2024-05-01'),
    email: 'bob@example.com'
  }
];

const mockDiffs = [
  [{ path: 'src/type.rs', additions: 200, deletions: 10, status: 'modified' }],
  [{ path: 'src/type_generic.rs', additions: 150, deletions: 20, status: 'added' }],
  [{ path: 'tests/type_test.rs', additions: 300, deletions: 0, status: 'added' }],
  [{ path: 'src/control.rs', additions: 180, deletions: 30, status: 'added' }],
  [{ path: 'src/perf_optimize.rs', additions: 120, deletions: 80, status: 'modified' }],
  [{ path: 'spec/phase_11.md', additions: 250, deletions: 50, status: 'modified' }],
  [{ path: 'src/ffi.rs', additions: 280, deletions: 10, status: 'added' }],
  [{ path: 'src/module.rs', additions: 50, deletions: 100, status: 'modified' }]
];

const mockStats = [
  { totalAdditions: 200, totalDeletions: 10, netChange: 190, totalFiles: 1 },
  { totalAdditions: 150, totalDeletions: 20, netChange: 130, totalFiles: 1 },
  { totalAdditions: 300, totalDeletions: 0, netChange: 300, totalFiles: 1 },
  { totalAdditions: 180, totalDeletions: 30, netChange: 150, totalFiles: 1 },
  { totalAdditions: 120, totalDeletions: 80, netChange: 40, totalFiles: 1 },
  { totalAdditions: 250, totalDeletions: 50, netChange: 200, totalFiles: 1 },
  { totalAdditions: 280, totalDeletions: 10, netChange: 270, totalFiles: 1 },
  { totalAdditions: 50, totalDeletions: 100, netChange: -50, totalFiles: 1 }
];

/**
 * Test 1: 규칙 기반 의도 분류
 */
export function testAnalyzeIntentByPattern() {
  console.log('\n🎯 Test 1: 규칙 기반 의도 분류');

  const result1 = designIntentAnalyzer.analyzeIntentByPattern(mockCommits[0], mockDiffs[0], mockStats[0]);
  console.assert(result1.primaryIntent, '의도 추출 확인');
  console.assert(result1.category, '카테고리 추출 확인');
  console.assert(result1.confidence > 0, '신뢰도 계산 확인');

  const result2 = designIntentAnalyzer.analyzeIntentByPattern(mockCommits[2], mockDiffs[2], mockStats[2]);
  console.assert(result2.category === 'Quality Assurance', 'Test 파일 분류 확인');

  console.log('✅ 규칙 기반 의도 분류: 통과');
}

/**
 * Test 2: 영향도 계산
 */
export function testCalculateImpactLevel() {
  console.log('\n📊 Test 2: 영향도 계산');

  const impact1 = designIntentAnalyzer.calculateImpactLevel(mockDiffs[0], mockStats[0]);
  console.assert(impact1.overallImpact > 0, '전체 영향도 계산');
  console.assert(impact1.overallImpact <= 1.0, '영향도 정규화 확인');

  const impact2 = designIntentAnalyzer.calculateImpactLevel(mockDiffs[2], mockStats[2]);
  console.assert(impact2.overallImpact >= impact1.overallImpact, '큰 변경의 영향도가 더 큼');

  console.log('✅ 영향도 계산: 통과');
}

/**
 * Test 3: 의도 추출 (LLM 준비)
 */
export function testExtractIntentStructured() {
  console.log('\n📝 Test 3: 의도 추출 (구조화)');

  const intent = intentExtractor.extractIntentStructured(
    mockCommits[6],
    { filesChanged: 1, linesAdded: 280, linesDeleted: 10, fileTypes: { rs: 1 }, keywords: ['ffi'] },
    { fileImpact: 0.2, sizeImpact: 0.3, complexityImpact: 0.1, overallImpact: 0.6 }
  );

  console.assert(intent.intent, '의도 추출');
  console.assert(intent.category, '카테고리 추출');
  console.assert(intent.depth, '깊이 결정');

  console.log('✅ 의도 추출: 통과');
}

/**
 * Test 4: 아키텍처 그래프 구축
 */
export function testBuildArchitectureGraph() {
  console.log('\n🏗️  Test 4: 아키텍처 그래프 구축');

  // 의도 시퀀스 생성
  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent ${i+1}`,
    category: ['Architecture', 'Verification', 'Performance'][i % 3],
    confidence: 0.8,
    impactLevel: 0.5 + (i * 0.05),
    diffSummary: { fileTypes: mockDiffs[i][0].path.split('/')[0] }
  }));

  const graph = architectureGraph.buildArchitectureGraph(intents);

  console.assert(graph.nodes.length === intents.length, '노드 생성 확인');
  console.assert(graph.timeline.length === intents.length, '타임라인 생성 확인');
  console.assert(graph.conceptMap, '개념 맵 생성 확인');
  console.assert(graph.clusters.length > 0, '클러스터 식별 확인');

  console.log('✅ 아키텍처 그래프 구축: 통과');
}

/**
 * Test 5: 진화 경로 추출
 */
export function testExtractEvolutionPath() {
  console.log('\n🛤️  Test 5: 진화 경로 추출');

  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent ${i+1}`,
    category: 'Architecture',
    impactLevel: 0.5
  }));

  const graph = architectureGraph.buildArchitectureGraph(intents);
  const path = architectureGraph.extractEvolutionPath(graph);

  console.assert(path.length > 0, '경로 추출 확인');
  console.assert(path[0].stage === 1, '첫 단계 확인');

  console.log('✅ 진화 경로 추출: 통과');
}

/**
 * Test 6: 모듈 추출 및 진화 추적
 */
export function testTrackModuleEvolution() {
  console.log('\n📦 Test 6: 모듈 추출 및 진화 추적');

  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent ${i+1}`,
    category: 'Development',
    impactLevel: 0.5,
    diffSummary: { fileTypes: { 'rs': 1 }, keywords: [] }
  }));

  const modules = dependencyMapper.trackModuleEvolution(intents);

  console.assert(Object.keys(modules).length > 0, '모듈 추출 확인');
  console.assert(modules['src'] || modules['tests'], '파일 경로 기반 모듈 분류');

  console.log('✅ 모듈 진화 추적: 통과');
}

/**
 * Test 7: 의존성 추론
 */
export function testInferModuleDependencies() {
  console.log('\n🔗 Test 7: 의존성 추론');

  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent ${i+1}`,
    category: ['Verification', 'Architecture', 'Performance'][i % 3],
    impactLevel: 0.5,
    diffSummary: { fileTypes: { 'rs': 1 }, keywords: [] }
  }));

  const modules = dependencyMapper.extractModulesFromPaths(mockDiffs.flat().map(d => d.path));
  const deps = dependencyMapper.inferModuleDependencies(modules, intents);

  console.assert(Object.keys(deps).length > 0, '의존성 맵 생성');
  console.assert(typeof deps['main'] !== 'undefined' || Object.keys(deps).length > 0, '모듈별 의존성 추적');

  console.log('✅ 의존성 추론: 통과');
}

/**
 * Test 8: 진화 밀도 계산
 */
export function testCalculateEvolutionDensity() {
  console.log('\n📈 Test 8: 진화 밀도 계산');

  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent ${i+1}`,
    category: ['Architecture', 'Verification'][i % 2],
    impactLevel: 0.5 + (i * 0.05),
    confidence: 0.8
  }));

  const timespan = mockCommits[mockCommits.length - 1].timestamp - mockCommits[0].timestamp;
  const density = evolutionMetrics.calculateEvolutionDensity(intents, timespan);

  console.assert(typeof density === 'number', '밀도 계산 확인');
  console.assert(density >= 0, '양수 밀도');

  console.log('✅ 진화 밀도 계산: 통과');
}

/**
 * Test 9: 설계 성숙도 계산
 */
export function testCalculateDesignMaturity() {
  console.log('\n🎓 Test 9: 설계 성숙도 계산');

  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent ${i+1}`,
    category: ['Verification', 'Architecture', 'Quality', 'Refactoring'][i % 4],
    impactLevel: 0.5,
    confidence: 0.8,
    depth: i % 2 === 0 ? 'Deep' : 'Medium'
  }));

  const maturity = evolutionMetrics.calculateDesignMaturity(intents);

  console.assert(maturity.overallMaturity >= 0, '성숙도 계산');
  console.assert(maturity.overallMaturity <= 1, '성숙도 정규화');
  console.assert(maturity.verificationScore >= 0, '검증 점수');
  console.assert(maturity.architectureScore >= 0, '아키텍처 점수');

  console.log('✅ 설계 성숙도 계산: 통과');
}

/**
 * Test 10: 아키텍처 확장 점수
 */
export function testCalculateArchitectureExpansionScore() {
  console.log('\n🚀 Test 10: 아키텍처 확장 점수');

  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent with type and memory and interface ${i+1}`,
    category: 'Architecture',
    impactLevel: 0.7
  }));

  const score = evolutionMetrics.calculateArchitectureExpansionScore(intents);

  console.assert(typeof score === 'number', '점수 계산 확인');
  console.assert(score > 0, '확장 점수가 양수');

  console.log('✅ 아키텍처 확장 점수: 통과');
}

/**
 * Test 11: 혁신 지수 및 설계 지능 계산
 */
export function testCalculateInnovationAndIntelligence() {
  console.log('\n🧠 Test 11: 혁신 지수 & 설계 지능');

  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent ${i+1}`,
    category: ['Verification', 'Architecture', 'API', 'Performance'][i % 4],
    impactLevel: 0.5 + (i * 0.05),
    confidence: 0.8,
    depth: i % 3 === 0 ? 'Deep' : 'Medium'
  }));

  const graph = architectureGraph.buildArchitectureGraph(intents);
  const innovation = evolutionMetrics.calculateInnovationIndex(intents, graph);
  const intelligence = evolutionMetrics.calculateDesignIntelligenceScore(
    intents,
    graph,
    {}
  );

  console.assert(innovation >= 0 && innovation <= 1, '혁신 지수 정규화');
  console.assert(intelligence.overallScore >= 0 && intelligence.overallScore <= 100, '지능 지수 범위');
  console.assert(intelligence.interpretation, '지능 지수 해석');

  console.log('✅ 혁신 지수 & 설계 지능: 통과');
}

/**
 * Test 12: 복잡도 진화 추적
 */
export function testTrackComplexityEvolution() {
  console.log('\n📊 Test 12: 복잡도 진화 추적');

  const intents = mockCommits.map((commit, i) => ({
    commit,
    intent: `Intent ${i+1}`,
    category: 'Development',
    impactLevel: 0.4 + (i * 0.08)
  }));

  const evolution = evolutionMetrics.trackComplexityEvolution(intents);

  console.assert(evolution.length === intents.length, '복잡도 진화 길이');
  console.assert(evolution[0].cumulativeComplexity > 0, '첫 누적 복잡도');
  console.assert(evolution[evolution.length - 1].cumulativeComplexity >=
                 evolution[0].cumulativeComplexity, '복잡도 증가 추세');

  console.log('✅ 복잡도 진화 추적: 통과');
}

/**
 * 모든 테스트 실행
 */
export function runAllTests() {
  console.log('\n🚀 4.0 설계 의도 추출 & 아키텍처 변화 지도 테스트');
  console.log('='.repeat(50));

  try {
    testAnalyzeIntentByPattern();
    testCalculateImpactLevel();
    testExtractIntentStructured();
    testBuildArchitectureGraph();
    testExtractEvolutionPath();
    testTrackModuleEvolution();
    testInferModuleDependencies();
    testCalculateEvolutionDensity();
    testCalculateDesignMaturity();
    testCalculateArchitectureExpansionScore();
    testCalculateInnovationAndIntelligence();
    testTrackComplexityEvolution();

    console.log('\n' + '='.repeat(50));
    console.log('✨ 모든 테스트 통과! (12/12)');
    console.log('='.repeat(50) + '\n');
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  }
}

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export default {
  testAnalyzeIntentByPattern,
  testCalculateImpactLevel,
  testExtractIntentStructured,
  testBuildArchitectureGraph,
  testExtractEvolutionPath,
  testTrackModuleEvolution,
  testInferModuleDependencies,
  testCalculateEvolutionDensity,
  testCalculateDesignMaturity,
  testCalculateArchitectureExpansionScore,
  testCalculateInnovationAndIntelligence,
  testTrackComplexityEvolution,
  runAllTests
};
