/**
 * 설계 균형 점수 계산 모듈
 * 코드/테스트/문서 균형 평가
 */

/**
 * 변경 비율 계산
 */
export function calculateChangeRatios(commits) {
  const ratios = {
    code: 0,
    test: 0,
    doc: 0,
    config: 0,
    other: 0
  };

  const totals = {
    code: 0,
    test: 0,
    doc: 0,
    config: 0,
    other: 0
  };

  for (const commit of commits) {
    for (const diff of commit.diffs || []) {
      const file = diff.file.toLowerCase();
      const additions = diff.additions || 0;

      if (file.includes('test') || file.includes('spec')) {
        totals.test += additions;
      } else if (file.includes('readme') || file.includes('.md') || file.includes('doc')) {
        totals.doc += additions;
      } else if (file.includes('.json') || file.includes('.config') || file.includes('.env')) {
        totals.config += additions;
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.go') || file.endsWith('.rs')) {
        totals.code += additions;
      } else {
        totals.other += additions;
      }
    }
  }

  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  if (total === 0) return ratios;

  for (const type in totals) {
    ratios[type] = totals[type] / total;
  }

  return ratios;
}

/**
 * 설계 균형 지수 계산
 */
export function calculateBalanceIndex(ratios) {
  // 지수 = (테스트 + 문서) / 코드
  const numerator = (ratios.test || 0) + (ratios.doc || 0);
  const denominator = ratios.code || 0.01;

  const index = numerator / denominator;

  return {
    index,
    numerator,
    denominator,
    ideal: 0.5, // 코드:테스트+문서 = 2:1
    isBalanced: index >= 0.4 && index <= 0.6,
    trend: classifyBalanceTrend(index)
  };
}

/**
 * 균형 추세 분류
 */
function classifyBalanceTrend(index) {
  if (index >= 0.6) return 'OVER_TESTING';      // 테스트/문서 과다
  if (index >= 0.4) return 'BALANCED';          // 균형
  if (index >= 0.2) return 'UNDER_TESTING';     // 테스트/문서 부족
  return 'SEVERELY_IMBALANCED';                 // 심각한 불균형
}

/**
 * 단계별 균형 추이 분석
 */
export function analyzeBalanceTrend(phaseCommits) {
  const trends = [];

  for (const phase in phaseCommits) {
    const commits = phaseCommits[phase];
    const ratios = calculateChangeRatios(commits);
    const balance = calculateBalanceIndex(ratios);

    trends.push({
      phase: parseInt(phase),
      ratios,
      balance,
      commitCount: commits.length
    });
  }

  trends.sort((a, b) => a.phase - b.phase);

  // 추세 계산
  const trendSlope = calculateTrendSlope(trends.map(t => t.balance.index));

  return {
    trends,
    currentBalance: trends.length > 0 ? trends[trends.length - 1].balance : null,
    averageBalance: trends.reduce((sum, t) => sum + t.balance.index, 0) / Math.max(1, trends.length),
    trendSlope,
    improving: trendSlope > 0,
    trajectory: classifyTrajectory(trendSlope)
  };
}

/**
 * 추세 기울기 계산
 */
