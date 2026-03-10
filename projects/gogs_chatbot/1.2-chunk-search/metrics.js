/**
 * 검증 지표 설계 모듈
 * 기록 기반 성능 측정
 */

/**
 * 검색 정확도 계산
 * 선택된 Chunk 중 관련성 있는 것의 비율
 */
export function calculateRelevanceScore(selectedChunks, query) {
  if (selectedChunks.length === 0) return 0;

  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  let relevantCount = 0;

  for (const chunk of selectedChunks) {
    const content = chunk.content.toLowerCase();
    const matchedWords = words.filter(w => content.includes(w)).length;

    // 50% 이상의 키워드가 포함되면 관련성 있다고 판단
    if (matchedWords >= words.length * 0.5) {
      relevantCount++;
    }
  }

  return (relevantCount / selectedChunks.length) * 100;
}

/**
 * Top-K 정확도 (관련성 있는 Chunk가 상위 K개에 포함되는 비율)
 */
export function calculateTopKAccuracy(searchResult, k = 5) {
  const topK = searchResult.results.slice(0, k);
  const avgScore = topK.reduce((sum, item) => sum + item.score, 0) / topK.length;
  const maxScore = Math.max(...topK.map(item => item.score));

  return {
    topK: k,
    avgScore: Math.round(avgScore * 100) / 100,
    maxScore: maxScore,
    ratioToMax: Math.round((avgScore / maxScore) * 100)
  };
}

/**
 * 오류율 계산
 * 부적절한 Chunk 선택 비율
 */
export function calculateErrorRate(selectedChunks, query) {
  if (selectedChunks.length === 0) return 0;

  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  let errorCount = 0;

  for (const chunk of selectedChunks) {
    const content = chunk.content.toLowerCase();
    const matchedWords = words.filter(w => content.includes(w)).length;

    // 키워드가 하나도 없으면 오류
    if (matchedWords === 0) {
      errorCount++;
    }
  }

  return (errorCount / selectedChunks.length) * 100;
}

/**
 * 다양성 지표
 * 선택된 Chunk의 파일/phase 다양성
 */
export function calculateDiversity(selectedChunks) {
  const files = new Set(selectedChunks.map(c => c.filePath)).size;
  const versions = new Set(selectedChunks.map(c => c.version)).size;
  const phases = new Set(selectedChunks.map(c => c.phase)).size;

  return {
    totalChunks: selectedChunks.length,
    uniqueFiles: files,
    uniqueVersions: versions,
    uniquePhases: phases,
    fileDiversity: (files / selectedChunks.length) * 100,
    versionDiversity: (versions / selectedChunks.length) * 100,
    phaseDiversity: (phases / selectedChunks.length) * 100
  };
}

/**
 * 커버리지 분석
 * 검색이 얼마나 많은 범위를 커버하는지
 */
export function calculateCoverage(selectedChunks, totalChunks) {
  const selectedIndices = selectedChunks.map(c => c.chunkIndex);
  const chunkCount = selectedChunks.length;
  const fileCount = new Set(selectedChunks.map(c => c.filePath)).size;
  const totalFiles = new Set(totalChunks.map(c => c.filePath)).size;

  return {
    chunkCoverage: (chunkCount / totalChunks.length) * 100,
    fileCoverage: (fileCount / totalFiles) * 100,
    avgChunkIndexCovered: selectedIndices.reduce((a, b) => a + b, 0) / selectedIndices.length
  };
}

/**
 * 공간 효율성
 * 선택된 Chunk의 토큰 효율성
 */
export function calculateEfficiency(selectedChunks) {
  const totalSize = selectedChunks.reduce((sum, c) => sum + c.size, 0);
  const totalWords = selectedChunks.reduce((sum, c) => sum + c.wordCount, 0);
  const avgChunkSize = totalSize / selectedChunks.length;
  const estimatedTokens = totalWords * 1.3; // 한글은 단어당 약 1.3 토큰

  return {
    totalBytes: totalSize,
    totalWords: totalWords,
    estimatedTokens: Math.round(estimatedTokens),
    avgChunkSize: Math.round(avgChunkSize),
    avgWords: Math.round(totalWords / selectedChunks.length),
    tokenEfficiency: Math.round((totalWords / estimatedTokens) * 100)
  };
}

/**
 * 종합 검증 보고서
 */
