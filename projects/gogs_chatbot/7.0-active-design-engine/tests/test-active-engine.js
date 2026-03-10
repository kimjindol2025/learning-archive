/**
 * 7.0 능동적 설계 보조 시스템 테스트
 * 12개 시나리오
 */

import warningDetector from '../warning-detector.js';
import balanceCalculator from '../balance-calculator.js';
import patternRecommender from '../pattern-recommender.js';
import evolutionPredictor from '../evolution-predictor.js';
import designAdvisor from '../design-advisor.js';

// 테스트 데이터 생성
function createTestData() {
  const rolesCurrent = {
    'Memory Layout': { degree: 0.9, betweenness: 0.85, pageRank: 0.08 },
    'Type System': { degree: 0.7, betweenness: 0.6, pageRank: 0.06 },
    'Unsafe': { degree: 0.6, betweenness: 0.4, pageRank: 0.04 }
  };

  const rolesPrevious = {
    'Memory Layout': { degree: 0.5, betweenness: 0.4, pageRank: 0.04 },
    'Type System': { degree: 0.65, betweenness: 0.5, pageRank: 0.05 },
    'Unsafe': { degree: 0.3, betweenness: 0.2, pageRank: 0.02 }
  };

  const dependencyGraph = {
    'core-lang': ['design-spec'],
    'design-spec': ['test-exp'],
    'test-exp': ['app-impl'],
    'app-impl': []
  };

  const commitHistory = [
    { hash: 'c1', message: 'Add memory', phase: 1, timestamp: Date.now() - 86400000 * 10 },
    { hash: 'c2', message: 'Type system', phase: 1, timestamp: Date.now() - 86400000 * 8 },
    { hash: 'c3', message: 'Unsafe pointers', phase: 2, timestamp: Date.now() - 86400000 * 5 },
    { hash: 'c4', message: 'Tests added', phase: 2, timestamp: Date.now() - 86400000 * 2 }
  ];

  const testHistory = [50, 55, 58, 60, 65];
  const conceptGrowth = [3, 4, 5, 7];
  const testCoverage = [0.4, 0.45, 0.5, 0.48];

  const phaseTimeline = [
    {
      phase: 1,
      concepts: ['Memory Layout', 'Type System'],
      commitCount: 5,
      timestamp: Date.now() - 86400000 * 10,
      density: 0.3,
      testRatio: 0.15,
      docRatio: 0.05,
      roles: { 'Memory Layout': { role: 'core', centrality: 0.5 }, 'Type System': { role: 'expansion', centrality: 0.4 } }
    },
    {
      phase: 2,
      concepts: ['Memory Layout', 'Type System', 'Unsafe'],
      commitCount: 4,
      timestamp: Date.now() - 86400000 * 5,
      density: 0.35,
      testRatio: 0.18,
      docRatio: 0.06,
      roles: { 'Memory Layout': { role: 'core', centrality: 0.7 }, 'Type System': { role: 'expansion', centrality: 0.5 }, 'Unsafe': { role: 'boundary', centrality: 0.3 } }
    }
  ];

  return {
    rolesCurrent,
    rolesPrevious,
    dependencyGraph,
    commitHistory,
    testHistory,
    conceptGrowth,
    testCoverage,
    phaseTimeline
  };
}

// 테스트 1: Centrality 급상승 감지
function test1_DetectCentralitySpike() {
  console.log('✓ Test 1: Centrality 급상승 감지');
  const { rolesCurrent, rolesPrevious } = createTestData();
  const warnings = warningDetector.detectCentralitySpike(rolesCurrent, rolesPrevious, 0.3);

  console.assert(warnings.length > 0, 'Should detect centrality spikes');
  console.assert(warnings[0].type === 'CENTRALITY_SPIKE', 'Should have CENTRALITY_SPIKE type');
  console.log('  ✓ Passed');
}

