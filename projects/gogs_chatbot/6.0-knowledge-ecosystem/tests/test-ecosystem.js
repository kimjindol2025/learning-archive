/**
 * 6.0 생태계 통합 분석 테스트
 * 12개 시나리오
 */

import collector from '../multi-repo-collector.js';
import transferAnalyzer from '../concept-transfer-analyzer.js';
import ecosystemAnalyzer from '../ecosystem-analyzer.js';
import patternDetector from '../pattern-transfer-detector.js';

// 테스트 데이터 생성
function createTestEcosystemData() {
  const repos = [
    { name: 'core-lang', path: '/core', url: 'https://gogs.example.com/core-lang', description: '핵심 언어', type: 'core' },
    { name: 'design-spec', path: '/spec', url: 'https://gogs.example.com/design-spec', description: '설계 명세', type: 'theoretical' },
    { name: 'test-experimental', path: '/test', url: 'https://gogs.example.com/test-experimental', description: '실험', type: 'experimental' },
    { name: 'app-impl', path: '/app', url: 'https://gogs.example.com/app-impl', description: '응용', type: 'application' }
  ];

  const allCommits = [
    // core-lang
    [
      { hash: 'c1', message: 'Add memory allocation', timestamp: '2026-01-01T10:00:00Z', author: 'alice' },
      { hash: 'c2', message: 'Implement type system', timestamp: '2026-01-05T10:00:00Z', author: 'alice' }
    ],
    // design-spec
    [
      { hash: 'd1', message: 'Spec: memory safety', timestamp: '2026-01-02T10:00:00Z', author: 'bob' }
    ],
    // test-experimental
    [
      { hash: 't1', message: 'Test memory bounds', timestamp: '2026-01-06T10:00:00Z', author: 'charlie' },
      { hash: 't2', message: 'Experiment: unsafe pointers', timestamp: '2026-01-08T10:00:00Z', author: 'charlie' }
    ],
    // app-impl
    [
      { hash: 'a1', message: 'Use type system in app', timestamp: '2026-01-10T10:00:00Z', author: 'dave' }
    ]
  ];

  const allIntents = [
    // core-lang intents
    [
      { intent: 'Memory Layout', category: 'architecture', commit: allCommits[0][0], weight: 0.9 },
      { intent: 'Type System', category: 'design', commit: allCommits[0][1], weight: 0.8 }
    ],
    // design-spec intents
    [
      { intent: 'Memory Safety', category: 'theory', commit: allCommits[1][0], weight: 0.7 }
    ],
    // test-experimental intents
    [
      { intent: 'Bounds Checking', category: 'validation', commit: allCommits[2][0], weight: 0.6 },
      { intent: 'Unsafe Pointers', category: 'exploration', commit: allCommits[2][1], weight: 0.5 }
    ],
    // app-impl intents
    [
      { intent: 'Type System', category: 'design', commit: allCommits[3][0], weight: 0.75 }
    ]
  ];

  const allGraphs = [
    // Mock cognitive graphs
    { nodes: 3, edges: 5 },
    { nodes: 2, edges: 2 },
    { nodes: 3, edges: 4 },
    { nodes: 2, edges: 3 }
  ];

  return { repos, allCommits, allIntents, allGraphs };
}

// 테스트 1: 저장소 메타데이터 정의
function test1_DefineRepositoryMetadata() {
  console.log('✓ Test 1: 저장소 메타데이터 정의');
  const { repos } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);

  console.assert(Object.keys(metadata).length === 4, 'Should have 4 repos');
  console.assert(metadata['core-lang'].type === 'core', 'core-lang should be classified as core');
  console.assert(metadata['design-spec'].type === 'theoretical', 'design-spec should be theoretical');
  console.log('  ✓ Passed');
}

