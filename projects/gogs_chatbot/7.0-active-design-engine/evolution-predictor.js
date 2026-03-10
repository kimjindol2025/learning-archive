/**
 * 진화 예측 모델
 * 시간 시계열 분석으로 다음 단계 예측
 */

/**
 * 개념 확장 속도 분석
 */
export function analyzeConceptGrowth(phaseTimeline) {
  const growthData = [];
  const timestamps = [];

  for (let i = 0; i < phaseTimeline.length; i++) {
    const phase = phaseTimeline[i];
    growthData.push(phase.concepts.length);
    timestamps.push(new Date(phase.timestamp).getTime());
  }

  // 성장률 계산
  const growthRates = [];
  for (let i = 1; i < growthData.length; i++) {
    const rate = growthData[i] - growthData[i - 1];
    growthRates.push(rate);
  }

  // 추세 분석
  const trend = calculateTrend(growthData);
  const movingAverage = calculateMovingAverage(growthRates, 3);

  return {
    conceptCount: growthData,
    growthRates,
    timestamps,
    trend,
    movingAverage,
    currentRate: growthRates[growthRates.length - 1] || 0,
    averageRate: growthRates.reduce((a, b) => a + b, 0) / Math.max(1, growthRates.length),
    acceleration: calculateAcceleration(growthRates),
    trajectory: classifyGrowthTrajectory(trend)
  };
}

/**
 * 테스트 커버리지 추세
 */
export function analyzeTestCoverageTrend(phaseTimeline) {
  const coverageData = [];

  for (const phase of phaseTimeline) {
    const testRatio = phase.testRatio || 0;
    coverageData.push(testRatio);
  }

  const trend = calculateTrend(coverageData);
  const movingAverage = calculateMovingAverage(coverageData, 3);

  return {
    coverageHistory: coverageData,
    trend,
    movingAverage,
    currentCoverage: coverageData[coverageData.length - 1] || 0,
    averageCoverage: coverageData.reduce((a, b) => a + b, 0) / Math.max(1, coverageData.length),
    trajectory: classifyTestTrajectory(trend),
    isImproving: trend.slope > 0.02
  };
}

/**
 * 선형 회귀로 다음 값 예측
 */
export function predictNextValues(values, steps = 3) {
  if (values.length < 2) {
    return values.map((_, i) => ({
      step: i + 1,
      predicted: values[i],
      confidence: 0.3
    }));
  }

  const trend = calculateTrend(values);
  const predictions = [];

  for (let i = 0; i < steps; i++) {
    const nextStep = values.length + i;
    const predicted = trend.intercept + trend.slope * nextStep;
    const confidence = Math.max(0.1, 1.0 - (i * 0.15));

    predictions.push({
      step: nextStep,
      predicted: Math.max(0, predicted),
      confidence,
      trend: trend.slope > 0 ? 'INCREASING' : 'DECREASING'
    });
  }

  return predictions;
}

/**
 * 선형 회귀 계산
 */
function calculateTrend(values) {
  if (values.length < 2) {
    return { slope: 0, intercept: values[0] || 0, r2: 0 };
  }

  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i + 1);

  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared 계산
  const yMean = sumY / n;
  const ssRes = values.reduce((sum, y) => sum + Math.pow(y - (intercept + slope * (indices[values.indexOf(y)])), 2), 0);
  const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const r2 = 1 - (ssRes / Math.max(ssTot, 0.0001));

  return { slope, intercept, r2, quality: r2 > 0.7 ? 'GOOD' : r2 > 0.4 ? 'FAIR' : 'POOR' };
}

/**
 * 이동 평균 계산
 */
function calculateMovingAverage(values, window = 3) {
  const result = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.ceil(window / 2));
    const avg = values.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
    result.push(avg);
  }

  return result;
}

/**
 * 가속도 계산
 */
