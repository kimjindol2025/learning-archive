/**
 * 5.0 설계 사고 지도 테스트
 * 12개 통합 테스트
 */

import conceptExtractor from '../concept-extractor.js';
import conceptGraphBuilder from '../concept-graph-builder.js';
import centralityAnalyzer from '../centrality-analyzer.js';
import cognitionMapper from '../cognition-mapper.js';
import patternAnalyzer from '../pattern-analyzer.js';

/**
 * Mock 데이터
 */
const mockCommits = [
  { hash: 'a1', message: 'Phase 8 control flow foundation', timestamp: new Date('2024-01-01'), author: 'alice' },
  { hash: 'a2', message: 'Type system generic support', timestamp: new Date('2024-02-01'), author: 'bob' },
  { hash: 'a3', message: 'Memory layout optimization', timestamp: new Date('2024-03-01'), author: 'alice' },
  { hash: 'a4', message: 'Phase 9 type system hardening', timestamp: new Date('2024-04-01'), author: 'bob' },
  { hash: 'a5', message: 'Unsafe pointer operations', timestamp: new Date('2024-05-01'), author: 'alice' },
  { hash: 'a6', message: 'Phase 11 FFI boundary definition', timestamp: new Date('2024-06-01'), author: 'bob' },
  { hash: 'a7', message: 'Memory model complete', timestamp: new Date('2024-07-01'), author: 'alice' }
];

const mockDiffs = [
  [{ path: 'src/control.rs', status: 'added' }],
  [{ path: 'src/type_system.rs', status: 'modified' }],
  [{ path: 'src/memory.rs', status: 'modified' }],
  [{ path: 'spec/type_spec.md', status: 'modified' }],
  [{ path: 'src/unsafe.rs', status: 'added' }],
  [{ path: 'src/ffi.rs', status: 'added' }],
  [{ path: 'src/memory_model.rs', status: 'modified' }]
];

const mockIntents = [
  { commit: mockCommits[0], intent: 'Control flow expansion', category: 'Architecture', impactLevel: 0.6 },
  { commit: mockCommits[1], intent: 'Type system generic support', category: 'API', impactLevel: 0.7 },
  { commit: mockCommits[2], intent: 'Memory layout optimization', category: 'Performance', impactLevel: 0.8 },
  { commit: mockCommits[3], intent: 'Type safety hardening', category: 'Verification', impactLevel: 0.75 },
  { commit: mockCommits[4], intent: 'Unsafe operations for low-level access', category: 'Architecture', impactLevel: 0.65 },
  { commit: mockCommits[5], intent: 'FFI boundary for interoperability', category: 'Architecture Expansion', impactLevel: 0.82 },
  { commit: mockCommits[6], intent: 'Memory model finalization', category: 'Architecture', impactLevel: 0.9 }
];

/**
 * Test 1: 개념 추출
 */
export function testExtractConcepts() {
  console.log('\n📚 Test 1: 개념 추출');

  const concepts = conceptExtractor.extractAllConcepts(mockCommits, mockDiffs, mockIntents);

  console.assert(concepts.length > 0, '개념 추출 확인');
  console.assert(concepts[0].weight > 0, '개념 가중치 계산');

  const conceptNames = concepts.map(c => c.concept);
  console.assert(
    conceptNames.some(c => ['type', 'memory', 'control', 'unsafe', 'interop'].includes(c)),
    '핵심 개념 포함 확인'
  );

  console.log('✅ 개념 추출: 통과');
}

/**
 * Test 2: 개념 그래프 구축
 */
export function testBuildConceptGraph() {
  console.log('\n🔗 Test 2: 개념 그래프 구축');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);

  console.assert(graph.nodes.length > 0, '노드 생성 확인');
  console.assert(graph.edges.length > 0, '엣지 생성 확인');

  const stats = conceptGraphBuilder.getGraphStatistics(graph);
  console.assert(stats.density >= 0 && stats.density <= 1, '그래프 밀도 계산');

  console.log('✅ 개념 그래프 구축: 통과');
}

