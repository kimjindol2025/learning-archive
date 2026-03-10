/**
 * 의도 추출 모듈 (LLM 기반)
 * Claude API를 통한 구조화된 설계 의도 추출
 */

/**
 * Commit 정보로부터 의도 프롬프트 생성
 */
export function buildIntentPrompt(commit, diffSummary, impactMetrics) {
  const prompt = `
다음 Commit의 설계 의도를 한 문장으로 분석하고, 영향 카테고리를 분류해주세요.

Commit:
- Hash: ${commit.hash}
- Message: "${commit.message}"
- Author: ${commit.author}
- Timestamp: ${commit.timestamp.toISOString()}

파일 변경:
- 총 파일: ${diffSummary.filesChanged}개
- 추가된 줄: ${diffSummary.linesAdded}줄
- 삭제된 줄: ${diffSummary.linesDeleted}줄
- 파일 타입: ${Object.entries(diffSummary.fileTypes).map(([type, count]) => \`\${type}(\${count})\`).join(', ')}

주요 키워드: ${diffSummary.keywords.join(', ')}

영향도 메트릭:
- 파일 영향도: ${(impactMetrics.fileImpact * 100).toFixed(1)}%
- 크기 영향도: ${(impactMetrics.sizeImpact * 100).toFixed(1)}%
- 복잡도 영향도: ${(impactMetrics.complexityImpact * 100).toFixed(1)}%
- 전체 영향도: ${(impactMetrics.overallImpact * 100).toFixed(1)}%

다음 형식으로 응답해주세요:
{
  "intent": "한 문장의 설계 의도",
  "category": "Architecture|Performance|Quality|API|Optimization|Refactoring|Verification|Other",
  "depth": "Shallow|Medium|Deep",
  "reasoning": "분석 근거 (2-3문장)"
}

응답은 JSON만 포함해주세요.
`;

  return prompt;
}

/**
 * 구조화된 입력으로부터 의도 추출 (시뮬레이션)
 * 실제 환경에서는 Claude API 호출
 */
export function extractIntentStructured(commit, diffSummary, impactMetrics) {
  // 규칙 기반 의도 결정 (LLM 대체)
  const intent = inferIntentFromData(commit, diffSummary, impactMetrics);

  return {
    commit: commit.hash,
    intent: intent.intent,
    category: intent.category,
    depth: calculateDepth(diffSummary, impactMetrics),
    reasoning: intent.reasoning,
    confidence: intent.confidence,
    impactLevel: impactMetrics.overallImpact
  };
}

/**
 * 데이터로부터 의도 추론
 */
function inferIntentFromData(commit, diffSummary, impactMetrics) {
  const message = commit.message.toLowerCase();
  const keywords = diffSummary.keywords || [];

  // 카테고리와 의도 결정
  let category = 'Other';
  let intent = '일반 개발';
  let reasoning = '';

  if (keywords.includes('test') || diffSummary.filesChanged > 3) {
    category = 'Verification';
    intent = '테스트 및 검증 강화를 통한 안정성 개선';
    reasoning = '테스트 파일 추가 및 검증 로직 확장으로 코드 안정성 강화';
  } else if (keywords.includes('spec') || message.includes('design')) {
    category = 'Architecture';
    intent = '아키텍처 설계 재정의 및 명세 업데이트';
    reasoning = '설계 명세 문서 수정으로 아키텍처 진화 표현';
  } else if (keywords.includes('perf') || keywords.includes('optim')) {
    category = 'Performance';
    intent = '성능 최적화를 위한 알고리즘 개선';
    reasoning = '성능 관련 키워드와 대량 코드 변경으로 최적화 의도 추론';
  } else if (keywords.includes('unsafe') || keywords.includes('ffi')) {
    category = 'Architecture';
    intent = '외부 언어와의 상호운용성 확보';
    reasoning = '저수준 FFI 및 Unsafe 코드 추가로 상호운용성 확장';
  } else if (keywords.includes('api') || message.includes('interface')) {
    category = 'API';
    intent = '공개 API 인터페이스 확장';
    reasoning = 'API 변경과 함수 추가로 공개 인터페이스 확대';
  } else if (keywords.includes('refactor') || diffSummary.linesDeleted > diffSummary.linesAdded) {
    category = 'Refactoring';
    intent = '코드 품질 개선 및 기술 부채 감소';
    reasoning = '리팩토링을 통한 코드 단순화 및 유지보수성 향상';
  } else if (message.includes('phase')) {
    category = 'Architecture';
    intent = '개발 단계 진행 및 마일스톤 달성';
    reasoning = '프로젝트 단계 진행으로 설계 진화 표현';
  }

  return {
    intent,
    category,
    reasoning,
    confidence: 0.75
  };
}