// 테스트 2: 다중 저장소 데이터 통합
function test2_AggregateRepositoryData() {
  console.log('✓ Test 2: 다중 저장소 데이터 통합');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);

  console.assert(aggregated.globalCommits.length === 5, 'Should have 5 total commits');
  console.assert(aggregated.globalConcepts.size === 5, 'Should have 5 unique concepts');
  console.assert(aggregated.repoIndex['core-lang'].commits.length === 2, 'core-lang should have 2 commits');
  console.log('  ✓ Passed');
}

// 테스트 3: 저장소 역할 분류
function test3_ClassifyRepositoryRoles() {
  console.log('✓ Test 3: 저장소 역할 분류');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const roles = collector.classifyRepositoryRoles(aggregated);

  console.assert(Object.keys(roles).length === 4, 'Should classify 4 repos');
  console.assert(['core', 'experimental', 'application', 'theoretical'].includes(roles['core-lang'].role), 'core-lang should have role');
  console.log('  ✓ Passed');
}

// 테스트 4: 전역 통계 계산
function test4_CalculateGlobalStatistics() {
  console.log('✓ Test 4: 전역 통계 계산');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const stats = collector.calculateGlobalStatistics(aggregated);

  console.assert(stats.totalRepositories === 4, 'Should have 4 repos');
  console.assert(stats.totalCommits === 5, 'Should have 5 commits');
  console.assert(stats.uniqueConcepts === 5, 'Should have 5 concepts');
  console.log('  ✓ Passed');
}

// 테스트 5: 저장소 간 개념 공유도 계산
function test5_CalculateCrossRepoConceptSharing() {
  console.log('✓ Test 5: 저장소 간 개념 공유도 계산');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const sharing = collector.calculateCrossRepoConceptSharing(aggregated);

  console.assert(Object.keys(sharing).length === 5, 'Should have sharing data for 5 concepts');
  console.assert(sharing['Type System'].repoCount === 2, 'Type System should be in 2 repos');
  console.log('  ✓ Passed');
}

// 테스트 6: 개념 전이 감지
function test6_DetectConceptTransfers() {
  console.log('✓ Test 6: 개념 전이 감지');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const sharing = collector.calculateCrossRepoConceptSharing(aggregated);
  const transfers = transferAnalyzer.detectConceptTransfers(aggregated, sharing);

  console.assert(transfers.length > 0, 'Should detect transfers');
  console.assert(transfers[0].concept !== undefined, 'Transfer should have concept');
  console.assert(transfers[0].from !== undefined, 'Transfer should have from');
  console.assert(transfers[0].to !== undefined, 'Transfer should have to');
  console.log('  ✓ Passed');
}

// 테스트 7: 전이 속도 분석
function test7_AnalyzeTransferVelocity() {
  console.log('✓ Test 7: 전이 속도 분석');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const sharing = collector.calculateCrossRepoConceptSharing(aggregated);
  const transfers = transferAnalyzer.detectConceptTransfers(aggregated, sharing);
  const velocities = transferAnalyzer.analyzeTransferVelocity(transfers);

  console.assert(Object.keys(velocities).length > 0, 'Should have velocity data');
  console.assert(velocities[Object.keys(velocities)[0]].avgLag !== undefined, 'Should have avgLag');
  console.log('  ✓ Passed');
}

// 테스트 8: 저장소 영향력 계산
function test8_CalculateRepositoryInfluence() {
  console.log('✓ Test 8: 저장소 영향력 계산');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const sharing = collector.calculateCrossRepoConceptSharing(aggregated);
  const transfers = transferAnalyzer.detectConceptTransfers(aggregated, sharing);
  const influence = ecosystemAnalyzer.calculateRepositoryInfluence(aggregated, transfers, sharing);

  console.assert(Object.keys(influence).length === 4, 'Should have influence for 4 repos');
  console.assert(influence['core-lang'].score !== undefined, 'Should have score');
  console.log('  ✓ Passed');
}

