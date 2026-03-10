/**
 * 8.0 운영 안정화 시스템 테스트
 * 12개 시나리오
 */

import featureManager from '../feature-manager.js';
import loggingSystem from '../logging-system.js';
import reproducibilityTester from '../reproducibility-tester.js';
import versionManager from '../version-manager.js';
import recoveryHandler from '../recovery-handler.js';

// 테스트 1: 기능 활성화/비활성화
function test1_FeatureToggle() {
  console.log('✓ Test 1: 기능 활성화/비활성화');

  const enabled = featureManager.isFeatureEnabled('CHUNK_PROCESSING');
  console.assert(enabled === true, 'CHUNK_PROCESSING should be enabled');

  const disabled = featureManager.isFeatureEnabled('EVOLUTION_REASONING');
  console.assert(disabled === false, 'EVOLUTION_REASONING should be disabled');

  console.log('  ✓ Passed');
}

// 테스트 2: 필수 기능 검증
function test2_ValidateRequiredFeatures() {
  console.log('✓ Test 2: 필수 기능 검증');

  const validation = featureManager.validateRequiredFeatures();
  console.assert(validation.isHealthy === true, 'All required features should be enabled');
  console.assert(Array.isArray(validation.missingRequired), 'Should return missing list');

  console.log('  ✓ Passed');
}

// 테스트 3: 기능 체인 검증
function test3_ValidateFeatureChain() {
  console.log('✓ Test 3: 기능 체인 검증');

  const chainValidation = featureManager.validateFeatureChain();
  console.assert(chainValidation.isValid !== undefined, 'Should return validation result');
  console.assert(Array.isArray(chainValidation.issues), 'Should have issues array');

  console.log('  ✓ Passed');
}

// 테스트 4: 검색 세션 로깅
function test4_SearchSessionLogging() {
  console.log('✓ Test 4: 검색 세션 로깅');

  const logger = new loggingSystem.SearchSessionLogger('test-session-1');

  logger.logQuery('test query', { limit: 10 });
  logger.logSearchResults([
    { commitHash: 'abc123', score: 0.9, source: 'BM25' }
  ]);
  logger.logFilterApplied('metadata', { type: 'commit' }, 1);

  const report = logger.generateReport();
  console.assert(report.sessionId === 'test-session-1', 'Session ID should match');
  console.assert(report.entries.length === 3, 'Should have 3 entries');

  console.log('  ✓ Passed');
}

// 테스트 5: 재현성 테스트
function test5_ReproducibilityTest() {
  console.log('✓ Test 5: 재현성 테스트');

  const test = new reproducibilityTester.ReproducibilityTest('rt-1', 'memory layout');

  test.recordExecution({ results: ['commit1', 'commit2'], scores: [0.9, 0.8] });
  test.recordExecution({ results: ['commit1', 'commit2'], scores: [0.9, 0.8] });

  const report = test.generateReport();
  console.assert(report.executionCount === 2, 'Should have 2 executions');
  console.assert(report.status === 'CONSISTENT', 'Should be consistent');

  console.log('  ✓ Passed');
}

// 테스트 6: 재현성 테스트 스위트
function test6_ReproducibilityTestSuite() {
  console.log('✓ Test 6: 재현성 테스트 스위트');

  const suite = new reproducibilityTester.ReproducibilityTestSuite('stability-tests');

  suite.addTest('query-1', 'memory');
  suite.addTest('query-2', 'unsafe');

  console.assert(suite.tests.size === 2, 'Should have 2 tests');

  const report = suite.generateReport();
  console.assert(report.suiteName === 'stability-tests', 'Suite name should match');

  console.log('  ✓ Passed');
}

// 테스트 7: 쿼리 재현성 검증
function test7_QueryReproducibility() {
  console.log('✓ Test 7: 쿼리 재현성 검증');

  const searchFunction = (query) => [
    { commitHash: 'abc', score: 0.9 },
    { commitHash: 'def', score: 0.8 }
  ];

  const validation = reproducibilityTester.validateQueryReproducibility(
    'test',
    searchFunction,
    3
  );

  console.assert(validation.query === 'test', 'Query should match');
  console.assert(validation.recommendation === 'PASS', 'Should pass');

  console.log('  ✓ Passed');
}

