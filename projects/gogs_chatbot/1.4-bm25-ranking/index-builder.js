/**
 * Inverted Index 생성 모듈
 * BM25 검색을 위한 인덱스 구축
 */

/**
 * Inverted Index 생성
 * 구조: { term: { df, postings: [{chunkId, tf}] } }
 */
export function buildInvertedIndex(preprocessedChunks) {
  const index = {};

  for (const chunk of preprocessedChunks) {
    for (const term of chunk.tokens) {
      if (!index[term]) {
        index[term] = {
          df: 0,              // Document Frequency
          postings: []        // Chunk ID와 TF의 리스트
        };
      }

      // TF 값
      const tf = chunk.tfMap[term] || 0;

      // Posting 추가
      index[term].postings.push({
        chunkId: chunk.chunkIndex,
        tf: tf
      });

      // DF 증가
      if (!index[term].counted) {
        index[term].df++;
        index[term].counted = true;
      }
    }

    // DF 카운팅 플래그 초기화
    for (const term in index) {
      index[term].counted = false;
    }
  }

  return index;
}

/**
 * IDF 계산
 */
export function calculateIDF(index, totalChunks) {
  const idf = {};

  for (const term in index) {
    const df = index[term].df;
    idf[term] = Math.log(totalChunks / (1 + df));
  }

  return idf;
}

/**
 * 평균 Chunk 길이 계산
 */
export function calculateAverageLength(preprocessedChunks) {
  if (preprocessedChunks.length === 0) return 0;

  const totalLength = preprocessedChunks.reduce((sum, chunk) => sum + chunk.termCount, 0);
  return totalLength / preprocessedChunks.length;
}

/**
 * 인덱싱 통계
 */
export function getIndexStatistics(index, preprocessedChunks, avgLength) {
  const stats = {
    totalTerms: Object.keys(index).length,
    totalChunks: preprocessedChunks.length,
    avgChunkLength: Math.round(avgLength * 100) / 100,
    postingCount: 0,
    rarityDistribution: {
      rare: 0,      // df <= 1
      medium: 0,    // 2 <= df <= 10
      common: 0,    // 11 <= df <= 100
      veryCommon: 0 // df > 100
    }
  };

  for (const term in index) {
    const df = index[term].df;
    stats.postingCount += index[term].postings.length;

    if (df <= 1) stats.rarityDistribution.rare++;
    else if (df <= 10) stats.rarityDistribution.medium++;
    else if (df <= 100) stats.rarityDistribution.common++;
    else stats.rarityDistribution.veryCommon++;
  }

  return stats;
}

/**
 * 특정 Term의 상세 정보
 */
export function getTermInfo(index, idf, term) {
  if (!index[term]) {
    return null;
  }

  return {
    term: term,
    df: index[term].df,
    idf: idf[term] || 0,
    postingCount: index[term].postings.length,
    postings: index[term].postings
  };
}

/**
 * Term 검색 (특정 Chunk에서)
 */
export function findTerm(index, term, chunkId) {
  if (!index[term]) return null;

  const posting = index[term].postings.find(p => p.chunkId === chunkId);
  return posting || null;
}

/**
 * 인덱스 직렬화 (저장용)
 */
export function serializeIndex(index) {
  const serialized = {};

  for (const term in index) {
    serialized[term] = {
      df: index[term].df,
      postings: index[term].postings
    };
  }

  return JSON.stringify(serialized);
}

/**
 * 인덱스 역직렬화 (로드용)
 */
export function deserializeIndex(serialized) {
  return JSON.parse(serialized);
}

/**
 * 전체 인덱싱 파이프라인
 */
export function buildCompleteIndex(preprocessedChunks) {
  const index = buildInvertedIndex(preprocessedChunks);
  const idf = calculateIDF(index, preprocessedChunks.length);
  const avgLength = calculateAverageLength(preprocessedChunks);
  const stats = getIndexStatistics(index, preprocessedChunks, avgLength);

  return {
    index: index,
    idf: idf,
    avgLength: avgLength,
    stats: stats,
    totalChunks: preprocessedChunks.length,
    builtAt: new Date().toISOString()
  };
}

/**
 * 인덱스 품질 검사
 */
export function validateIndex(completeIndex) {
  const validations = {
    hasIndex: !!completeIndex.index,
    hasIDF: !!completeIndex.idf,
    hasAvgLength: completeIndex.avgLength > 0,
    hasStats: !!completeIndex.stats,
    consistentTermCount: Object.keys(completeIndex.index).length === Object.keys(completeIndex.idf).length
  };

  return {
    isValid: Object.values(validations).every(v => v),
    validations: validations
  };
}

/**
 * 포맷팅 (테스트용)
 */
export function formatIndexStats(stats) {
  const lines = [];

  lines.push('📊 인덱스 통계');
  lines.push(`   전체 Terms: ${stats.totalTerms}개`);
  lines.push(`   Chunks: ${stats.totalChunks}개`);
  lines.push(`   평균 길이: ${stats.avgChunkLength} 토큰`);
  lines.push(`   Postings: ${stats.postingCount}개`);
  lines.push('   단어 분포:');
  lines.push(`   - 희귀: ${stats.rarityDistribution.rare}개`);
  lines.push(`   - 중간: ${stats.rarityDistribution.medium}개`);
  lines.push(`   - 흔함: ${stats.rarityDistribution.common}개`);
  lines.push(`   - 매우흔함: ${stats.rarityDistribution.veryCommon}개`);

  return lines.join('\n');
}

export default {
  buildInvertedIndex,
  calculateIDF,
  calculateAverageLength,
  getIndexStatistics,
  getTermInfo,
  findTerm,
  serializeIndex,
  deserializeIndex,
  buildCompleteIndex,
  validateIndex,
  formatIndexStats
};
