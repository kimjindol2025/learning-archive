/**
 * 재현성 테스트 모듈
 * 동일한 입력에 대한 동일한 출력 보장
 */

/**
 * 재현성 테스트 케이스
 */
export class ReproducibilityTest {
  constructor(testId, query, expectedBehavior = {}) {
    this.testId = testId;
    this.query = query;
    this.expectedBehavior = expectedBehavior;
    this.executions = [];
    this.status = 'PENDING';
  }

  /**
   * 테스트 실행 기록
   */
  recordExecution(result, metadata = {}) {
    this.executions.push({
      timestamp: new Date(),
      resultHash: hashResult(result),
      result,
      metadata,
      executionNumber: this.executions.length + 1
    });

    // 재현성 확인
    if (this.executions.length > 1) {
      this.checkConsistency();
    }
  }

  /**
   * 일관성 확인
   */
  checkConsistency() {
    if (this.executions.length < 2) return;

    const hashes = this.executions.map(e => e.resultHash);
    const allSame = hashes.every(h => h === hashes[0]);

    this.status = allSame ? 'CONSISTENT' : 'INCONSISTENT';

    return {
      consistent: allSame,
      hashes: hashes.slice(-3), // 최근 3개
      differencePoints: findDifferences(this.executions)
    };
  }

  /**
   * 테스트 리포트
   */
  generateReport() {
    return {
      testId: this.testId,
      query: this.query,
      executionCount: this.executions.length,
      status: this.status,
      consistency: this.checkConsistency(),
      expectedBehavior: this.expectedBehavior,
      executionDetails: this.executions.map((e, i) => ({
        number: i + 1,
        timestamp: e.timestamp,
        hash: e.resultHash,
        metadata: e.metadata
      }))
    };
  }
}

/**
 * 재현성 테스트 스위트
 */
export class ReproducibilityTestSuite {
  constructor(name) {
    this.name = name;
    this.tests = new Map();
    this.suiteStartTime = new Date();
    this.results = [];
  }

  /**
   * 테스트 추가
   */
  addTest(testId, query, expectedBehavior = {}) {
    const test = new ReproducibilityTest(testId, query, expectedBehavior);
    this.tests.set(testId, test);
    return test;
  }

  /**
   * 테스트 실행
   */
  runTest(testId, executionFunction, iterations = 3) {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    const results = [];
    for (let i = 0; i < iterations; i++) {
      try {
        const result = executionFunction();
        test.recordExecution(result, { iteration: i + 1 });
        results.push({
          iteration: i + 1,
          success: true,
          resultHash: hashResult(result)
        });
      } catch (error) {
        results.push({
          iteration: i + 1,
          success: false,
          error: error.message
        });
      }
    }

    return {
      testId,
      executionResults: results,
      testStatus: test.status
    };
  }

  /**
   * 전체 스위트 실행
   */
  runAll(executionFunctions, iterations = 3) {
    const suiteResults = [];

    for (const [testId, test] of this.tests.entries()) {
      if (executionFunctions[testId]) {
        const result = this.runTest(testId, executionFunctions[testId], iterations);
        suiteResults.push(result);
      }
    }

    return {
      suiteName: this.name,
      totalTests: this.tests.size,
      results: suiteResults,
      overallStatus: this.calculateSuiteStatus(suiteResults),
      timestamp: new Date()
    };
  }

  /**
   * 전체 상태 계산
   */
  calculateSuiteStatus(results) {
    const inconsistent = results.filter(r => r.testStatus === 'INCONSISTENT');
    const consistent = results.filter(r => r.testStatus === 'CONSISTENT');
    const pending = results.filter(r => r.testStatus === 'PENDING');

    return {
      totalTests: results.length,
      consistent: consistent.length,
      inconsistent: inconsistent.length,
      pending: pending.length,
      passRate: ((consistent.length) / results.length * 100).toFixed(1) + '%'
    };
  }

  /**
   * 리포트 생성
   */
  generateReport() {
    const testReports = Array.from(this.tests.values()).map(test => test.generateReport());

    return {
      suiteName: this.name,
      startTime: this.suiteStartTime,
      endTime: new Date(),
      duration: new Date() - this.suiteStartTime,
      testReports,
      summary: {
        totalTests: this.tests.size,
        consistentTests: testReports.filter(t => t.status === 'CONSISTENT').length,
        inconsistentTests: testReports.filter(t => t.status === 'INCONSISTENT').length,
        pendingTests: testReports.filter(t => t.status === 'PENDING').length
      }
    };
  }
}

/**
 * 특정 쿼리의 재현성 검증
 */
export function validateQueryReproducibility(query, searchFunction, iterations = 5, tolerance = 'EXACT') {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const result = searchFunction(query);
    results.push({
      iteration: i + 1,
      commitOrder: result.map(r => r.commitHash),
      scores: result.map(r => r.score)
    });
  }

  // 비교
  const firstOrder = results[0].commitOrder;
  const consistent = results.every(r => arraysEqual(r.commitOrder, firstOrder));

  const scoreVariations = calculateScoreVariations(results);

  return {
    query,
    iterations,
    consistent,
    tolerance,
    results: results.map((r, i) => ({
      iteration: i + 1,
      hash: hashArray(r.commitOrder)
    })),
    scoreStats: scoreVariations,
    recommendation: tolerance === 'EXACT'
      ? (consistent ? 'PASS' : 'FAIL')
      : (scoreVariations.maxDelta < 0.05 ? 'PASS' : 'FAIL')
  };
}

