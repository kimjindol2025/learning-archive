/**
 * 진화 메트릭 계산 모듈
 * 진화 밀도, 지능 지수 등 고급 지표
 */

/**
 * 기간별 진화 밀도 계산
 */
export function calculateEvolutionDensity(intents, timespan) {
  if (intents.length < 1 || timespan <= 0) return 0;

  // 설계 변경 commit 수
  const designChangeCommits = intents.filter(intent =>
    intent.category === 'Architecture' ||
    intent.category === 'API' ||
    intent.category === 'Verification'
  ).length;

  // 영향도 평균
  const averageImpact = intents.reduce((sum, i) => sum + i.impactLevel, 0) / intents.length;

  // 진화 밀도 = (설계 변경 commit 수 × 영향도 평균) ÷ 기간
  const densityScore = (designChangeCommits * averageImpact) / (timespan / 1000 / 60 / 60 / 24);

  return parseFloat(densityScore.toFixed(4));
}

/**
 * 아키텍처 확장 점수 계산
 */
export function calculateArchitectureExpansionScore(intents) {
  // 새로운 개념 도입 수
  const concepts = extractUniqueConcepts(intents);
  const newConceptCount = concepts.size;

  // 의존성 증가량
  const dependencyGrowth = calculateDependencyGrowth(intents);

  // 아키텍처 확장 점수
  const score = newConceptCount * dependencyGrowth;

  return parseFloat(score.toFixed(2));
}

/**
 * 고유 개념 추출
 */
function extractUniqueConcepts(intents) {
  const concepts = new Set();
  const conceptPatterns = [
    /타입|type/i,
    /메모리|memory/i,
    /제어|control/i,
    /인터페이스|interface|api/i,
    /성능|performance/i,
    /안정성|stability/i,
    /상호운용|interop|ffi/i,
    /테스트|test|verify/i,
    /모듈|module/i,
    /계층|layer/i
  ];

  for (const intent of intents) {
    for (const pattern of conceptPatterns) {
      if (pattern.test(intent.intent)) {
        concepts.add(pattern.source);
      }
    }
  }

  return concepts;
}

/**
 * 의존성 증가량 계산
 */
function calculateDependencyGrowth(intents) {
  const categories = {};

  for (const intent of intents) {
    categories[intent.category] = (categories[intent.category] || 0) + 1;
  }

  // 카테고리 다양성을 의존성 증가량으로 환산
  const diversityScore = Object.keys(categories).length / 10;

  return Math.min(2.0, diversityScore + 1.0);
}

/**
 * 설계 성숙도 계산
 */
export function calculateDesignMaturity(intents) {
  const metrics = {
    verificationScore: 0,
    stabilityScore: 0,
    architectureScore: 0,
    codeQualityScore: 0,
    overallMaturity: 0
  };

  if (intents.length === 0) return metrics;

  // 검증 점수: Verification 카테고리 비율
  const verificationCount = intents.filter(i => i.category === 'Verification').length;
  metrics.verificationScore = verificationCount / intents.length;

  // 안정성 점수: 깊이 메트릭과 신뢰도 평균
  const depthScores = intents.map(i => i.depth === 'Deep' ? 1 : (i.depth === 'Medium' ? 0.5 : 0));
  const avgDepth = depthScores.reduce((a, b) => a + b, 0) / intents.length;
  const avgConfidence = intents.reduce((sum, i) => sum + i.confidence, 0) / intents.length;
  metrics.stabilityScore = (avgDepth + avgConfidence) / 2;

  // 아키텍처 점수: Architecture/API 카테고리 비율
  const archCount = intents.filter(i =>
    i.category === 'Architecture' || i.category === 'API'
  ).length;
  metrics.architectureScore = archCount / intents.length;

  // 코드 품질 점수: Refactoring/Quality 카테고리 비율
  const qualityCount = intents.filter(i =>
    i.category === 'Refactoring' || i.category === 'Quality'
  ).length;
  metrics.codeQualityScore = qualityCount / intents.length;

  // 전체 성숙도
  metrics.overallMaturity = (
    metrics.verificationScore * 0.25 +
    metrics.stabilityScore * 0.25 +
    metrics.architectureScore * 0.25 +
    metrics.codeQualityScore * 0.25
  );

  return metrics;
}

/**
 * 설계 트렌드 분석
 */
export function analyzeDesignTrend(intents) {
  if (intents.length < 2) {
    return { trend: 'insufficient_data', score: 0 };
  }

  // 시간 순서로 정렬
  const sorted = [...intents].sort((a, b) =>
    new Date(a.commit.timestamp) - new Date(b.commit.timestamp)
  );

  // 전반부와 후반부의 영향도 비교
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  const avgFirstHalf = firstHalf.reduce((sum, i) => sum + i.impactLevel, 0) / firstHalf.length;
  const avgSecondHalf = secondHalf.reduce((sum, i) => sum + i.impactLevel, 0) / secondHalf.length;

  const trendScore = (avgSecondHalf - avgFirstHalf) / (avgFirstHalf || 1);

  let trend = 'stable';
  if (trendScore > 0.2) trend = 'accelerating';
  if (trendScore < -0.2) trend = 'decelerating';

  return {
    trend,
    score: parseFloat(trendScore.toFixed(3)),
    firstHalfAverage: parseFloat(avgFirstHalf.toFixed(3)),
    secondHalfAverage: parseFloat(avgSecondHalf.toFixed(3))
  };
}

