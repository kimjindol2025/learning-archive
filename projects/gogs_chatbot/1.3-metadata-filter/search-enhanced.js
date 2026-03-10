/**
 * 강화된 검색 모듈
 * 필터링 + 점수 기반 검색 통합
 */

import filter from './filter.js';

/**
 * 1.3 검색 파이프라인
 * 1. Repo 선택
 * 2. 메타 필터 적용
 * 3. 남은 chunk에 점수 계산
 * 4. Top-K 선택
 * 5. LLM 전달 준비
 */
export function searchWithFilters(chunks, query, options = {}) {
  const {
    repo,
    version,
    phase,
    versionRange,
    phases,
    topK = 5,
    diversify = false,
    threshold = 0
  } = options;

  // Step 1: 필터링 조건 구성
  const filters = {
    repo,
    version,
    phase,
    ...(versionRange && { versionRange }),
    ...(phases && { phases })
  };

  // Step 2: 메타 필터 적용
  let filtered = filter.filterByMultipleCriteria(chunks, filters);

  // Step 3: 필터 후 Chunk가 없으면 경고
  if (filtered.length === 0) {
    return {
      query: query,
      filters: filters,
      error: 'No chunks match the filter criteria',
      totalMatches: 0,
      selectedCount: 0,
      results: [],
      filterStatistics: {
        totalChunks: chunks.length,
        filteredChunks: 0,
        reductionRate: 100
      }
    };
  }

  // Step 4: 점수 계산
  const scored = filtered.map(chunk => ({
    chunk: chunk,
    score: scoreChunkEnhanced(chunk, query, filters),
    rank: 0
  }));

  // Step 5: 정렬
  scored.sort((a, b) => b.score - a.score);
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Step 6: 상위 임계값 필터링
  let selected = scored;
  if (threshold > 0) {
    selected = scored.filter(item => item.score >= threshold);
  }

  // Step 7: Top-K 선택
  if (diversify) {
    selected = selectTopDiversified(selected, topK);
  } else {
    selected = selected.slice(0, topK);
  }

  // Step 8: 결과 구성
  return {
    query: query,
    filters: filters,
    results: selected,
    statistics: {
      totalChunks: chunks.length,
      filteredChunks: filtered.length,
      matchedChunks: scored.filter(s => s.score > 0).length,
      selectedCount: selected.length,
      reductionRate: ((1 - filtered.length / chunks.length) * 100).toFixed(1),
      scoreDistribution: analyzeScores(scored)
    }
  };
}

/**
 * 강화된 점수 계산 (필터 가중치 포함)
 */
function scoreChunkEnhanced(chunk, query, filters) {
  let score = 0;

  // 기본 점수: 키워드 매칭
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const content = chunk.content.toLowerCase();

  for (const word of words) {
    const count = (content.match(new RegExp(word, 'g')) || []).length;
    if (count > 0) {
      score += 10 + Math.min(count - 1, 5);
    }
  }

  // 파일 이름 보너스
  const fileName = chunk.fileName.toLowerCase();
  for (const word of words) {
    if (fileName.includes(word)) {
      score += 20;
    }
  }

  // 위치 보너스
  score += Math.max(0, 10 - chunk.chunkIndex);

  // 필터 적중 보너스 (필터링된 공간 내의 순위는 더 높게)
  if (filters.version === chunk.version) {
    score += 15;
  }

  if (filters.phase === chunk.phase) {
    score += 15;
  }

  return score;
}

/**
 * 다양성 기반 Top-K 선택
 */
function selectTopDiversified(scored, k) {
  const selected = [];
  const usedFiles = new Set();
  const usedPhases = new Set();

  for (const item of scored) {
    if (selected.length >= k) break;

    const chunk = item.chunk;

    if (usedFiles.has(chunk.filePath) || usedPhases.has(chunk.phase)) {
      continue;
    }

    selected.push(item);
    usedFiles.add(chunk.filePath);
    usedPhases.add(chunk.phase);
  }

  // k개 미만이면 추가
  for (const item of scored) {
    if (selected.length >= k) break;
    if (!selected.some(s => s.chunk.chunkIndex === item.chunk.chunkIndex)) {
      selected.push(item);
    }
  }

  return selected;
}