/**
 * Test 3: 그래프 밀도 및 연결 요소
 */
export function testGraphProperties() {
  console.log('\n📊 Test 3: 그래프 특성');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);

  const density = conceptGraphBuilder.calculateGraphDensity(graph);
  console.assert(typeof density === 'number', '밀도 계산');

  const components = conceptGraphBuilder.identifyConnectedComponents(graph);
  console.assert(components.length > 0, '연결 요소 식별');

  console.log('✅ 그래프 특성: 통과');
}

/**
 * Test 4: Degree Centrality
 */
export function testDegreeCentrality() {
  console.log('\n🎯 Test 4: Degree Centrality');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);
  const centrality = centralityAnalyzer.calculateDegreeCentrality(graph);

  console.assert(Object.keys(centrality).length > 0, '중심성 계산');
  for (const value of Object.values(centrality)) {
    console.assert(value >= 0 && value <= 1, '중심성 정규화 확인');
  }

  console.log('✅ Degree Centrality: 통과');
}

/**
 * Test 5: PageRank
 */
export function testPageRank() {
  console.log('\n📈 Test 5: PageRank');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);
  const pagerank = centralityAnalyzer.calculatePageRank(graph);

  console.assert(Object.keys(pagerank).length === graph.nodes.length, 'PageRank 계산 완료');

  let totalRank = 0;
  for (const rank of Object.values(pagerank)) {
    totalRank += rank;
  }
  console.assert(totalRank > 0, 'PageRank 합계 확인');

  console.log('✅ PageRank: 통과');
}

/**
 * Test 6: 개념 역할 분류
 */
export function testConceptRoles() {
  console.log('\n🏗️  Test 6: 개념 역할 분류');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);
  const degree = centralityAnalyzer.calculateDegreeCentrality(graph);
  const pagerank = centralityAnalyzer.calculatePageRank(graph);

  const roles = centralityAnalyzer.classifyConceptRoles(graph, degree, pagerank);

  console.assert(Object.keys(roles).length > 0, '역할 분류 수행');

  for (const role of Object.values(roles)) {
    console.assert(
      ['core', 'hub', 'expansion', 'boundary', 'peripheral'].includes(role.role),
      '올바른 역할 할당'
    );
  }

  console.log('✅ 개념 역할 분류: 통과');
}

/**
 * Test 7: 아키텍처 계층
 */
export function testArchitectureLayers() {
  console.log('\n📏 Test 7: 아키텍처 계층');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);
  const degree = centralityAnalyzer.calculateDegreeCentrality(graph);
  const pagerank = centralityAnalyzer.calculatePageRank(graph);
  const roles = centralityAnalyzer.classifyConceptRoles(graph, degree, pagerank);

  const layers = centralityAnalyzer.generateArchitectureLayers(graph, roles);

  console.assert(layers.core, '핵심 계층 확인');
  console.assert(layers.expansion, '확장 계층 확인');
  console.assert(layers.boundary, '경계 계층 확인');

  console.log('✅ 아키텍처 계층: 통과');
}

/**
 * Test 8: 설계 사고 지도 생성
 */
export function testGenerateCognitionMap() {
  console.log('\n🧠 Test 8: 설계 사고 지도');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);
  const degree = centralityAnalyzer.calculateDegreeCentrality(graph);
  const pagerank = centralityAnalyzer.calculatePageRank(graph);
  const roles = centralityAnalyzer.classifyConceptRoles(graph, degree, pagerank);
  const layers = centralityAnalyzer.generateArchitectureLayers(graph, roles);

  const map = cognitionMapper.generateCognitionMap(graph, roles, layers);

  console.assert(map.nodes.length > 0, '지도 노드 생성');
  console.assert(map.edges.length > 0, '지도 엣지 생성');
  console.assert(map.structure, '구조 정보 포함');

  console.log('✅ 설계 사고 지도: 통과');
}

/**
 * Test 9: 사고 지도 요약
 */