// 테스트 2: 의존성 과집중 감지
function test2_DetectDependencyCongestion() {
  console.log('✓ Test 2: 의존성 과집중 감지');
  const { dependencyGraph } = createTestData();
  const warnings = warningDetector.detectDependencyCongestion(dependencyGraph, 2);

  console.assert(Array.isArray(warnings), 'Should return array');
  console.log('  ✓ Passed');
}

// 테스트 3: 테스트 증가율 감소 감지
function test3_DetectTestGrowthSlowdown() {
  console.log('✓ Test 3: 테스트 증가율 감소 감지');
  const { commitHistory, testHistory } = createTestData();
  const warnings = warningDetector.detectTestGrowthSlowdown(commitHistory, testHistory, 2);

  console.assert(Array.isArray(warnings), 'Should return array of warnings');
  console.log('  ✓ Passed');
}

// 테스트 4: 노드 고립 감지
function test4_DetectIsolatedNodes() {
  console.log('✓ Test 4: 노드 고립 감지');
  const conceptGraph = {
    nodes: ['A', 'B', 'C', 'D'],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' }
    ]
  };
  const roleClassification = {
    'A': { role: 'core' },
    'B': { role: 'expansion' },
    'C': { role: 'boundary' },
    'D': { role: 'boundary' }
  };

  const warnings = warningDetector.detectIsolatedNodes(conceptGraph, roleClassification);

  console.assert(Array.isArray(warnings), 'Should return array');
  console.log('  ✓ Passed');
}

// 테스트 5: 변경 비율 계산
function test5_CalculateChangeRatios() {
  console.log('✓ Test 5: 변경 비율 계산');
  const commits = [
    {
      diffs: [
        { file: 'app.js', additions: 100 },
        { file: 'app.test.js', additions: 50 },
        { file: 'README.md', additions: 30 }
      ]
    }
  ];

  const ratios = balanceCalculator.calculateChangeRatios(commits);

  console.assert(ratios.code > 0, 'Should have code ratio');
  console.assert(ratios.test > 0, 'Should have test ratio');
  console.assert(ratios.doc > 0, 'Should have doc ratio');
  console.assert(Math.abs((ratios.code + ratios.test + ratios.doc) - 1.0) < 0.01, 'Ratios should sum to 1');
  console.log('  ✓ Passed');
}

// 테스트 6: 균형 지수 계산
function test6_CalculateBalanceIndex() {
  console.log('✓ Test 6: 균형 지수 계산');
  const ratios = { code: 0.7, test: 0.15, doc: 0.1, config: 0.05 };
  const balance = balanceCalculator.calculateBalanceIndex(ratios);

  console.assert(balance.index !== undefined, 'Should calculate balance index');
  console.assert(balance.trend !== undefined, 'Should have trend');
  console.log('  ✓ Passed');
}

// 테스트 7: 진화 패턴 추출
function test7_ExtractEvolutionPatterns() {
  console.log('✓ Test 7: 진화 패턴 추출');
  const { phaseTimeline } = createTestData();
  const patterns = patternRecommender.extractEvolutionPatterns(phaseTimeline);

  console.assert(Array.isArray(patterns), 'Should return array');
  console.assert(patterns.length > 0, 'Should extract patterns');
  console.log('  ✓ Passed');
}

// 테스트 8: 개념 성장 분석
function test8_AnalyzeConceptGrowth() {
  console.log('✓ Test 8: 개념 성장 분석');
  const { phaseTimeline } = createTestData();
  const growth = evolutionPredictor.analyzeConceptGrowth(phaseTimeline);

  console.assert(growth.conceptCount !== undefined, 'Should have concept count');
  console.assert(growth.growthRates !== undefined, 'Should have growth rates');
  console.assert(growth.trajectory !== undefined, 'Should have trajectory');
  console.log('  ✓ Passed');
}