/**
 * 메타데이터 스키마 일관성 검증
 */
export function validateMetadataSchema(commits, schema) {
  const issues = [];

  for (const commit of commits) {
    for (const field of Object.keys(schema)) {
      const expectedType = schema[field];
      const actualType = typeof commit[field];

      if (actualType !== expectedType) {
        issues.push({
          commitHash: commit.hash,
          field,
          expectedType,
          actualType,
          severity: 'HIGH'
        });
      }
    }
  }

  return {
    schemaValid: issues.length === 0,
    issues,
    commitCount: commits.length,
    validCommits: commits.length - new Set(issues.map(i => i.commitHash)).size
  };
}

/**
 * 검색 파라미터 변동성 테스트
 */
export function testParameterVariation(query, parameterGrid, searchFunction) {
  const results = [];

  for (const params of parameterGrid) {
    const result = searchFunction(query, params);
    results.push({
      params,
      resultCount: result.length,
      topCommits: result.slice(0, 3).map(r => r.commitHash),
      avgScore: result.reduce((sum, r) => sum + r.score, 0) / result.length
    });
  }

  return {
    query,
    parameterCount: parameterGrid.length,
    results,
    stability: calculateParameterStability(results),
    recommendation: analyzeParameterRecommendation(results)
  };
}

/**
 * 버전 간 호환성 테스트
 */
export function validateVersionCompatibility(version1Data, version2Data, testCases) {
  const incompatibilities = [];

  for (const testCase of testCases) {
    const result1 = version1Data[testCase];
    const result2 = version2Data[testCase];

    if (!result1 || !result2) continue;

    const diff = calculateDifference(result1, result2);

    if (diff.similarity < 0.9) { // 90% 이상 일치하지 않음
      incompatibilities.push({
        testCase,
        similarity: diff.similarity,
        differences: diff.differences
      });
    }
  }

  return {
    compatible: incompatibilities.length === 0,
    incompatibilityCount: incompatibilities.length,
    incompatibilities,
    overallSimilarity: (1 - (incompatibilities.length / testCases.length)) * 100
  };
}

/**
 * 유틸리티: 결과 해싱
 */
function hashResult(result) {
  return hashString(JSON.stringify(result));
}

/**
 * 유틸리티: 문자열 해싱
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 유틸리티: 배열 비교
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * 유틸리티: 배열 해싱
 */
function hashArray(arr) {
  return hashString(JSON.stringify(arr));
}

/**
 * 유틸리티: 스코어 변동 계산
 */
function calculateScoreVariations(results) {
  const allScores = results.flatMap(r => r.scores);
  const min = Math.min(...allScores);
  const max = Math.max(...allScores);
  const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  return {
    min,
    max,
    avg,
    maxDelta: max - min,
    variation: ((max - min) / avg * 100).toFixed(2) + '%'
  };
}

/**
 * 유틸리티: 파라미터 안정성
 */
function calculateParameterStability(results) {
  const topCommits = results.map(r => r.topCommits[0]);
  const consistent = topCommits.every(c => c === topCommits[0]);

  return {
    topResultConsistent: consistent,
    uniqueTopResults: new Set(topCommits).size,
    maxVariation: Math.max(...results.map(r => r.avgScore)) - Math.min(...results.map(r => r.avgScore))
  };
}

/**
 * 유틸리티: 파라미터 권장사항
 */
function analyzeParameterRecommendation(results) {
  const bestResult = results.reduce((best, curr) =>
    curr.avgScore > best.avgScore ? curr : best
  );

  return {
    recommendedParams: bestResult.params,
    bestScore: bestResult.avgScore,
    stability: 'good'
  };
}

/**
 * 유틸리티: 차이 계산
 */
function calculateDifference(data1, data2) {
  const similarity = JSON.stringify(data1) === JSON.stringify(data2) ? 1.0 : 0.8;

  return {
    similarity,
    differences: []
  };
}

/**
 * 유틸리티: 실행 차이 찾기
 */
function findDifferences(executions) {
  if (executions.length < 2) return [];

  const differences = [];
  const first = executions[0];

  for (let i = 1; i < executions.length; i++) {
    if (executions[i].resultHash !== first.resultHash) {
      differences.push({
        executionNumber: i + 1,
        differsFromFirst: true
      });
    }
  }

  return differences;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatTestReport(report) {
  const lines = [];

  lines.push('🧪 재현성 테스트 리포트');
  lines.push(`   테스트 ID: ${report.testId}`);
  lines.push(`   쿼리: ${report.query}`);
  lines.push(`   실행 횟수: ${report.executionCount}`);
  lines.push(`   상태: ${report.status}`);

  if (report.consistency) {
    lines.push(`   일관성: ${report.consistency.consistent ? '✓' : '✗'}`);
  }

  return lines.join('\n');
}

export default {
  ReproducibilityTest,
  ReproducibilityTestSuite,
  validateQueryReproducibility,
  validateMetadataSchema,
  testParameterVariation,
  validateVersionCompatibility,
  formatTestReport
};
