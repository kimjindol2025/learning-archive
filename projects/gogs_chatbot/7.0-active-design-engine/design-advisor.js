/**
 * 설계 파트너 - 통합 설계 조언 시스템
 * 모든 분석을 통합하여 능동적 제안 생성
 */

/**
 * 통합 분석 및 조언 생성
 */
export function generateDesignAdvice(
  warnings,
  balance,
  patternMatches,
  prediction,
  ecosystemHealth,
  currentPhase
) {
  const advice = {
    timestamp: new Date(),
    phase: currentPhase?.phase || 'unknown',
    severity: determineSeverity(warnings),
    sections: [],
    actionItems: [],
    priority: []
  };

  // 1. 위험 경고 섹션
  if (warnings.length > 0) {
    advice.sections.push(generateWarningSection(warnings));
  }

  // 2. 균형 분석 섹션
  advice.sections.push(generateBalanceSection(balance));

  // 3. 패턴 기반 제안 섹션
  if (patternMatches.length > 0) {
    advice.sections.push(generatePatternSection(patternMatches));
  }

  // 4. 진화 예측 섹션
  advice.sections.push(generatePredictionSection(prediction));

  // 5. 생태계 맥락 섹션
  if (ecosystemHealth) {
    advice.sections.push(generateEcosystemSection(ecosystemHealth));
  }

  // 우선순위 액션 아이템 생성
  advice.actionItems = generateActionItems(warnings, balance, prediction);
  advice.priority = prioritizeActions(advice.actionItems);

  return advice;
}

/**
 * 심각도 결정
 */
function determineSeverity(warnings) {
  const criticalCount = warnings.filter(w => w.severity === 'CRITICAL').length;
  const highCount = warnings.filter(w => w.severity === 'HIGH').length;

  if (criticalCount > 0) return 'CRITICAL';
  if (highCount > 2) return 'HIGH';
  if (highCount > 0 || warnings.length > 5) return 'MEDIUM';
  return 'LOW';
}

/**
 * 경고 섹션 생성
 */
function generateWarningSection(warnings) {
  const section = {
    title: '⚠️  구조 위험 경고',
    items: []
  };

  // 심각도별 그룹화
  const bySeverity = {};
  for (const warning of warnings) {
    if (!bySeverity[warning.severity]) {
      bySeverity[warning.severity] = [];
    }
    bySeverity[warning.severity].push(warning);
  }

  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  for (const severity of severityOrder) {
    if (bySeverity[severity]) {
      section.items.push({
        severity,
        count: bySeverity[severity].length,
        warnings: bySeverity[severity].map(w => ({
          type: w.type,
          message: w.message,
          details: extractWarningDetails(w)
        }))
      });
    }
  }

  return section;
}

/**
 * 경고 상세 정보 추출
 */
function extractWarningDetails(warning) {
  if (warning.type === 'CENTRALITY_SPIKE') {
    return `${warning.previous.toFixed(2)} → ${warning.current.toFixed(2)} (변화: ${warning.change.toFixed(2)})`;
  }
  if (warning.type === 'DEPENDENCY_CONGESTION') {
    return `${warning.inDegree}개 모듈이 의존 (임계값: ${warning.threshold})`;
  }
  return '';
}

/**
 * 균형 분석 섹션
 */
function generateBalanceSection(balance) {
  const section = {
    title: '⚖️  설계 균형 분석',
    currentBalance: balance.balance,
    assessment: balance.assessment,
    trend: null,
    items: []
  };

  // 추이 분석
  if (balance.trends && balance.trends.length > 1) {
    const current = balance.trends[balance.trends.length - 1];
    const previous = balance.trends[balance.trends.length - 2];
    section.trend = {
      direction: current.balance.index > previous.balance.index ? 'IMPROVING' : 'DECLINING',
      delta: current.balance.index - previous.balance.index
    };
  }

  // 권장사항
  if (balance.assessment?.recommendations) {
    section.items = balance.assessment.recommendations.map(rec => ({
      type: 'RECOMMENDATION',
      text: rec
    }));
  }

  return section;
}

/**
 * 패턴 기반 제안 섹션
 */
function generatePatternSection(patternMatches) {
  const section = {
    title: '💡 설계 패턴 기반 제안',
    topMatch: patternMatches[0],
    items: []
  };

  if (patternMatches[0]) {
    const topMatch = patternMatches[0];
    section.items.push({
      type: 'PATTERN_MATCH',
      pattern: topMatch.pattern,
      confidence: topMatch.confidence,
      expectedChanges: topMatch.nextPhase?.keyChanges || []
    });
  }

  return section;
}

/**
 * 진화 예측 섹션
 */
function generatePredictionSection(prediction) {
  const section = {
    title: '🔮 진화 예측',
    forecast: {
      concepts: prediction.expectedConceptCount,
      testing: prediction.expectedTestCoverage,
      focus: prediction.predictedFocus
    },
    items: []
  };

  // 위험 항목
  if (prediction.risks && prediction.risks.length > 0) {
    section.items.push({
      type: 'RISKS',
      items: prediction.risks.map(r => ({
        severity: r.severity,
        description: r.description
      }))
    });
  }

  // 기회 항목
  if (prediction.opportunities && prediction.opportunities.length > 0) {
    section.items.push({
      type: 'OPPORTUNITIES',
      items: prediction.opportunities.map(o => ({
        description: o.description,
        type: o.type
      }))
    });
  }

  return section;
}

/**
 * 생태계 맥락 섹션
 */