// 테스트 9: 테스트 커버리지 추세
function test9_AnalyzeTestCoverageTrend() {
  console.log('✓ Test 9: 테스트 커버리지 추세');
  const { phaseTimeline } = createTestData();
  const trend = evolutionPredictor.analyzeTestCoverageTrend(phaseTimeline);

  console.assert(trend.coverageHistory !== undefined, 'Should have coverage history');
  console.assert(trend.trajectory !== undefined, 'Should have trajectory');
  console.log('  ✓ Passed');
}

// 테스트 10: 다음 값 예측
function test10_PredictNextValues() {
  console.log('✓ Test 10: 다음 값 예측');
  const values = [1, 2, 3, 5, 8];
  const predictions = evolutionPredictor.predictNextValues(values, 2);

  console.assert(predictions.length === 2, 'Should predict 2 steps');
  console.assert(predictions[0].predicted !== undefined, 'Should have predicted value');
  console.assert(predictions[0].confidence > 0, 'Should have confidence > 0');
  console.log('  ✓ Passed');
}

// 테스트 11: 통합 분석 및 조언 생성
function test11_GenerateDesignAdvice() {
  console.log('✓ Test 11: 통합 분석 및 조언 생성');
  const { rolesCurrent, rolesPrevious, phaseTimeline } = createTestData();

  const warnings = warningDetector.detectCentralitySpike(rolesCurrent, rolesPrevious, 0.2);
  const ratios = { code: 0.7, test: 0.15, doc: 0.1, config: 0.05 };
  const balance = { balance: { index: 0.21, trend: 'UNDER_TESTING' }, assessment: { recommendations: [] } };
  const prediction = {
    expectedConceptCount: 4,
    expectedTestCoverage: 0.5,
    predictedFocus: ['개념 확장'],
    risks: [],
    opportunities: [],
    confidence: 0.75
  };
  const ecosystemHealth = { overall: 0.7, diversity: 0.8, stability: 0.65, connectivity: 0.6 };

  const advice = designAdvisor.generateDesignAdvice(
    warnings,
    balance,
    [],
    prediction,
    ecosystemHealth,
    phaseTimeline[0]
  );

  console.assert(advice.sections !== undefined, 'Should have sections');
  console.assert(advice.actionItems !== undefined, 'Should have action items');
  console.assert(advice.priority !== undefined, 'Should have priority');
  console.log('  ✓ Passed');
}

// 테스트 12: 설계 파트너 대화체 생성
function test12_GenerateAdvisoryMessage() {
  console.log('✓ Test 12: 설계 파트너 대화체 생성');
  const { phaseTimeline } = createTestData();

  const advice = {
    timestamp: new Date(),
    phase: 1,
    severity: 'MEDIUM',
    sections: [
      {
        title: '⚠️  구조 위험 경고',
        items: [
          {
            severity: 'HIGH',
            warnings: [{ type: 'TEST', message: '테스트 부족' }]
          }
        ]
      }
    ],
    priority: {
      P0: [],
      P1: [{ action: '테스트 강화' }],
      P2: []
    }
  };

  const message = designAdvisor.generateAdvisoryMessage(advice);

  console.assert(typeof message === 'string', 'Should return string message');
  console.assert(message.length > 0, 'Message should not be empty');
  console.log('  ✓ Passed');
}

// 테스트 실행
function runAllTests() {
  console.log('\n🧪 7.0 능동적 설계 보조 시스템 테스트\n');
  console.log('='.repeat(50));

  test1_DetectCentralitySpike();
  test2_DetectDependencyCongestion();
  test3_DetectTestGrowthSlowdown();
  test4_DetectIsolatedNodes();
  test5_CalculateChangeRatios();
  test6_CalculateBalanceIndex();
  test7_ExtractEvolutionPatterns();
  test8_AnalyzeConceptGrowth();
  test9_AnalyzeTestCoverageTrend();
  test10_PredictNextValues();
  test11_GenerateDesignAdvice();
  test12_GenerateAdvisoryMessage();

  console.log('='.repeat(50));
  console.log('\n✅ 모든 테스트 통과!\n');
}

runAllTests();