/**
 * 점수 분포 분석
 */
function analyzeScores(scored) {
  if (scored.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0 };
  }

  const scores = scored.map(item => item.score);
  const sorted = [...scores].sort((a, b) => a - b);
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
    median: sorted[Math.floor(sorted.length / 2)],
    nonZeroCount: scores.filter(s => s > 0).length
  };
}

/**
 * 진화 비교 검색
 */
export function compareVersionSearch(chunks, query, version1, version2, options = {}) {
  const baseOptions = {
    topK: options.topK || 5,
    diversify: options.diversify || false
  };

  // 버전 1 검색
  const result1 = searchWithFilters(chunks, query, {
    ...baseOptions,
    version: version1
  });

  // 버전 2 검색
  const result2 = searchWithFilters(chunks, query, {
    ...baseOptions,
    version: version2
  });

  // 비교 분석
  const comparison = {
    query: query,
    version1: {
      version: version1,
      matches: result1.statistics.matchedChunks,
      selectedCount: result1.statistics.selectedCount,
      avgScore: result1.statistics.scoreDistribution.avg,
      results: result1.results
    },
    version2: {
      version: version2,
      matches: result2.statistics.matchedChunks,
      selectedCount: result2.statistics.selectedCount,
      avgScore: result2.statistics.scoreDistribution.avg,
      results: result2.results
    },
    diff: {
      matchDiff: result2.statistics.matchedChunks - result1.statistics.matchedChunks,
      scoreDiff: Math.round((result2.statistics.scoreDistribution.avg -
                             result1.statistics.scoreDistribution.avg) * 100) / 100
    }
  };

  return comparison;
}

/**
 * Phase 단위 추론 (특정 Phase의 특정 주제)
 */
export function searchByPhaseAndTopic(chunks, topic, phase, options = {}) {
  const result = searchWithFilters(chunks, topic, {
    phase: phase,
    topK: options.topK || 5,
    diversify: options.diversify || true
  });

  return {
    topic: topic,
    phase: phase,
    phaseChunks: chunks.filter(c => c.phase === phase).length,
    ...result
  };
}

/**
 * 검색 결과 포맷팅 (강화)
 */
export function formatSearchResultsEnhanced(searchResult) {
  const lines = [];

  lines.push(`\n🔍 강화된 검색 결과`);
  lines.push(`═══════════════════════════════`);
  lines.push(`쿼리: "${searchResult.query}"`);

  if (Object.keys(searchResult.filters).filter(k => searchResult.filters[k]).length > 0) {
    lines.push(`\n📋 필터:`);
    Object.entries(searchResult.filters)
      .filter(([k, v]) => v)
      .forEach(([key, value]) => {
        lines.push(`   ${key}: ${value}`);
      });
  }

  if (searchResult.error) {
    lines.push(`\n❌ 오류: ${searchResult.error}`);
    return lines.join('\n');
  }

  lines.push(`\n📊 통계:`);
  lines.push(`   전체 Chunk: ${searchResult.statistics.totalChunks}개`);
  lines.push(`   필터 후: ${searchResult.statistics.filteredChunks}개 (${searchResult.statistics.reductionRate}% 감소)`);
  lines.push(`   매치: ${searchResult.statistics.matchedChunks}개`);
  lines.push(`   선택: ${searchResult.statistics.selectedCount}개`);

  lines.push(`\n🏆 선택된 Chunk:`);
  searchResult.results.forEach((item, index) => {
    const chunk = item.chunk;
    lines.push(`\n${index + 1}. [${chunk.fileName}] ${chunk.version}/${chunk.phase}`);
    lines.push(`   점수: ${item.score} | 순위: ${item.rank}`);
    lines.push(`   내용: ${chunk.content.substring(0, 80)}...`);
  });

  lines.push('');
  return lines.join('\n');
}

export default {
  searchWithFilters,
  compareVersionSearch,
  searchByPhaseAndTopic,
  formatSearchResultsEnhanced
};