/**
 * 복잡도 진화 추적
 */
export function trackComplexityEvolution(intents) {
  const evolution = [];

  for (let i = 0; i < intents.length; i++) {
    const cumulative = intents.slice(0, i + 1);

    const complexity = {
      index: i,
      timestamp: intents[i].commit.timestamp,
      localComplexity: intents[i].impactLevel,
      cumulativeComplexity: calculateCumulativeComplexity(cumulative),
      architectureDepth: calculateArchitectureDepth(cumulative),
      conceptDiversity: calculateConceptDiversity(cumulative)
    };

    evolution.push(complexity);
  }

  return evolution;
}

/**
 * 누적 복잡도 계산
 */
function calculateCumulativeComplexity(intents) {
  return intents.reduce((sum, i) => sum + i.impactLevel, 0) / intents.length;
}

/**
 * 아키텍처 깊이 계산
 */
function calculateArchitectureDepth(intents) {
  const architectureCount = intents.filter(i =>
    i.category === 'Architecture'
  ).length;

  return architectureCount / intents.length;
}

/**
 * 개념 다양성 계산
 */
function calculateConceptDiversity(intents) {
  const concepts = extractUniqueConcepts(intents);
  const maxPossibleConcepts = 10;

  return concepts.size / maxPossibleConcepts;
}

/**
 * 혁신 지수 계산
 */
export function calculateInnovationIndex(intents, graph) {
  if (!intents || intents.length === 0) return 0;

  // 새로운 카테고리 도입
  const categories = new Set(intents.map(i => i.category));
  const categoryNovelty = categories.size / 7; // 7개 카테고리 기준

  // 깊은 변경의 비율
  const deepChanges = intents.filter(i => i.depth === 'Deep').length;
  const depthNovelty = deepChanges / intents.length;

  // 아키텍처 클러스터 성장
  const clusterGrowth = graph?.clusters?.length || 1;
  const clusterNovelty = Math.min(1.0, clusterGrowth / 5);

  // 혁신 지수
  const innovationIndex =
    categoryNovelty * 0.33 +
    depthNovelty * 0.33 +
    clusterNovelty * 0.34;

  return parseFloat(innovationIndex.toFixed(3));
}

/**
 * 설계 지능 지수 계산 (통합 지표)
 */
export function calculateDesignIntelligenceScore(intents, graph, dependencies) {
  const maturity = calculateDesignMaturity(intents);
  const density = calculateEvolutionDensity(intents, intents.length * 24 * 60 * 60 * 1000);
  const innovation = calculateInnovationIndex(intents, graph);
  const expansion = calculateArchitectureExpansionScore(intents);

  // 정규화
  const normalizedDensity = Math.min(1.0, density / 10);
  const normalizedExpansion = Math.min(1.0, expansion / 100);

  // 지능 지수 (0-100)
  const score =
    maturity.overallMaturity * 0.25 +
    normalizedDensity * 0.25 +
    innovation * 0.25 +
    normalizedExpansion * 0.25;

  return {
    overallScore: parseFloat((score * 100).toFixed(1)),
    components: {
      maturity: parseFloat((maturity.overallMaturity * 100).toFixed(1)),
      density: parseFloat((normalizedDensity * 100).toFixed(1)),
      innovation: parseFloat((innovation * 100).toFixed(1)),
      expansion: parseFloat((normalizedExpansion * 100).toFixed(1))
    },
    interpretation: interpretScore(score)
  };
}

/**
 * 점수 해석
 */
function interpretScore(score) {
  if (score >= 0.8) return '우수한 설계 진화 - 매우 높은 지능';
  if (score >= 0.6) return '양호한 설계 진화 - 높은 지능';
  if (score >= 0.4) return '보통의 설계 진화 - 중간 지능';
  if (score >= 0.2) return '제한적인 설계 진화 - 낮은 지능';
  return '미미한 설계 진화 - 매우 낮은 지능';
}

/**
 * 포맷팅 (테스트용)
 */
export function formatEvolutionMetrics(metrics) {
  const lines = [];

  lines.push('📈 진화 메트릭');
  lines.push(`   설계 성숙도: ${(metrics.overallMaturity * 100).toFixed(1)}%`);
  lines.push(`   혁신 지수: ${(metrics.innovationIndex * 100).toFixed(1)}%`);
  lines.push(`   아키텍처 확장: ${metrics.expansionScore}`);
  lines.push(`   진화 밀도: ${metrics.density}`);

  return lines.join('\n');
}

export default {
  calculateEvolutionDensity,
  calculateArchitectureExpansionScore,
  calculateDesignMaturity,
  analyzeDesignTrend,
  trackComplexityEvolution,
  calculateInnovationIndex,
  calculateDesignIntelligenceScore,
  formatEvolutionMetrics
};