function generateEcosystemSection(health) {
  const section = {
    title: '🌍 생태계 맥락',
    health: health.overall,
    repoHealth: {
      diversity: health.diversity,
      stability: health.stability,
      connectivity: health.connectivity
    },
    items: []
  };

  if (health.overall < 0.5) {
    section.items.push({
      type: 'WARNING',
      text: '생태계 건강도 저하 - 크로스 저장소 영향력 증진 필요'
    });
  }

  return section;
}

/**
 * 액션 아이템 생성
 */
function generateActionItems(warnings, balance, prediction) {
  const items = [];

  // 위험 기반 액션
  const criticalWarnings = warnings.filter(w => w.severity === 'CRITICAL');
  if (criticalWarnings.length > 0) {
    items.push({
      priority: 'P0',
      type: 'URGENT_FIX',
      action: `${criticalWarnings.length}개의 심각한 구조 문제 해결`,
      details: criticalWarnings.map(w => w.message)
    });
  }

  // 균형 기반 액션
  if (balance.assessment?.recommendations) {
    for (const rec of balance.assessment.recommendations) {
      items.push({
        priority: rec.includes('테스트') ? 'P1' : 'P2',
        type: 'BALANCE_IMPROVEMENT',
        action: rec
      });
    }
  }

  // 예측 기반 액션
  if (prediction.risks && prediction.risks.length > 0) {
    for (const risk of prediction.risks) {
      items.push({
        priority: 'P1',
        type: 'RISK_MITIGATION',
        action: `위험 완화: ${risk.description}`
      });
    }
  }

  return items;
}

/**
 * 액션 우선순위 지정
 */
function prioritizeActions(items) {
  const prioritized = {};
  const priorities = ['P0', 'P1', 'P2'];

  for (const priority of priorities) {
    prioritized[priority] = items.filter(item => item.priority === priority);
  }

  return prioritized;
}

/**
 * 설계 파트너 대화체 생성
 */
export function generateAdvisoryMessage(advice) {
  const lines = [];

  lines.push('🤝 설계 진화 동반 지능 (Design Evolution Companion)');
  lines.push('='.repeat(50));

  // 상황 평가
  lines.push(`\n📊 현재 상황 평가: ${advice.severity}`);
  lines.push(`   Phase: ${advice.phase}`);

  // 섹션별 요약
  for (const section of advice.sections) {
    lines.push(`\n${section.title}`);

    if (section.currentBalance) {
      lines.push(`   균형 지수: ${section.currentBalance.index.toFixed(2)}`);
      lines.push(`   상태: ${section.currentBalance.trend}`);
    }

    if (section.topMatch) {
      lines.push(`   매칭 패턴: ${section.topMatch.pattern}`);
      lines.push(`   신뢰도: ${(section.topMatch.confidence * 100).toFixed(0)}%`);
    }

    if (section.forecast) {
      lines.push(`   예상 개념: ${section.forecast.concepts}개`);
      lines.push(`   예상 테스트: ${(section.forecast.testing * 100).toFixed(0)}%`);
    }

    if (section.items && section.items.length > 0) {
      for (const item of section.items.slice(0, 3)) {
        if (typeof item === 'string') {
          lines.push(`   → ${item}`);
        } else if (item.text) {
          lines.push(`   → ${item.text}`);
        }
      }
    }
  }

  // 우선 액션
  lines.push('\n🎯 우선 조치 사항');
  const p0Items = advice.priority.P0 || [];
  if (p0Items.length > 0) {
    lines.push('   [긴급]');
    for (const item of p0Items) {
      lines.push(`     🔴 ${item.action}`);
    }
  }

  const p1Items = advice.priority.P1 || [];
  if (p1Items.length > 0) {
    lines.push('   [높음]');
    for (const item of p1Items.slice(0, 2)) {
      lines.push(`     🟡 ${item.action}`);
    }
  }

  lines.push('\n💭 설계 파트너의 조언:');
  lines.push(generateWisdom(advice));

  lines.push('\n' + '='.repeat(50));

  return lines.join('\n');
}

/**
 * 설계 지혜 생성
 */
function generateWisdom(advice) {
  const wisdoms = [];

  if (advice.severity === 'CRITICAL') {
    wisdoms.push('현재 구조가 매우 위험한 상태입니다. 즉시 개선이 필요합니다.');
  } else if (advice.severity === 'HIGH') {
    wisdoms.push('설계의 몇 가지 부분이 우려됩니다. 다음 단계에서 집중 개선하세요.');
  }

  // 패턴 기반 지혜
  const patternSection = advice.sections.find(s => s.title?.includes('패턴'));
  if (patternSection?.topMatch && patternSection.topMatch.confidence > 0.8) {
    wisdoms.push(`과거 패턴과 매우 유사합니다. "${patternSection.topMatch.pattern}" 경로를 참고하세요.`);
  }

  // 균형 기반 지혜
  const balanceSection = advice.sections.find(s => s.title?.includes('균형'));
  if (balanceSection?.trend?.direction === 'IMPROVING') {
    wisdoms.push('설계 균형이 개선되고 있습니다. 현재의 방향을 유지하세요.');
  } else if (balanceSection?.trend?.direction === 'DECLINING') {
    wisdoms.push('설계 균형이 악화되고 있습니다. 코드와 테스트의 비율을 재조정하세요.');
  }

  return wisdoms.length > 0 ? wisdoms[0] : '설계 진화가 진행 중입니다. 계속 모니터링하세요.';
}

/**
 * 포맷팅 (테스트용)
 */
export function formatAdvice(advice) {
  return generateAdvisoryMessage(advice);
}

export default {
  generateDesignAdvice,
  generateAdvisoryMessage,
  formatAdvice
};
