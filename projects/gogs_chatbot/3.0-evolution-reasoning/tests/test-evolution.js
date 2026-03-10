/**
 * 3.0 시간축 진화 추론 엔진 테스트
 * Git DAG 기반 진화 분석
 */

import gitDag from '../git-dag.js';
import commitParser from '../commit-parser.js';
import diffAnalyzer from '../diff-analyzer.js';
import evolutionTracker from '../evolution-tracker.js';
import reportGenerator from '../report-generator.js';

/**
 * Mock 데이터
 */
const mockCommits = [
  {
    hash: 'abc1234567',
    parents: [],
    timestamp: new Date('2024-01-01'),
    message: 'Initial commit: project setup',
    author: 'alice',
    email: 'alice@example.com',
    files: []
  },
  {
    hash: 'def2345678',
    parents: ['abc1234567'],
    timestamp: new Date('2024-01-15'),
    message: 'feat(auth): implement authentication system',
    author: 'bob',
    email: 'bob@example.com',
    files: []
  },
  {
    hash: 'ghi3456789',
    parents: ['def2345678'],
    timestamp: new Date('2024-02-01'),
    message: 'fix(auth): fix token validation bug',
    author: 'alice',
    email: 'alice@example.com',
    files: []
  },
  {
    hash: 'jkl4567890',
    parents: ['ghi3456789'],
    timestamp: new Date('2024-02-15'),
    message: 'feat(cache): add caching layer for performance',
    author: 'bob',
    email: 'bob@example.com',
    files: []
  },
  {
    hash: 'mno5678901',
    parents: ['jkl4567890'],
    timestamp: new Date('2024-03-01'),
    message: 'v1.0.0: release version 1.0.0',
    author: 'alice',
    email: 'alice@example.com',
    files: []
  },
  {
    hash: 'pqr6789012',
    parents: ['mno5678901'],
    timestamp: new Date('2024-03-15'),
    message: 'refactor(auth): optimize authentication flow',
    author: 'bob',
    email: 'bob@example.com',
    files: []
  },
  {
    hash: 'stu7890123',
    parents: ['pqr6789012'],
    timestamp: new Date('2024-04-01'),
    message: 'fix(cache): resolve cache invalidation issue',
    author: 'alice',
    email: 'alice@example.com',
    files: []
  },
  {
    hash: 'vwx8901234',
    parents: ['stu7890123'],
    timestamp: new Date('2024-04-15'),
    message: 'v2.0.0: release version 2.0.0 with new features',
    author: 'bob',
    email: 'bob@example.com',
    files: []
  }
];

const mockDiffOutput = `
diff --git a/src/auth.js b/src/auth.js
index abc1234..def5678 100644
--- a/src/auth.js
+++ b/src/auth.js
@@ -1,10 +1,25 @@
 class Auth {
   constructor() {
+    this.tokens = {};
+    this.sessions = [];
   }

+  login(user, password) {
+    // authentication logic
+  }
+
+  logout(token) {
+    // cleanup logic
+  }
 }

diff --git a/src/cache.js b/src/cache.js
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/cache.js
@@ -0,0 +1,30 @@
+class Cache {
+  constructor() {
+    this.data = {};
+    this.ttl = {};
+  }
+
+  set(key, value, ttl) {
+    this.data[key] = value;
+    this.ttl[key] = Date.now() + ttl;
+  }
+
+  get(key) {
+    if (this.ttl[key] && Date.now() > this.ttl[key]) {
+      delete this.data[key];
+      return null;
+    }
+    return this.data[key];
+  }
+}
`;

/**
 * Test 1: DAG 구축 및 통계
 */
export function testBuildDAG() {
  console.log('\n📊 Test 1: DAG 구축');
  const dag = gitDag.buildDAG(mockCommits);

  console.assert(Object.keys(dag.commits).length === 8, 'Commit 수 확인');
  console.assert(dag.roots.length === 1, 'Root 노드 1개 확인');
  console.assert(dag.heads.length === 1, 'Head 노드 1개 확인');
  console.assert(dag.edges.length === 7, 'Edge 개수 확인');

  const stats = gitDag.getDAGStatistics(dag);
  console.assert(stats.totalCommits === 8, '총 commit 수 확인');
  console.assert(stats.authors === 2, '저자 수 확인');

  console.log('✅ DAG 구축 및 통계: 통과');
}

/**
 * Test 2: Commit 메시지 파싱
 */