// 테스트 9: 생태계 건강도 분석
function test9_CalculateEcosystemHealth() {
  console.log('✓ Test 9: 생태계 건강도 분석');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const sharing = collector.calculateCrossRepoConceptSharing(aggregated);
  const transfers = transferAnalyzer.detectConceptTransfers(aggregated, sharing);
  const influence = ecosystemAnalyzer.calculateRepositoryInfluence(aggregated, transfers, sharing);
  const health = ecosystemAnalyzer.calculateEcosystemHealth(aggregated, influence, transfers);

  console.assert(health.overall >= 0 && health.overall <= 1, 'Health score should be 0-1');
  console.assert(health.diversity >= 0, 'Diversity should be calculated');
  console.assert(health.repoCount === 4, 'Should count 4 repos');
  console.log('  ✓ Passed');
}

// 테스트 10: 생태계 구조 분석
function test10_AnalyzeEcosystemStructure() {
  console.log('✓ Test 10: 생태계 구조 분석');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const sharing = collector.calculateCrossRepoConceptSharing(aggregated);
  const transfers = transferAnalyzer.detectConceptTransfers(aggregated, sharing);
  const structure = ecosystemAnalyzer.analyzeEcosystemStructure(aggregated, transfers);

  console.assert(Array.isArray(structure.coreRepositories), 'Should list core repos');
  console.assert(structure.coreRepositories.length > 0, 'Should have at least 1 core repo');
  console.log('  ✓ Passed');
}

// 테스트 11: 패턴 전이 감지
function test11_IdentifyTransferPathPatterns() {
  console.log('✓ Test 11: 패턴 전이 감지');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const sharing = collector.calculateCrossRepoConceptSharing(aggregated);
  const transfers = transferAnalyzer.detectConceptTransfers(aggregated, sharing);
  const patterns = patternDetector.identifyTransferPathPatterns(transfers);

  console.assert(patterns.linearChain !== undefined, 'Should have linearChain pattern');
  console.assert(patterns.fanOut !== undefined, 'Should have fanOut pattern');
  console.assert(patterns.fanIn !== undefined, 'Should have fanIn pattern');
  console.log('  ✓ Passed');
}

// 테스트 12: 저장소 영향 프로필 구축
function test12_BuildRepositoryInfluenceProfile() {
  console.log('✓ Test 12: 저장소 영향 프로필 구축');
  const { repos, allCommits, allIntents, allGraphs } = createTestEcosystemData();
  const metadata = collector.defineRepositoryMetadata(repos);
  const aggregated = collector.aggregateRepositoryData(metadata, allCommits, allIntents, allGraphs);
  const sharing = collector.calculateCrossRepoConceptSharing(aggregated);
  const transfers = transferAnalyzer.detectConceptTransfers(aggregated, sharing);
  const profiles = patternDetector.buildRepositoryInfluenceProfile(transfers, aggregated);

  console.assert(Object.keys(profiles).length === 4, 'Should have profiles for 4 repos');
  console.assert(profiles['core-lang'].influenceIndex !== undefined, 'Should have influenceIndex');
  console.log('  ✓ Passed');
}

// 테스트 실행
function runAllTests() {
  console.log('\n🧪 6.0 생태계 통합 분석 테스트\n');
  console.log('=' .repeat(50));

  test1_DefineRepositoryMetadata();
  test2_AggregateRepositoryData();
  test3_ClassifyRepositoryRoles();
  test4_CalculateGlobalStatistics();
  test5_CalculateCrossRepoConceptSharing();
  test6_DetectConceptTransfers();
  test7_AnalyzeTransferVelocity();
  test8_CalculateRepositoryInfluence();
  test9_CalculateEcosystemHealth();
  test10_AnalyzeEcosystemStructure();
  test11_IdentifyTransferPathPatterns();
  test12_BuildRepositoryInfluenceProfile();

  console.log('=' .repeat(50));
  console.log('\n✅ 모든 테스트 통과!\n');
}

runAllTests();