function calculateAcceleration(rates) {
  if (rates.length < 2) return 0;

  const diffs = [];
  for (let i = 1; i < rates.length; i++) {
    diffs.push(rates[i] - rates[i - 1]);
  }

  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

/**
 * 성장 궤적 분류
 */
function classifyGrowthTrajectory(trend) {
  if (trend.slope > 2) return 'EXPONENTIAL_GROWTH';
  if (trend.slope > 0.5) return 'STEADY_GROWTH';
  if (trend.slope > 0.1) return 'SLOW_GROWTH';
  if (trend.slope > -0.1) return 'PLATEAU';
  return 'DECLINE';
}

/**
 * 테스트 궤적 분류
 */
function classifyTestTrajectory(trend) {
  if (trend.slope > 0.05) return 'RAPIDLY_IMPROVING';
  if (trend.slope > 0.01) return 'GRADUALLY_IMPROVING';
  if (trend.slope > -0.01) return 'STABLE';
  return 'DECLINING';
}

/**
 * 다중 지표 기반 통합 예측
 */
export function predictNextEvolutionPhase(
  conceptGrowth,
  testTrend,
  commitHistory,
  densityHistory
) {
  const conceptPrediction = predictNextValues(conceptGrowth.conceptCount, 1)[0];
  const testPrediction = predictNextValues(testTrend.coverageHistory, 1)[0];

  // 이전 phase 간 평균 시간 간격
  const avgTimeBetweenPhases = calculateAverageTimeBetweenPhases(commitHistory);

  const prediction = {
    expectedConceptCount: Math.round(conceptPrediction.predicted),
    expectedTestCoverage: Math.min(1.0, Math.max(0, testPrediction.predicted)),
    expectedTimeToNextPhase: avgTimeBetweenPhases,
    conceptGrowthTrend: conceptGrowth.trajectory,
    testImprovementTrend: testTrend.trajectory,
    predictedFocus: determinePredictedFocus(conceptGrowth, testTrend),
    risks: identifyEvolutionRisks(conceptGrowth, testTrend),
    opportunities: identifyEvolutionOpportunities(conceptGrowth, testTrend),
    confidence: (conceptPrediction.confidence + testPrediction.confidence) / 2
  };

  return prediction;
}

/**
 * Phase 간 평균 시간 간격 계산
 */
function calculateAverageTimeBetweenPhases(commits) {
  if (commits.length < 2) return 0;

  const phases = [];
  let currentPhase = 0;
  let phaseStart = commits[0]?.timestamp;

  for (const commit of commits) {
    if (commit.phase && commit.phase !== currentPhase) {
      if (phaseStart) {
        phases.push(commit.timestamp - phaseStart);
      }
      currentPhase = commit.phase;
      phaseStart = commit.timestamp;
    }
  }

  return phases.reduce((a, b) => a + b, 0) / Math.max(1, phases.length);
}

/**
 * 예상 포커스 결정
 */
function determinePredictedFocus(conceptGrowth, testTrend) {
  const focuses = [];

  if (conceptGrowth.currentRate > 2) {
    focuses.push('신규 개념 도입 중심');
  }

  if (conceptGrowth.trajectory === 'STEADY_GROWTH' && testTrend.isImproving) {
    focuses.push('구조적 확장 & 검증 강화');
  }

  if (conceptGrowth.trajectory === 'PLATEAU' && testTrend.currentCoverage < 0.6) {
    focuses.push('기존 개념 검증 강화');
  }

  if (conceptGrowth.acceleration < -0.5) {
    focuses.push('리팩토링 및 정리');
  }

  return focuses.length > 0 ? focuses : ['안정화 단계'];
}

/**
 * 진화 위험 식별
 */
function identifyEvolutionRisks(conceptGrowth, testTrend) {
  const risks = [];

  if (conceptGrowth.currentRate > 5 && testTrend.currentCoverage < 0.5) {
    risks.push({
      type: 'RAPID_GROWTH_LOW_TEST',
      severity: 'HIGH',
      description: '개념 확장 속도는 빠른데 테스트 부족'
    });
  }

  if (conceptGrowth.trajectory === 'DECLINE') {
    risks.push({
      type: 'CONCEPT_DECLINE',
      severity: 'MEDIUM',
      description: '개념 수 감소 추세 - 설계 정체 가능성'
    });
  }

  if (testTrend.trajectory === 'DECLINING') {
    risks.push({
      type: 'TEST_COVERAGE_DECLINE',
      severity: 'MEDIUM',
      description: '테스트 커버리지 하락 - 품질 저하 위험'
    });
  }

  return risks;
}

/**
 * 진화 기회 식별
 */
function identifyEvolutionOpportunities(conceptGrowth, testTrend) {
  const opportunities = [];

  if (conceptGrowth.trajectory === 'STEADY_GROWTH' && testTrend.isImproving) {
    opportunities.push({
      type: 'BALANCED_EXPANSION',
      description: '개념 확장과 테스트가 동시에 증가 - 건강한 성장'
    });
  }

  if (conceptGrowth.acceleration > 1) {
    opportunities.push({
      type: 'ACCELERATING_INNOVATION',
      description: '개념 도입 속도 가속화 - 설계 혁신 단계'
    });
  }

  if (testTrend.currentCoverage > 0.8) {
    opportunities.push({
      type: 'SOLID_QUALITY_BASE',
      description: '높은 테스트 커버리지 - 대담한 리팩토링 가능'
    });
  }

  return opportunities;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatPrediction(prediction) {
  const lines = [];

  lines.push('🔮 진화 예측');
  lines.push(`   예상 개념 수: ${prediction.expectedConceptCount}개`);
  lines.push(`   예상 테스트 커버리지: ${(prediction.expectedTestCoverage * 100).toFixed(1)}%`);
  lines.push(`   개념 성장 추세: ${prediction.conceptGrowthTrend}`);
  lines.push(`   테스트 개선 추세: ${prediction.testImprovementTrend}`);
  lines.push(`   예상 포커스: ${prediction.predictedFocus.join(', ')}`);

  if (prediction.risks.length > 0) {
    lines.push('\n   위험:');
    for (const risk of prediction.risks) {
      lines.push(`     ⚠️  [${risk.severity}] ${risk.description}`);
    }
  }

  if (prediction.opportunities.length > 0) {
    lines.push('\n   기회:');
    for (const opp of prediction.opportunities) {
      lines.push(`     ✨ ${opp.description}`);
    }
  }

  lines.push(`\n   신뢰도: ${(prediction.confidence * 100).toFixed(0)}%`);

  return lines.join('\n');
}

export default {
  analyzeConceptGrowth,
  analyzeTestCoverageTrend,
  predictNextValues,
  predictNextEvolutionPhase,
  formatPrediction
};