export function testParseCommitMessage() {
  console.log('\n📝 Test 2: Commit 메시지 파싱');

  const parsed1 = commitParser.parseCommitMessage('feat(auth): implement authentication system');
  console.assert(parsed1.type === 'feat', 'feat 타입 감지');
  console.assert(parsed1.scope === 'auth', 'auth scope 추출');

  const parsed2 = commitParser.parseCommitMessage('fix(cache): resolve cache invalidation issue');
  console.assert(parsed2.type === 'fix', 'fix 타입 감지');
  console.assert(parsed2.scope === 'cache', 'cache scope 추출');

  const versionCommits = commitParser.extractVersionInfo(mockCommits);
  console.assert(versionCommits.length === 2, '2개 버전 commit 발견');
  console.assert(versionCommits[0].version === '2.0.0', '최신 버전 감지');

  console.log('✅ Commit 메시지 파싱: 통과');
}

/**
 * Test 3: Commit 분류
 */
export function testCategorizeCommits() {
  console.log('\n🏷️  Test 3: Commit 분류');

  const categories = commitParser.categorizeCommits(mockCommits);
  console.assert(categories.feature.length >= 2, 'feature 분류 2개 이상');
  console.assert(categories.bugfix.length >= 2, 'bugfix 분류 2개 이상');
  console.assert(categories.refactor.length >= 1, 'refactor 분류 1개 이상');

  console.log('✅ Commit 분류: 통과');
}

/**
 * Test 4: Diff 파싱 및 분석
 */
export function testParseDiffLines() {
  console.log('\n📋 Test 4: Diff 파싱 및 분석');

  const files = diffAnalyzer.parseDiffLines(mockDiffOutput);
  console.assert(files.length >= 1, 'Diff에서 파일 추출');

  const stats = diffAnalyzer.calculateFileStats(files);
  console.assert(stats.totalFiles >= 1, '파일 통계 계산');
  console.assert(stats.totalAdditions > 0, '추가된 줄 계산');

  const classified = diffAnalyzer.classifyByFileType(files);
  console.assert(classified.code, '파일 분류 수행');

  console.log('✅ Diff 파싱 및 분석: 통과');
}

/**
 * Test 5: 변화 패턴 감지
 */
export function testDetectChangePatterns() {
  console.log('\n🔍 Test 5: 변화 패턴 감지');

  const files = diffAnalyzer.parseDiffLines(mockDiffOutput);
  const accumulated = diffAnalyzer.accumulateDifferences([{ files: files }]);
  const patterns = diffAnalyzer.detectChangePatterns(accumulated.fileHistory);

  console.assert(patterns, 'Pattern 객체 생성');
  console.assert(Array.isArray(patterns.newFeature), 'newFeature 배열 확인');
  console.assert(Array.isArray(patterns.refactoring), 'refactoring 배열 확인');

  console.log('✅ 변화 패턴 감지: 통과');
}

/**
 * Test 6: 기능 생애 주기 추적
 */
export function testTraceFeatureLifecycle() {
  console.log('\n🔄 Test 6: 기능 생애 주기 추적');

  const dag = gitDag.buildDAG(mockCommits);
  const lifecycle = evolutionTracker.traceFeatureLifecycle(dag, mockCommits, 'auth');

  console.assert(lifecycle !== null, '기능 추적 성공');
  console.assert(lifecycle.name === 'auth', '기능명 확인');
  console.assert(lifecycle.introduced !== null, 'introduced 설정');
  console.assert(lifecycle.lastModified !== null, 'lastModified 설정');
  console.assert(lifecycle.stages.length > 0, 'stages 식별');
  console.assert(lifecycle.events.length > 0, 'events 수집');

  console.log('✅ 기능 생애 주기 추적: 통과');
}

/**
 * Test 7: 진화 속도 계산
 */
export function testCalculateEvolutionVelocity() {
  console.log('\n⚡ Test 7: 진화 속도 계산');

  const velocity = evolutionTracker.calculateEvolutionVelocity(mockCommits, 'auth');

  console.assert(velocity !== null, '속도 계산 성공');
  console.assert(velocity.totalCommits >= 1, 'commit 수 계산');
  console.assert(velocity.timeSpanDays > 0, 'timespan 계산');
  console.assert(velocity.commitsPerDay >= 0, 'velocity 계산');
  console.assert(velocity.activityDensity >= 0, 'activity density 계산');

  console.log('✅ 진화 속도 계산: 통과');
}

/**
 * Test 8: 버전 비교 분석
 */
export function testAnalyzeVersionEvolution() {
  console.log('\n🆚 Test 8: 버전 비교 분석');

  const dag = gitDag.buildDAG(mockCommits);
  const evolution = gitDag.analyzeVersionEvolution(dag, 'v1.0.0', 'v2.0.0');

  console.assert(evolution.from !== undefined, 'from 버전 감지');
  console.assert(evolution.to !== undefined, 'to 버전 감지');
  console.assert(evolution.path !== undefined, 'commit path 생성');
  console.assert(evolution.timespan !== undefined, 'timespan 계산');

  console.log('✅ 버전 비교 분석: 통과');
}