/**
 * 변경의 깊이 계산
 */
function calculateDepth(diffSummary, impactMetrics) {
  const impact = impactMetrics.overallImpact;

  if (impact > 0.66) return 'Deep';
  if (impact > 0.33) return 'Medium';
  return 'Shallow';
}

/**
 * 의도 추출 및 메타데이터 추가
 */
export function extractIntentWithMetadata(commit, diff, fileStats) {
  const diffSummary = buildDiffSummary(diff);
  const impactMetrics = calculateImpactMetrics(diff, fileStats);

  const extracted = extractIntentStructured(commit, diffSummary, impactMetrics);

  return {
    ...extracted,
    commit: commit,
    diffSummary: diffSummary,
    impactMetrics: impactMetrics,
    extractedAt: new Date()
  };
}

/**
 * Diff 요약 생성
 */
function buildDiffSummary(diff) {
  const fileTypes = {};
  const keywords = new Set();

  for (const file of diff) {
    // 파일 타입 집계
    const ext = file.path.split('.').pop();
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;

    // 파일명에서 키워드 추출
    const lower = file.path.toLowerCase();
    if (lower.includes('test')) keywords.add('test');
    if (lower.includes('spec')) keywords.add('spec');
    if (lower.includes('bench')) keywords.add('bench');
    if (lower.includes('ffi')) keywords.add('ffi');
    if (lower.includes('unsafe')) keywords.add('unsafe');
  }

  return {
    filesChanged: diff.length,
    linesAdded: diff.reduce((sum, f) => sum + (f.additions || 0), 0),
    linesDeleted: diff.reduce((sum, f) => sum + (f.deletions || 0), 0),
    fileTypes: fileTypes,
    keywords: Array.from(keywords)
  };
}

/**
 * 영향 메트릭 계산
 */
function calculateImpactMetrics(diff, fileStats) {
  const fileImpact = Math.min(0.3, diff.length / 20);
  const totalChange = (fileStats.totalAdditions || 0) + (fileStats.totalDeletions || 0);
  const sizeImpact = Math.min(0.4, totalChange / 1000);
  const fileTypes = new Set();

  for (const file of diff) {
    const ext = file.path.split('.').pop();
    fileTypes.add(ext);
  }

  const complexityImpact = Math.min(0.3, (fileTypes.size / 10));

  return {
    fileImpact,
    sizeImpact,
    complexityImpact,
    overallImpact: Math.min(1.0, fileImpact + sizeImpact + complexityImpact)
  };
}

/**
 * 의도 배치 추출
 */
export function extractIntentBatch(commits, diffs, fileStats) {
  const results = [];

  for (let i = 0; i < commits.length; i++) {
    const intent = extractIntentWithMetadata(commits[i], diffs[i], fileStats[i]);
    results.push(intent);
  }

  return results;
}

/**
 * 의도 검증 및 신뢰도 점수
 */
export function validateAndScoreIntent(intent, originalAnalysis) {
  const validation = {
    intentValid: intent.intent && intent.intent.length > 0,
    categoryValid: intent.category && intent.category.length > 0,
    confidenceValid: intent.confidence >= 0 && intent.confidence <= 1,
    impactValid: intent.impactLevel >= 0 && intent.impactLevel <= 1
  };

  const score = Object.values(validation).filter(v => v).length / Object.keys(validation).length;

  return {
    isValid: Object.values(validation).every(v => v),
    validations: validation,
    confidenceScore: score,
    finalConfidence: intent.confidence * score
  };
}

/**
 * 포맷팅 (테스트용)
 */
export function formatExtractedIntent(intent) {
  const lines = [];

  lines.push('📋 추출된 설계 의도');
  lines.push(`   Commit: ${intent.commit.hash}`);
  lines.push(`   의도: ${intent.intent}`);
  lines.push(`   카테고리: ${intent.category}`);
  lines.push(`   깊이: ${intent.depth}`);
  lines.push(`   신뢰도: ${(intent.confidence * 100).toFixed(1)}%`);
  lines.push(`   영향도: ${(intent.impactLevel * 100).toFixed(1)}%`);

  return lines.join('\n');
}

export default {
  buildIntentPrompt,
  extractIntentStructured,
  extractIntentWithMetadata,
  extractIntentBatch,
  validateAndScoreIntent,
  formatExtractedIntent
};