export function generateMetricsReport(searchResult, allChunks, query) {
  const selectedChunks = searchResult.results.map(item => item.chunk);

  const report = {
    timestamp: new Date().toISOString(),
    query: query,

    // 정확도 지표
    accuracy: {
      relevance: Math.round(calculateRelevanceScore(selectedChunks, query) * 100) / 100,
      topKPerformance: calculateTopKAccuracy(searchResult),
      errorRate: Math.round(calculateErrorRate(selectedChunks, query) * 100) / 100
    },

    // 다양성 지표
    diversity: calculateDiversity(selectedChunks),

    // 커버리지 지표
    coverage: calculateCoverage(selectedChunks, allChunks),

    // 효율성 지표
    efficiency: calculateEfficiency(selectedChunks),

    // 검색 통계
    statistics: {
      totalMatches: searchResult.totalMatches,
      selectedCount: searchResult.selectedCount,
      matchRate: (searchResult.selectedCount / searchResult.totalMatches) * 100
    },

    // 종합 점수
    overallScore: 0
  };

  // 종합 점수 계산
  report.overallScore =
    (report.accuracy.relevance * 0.4 +
      (100 - report.accuracy.errorRate) * 0.3 +
      report.diversity.fileDiversity * 0.2 +
      report.coverage.chunkCoverage * 0.1) /
    100;

  report.overallScore = Math.round(report.overallScore * 100) / 100;

  return report;
}

/**
 * 메트릭 비교 (두 검색 결과 비교)
 */
export function compareMetrics(report1, report2) {
  return {
    query1: report1.query,
    query2: report2.query,

    comparison: {
      accuracy: {
        delta: Math.round((report2.accuracy.relevance - report1.accuracy.relevance) * 100) / 100,
        improved: report2.accuracy.relevance > report1.accuracy.relevance
      },

      errorRate: {
        delta: Math.round((report2.accuracy.errorRate - report1.accuracy.errorRate) * 100) / 100,
        improved: report2.accuracy.errorRate < report1.accuracy.errorRate
      },

      diversity: {
        delta: Math.round(
          (report2.diversity.fileDiversity - report1.diversity.fileDiversity) * 100
        ) / 100,
        improved: report2.diversity.fileDiversity > report1.diversity.fileDiversity
      },

      efficiency: {
        tokenDelta: report2.efficiency.estimatedTokens - report1.efficiency.estimatedTokens,
        improved: report2.efficiency.estimatedTokens < report1.efficiency.estimatedTokens
      },

      overall: {
        delta: Math.round((report2.overallScore - report1.overallScore) * 100) / 100,
        improved: report2.overallScore > report1.overallScore
      }
    }
  };
}

/**
 * 포맷된 메트릭 리포트
 */
export function formatMetricsReport(report) {
  const lines = [];

  lines.push(`\n📊 검증 지표 보고서`);
  lines.push(`═══════════════════════════════`);
  lines.push(`시간: ${report.timestamp}`);
  lines.push(`쿼리: "${report.query}"\n`);

  lines.push(`📈 정확도`);
  lines.push(`  관련성: ${report.accuracy.relevance}%`);
  lines.push(`  오류율: ${report.accuracy.errorRate}%`);
  lines.push(`  Top-5 평균 점수: ${report.accuracy.topKPerformance.avgScore}\n`);

  lines.push(`🎯 다양성`);
  lines.push(`  파일: ${report.diversity.uniqueFiles}개 (${report.diversity.fileDiversity.toFixed(1)}%)`);
  lines.push(`  버전: ${report.diversity.uniqueVersions}개`);
  lines.push(`  Phase: ${report.diversity.uniquePhases}개\n`);

  lines.push(`📍 커버리지`);
  lines.push(`  Chunk: ${report.coverage.chunkCoverage.toFixed(1)}%`);
  lines.push(`  파일: ${report.coverage.fileCoverage.toFixed(1)}%\n`);

  lines.push(`⚡ 효율성`);
  lines.push(`  예상 토큰: ${report.efficiency.estimatedTokens}개`);
  lines.push(`  평균 Chunk 크기: ${report.efficiency.avgChunkSize} bytes`);
  lines.push(`  평균 단어: ${report.efficiency.avgWords}개\n`);

  lines.push(`🏆 종합 점수: ${report.overallScore}/100\n`);

  return lines.join('\n');
}

export default {
  calculateRelevanceScore,
  calculateTopKAccuracy,
  calculateErrorRate,
  calculateDiversity,
  calculateCoverage,
  calculateEfficiency,
  generateMetricsReport,
  compareMetrics,
  formatMetricsReport
};
