/**
 * 유사도 계산 모듈
 * Cosine Similarity 및 기타 거리 메트릭
 */

/**
 * Cosine Similarity 계산
 * 두 벡터 간 각도의 코사인 값
 */
export function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Euclidean Distance (정규화 벡터는 코사인과 동등)
 */
export function euclideanDistance(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return Infinity;
  }

  let sum = 0;

  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * 여러 벡터와의 유사도 계산
 */
export function calculateSimilarities(queryVector, embeddings, metric = 'cosine') {
  const similarities = [];

  for (const emb of embeddings) {
    let score;

    if (metric === 'cosine') {
      score = cosineSimilarity(queryVector, emb.vector);
    } else if (metric === 'euclidean') {
      score = 1 / (1 + euclideanDistance(queryVector, emb.vector));
    } else {
      score = cosineSimilarity(queryVector, emb.vector);
    }

    similarities.push({
      embedding: emb,
      similarity: score,
      rank: 0
    });
  }

  // 유사도 기준으로 정렬
  similarities.sort((a, b) => b.similarity - a.similarity);

  // 순위 지정
  similarities.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return similarities;
}

/**
 * Top-K 선택
 */
export function selectTopK(similarities, k = 5) {
  return similarities.slice(0, k);
}

/**
 * 유사도 임계값 필터링
 */
export function filterByThreshold(similarities, threshold = 0.5) {
  return similarities.filter(item => item.similarity >= threshold);
}

/**
 * 다양성 기반 Top-K 선택
 */
export function selectTopKDiversified(similarities, k = 5, diversifyBy = 'filePath') {
  const selected = [];
  const used = new Set();

  for (const item of similarities) {
    if (selected.length >= k) break;

    const key = item.embedding[diversifyBy];

    if (!used.has(key)) {
      selected.push(item);
      used.add(key);
    }
  }

  // k개 미만이면 추가
  for (const item of similarities) {
    if (selected.length >= k) break;
    if (!selected.some(s => s.embedding.chunkId === item.embedding.chunkId)) {
      selected.push(item);
    }
  }

  return selected;
}

/**
 * 유사도 분석
 */
export function analyzeSimilarities(similarities) {
  if (similarities.length === 0) {
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

  const scores = similarities.map(s => s.similarity);
  const sorted = [...scores].sort((a, b) => a - b);
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;

  return {
    count: scores.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 10000) / 10000,
    median: sorted[Math.floor(sorted.length / 2)],
    q1: sorted[Math.floor(sorted.length * 0.25)],
    q3: sorted[Math.floor(sorted.length * 0.75)],
    stdDev: Math.round(Math.sqrt(
      scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length
    ) * 10000) / 10000
  };
}

/**
 * 유사도 시각화 (텍스트)
 */
export function visualizeSimilarities(similarities, width = 40) {
  if (similarities.length === 0) return 'No results';

  const lines = [];

  similarities.slice(0, 10).forEach((item, idx) => {
    const barWidth = Math.round(item.similarity * width);
    const bar = '█'.repeat(barWidth) + '░'.repeat(width - barWidth);
    const score = (item.similarity * 100).toFixed(1);
    lines.push(`${idx + 1:2d}. [${bar}] ${score}% - ${item.embedding.fileName}`);
  });

  return lines.join('\n');
}

/**
 * 벡터 정규화 (필요시)
 */
export function normalizeVector(vector) {
  const norm = Math.sqrt(
    vector.reduce((sum, val) => sum + val * val, 0)
  );

  if (norm === 0) return vector;

  return vector.map(val => val / norm);
}

/**
 * 벡터 평균 (의미 공간의 중심)
 */
export function averageVectors(vectors) {
  if (vectors.length === 0) {
    return [];
  }

  const dimension = vectors[0].length;
  const avg = new Array(dimension).fill(0);

  for (const vec of vectors) {
    for (let i = 0; i < dimension; i++) {
      avg[i] += vec[i];
    }
  }

  for (let i = 0; i < dimension; i++) {
    avg[i] /= vectors.length;
  }

  return normalizeVector(avg);
}

/**
 * 포맷팅 (테스트용)
 */
export function formatSimilarityResults(similarities, limit = 10) {
  const lines = [];

  lines.push('🔍 유사도 검색 결과');
  lines.push(`   총 매치: ${similarities.length}개\n`);

  const displayed = similarities.slice(0, limit);
  displayed.forEach((item, idx) => {
    const score = (item.similarity * 100).toFixed(1);
    lines.push(`${idx + 1}. [${item.embedding.fileName}] ${score}% (순위: ${item.rank})`);
    lines.push(`   버전: ${item.embedding.version}/${item.embedding.phase}`);
  });

  if (similarities.length > limit) {
    lines.push(`\n... 외 ${similarities.length - limit}개`);
  }

  return lines.join('\n');
}

export default {
  cosineSimilarity,
  euclideanDistance,
  calculateSimilarities,
  selectTopK,
  filterByThreshold,
  selectTopKDiversified,
  analyzeSimilarities,
  visualizeSimilarities,
  normalizeVector,
  averageVectors,
  formatSimilarityResults
};