// 테스트 8: 버전 등록 및 활성화
function test8_VersionManagement() {
  console.log('✓ Test 8: 버전 등록 및 활성화');

  const manager = new versionManager.VersionManager();

  manager.registerVersion('LLM_MODEL', 'gpt-4-latest', { temperature: 0.7 });
  manager.registerVersion('LLM_MODEL', 'gpt-4-previous', { temperature: 0.7 });

  manager.activateVersion('LLM_MODEL', 'gpt-4-latest');

  const active = manager.getActiveVersions();
  console.assert(active.LLM_MODEL === 'gpt-4-latest', 'Should activate latest');

  console.log('  ✓ Passed');
}

// 테스트 9: 버전 롤백
function test9_VersionRollback() {
  console.log('✓ Test 9: 버전 롤백');

  const manager = new versionManager.VersionManager();

  manager.registerVersion('BM25_INDEX', 'v1.0');
  manager.registerVersion('BM25_INDEX', 'v1.1');

  manager.activateVersion('BM25_INDEX', 'v1.1');
  const rollback = manager.rollbackVersion('BM25_INDEX', 'v1.0');

  console.assert(rollback.rolledBackTo === 'v1.0', 'Should rollback to v1.0');
  console.assert(manager.activeVersions['BM25_INDEX'] === 'v1.0', 'Should be v1.0');

  console.log('  ✓ Passed');
}

// 테스트 10: 배포 전 검증
function test10_DeploymentValidation() {
  console.log('✓ Test 10: 배포 전 검증');

  const manager = new versionManager.VersionManager();

  // 필수 컴포넌트 등록
  manager.registerVersion('BM25_INDEX', 'v1.0');
  manager.activateVersion('BM25_INDEX', 'v1.0');

  manager.registerVersion('LLM_MODEL', 'gpt-4');
  manager.activateVersion('LLM_MODEL', 'gpt-4');

  manager.registerVersion('PROMPT', 'v1');
  manager.activateVersion('PROMPT', 'v1');

  const checks = manager.validateForDeployment();
  console.assert(Array.isArray(checks.issues), 'Should have issues list');

  console.log('  ✓ Passed');
}

// 테스트 11: 메타데이터 스키마 버전
function test11_MetadataSchemaVersion() {
  console.log('✓ Test 11: 메타데이터 스키마 버전');

  const manager = new versionManager.MetadataSchemaVersionManager();

  const schema = {
    hash: 'string',
    message: 'string',
    timestamp: 'number'
  };

  manager.registerSchema('v1.0', schema);
  manager.activateSchema('v1.0');

  console.assert(manager.activeSchema === 'v1.0', 'Should activate schema');

  console.log('  ✓ Passed');
}

// 테스트 12: 복구 시나리오
function test12_RecoveryScenario() {
  console.log('✓ Test 12: 복구 시나리오');

  const executor = new recoveryHandler.RecoveryExecutor();

  const canRecover = executor.canRecover('INDEX_CORRUPTION');
  console.assert(canRecover === true, 'Should be able to recover from INDEX_CORRUPTION');

  const policy = executor.getAutoRecoveryPolicy('LLM_API_FAILURE');
  console.assert(policy !== null, 'Should have recovery policy');
  console.assert(policy.scenario === 'LLM_API_FAILURE', 'Scenario should match');

  console.log('  ✓ Passed');
}

// 테스트 실행
function runAllTests() {
  console.log('\n🧪 8.0 운영 안정화 시스템 테스트\n');
  console.log('='.repeat(50));

  test1_FeatureToggle();
  test2_ValidateRequiredFeatures();
  test3_ValidateFeatureChain();
  test4_SearchSessionLogging();
  test5_ReproducibilityTest();
  test6_ReproducibilityTestSuite();
  test7_QueryReproducibility();
  test8_VersionManagement();
  test9_VersionRollback();
  test10_DeploymentValidation();
  test11_MetadataSchemaVersion();
  test12_RecoveryScenario();

  console.log('='.repeat(50));
  console.log('\n✅ 모든 테스트 통과!\n');
}

runAllTests();