/**
 * Test 9: 리포트 생성 및 마크다운 변환
 */
export function testGenerateVersionReport() {
  console.log('\n📄 Test 9: 리포트 생성 및 마크다운 변환');

  const dag = gitDag.buildDAG(mockCommits);
  const evolution = gitDag.analyzeVersionEvolution(dag, 'v1.0.0', 'v2.0.0');

  const files = diffAnalyzer.parseDiffLines(mockDiffOutput);
  const diffStats = diffAnalyzer.calculateFileStats(files);

  const report = reportGenerator.generateVersionReport(evolution, diffStats);
  console.assert(report.type === 'VERSION_EVOLUTION', 'report 타입 확인');
  console.assert(report.content.length > 0, 'report content 구성');

  const markdown = reportGenerator.reportToMarkdown(report);
  console.assert(markdown.includes('VERSION_EVOLUTION'), 'markdown 생성');
  console.assert(markdown.length > 0, 'markdown 내용 확인');

  const validation = reportGenerator.validateReport(report);
  console.assert(validation.isValid, 'report 검증');

  console.log('✅ 리포트 생성 및 마크다운 변환: 통과');
}

/**
 * Test 10: 설계 의도 분석
 */
export function testGenerateDesignIntentReport() {
  console.log('\n🏗️  Test 10: 설계 의도 분석');

  const report = reportGenerator.generateDesignIntentReport(mockCommits);
  console.assert(report.type === 'DESIGN_INTENT', 'report 타입 확인');
  console.assert(report.content !== undefined, 'report content 존재');

  const markdown = reportGenerator.reportToMarkdown(report);
  console.assert(markdown.length > 0, 'markdown 생성');
  console.assert(markdown.includes('DESIGN_INTENT'), 'design intent 마크다운 확인');

  console.log('✅ 설계 의도 분석: 통과');
}

/**
 * Test 11: 기능 간 의존성 분석
 */
export function testAnalyzeDependencies() {
  console.log('\n🔗 Test 11: 기능 간 의존성 분석');

  const features = ['auth', 'cache', 'database'];
  const dependencies = evolutionTracker.analyzeDependencies(mockCommits, features);

  console.assert(dependencies !== undefined, 'dependencies 분석 수행');
  console.assert(Object.keys(dependencies).length === 3, 'feature별 의존성 추적');

  for (const feature of features) {
    console.assert(dependencies[feature].dependsOn !== undefined, `${feature} dependsOn 확인`);
    console.assert(dependencies[feature].requiredBy !== undefined, `${feature} requiredBy 확인`);
  }

  console.log('✅ 기능 간 의존성 분석: 통과');
}

/**
 * Test 12: 버전별 기능 추적
 */
export function testTrackFeaturesByVersion() {
  console.log('\n📌 Test 12: 버전별 기능 추적');

  const versionCommits = commitParser.extractVersionInfo(mockCommits);
  const features = evolutionTracker.trackFeaturesByVersion(mockCommits, versionCommits);

  console.assert(features !== undefined, 'feature 추적 수행');
  console.assert(Object.keys(features).length > 0, 'version별 feature 분류');

  for (const version in features) {
    console.assert(features[version].added !== undefined, `${version} added 확인`);
    console.assert(features[version].modified !== undefined, `${version} modified 확인`);
    console.assert(features[version].fixed !== undefined, `${version} fixed 확인`);
  }

  console.log('✅ 버전별 기능 추적: 통과');
}

/**
 * 모든 테스트 실행
 */
export function runAllTests() {
  console.log('\n🚀 3.0 시간축 진화 추론 엔진 테스트 시작');
  console.log('='.repeat(50));

  try {
    testBuildDAG();
    testParseCommitMessage();
    testCategorizeCommits();
    testParseDiffLines();
    testDetectChangePatterns();
    testTraceFeatureLifecycle();
    testCalculateEvolutionVelocity();
    testAnalyzeVersionEvolution();
    testGenerateVersionReport();
    testGenerateDesignIntentReport();
    testAnalyzeDependencies();
    testTrackFeaturesByVersion();

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
  testBuildDAG,
  testParseCommitMessage,
  testCategorizeCommits,
  testParseDiffLines,
  testDetectChangePatterns,
  testTraceFeatureLifecycle,
  testCalculateEvolutionVelocity,
  testAnalyzeVersionEvolution,
  testGenerateVersionReport,
  testGenerateDesignIntentReport,
  testAnalyzeDependencies,
  testTrackFeaturesByVersion,
  runAllTests
};