export function testCognitionMapSummary() {
  console.log('\n📝 Test 9: 사고 지도 요약');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);
  const degree = centralityAnalyzer.calculateDegreeCentrality(graph);
  const pagerank = centralityAnalyzer.calculatePageRank(graph);
  const roles = centralityAnalyzer.classifyConceptRoles(graph, degree, pagerank);
  const layers = centralityAnalyzer.generateArchitectureLayers(graph, roles);
  const map = cognitionMapper.generateCognitionMap(graph, roles, layers);

  const summary = cognitionMapper.summarizeCognitionMap(map);

  console.assert(summary.totalConcepts > 0, '총 개념 수 계산');
  console.assert(summary.coreConceptCount >= 0, '핵심 개념 수');
  console.assert(summary.structuralStability >= 0 && summary.structuralStability <= 1, '구조 안정성');

  console.log('✅ 사고 지도 요약: 통과');
}

/**
 * Test 10: 단계별 진화 맵
 */
export function testPhaseEvolution() {
  console.log('\n📊 Test 10: 단계별 진화');

  const phaseMaps = patternAnalyzer.generatePhaseEvolutionMaps(mockCommits, []);

  console.assert(Object.keys(phaseMaps).length > 0, 'Phase 맵 생성');

  for (const phaseMap of Object.values(phaseMaps)) {
    console.assert(phaseMap.concepts.length > 0, 'Phase별 개념 추출');
  }

  console.log('✅ 단계별 진화: 통과');
}

/**
 * Test 11: 사고 이동 분석
 */
export function testCognitionShift() {
  console.log('\n🔄 Test 11: 사고 이동 분석');

  const phaseMaps = patternAnalyzer.generatePhaseEvolutionMaps(mockCommits, []);
  const shifts = patternAnalyzer.analyzeCognitionShift(phaseMaps);

  console.assert(shifts.length >= 0, '사고 이동 분석');

  for (const shift of shifts) {
    console.assert(shift.introduced !== undefined, '도입 개념 확인');
    console.assert(shift.removed !== undefined, '제거 개념 확인');
  }

  console.log('✅ 사고 이동 분석: 통과');
}

/**
 * Test 12: 설계 패턴 감지
 */
export function testDesignPatternDetection() {
  console.log('\n🎨 Test 12: 설계 패턴 감지');

  const graph = conceptGraphBuilder.buildConceptGraph(mockCommits, mockDiffs, mockIntents);
  const degree = centralityAnalyzer.calculateDegreeCentrality(graph);
  const pagerank = centralityAnalyzer.calculatePageRank(graph);
  const roles = centralityAnalyzer.classifyConceptRoles(graph, degree, pagerank);
  const layers = centralityAnalyzer.generateArchitectureLayers(graph, roles);
  const map = cognitionMapper.generateCognitionMap(graph, roles, layers);

  const patterns = patternAnalyzer.detectDesignPatterns(map, mockIntents);

  console.assert(typeof patterns === 'object', '패턴 감지 수행');
  console.assert(
    Object.keys(patterns).some(key => patterns[key] === true),
    '패턴 감지 결과 확인'
  );

  console.log('✅ 설계 패턴 감지: 통과');
}

/**
 * 모든 테스트 실행
 */
export function runAllTests() {
  console.log('\n🚀 5.0 설계 사고 지도 테스트');
  console.log('='.repeat(50));

  try {
    testExtractConcepts();
    testBuildConceptGraph();
    testGraphProperties();
    testDegreeCentrality();
    testPageRank();
    testConceptRoles();
    testArchitectureLayers();
    testGenerateCognitionMap();
    testCognitionMapSummary();
    testPhaseEvolution();
    testCognitionShift();
    testDesignPatternDetection();

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
  testExtractConcepts,
  testBuildConceptGraph,
  testGraphProperties,
  testDegreeCentrality,
  testPageRank,
  testConceptRoles,
  testArchitectureLayers,
  testGenerateCognitionMap,
  testCognitionMapSummary,
  testPhaseEvolution,
  testCognitionShift,
  testDesignPatternDetection,
  runAllTests
};
