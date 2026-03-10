/**
 * BM25 점수 계산 모듈
 * 정보 검색(IR) 기반 순위 지정
 */

/**
 * 단일 Term의 BM25 점수
 */
export function scoreTerm(
  term,
  chunkTF,
  idf,
  chunkLength,
  avgLength,
  k = 1.5,
  b = 0.75
) {
  if (!idf || idf <= 0) return 0;

  // BM25 공식
  const numerator = chunkTF * (k + 1);
  const denominator = chunkTF + k * (1 - b + b * (chunkLength / avgLength));

  return idf * (numerator / denominator);
}

/**
 * Chunk의 전체 BM25 점수
 */
export function scoreChunk(
  queryTerms,
  chunk,
  index,
  idf,
  avgLength,
  k = 1.5,
  b = 0.75
) {
  let totalScore = 0;

  for (const term of queryTerms) {
    // IDF 확인
    if (!idf[term] || idf[term] <= 0) continue;

    // TF 확인
    const tf = chunk.tfMap[term] || 0;
    if (tf === 0) continue;

    // 해당 Term의 점수 추가
    const termScore = scoreTerm(
      term,
      tf,
      idf[term],
      chunk.termCount,
      avgLength,
      k,
      b
    );

    totalScore += termScore;
  }

  return totalScore;
}

/**
 * 여러 Chunk에 BM25 점수 매기기
 */
export function scoreChunks(
  queryTerms,
  chunks,
  index,
  idf,
  avgLength,
  k = 1.5,
  b = 0.75
) {
  const scored = [];

  for (const chunk of chunks) {
    const score = scoreChunk(
      queryTerms,
      chunk,
      index,
      idf,
      avgLength,
      k,
      b
    );

    if (score > 0) {
      scored.push({
        chunk: chunk,
        score: score,
        rank: 0
      });
    }
  }

  // 점수 기준으로 정렬
  scored.sort((a, b) => b.score - a.score);

  // 순위 지정
  scored.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return scored;
}

/**
 * 점수 분석
 */
export function analyzeScores(scored) {
  if (scored.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      q1: 0,
      q3: 0
    };
  }

  const scores = scored.map(item => item.score);
  const sorted = [...scores].sort((a, b) => a - b);
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;

  return {
    count: scores.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
    median: sorted[Math.floor(sorted.length / 2)],
    q1: sorted[Math.floor(sorted.length * 0.25)],
    q3: sorted[Math.floor(sorted.length * 0.75)],
    stdDev: Math.round(Math.sqrt(
      scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length
    ) * 100) / 100
  };
}

/**
 * 상위 K개 선택
 */
export function selectTopK(scored, k = 5) {
  return scored.slice(0, k);
}

/**
 * 다양성 기반 Top-K 선택
 */
export function selectTopKDiversified(scored, k = 5, diversifyBy = 'filePath') {
  const selected = [];
  const used = new Set();

  for (const item of scored) {
    if (selected.length >= k) break;

    const diverseKey = item.chunk[diversifyBy];

    if (!used.has(diverseKey)) {
      selected.push(item);
      used.add(diverseKey);
    }
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
 * 점수 임계값 필터링
 */
export function filterByThreshold(scored, threshold = 0) {
  return scored.filter(item => item.score >= threshold);
}

/**
 * 점수 상세 분석 (Term별)
 */
export function analyzeTermContributions(
  queryTerms,
  topChunks,
  idf,
  avgLength,
  k = 1.5,
  b = 0.75
) {
  const contributions = {};

  for (const term of queryTerms) {
    contributions[term] = {
      idf: idf[term] || 0,
      totalScore: 0,
      chunkCount: 0,
      avgTF: 0
    };
  }

  for (const item of topChunks) {
    const chunk = item.chunk;

    for (const term of queryTerms) {
      if (!contributions[term]) continue;

      const tf = chunk.tfMap[term] || 0;
      if (tf > 0) {
        const termScore = scoreTerm(
          term,
          tf,
          idf[term],
          chunk.termCount,
          avgLength,
          k,
          b
        );

        contributions[term].totalScore += termScore;
        contributions[term].chunkCount++;
        contributions[term].avgTF += tf;
      }
    }
  }

  // 평균 계산
  for (const term in contributions) {
    if (contributions[term].chunkCount > 0) {
      contributions[term].avgTF =
        Math.round((contributions[term].avgTF / contributions[term].chunkCount) * 100) / 100;
      contributions[term].totalScore =
        Math.round(contributions[term].totalScore * 100) / 100;
    }
  }

  return contributions;
}

/**
 * BM25 점수 분포 시각화 (텍스트)
 */
export function visualizeScoreDistribution(scored, width = 40) {
  if (scored.length === 0) return 'No results';

  const maxScore = Math.max(...scored.map(s => s.score));
  const lines = [];

  scored.slice(0, 10).forEach((item, idx) => {
    const barWidth = Math.round((item.score / maxScore) * width);
    const bar = '█'.repeat(barWidth) + '░'.repeat(width - barWidth);
    lines.push(`${idx + 1:2d}. [${bar}] ${item.score.toFixed(2)}`);
  });

  return lines.join('\n');
}

/**
 * 포맷팅 (테스트용)
 */
export function formatScoredResults(scored, limit = 10) {
  const lines = [];

  lines.push('📊 BM25 점수 결과');
  lines.push(`   총 매치: ${scored.length}개\n`);

  const displayed = scored.slice(0, limit);
  displayed.forEach((item, idx) => {
    lines.push(`${idx + 1}. [${item.chunk.fileName}] 점수: ${item.score.toFixed(2)} (순위: ${item.rank})`);
    lines.push(`   내용: ${item.chunk.content.substring(0, 60)}...`);
  });

  if (scored.length > limit) {
    lines.push(`\n... 외 ${scored.length - limit}개`);
  }

  return lines.join('\n');
}

export default {
  scoreTerm,
  scoreChunk,
  scoreChunks,
  analyzeScores,
  selectTopK,
  selectTopKDiversified,
  filterByThreshold,
  analyzeTermContributions,
  visualizeScoreDistribution,
  formatScoredResults
};
