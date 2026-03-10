/**
 * 지식 생태계 분석 모듈
 * 다중 저장소의 생태계 건강도와 영향력 계산
 */

/**
 * 저장소 영향력 점수 계산
 */
export function calculateRepositoryInfluence(aggregated, transfers, conceptSharing) {
  const influence = {};

  for (const repo in aggregated.repositories) {
    const metadata = aggregated.repositories[repo];
    const repoTransfers = transfers.filter(t => t.from === repo);
    const repoReceives = transfers.filter(t => t.to === repo);
    const concepts = aggregated.repoIndex[repo].intents.length;

    // 영향력 점수: 개념 수 × 전이 역동성 × 타입 가중치
    const typeWeight = getRepositoryTypeWeight(metadata.type);
    const outflowScore = repoTransfers.length > 0 ?
      repoTransfers.reduce((sum, t) => sum + t.direction.split('_').length, 0) / repoTransfers.length : 0;
    const inflowScore = repoReceives.length > 0 ? repoReceives.length : 0;

    const score = (concepts / 10) * (0.6 * outflowScore + 0.4 * inflowScore) * typeWeight;

    influence[repo] = {
      repo,
      score,
      outflow: repoTransfers.length,
      inflow: repoReceives.length,
      conceptContribution: concepts,
      type: metadata.type,
      role: aggregated.repositories[repo].cognitiveLayer || 'unknown'
    };
  }

  return influence;
}

/**
 * 저장소 타입별 가중치
 */
function getRepositoryTypeWeight(type) {
  const weights = {
    core: 1.0,
    theoretical: 0.9,
    experimental: 0.7,
    application: 0.6,
    mixed: 0.5
  };
  return weights[type] || 0.5;
}

/**
 * 생태계 건강도 지수
 */
export function calculateEcosystemHealth(aggregated, influence, transfers) {
  const repos = Object.keys(aggregated.repositories);

  // 1. 다양성: 저장소 수와 역할 분포
  const roleDistribution = {};
  for (const repo in aggregated.repositories) {
    const type = aggregated.repositories[repo].type;
    roleDistribution[type] = (roleDistribution[type] || 0) + 1;
  }
  const diversity = Object.keys(roleDistribution).length / 5; // 5가지 타입 기준

  // 2. 안정성: 개념 공유도와 전이 일관성
  const avgSharing = Object.values(influence).reduce((sum, inf) => sum + inf.score, 0) / repos.length;
  const stability = Math.min(1.0, avgSharing * 1.5);

  // 3. 성장성: 새로운 개념 도입 속도
  const newConcepts = transfers.filter(t => t.transferLag < 1000 * 60 * 60 * 24 * 30).length; // 30일 내
  const growth = Math.min(1.0, newConcepts / Math.max(1, transfers.length / 2));

  // 4. 연결성: 저장소 간 연결 밀도
  const maxEdges = repos.length * (repos.length - 1);
  const actualEdges = new Set(transfers.map(t => `${t.from}-${t.to}`)).size;
  const connectivity = maxEdges > 0 ? actualEdges / maxEdges : 0;

  const overallHealth = (diversity * 0.25 + stability * 0.35 + growth * 0.2 + connectivity * 0.2);

  return {
    overall: overallHealth,
    diversity,
    stability,
    growth,
    connectivity,
    repoCount: repos.length,
    transferCount: transfers.length,
    conceptCount: aggregated.globalConcepts.size
  };
}

/**
 * 생태계 구조 분석
 */
export function analyzeEcosystemStructure(aggregated, transfers) {
  const structure = {
    coreRepositories: [],
    theoreticalRepositories: [],
    experimentalRepositories: [],
    applicationRepositories: [],
    communicationPaths: [],
    bottlenecks: []
  };

  // 저장소 분류
  for (const repo in aggregated.repositories) {
    const metadata = aggregated.repositories[repo];
    switch (metadata.type) {
      case 'core':
        structure.coreRepositories.push(repo);
        break;
      case 'theoretical':
        structure.theoreticalRepositories.push(repo);
        break;
      case 'experimental':
        structure.experimentalRepositories.push(repo);
        break;
      case 'application':
        structure.applicationRepositories.push(repo);
        break;
    }
  }

  // 통신 경로: 어느 repo들이 서로 concept을 주고받는가
  const pathMap = {};
  for (const transfer of transfers) {
    const path = `${transfer.from} → ${transfer.to}`;
    pathMap[path] = (pathMap[path] || 0) + 1;
  }

  structure.communicationPaths = Object.entries(pathMap)
    .map(([path, count]) => ({ path, transferCount: count }))
    .sort((a, b) => b.transferCount - a.transferCount);

  // 병목: 전이가 집중된 지점
  const bottleneckCandidates = {};
  for (const transfer of transfers) {
    bottleneckCandidates[transfer.to] = (bottleneckCandidates[transfer.to] || 0) + 1;
  }

  structure.bottlenecks = Object.entries(bottleneckCandidates)
    .filter(([_, count]) => count > Math.max(2, transfers.length / 10))
    .map(([repo, count]) => ({ repo, receiveCount: count }))
    .sort((a, b) => b.receiveCount - a.receiveCount);

  return structure;
}

