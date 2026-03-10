/**
 * 점수 기반 Chunk 검색 모듈
 * 키워드 매칭 및 순위 지정
 */

/**
 * 단일 Chunk 점수 계산
 */
export function scoreChunk(chunk, query) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  let score = 0;
  const content = chunk.content.toLowerCase();

  // 각 단어별 점수 계산
  for (const word of words) {
    const count = (content.match(new RegExp(word, 'g')) || []).length;

    if (count > 0) {
      // 기본 점수: 단어 포함
      score += 10;

      // 보너스: 단어가 많이 포함되면 추가 점수
      score += Math.min(count - 1, 5);
    }
  }

  // 파일 이름에 키워드가 있으면 추가 점수
  const fileName = chunk.fileName.toLowerCase();
  for (const word of words) {
    if (fileName.includes(word)) {
      score += 20;
    }
  }

  // Chunk 위치 점수 (앞쪽 chunk가 높음)
  const positionBonus = Math.max(0, 10 - chunk.chunkIndex);
  score += positionBonus;

  return score;
}

/**
 * 여러 Chunk에 점수 매기고 정렬
 */
export function scoreAndRankChunks(chunks, query) {
  const scored = chunks.map(chunk => ({
    chunk: chunk,
    score: scoreChunk(chunk, query),
    rank: 0
  }));

  // 점수 기준으로 정렬
  scored.sort((a, b) => b.score - a.score);

  // 순위 지정
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  return scored;
}

/**
 * Top-K Chunk 선택
 */
export function selectTopChunks(scoredChunks, k = 5) {
  return scoredChunks.slice(0, k);
}

/**
 * 다양성 기반 Top-K 선택 (파일/phase 다양화)
 */
export function selectTopChunksDiversified(scoredChunks, k = 5) {
  const selected = [];
  const usedFiles = new Set();
  const usedPhases = new Set();

  for (const item of scoredChunks) {
    if (selected.length >= k) break;

    const chunk = item.chunk;

    // 파일이나 phase가 이미 선택되었으면 스킵 (다양성)
    if (usedFiles.has(chunk.filePath) || usedPhases.has(chunk.phase)) {
      continue;
    }

    selected.push(item);
    usedFiles.add(chunk.filePath);
    usedPhases.add(chunk.phase);
  }

  // 아직 k개 미만이면 순서대로 추가
  for (const item of scoredChunks) {
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
export function analyzeScoreDistribution(scoredChunks) {
  const scores = scoredChunks.map(item => item.score);

  if (scores.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      median: 0
    };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;
  const median = sorted[Math.floor(sorted.length / 2)];

  return {
    count: scores.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
    median: median,
    q1: sorted[Math.floor(sorted.length * 0.25)],
    q3: sorted[Math.floor(sorted.length * 0.75)]
  };
}

/**
 * 점수 기반 필터링 (임계값 초과)
 */
export function filterChunksByScore(scoredChunks, threshold = 10) {
  return scoredChunks.filter(item => item.score >= threshold);
}

/**
 * 전체 검색 파이프라인
 */
export function searchChunks(chunks, query, options = {}) {
  const {
    topK = 5,
    diversify = false,
    threshold = 0,
    returnScores = true
  } = options;

  // 1. 점수 계산 및 정렬
  let scoredChunks = scoreAndRankChunks(chunks, query);

  // 2. 임계값 필터링
  if (threshold > 0) {
    scoredChunks = filterChunksByScore(scoredChunks, threshold);
  }

  // 3. Top-K 선택
  let selected;
  if (diversify) {
    selected = selectTopChunksDiversified(scoredChunks, topK);
  } else {
    selected = selectTopChunks(scoredChunks, topK);
  }

  // 4. 점수 정보 포함 여부에 따라 반환
  if (returnScores) {
    return {
      query: query,
      results: selected,
      statistics: analyzeScoreDistribution(scoredChunks),
      totalMatches: scoredChunks.length,
      selectedCount: selected.length
    };
  } else {
    return {
      query: query,
      results: selected.map(item => item.chunk),
      totalMatches: scoredChunks.length,
      selectedCount: selected.length
    };
  }
}

/**
 * 포맷된 검색 결과 출력
 */
export function formatSearchResults(searchResult) {
  const lines = [];
  lines.push(`🔍 검색: "${searchResult.query}"`);
  lines.push(`📊 결과: ${searchResult.selectedCount}개 선택 / ${searchResult.totalMatches}개 매치\n`);

  searchResult.results.forEach((item, index) => {
    const chunk = item.chunk;
    lines.push(`${index + 1}. [${chunk.fileName}] ${chunk.version}/${chunk.phase} (Chunk ${chunk.chunkIndex + 1})`);
    lines.push(`   점수: ${item.score} | 단어: ${chunk.wordCount}`);
    lines.push(`   미리보기: ${chunk.content.substring(0, 80)}...`);
    lines.push('');
  });

  return lines.join('\n');
}

export default {
  scoreChunk,
  scoreAndRankChunks,
  selectTopChunks,
  selectTopChunksDiversified,
  analyzeScoreDistribution,
  filterChunksByScore,
  searchChunks,
  formatSearchResults
};
