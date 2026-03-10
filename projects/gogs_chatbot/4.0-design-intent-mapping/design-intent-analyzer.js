/**
 * 설계 의도 분석 모듈
 * 규칙 기반 1차 분류
 */

/**
 * Commit의 패턴으로부터 설계 의도 분류
 */
export function analyzeIntentByPattern(commit, diff, fileStats) {
  const message = commit.message.toLowerCase();
  const intent = {
    commit: commit.hash,
    primaryIntent: null,
    category: null,
    confidence: 0,
    patterns: [],
    reasoning: []
  };

  // 파일 타입별 통계
  const testFilesAdded = diff.filter(f => f.path.includes('test') && f.status === 'added').length;
  const specFilesChanged = diff.filter(f => f.path.includes('spec')).length;
  const srcFilesChanged = diff.filter(f => f.path.includes('src')).length;

  const totalAdditions = fileStats.totalAdditions || 0;
  const totalDeletions = fileStats.totalDeletions || 0;
  const additionRatio = totalAdditions / (totalAdditions + totalDeletions + 1);

  // 규칙 1: Test 파일 추가 多 → 안정화/검증 강화
  if (testFilesAdded >= 2 || (message.includes('test') && additionRatio > 0.7)) {
    intent.primaryIntent = 'Stabilization & Validation';
    intent.category = 'Quality Assurance';
    intent.confidence = Math.min(0.95, 0.5 + testFilesAdded * 0.2);
    intent.patterns.push('Multiple test files added');
    intent.reasoning.push('Test coverage expansion detected');
  }

  // 규칙 2: Spec 변경 多 → 설계 재정의
  if (specFilesChanged >= 2 || (message.includes('spec') && additionRatio > 0.8)) {
    intent.primaryIntent = 'Architecture Redefinition';
    intent.category = 'Design Evolution';
    intent.confidence = Math.min(0.95, 0.5 + specFilesChanged * 0.2);
    intent.patterns.push('Specification files modified');
    intent.reasoning.push('Design specification update detected');
  }

  // 규칙 3: Src 대량 변경 + 성능 키워드 → 최적화
  if ((srcFilesChanged >= 3 || totalAdditions > 200) &&
      (message.includes('perf') || message.includes('optim') ||
       message.includes('fast') || message.includes('efficient'))) {
    intent.primaryIntent = 'Performance Optimization';
    intent.category = 'System Optimization';
    intent.confidence = Math.min(0.95, 0.6 + (srcFilesChanged * 0.15));
    intent.patterns.push('Significant source changes with performance keywords');
    intent.reasoning.push('Performance improvement goal inferred');
  }

  // 규칙 4: Unsafe 추가 → 저수준 확장
  if (message.includes('unsafe') || message.includes('ffi') ||
      message.includes('extern') || message.includes('interop')) {
    intent.primaryIntent = 'Low-level Extension';
    intent.category = 'Architecture Expansion';
    intent.confidence = Math.min(0.95, 0.8);
    intent.patterns.push('Unsafe/FFI/Extern keywords present');
    intent.reasoning.push('External language interoperability or low-level access');
  }

  // 규칙 5: API 변경 多 → 인터페이스 진화
  if ((message.includes('api') || message.includes('interface')) &&
      additionRatio > 0.6) {
    intent.primaryIntent = 'Interface Evolution';
    intent.category = 'API Development';
    intent.confidence = Math.min(0.95, 0.75);
    intent.patterns.push('API/Interface changes detected');
    intent.reasoning.push('Public API expansion or modification');
  }

  // 규칙 6: Refactor 多 + 삭제 比높음 → 코드 품질 개선
  if (message.includes('refactor') || (additionRatio < 0.5 && totalDeletions > totalAdditions)) {
    intent.primaryIntent = 'Code Quality Improvement';
    intent.category = 'Refactoring';
    intent.confidence = Math.min(0.95, 0.7);
    intent.patterns.push('Refactoring pattern detected');
    intent.reasoning.push('Code simplification and quality enhancement');
  }

  // 규칙 7: 버전 릴리스 → 릴리스 마일스톤
  if (message.includes('v') && /\d+\.\d+/.test(message)) {
    intent.primaryIntent = 'Release Milestone';
    intent.category = 'Versioning';
    intent.confidence = 0.9;
    intent.patterns.push('Version tag detected in message');
    intent.reasoning.push('Release cycle checkpoint');
  }

  // 규칙 8: Phase 마크 → 단계 진화
  if (message.includes('phase')) {
    intent.primaryIntent = 'Phase Progression';
    intent.category = 'Development Cycle';
    intent.confidence = 0.85;
    intent.patterns.push('Phase progression marker');
    intent.reasoning.push('Development phase transition detected');
  }

  // 기본값 설정 (매칭 없음)
  if (!intent.primaryIntent) {
    intent.primaryIntent = 'General Development';
    intent.category = 'Maintenance';
    intent.confidence = 0.5;
    intent.patterns.push('No specific pattern matched');
    intent.reasoning.push('General code maintenance or feature development');
  }

  return intent;
}

/**
 * 파일 통계로부터 변경 영향도 계산
 */