function calculateTrendSlope(values) {
  if (values.length < 2) return 0;

  const n = values.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
  const sumX2 = values.reduce((sum, _, i) => sum + (i + 1) ** 2, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  return slope;
}

/**
 * 궤적 분류
 */
function classifyTrajectory(slope) {
  if (slope > 0.05) return 'RAPIDLY_IMPROVING';
  if (slope > 0.01) return 'GRADUALLY_IMPROVING';
  if (slope > -0.01) return 'STABLE';
  if (slope > -0.05) return 'GRADUALLY_DECLINING';
  return 'RAPIDLY_DECLINING';
}

/**
 * 불균형 점수 및 권장사항
 */
export function assessImbalance(ratios, balance) {
  const assessment = {
    balance,
    issues: [],
    recommendations: []
  };

  if (ratios.code > 0.85) {
    assessment.issues.push('코드 변경 비율이 과도합니다');
    assessment.recommendations.push('테스트 작성 강화 필요');
    assessment.recommendations.push('문서화 개선 필요');
  }

  if (ratios.test < 0.05) {
    assessment.issues.push('테스트 범위가 매우 낮습니다');
    assessment.recommendations.push('단위 테스트 추가');
    assessment.recommendations.push('통합 테스트 작성');
  }

  if (ratios.doc < 0.02) {
    assessment.issues.push('문서화가 거의 없습니다');
    assessment.recommendations.push('아키텍처 문서 작성');
    assessment.recommendations.push('API 문서 추가');
    assessment.recommendations.push('설계 결정 기록');
  }

  if (ratios.config > 0.2 && ratios.code < 0.5) {
    assessment.issues.push('설정 파일 변경이 많으며 코드 변경은 적습니다');
    assessment.recommendations.push('설정 자동화 검토');
  }

  return assessment;
}

/**
 * 단계별 균형 비교
 */
export function comparePhaseBalances(phase1Commits, phase2Commits) {
  const ratios1 = calculateChangeRatios(phase1Commits);
  const balance1 = calculateBalanceIndex(ratios1);

  const ratios2 = calculateChangeRatios(phase2Commits);
  const balance2 = calculateBalanceIndex(ratios2);

  const changes = {
    phase1: { ratios: ratios1, balance: balance1 },
    phase2: { ratios: ratios2, balance: balance2 },
    deltas: {
      codeRatioDelta: ratios2.code - ratios1.code,
      testRatioDelta: ratios2.test - ratios1.test,
      docRatioDelta: ratios2.doc - ratios1.doc,
      balanceIndexDelta: balance2.index - balance1.index
    },
    improved: balance2.index > balance1.index,
    verdict: balance2.isBalanced ? 'IMPROVED' : balance1.isBalanced ? 'REGRESSED' : 'UNCHANGED'
  };

  return changes;
}

/**
 * 설계 성숙도와 균형의 상관관계
 */
export function correlateMaturityWithBalance(maturityScore, balanceIndex) {
  const correlation = {
    maturity: maturityScore,
    balance: balanceIndex,
    correlation: 0
  };

  // 성숙한 설계는 일반적으로 더 나은 균형을 가짐
  // 상관관계: 둘 다 높거나 둘 다 낮은 경향

  if (maturityScore > 0.7 && balanceIndex < 0.3) {
    correlation.flag = 'ANOMALY';
    correlation.message = '성숙한 설계인데 테스트/문서가 부족합니다';
  } else if (maturityScore < 0.4 && balanceIndex > 0.6) {
    correlation.flag = 'PREMATURE_POLISH';
    correlation.message = '설계가 미성숙한데 과도한 테스트/문서';
  } else if (maturityScore > 0.6 && balanceIndex > 0.4) {
    correlation.flag = 'HEALTHY';
    correlation.message = '성숙하고 균형잡힌 설계';
  } else if (maturityScore < 0.4 && balanceIndex < 0.3) {
    correlation.flag = 'BOOTSTRAP';
    correlation.message = '초기 개발 단계: 확장 중심';
  }

  return correlation;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatBalanceAnalysis(ratios, balance, assessment) {
  const lines = [];

  lines.push('⚖️  설계 균형 분석');
  lines.push(`   코드: ${(ratios.code * 100).toFixed(1)}%`);
  lines.push(`   테스트: ${(ratios.test * 100).toFixed(1)}%`);
  lines.push(`   문서: ${(ratios.doc * 100).toFixed(1)}%`);
  lines.push('');
  lines.push(`   균형 지수: ${balance.index.toFixed(2)} (이상적: ${balance.ideal.toFixed(2)})`);
  lines.push(`   상태: ${balance.trend}`);
  lines.push('');

  if (assessment.issues.length > 0) {
    lines.push('   문제점:');
    for (const issue of assessment.issues) {
      lines.push(`     - ${issue}`);
    }
  }

  if (assessment.recommendations.length > 0) {
    lines.push('   권장사항:');
    for (const rec of assessment.recommendations) {
      lines.push(`     → ${rec}`);
    }
  }

  return lines.join('\n');
}

export default {
  calculateChangeRatios,
  calculateBalanceIndex,
  analyzeBalanceTrend,
  assessImbalance,
  comparePhaseBalances,
  correlateMaturityWithBalance,
  formatBalanceAnalysis
};
