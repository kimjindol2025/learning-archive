/**
 * 설계 패턴 기반 제안 모듈
 * 과거 패턴으로부터 다음 단계 추천
 */

/**
 * 이전 진화 패턴 추출
 */
export function extractEvolutionPatterns(phaseHistories) {
  const patterns = [];

  for (let i = 1; i < phaseHistories.length; i++) {
    const prev = phaseHistories[i - 1];
    const curr = phaseHistories[i];
    const next = i + 1 < phaseHistories.length ? phaseHistories[i + 1] : null;

    const pattern = {
      phase: `${prev.phase} → ${curr.phase}${next ? ` → ${next.phase}` : ''}`,
      transitions: [
        {
          from: prev,
          to: curr,
          conceptsAdded: findNewConcepts(prev.concepts, curr.concepts),
          conceptsRemoved: findRemovedConcepts(prev.concepts, curr.concepts),
          conceptsExpanded: findExpandedConcepts(prev, curr),
          centralityChanges: calculateCentralityChanges(prev.roles, curr.roles),
          timeGap: curr.timestamp - prev.timestamp,
          intensity: calculateTransitionIntensity(prev, curr)
        }
      ]
    };

    if (next) {
      pattern.transitions.push({
        from: curr,
        to: next,
        conceptsAdded: findNewConcepts(curr.concepts, next.concepts),
        conceptsRemoved: findRemovedConcepts(curr.concepts, next.concepts),
        conceptsExpanded: findExpandedConcepts(curr, next),
        centralityChanges: calculateCentralityChanges(curr.roles, next.roles),
        timeGap: next.timestamp - curr.timestamp,
        intensity: calculateTransitionIntensity(curr, next)
      });
    }

    patterns.push(pattern);
  }

  return patterns;
}

/**
 * 새로운 개념 식별
 */
function findNewConcepts(prevConcepts, currConcepts) {
  return currConcepts.filter(c => !prevConcepts.includes(c));
}

/**
 * 제거된 개념 식별
 */
function findRemovedConcepts(prevConcepts, currConcepts) {
  return prevConcepts.filter(c => !currConcepts.includes(c));
}

/**
 * 확장된 개념 식별
 */
function findExpandedConcepts(prevPhase, currPhase) {
  const expanded = [];

  for (const concept in prevPhase.roles) {
    const prevRole = prevPhase.roles[concept];
    const currRole = currPhase.roles[concept];

    if (!currRole) continue;

    // 역할 상승 (peripheral → boundary → expansion → hub → core)
    const prevRank = getRoleRank(prevRole.role);
    const currRank = getRoleRank(currRole.role);

    if (currRank > prevRank) {
      expanded.push({
        concept,
        from: prevRole.role,
        to: currRole.role,
        advancement: currRank - prevRank
      });
    }
  }

  return expanded;
}

/**
 * 역할 순위
 */
function getRoleRank(role) {
  const ranks = { peripheral: 0, boundary: 1, expansion: 2, hub: 3, core: 4 };
  return ranks[role] || 0;
}

/**
 * 중심성 변화 계산
 */
function calculateCentralityChanges(prevRoles, currRoles) {
  const changes = [];

  for (const concept in currRoles) {
    const prevRole = prevRoles[concept];
    if (!prevRole) continue;

    const centralityDelta = (currRoles[concept].centrality || 0) - (prevRole.centrality || 0);
    if (Math.abs(centralityDelta) > 0.1) {
      changes.push({
        concept,
        delta: centralityDelta,
        direction: centralityDelta > 0 ? 'RISE' : 'DECLINE'
      });
    }
  }

  return changes;
}

/**
 * 전이 강도 계산
 */
function calculateTransitionIntensity(fromPhase, toPhase) {
  const conceptDelta = Math.abs(toPhase.concepts.length - fromPhase.concepts.length);
  const commitDelta = Math.abs(toPhase.commitCount - fromPhase.commitCount);
  const densityChange = Math.abs((toPhase.density || 0) - (fromPhase.density || 0));

  return (conceptDelta + commitDelta * 0.1 + densityChange * 10) / 10;
}

/**
 * 현재 상태를 과거 패턴과 비교
 */
export function compareWithPatterns(currentPhase, patterns) {
  const similarities = [];

  for (const pattern of patterns) {
    const lastTransition = pattern.transitions[pattern.transitions.length - 1];
    const fromPhase = lastTransition.from;

    // 유사도 계산
    const conceptSimilarity = calculateConceptSimilarity(
      fromPhase.concepts,
      currentPhase.concepts
    );

    const roleSimilarity = calculateRoleSimilarity(
      fromPhase.roles,
      currentPhase.roles
    );

    const intensitySimilarity = 1 - Math.abs(
      lastTransition.intensity - calculateCurrentIntensity(currentPhase)
    ) / Math.max(lastTransition.intensity, calculateCurrentIntensity(currentPhase));

    const overallSimilarity = (conceptSimilarity * 0.4 + roleSimilarity * 0.4 + intensitySimilarity * 0.2);

    if (overallSimilarity > 0.6) {
      similarities.push({
        pattern: pattern.phase,
        overallSimilarity,
        conceptSimilarity,
        roleSimilarity,
        intensitySimilarity,
        nextPhase: calculateNextPhaseFromPattern(lastTransition),
        confidence: overallSimilarity
      });
    }
  }

  similarities.sort((a, b) => b.overallSimilarity - a.overallSimilarity);
  return similarities;
}

/**
 * 개념 유사도
 */