export function calculateImpactLevel(diff, fileStats) {
  const impact = {
    fileImpact: 0,      // 변경된 파일 수
    sizeImpact: 0,      // 코드량 변경
    complexityImpact: 0, // 복잡도 증가
    overallImpact: 0
  };

  // 파일 수 영향도 (최대 0.3)
  impact.fileImpact = Math.min(0.3, diff.length / 20);

  // 코드량 영향도 (최대 0.4)
  const totalChange = (fileStats.totalAdditions || 0) + (fileStats.totalDeletions || 0);
  impact.sizeImpact = Math.min(0.4, totalChange / 1000);

  // 복잡도 영향도 (최대 0.3)
  // - 파일 타입 다양성
  // - 추가 vs 삭제 비율
  const fileTypes = countFileTypes(diff);
  impact.complexityImpact = Math.min(0.3, (Object.keys(fileTypes).length / 10));

  // 전체 영향도 (0.0 - 1.0)
  impact.overallImpact = Math.min(1.0,
    impact.fileImpact + impact.sizeImpact + impact.complexityImpact
  );

  return impact;
}

/**
 * 파일 타입별 개수 세기
 */
function countFileTypes(diff) {
  const types = {};

  for (const file of diff) {
    const ext = file.path.split('.').pop();
    types[ext] = (types[ext] || 0) + 1;
  }

  return types;
}

/**
 * 의도별 키워드 추출
 */
export function extractKeywords(message, diff) {
  const keywords = {
    performance: ['perf', 'optim', 'fast', 'efficient', 'speed', 'slow', 'bench'],
    safety: ['safe', 'unsafe', 'bounds', 'check', 'validate', 'assert', 'panic'],
    memory: ['memory', 'heap', 'stack', 'alloc', 'free', 'leak', 'gc'],
    testing: ['test', 'spec', 'unit', 'integration', 'coverage', 'verify'],
    architecture: ['arch', 'design', 'structure', 'pattern', 'layer', 'module'],
    api: ['api', 'interface', 'contract', 'protocol', 'endpoint'],
    refactoring: ['refactor', 'clean', 'improve', 'simplify', 'reorganize'],
    ffi: ['ffi', 'extern', 'c', 'interop', 'binding', 'wrapper']
  };

  const lower = message.toLowerCase();
  const found = {};

  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lower.includes(word)) {
        found[category] = (found[category] || 0) + 1;
      }
    }
  }

  return found;
}

/**
 * 설계 의도 종합 분석
 */
export function analyzeDesignIntent(commit, diff, fileStats) {
  const byPattern = analyzeIntentByPattern(commit, diff, fileStats);
  const impact = calculateImpactLevel(diff, fileStats);
  const keywords = extractKeywords(commit.message, diff);

  return {
    commit: commit.hash,
    message: commit.message,
    timestamp: commit.timestamp,
    author: commit.author,
    intent: byPattern.primaryIntent,
    category: byPattern.category,
    confidence: byPattern.confidence,
    impactLevel: impact.overallImpact,
    keywords: keywords,
    patterns: byPattern.patterns,
    reasoning: byPattern.reasoning,
    statistics: {
      filesChanged: diff.length,
      linesAdded: fileStats.totalAdditions,
      linesDeleted: fileStats.totalDeletions,
      netChange: fileStats.netChange
    }
  };
}

/**
 * 다중 Commit 의도 분석
 */
export function analyzeIntentSequence(commits, diffs, fileStats) {
  const sequence = [];

  for (let i = 0; i < commits.length; i++) {
    const intent = analyzeDesignIntent(commits[i], diffs[i], fileStats[i]);
    sequence.push(intent);
  }

  return sequence;
}

/**
 * 의도 패턴 요약
 */
export function summarizeIntentPatterns(intents) {
  const summary = {
    totalCommits: intents.length,
    byCategory: {},
    byIntent: {},
    topKeywords: {},
    averageImpact: 0,
    averageConfidence: 0
  };

  let totalImpact = 0;
  let totalConfidence = 0;

  for (const intent of intents) {
    // 카테고리별 집계
    summary.byCategory[intent.category] = (summary.byCategory[intent.category] || 0) + 1;

    // 의도별 집계
    summary.byIntent[intent.intent] = (summary.byIntent[intent.intent] || 0) + 1;

    // 키워드 집계
    for (const [keyword, count] of Object.entries(intent.keywords)) {
      summary.topKeywords[keyword] = (summary.topKeywords[keyword] || 0) + count;
    }

    totalImpact += intent.impactLevel;
    totalConfidence += intent.confidence;
  }

  summary.averageImpact = intents.length > 0 ? totalImpact / intents.length : 0;
  summary.averageConfidence = intents.length > 0 ? totalConfidence / intents.length : 0;

  // 상위 키워드 정렬
  summary.topKeywords = Object.entries(summary.topKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {});

  return summary;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatIntentAnalysis(intent) {
  const lines = [];

  lines.push('🎯 설계 의도 분석');
  lines.push(`   Commit: ${intent.commit}`);
  lines.push(`   의도: ${intent.intent}`);
  lines.push(`   카테고리: ${intent.category}`);
  lines.push(`   신뢰도: ${(intent.confidence * 100).toFixed(1)}%`);
  lines.push(`   영향도: ${(intent.impactLevel * 100).toFixed(1)}%`);
  lines.push(`   파일 변경: ${intent.statistics.filesChanged}개`);
  lines.push(`   코드 변경: +${intent.statistics.linesAdded} -${intent.statistics.linesDeleted}`);

  return lines.join('\n');
}

export default {
  analyzeIntentByPattern,
  calculateImpactLevel,
  extractKeywords,
  analyzeDesignIntent,
  analyzeIntentSequence,
  summarizeIntentPatterns,
  formatIntentAnalysis
};