/**
 * 생태계 성숙도
 */
export function calculateEcosystemMaturity(aggregated, influence, health) {
  const repos = Object.keys(aggregated.repositories);
  const influenceScores = Object.values(influence).map(i => i.score);

  // 1. 균형성: 저장소 간 영향력 분포
  const avgInfluence = influenceScores.reduce((a, b) => a + b, 0) / repos.length;
  const variance = influenceScores.reduce((sum, score) => sum + Math.pow(score - avgInfluence, 2), 0) / repos.length;
  const stdDev = Math.sqrt(variance);
  const balance = Math.max(0, 1.0 - (stdDev / (avgInfluence || 1)));

  // 2. 개념 집중도: 개념이 얼마나 분산되어 있는가
  const conceptDistribution = {};
  for (const concept of aggregated.globalConcepts) {
    const origins = aggregated.conceptOrigins[concept] || [];
    const repoCount = new Set(origins.map(o => o.repo)).size;
    conceptDistribution[repoCount] = (conceptDistribution[repoCount] || 0) + 1;
  }
  const spread = Object.entries(conceptDistribution)
    .reduce((sum, [count, freq]) => sum + (count * freq), 0) / aggregated.globalConcepts.size;
  const concentration = Math.min(1.0, spread / repos.length);

  // 3. 역할 명확성: 저장소 역할 다양성
  const typeCount = new Set(repos.map(r => aggregated.repositories[r].type)).size;
  const roleCertainty = Math.min(1.0, typeCount / 5);

  const maturity = (balance * 0.3 + concentration * 0.4 + roleCertainty * 0.3);

  return {
    score: maturity,
    balance,
    concentration,
    roleCertainty,
    avgInfluence: avgInfluence || 0,
    inflowVariance: stdDev
  };
}

/**
 * 생태계 권장사항
 */
export function generateEcosystemRecommendations(health, maturity, structure) {
  const recommendations = [];

  if (health.diversity < 0.6) {
    recommendations.push('🔧 저장소 타입 다양성 부족 - 이론/실험 저장소 추가 권장');
  }

  if (health.stability < 0.5) {
    recommendations.push('⚠️  개념 공유도 낮음 - 저장소 간 문서화 강화 필요');
  }

  if (health.connectivity < 0.3) {
    recommendations.push('🔗 저장소 간 연결성 약함 - 크로스-repo 협업 증진 필요');
  }

  if (maturity.score < 0.5) {
    recommendations.push('📊 생태계 성숙도 낮음 - 역할 분명 약화, 재구조화 권장');
  }

  if (maturity.balance < 0.4) {
    recommendations.push('⚖️  영향력 불균형 - 핵심 저장소에 의존도 높음');
  }

  if (structure.bottlenecks.length > 0) {
    recommendations.push(`🚨 병목 저장소 ${structure.bottlenecks.length}개 감지 - 개념 확산 경로 검토`);
  }

  return recommendations;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatEcosystemAnalysis(influence, health, maturity, structure) {
  const lines = [];

  lines.push('🌍 생태계 건강도 분석');
  lines.push(`   전체 건강도: ${(health.overall * 100).toFixed(1)}%`);
  lines.push(`   다양성: ${(health.diversity * 100).toFixed(1)}%`);
  lines.push(`   안정성: ${(health.stability * 100).toFixed(1)}%`);
  lines.push(`   성장성: ${(health.growth * 100).toFixed(1)}%`);
  lines.push('');
  lines.push('📈 성숙도');
  lines.push(`   성숙도 점수: ${(maturity.score * 100).toFixed(1)}%`);
  lines.push(`   균형성: ${(maturity.balance * 100).toFixed(1)}%`);
  lines.push(`   개념 확산: ${(maturity.concentration * 100).toFixed(1)}%`);

  return lines.join('\n');
}

export default {
  calculateRepositoryInfluence,
  calculateEcosystemHealth,
  analyzeEcosystemStructure,
  calculateEcosystemMaturity,
  generateEcosystemRecommendations,
  formatEcosystemAnalysis
};