function calculateConceptSimilarity(concepts1, concepts2) {
  if (concepts1.length === 0 && concepts2.length === 0) return 1.0;
  if (concepts1.length === 0 || concepts2.length === 0) return 0;

  const intersection = concepts1.filter(c => concepts2.includes(c)).length;
  const union = new Set([...concepts1, ...concepts2]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * 역할 유사도
 */
function calculateRoleSimilarity(roles1, roles2) {
  const concepts1 = Object.keys(roles1);
  const concepts2 = Object.keys(roles2);

  if (concepts1.length === 0 && concepts2.length === 0) return 1.0;

  const commonConcepts = concepts1.filter(c => concepts2.includes(c));
  if (commonConcepts.length === 0) return 0;

  const roleMatches = commonConcepts.filter(
    c => roles1[c].role === roles2[c].role
  ).length;

  return roleMatches / commonConcepts.length;
}

/**
 * 현재 강도 계산
 */
function calculateCurrentIntensity(phase) {
  return (phase.concepts.length + phase.commitCount * 0.1 + (phase.density || 0) * 10) / 10;
}

/**
 * 패턴으로부터 다음 단계 예측
 */
function calculateNextPhaseFromPattern(transition) {
  return {
    expectedNewConcepts: transition.conceptsAdded.length,
    expectedRemovedConcepts: transition.conceptsRemoved.length,
    expectedExpansions: transition.conceptsExpanded.length,
    expectedTimeGap: transition.timeGap,
    expectedIntensity: transition.intensity,
    keyChanges: [
      ...transition.conceptsAdded.map(c => `"${c}" 도입`),
      ...transition.conceptsExpanded.map(e => `"${e.concept}" 승격`)
    ]
  };
}

/**
 * 패턴 기반 제안 생성
 */
export function generateRecommendations(currentPhase, matches, assessmentData) {
  const recommendations = [];

  if (matches.length === 0) {
    recommendations.push({
      type: 'NOVEL_DIRECTION',
      confidence: 0,
      message: '새로운 진화 방향입니다. 기존 패턴이 없습니다.'
    });
    return recommendations;
  }

  const topMatch = matches[0];

  // 1. 개념 추천
  if (topMatch.nextPhase.keyChanges.length > 0) {
    recommendations.push({
      type: 'CONCEPT_PROGRESSION',
      confidence: topMatch.confidence,
      message: `다음 단계로 예상되는 변화: ${topMatch.nextPhase.keyChanges.join(', ')}`,
      basedOn: topMatch.pattern
    });
  }

  // 2. 테스트 강화 추천
  if (currentPhase.testRatio < 0.1 && topMatch.nextPhase.expectedNewConcepts > 2) {
    recommendations.push({
      type: 'TEST_REINFORCEMENT',
      confidence: topMatch.confidence * 0.8,
      message: `새로운 개념 도입 후 테스트 강화 단계가 필요할 가능성 높음`,
      pattern: topMatch.pattern,
      suggestion: `테스트 커버리지 목표: 80% 이상`
    });
  }

  // 3. 리팩토링 추천
  if (currentPhase.density > 0.4) {
    recommendations.push({
      type: 'REFACTORING_SUGGESTED',
      confidence: 0.7,
      message: `개념 네트워크 밀도가 높습니다. 리팩토링으로 구조 단순화 권장`,
      currentDensity: currentPhase.density,
      targetDensity: 0.3
    });
  }

  // 4. 문서화 추천
  if (currentPhase.docRatio < 0.05 && topMatch.nextPhase.expectedNewConcepts > 1) {
    recommendations.push({
      type: 'DOCUMENTATION_NEEDED',
      confidence: 0.8,
      message: `새로운 개념들의 설계 의도 문서화 필요`,
      suggestion: `${topMatch.nextPhase.expectedNewConcepts}개 개념의 아키텍처 문서 작성`
    });
  }

  return recommendations;
}

/**
 * 패턴 통계
 */
export function getPatternStatistics(patterns) {
  const stats = {
    totalPatterns: patterns.length,
    avgTransitionIntensity: 0,
    mostCommonConceptAddition: null,
    avgTimeGap: 0,
    averageConceptsPerTransition: 0
  };

  if (patterns.length === 0) return stats;

  let totalIntensity = 0;
  let totalTimeGap = 0;
  let totalTransitions = 0;
  let conceptFrequency = {};

  for (const pattern of patterns) {
    for (const transition of pattern.transitions) {
      totalIntensity += transition.intensity;
      totalTimeGap += transition.timeGap;
      totalTransitions++;

      for (const concept of transition.conceptsAdded) {
        conceptFrequency[concept] = (conceptFrequency[concept] || 0) + 1;
      }
    }
  }

  stats.avgTransitionIntensity = totalIntensity / Math.max(1, totalTransitions);
  stats.avgTimeGap = totalTimeGap / Math.max(1, totalTransitions);
  stats.averageConceptsPerTransition = Object.keys(conceptFrequency).length / Math.max(1, totalTransitions);
  stats.mostCommonConceptAddition = Object.entries(conceptFrequency)
    .sort((a, b) => b[1] - a[1])[0];

  return stats;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatRecommendations(recommendations) {
  const lines = [];

  lines.push('💡 설계 제안');

  for (const rec of recommendations) {
    lines.push(`\n   [${rec.type}] (신뢰도: ${(rec.confidence * 100).toFixed(0)}%)`);
    lines.push(`   → ${rec.message}`);
    if (rec.suggestion) {
      lines.push(`   → 제안: ${rec.suggestion}`);
    }
  }

  return lines.join('\n');
}

export default {
  extractEvolutionPatterns,
  compareWithPatterns,
  generateRecommendations,
  getPatternStatistics,
  formatRecommendations
};
