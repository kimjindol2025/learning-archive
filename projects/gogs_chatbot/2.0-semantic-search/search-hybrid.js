/**
 * 하이브리드 검색 모듈
 * 메타필터 → BM25 → 벡터 유사도
 */

/**
 * 하이브리드 검색 파이프라인
 *
 * 1. 메타 필터 적용
 * 2. BM25 상위 K개 선택
 * 3. 그 안에서 벡터 유사도 재정렬
 * 4. 최종 Top-K
 */
export function searchHybrid(
  query,
  bm25Results,
  vectorStore,
  queryEmbedding,
  similarityFn,
  options = {}
) {
  const {
    bm25TopK = 20,      // BM25에서 선택할 상위 개수
    finalTopK = 5,      // 최종 결과 개수
    threshold = 0.3,    // 유사도 임계값
    bm25Weight = 0.4,   // BM25 가중치
    vectorWeight = 0.6  // 벡터 가중치
  } = options;

  // Step 1: BM25 결과에서 상위 K개 선택
  const bm25Top = bm25Results.results.slice(0, bm25TopK);

  if (bm25Top.length === 0) {
    return {
      query: query,
      error: 'No BM25 results',
      results: [],
      statistics: {}
    };
  }

  // Step 2: 이들 Chunk의 벡터 추출
  const chunksToRescore = [];

  for (const item of bm25Top) {
    const vector = vectorStore.vectors.find(
      v => v.chunkId === item.chunk.chunkIndex
    );

    if (vector) {
      chunksToRescore.push({
        bm25Score: item.score,
        bm25Rank: item.rank,
        vectorData: vector
      });
    }
  }

  // Step 3: 벡터 유사도 계산
  const rescored = [];

  for (const item of chunksToRescore) {
    const vectorSimilarity = similarityFn(
      queryEmbedding,
      item.vectorData.vector
    );

    // 필터링
    if (vectorSimilarity < threshold) {
      continue;
    }

    // 정규화된 점수
    const bm25Norm = item.bm25Score / (chunksToRescore[0].bm25Score || 1);
    const vectorNorm = Math.max(0, vectorSimilarity); // 이미 -1~1 범위

    // 하이브리드 점수
    const hybridScore = (bm25Norm * bm25Weight) + (vectorNorm * vectorWeight);

    rescored.push({
      embedding: item.vectorData,
      bm25Score: item.bm25Score,
      vectorSimilarity: vectorSimilarity,
      hybridScore: hybridScore,
      rank: 0
    });
  }

  // Step 4: 하이브리드 점수로 정렬
  rescored.sort((a, b) => b.hybridScore - a.hybridScore);

  // 순위 지정
  rescored.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Step 5: 최종 Top-K
  const final = rescored.slice(0, finalTopK);

  return {
    query: query,
    results: final,
    statistics: {
      bm25Input: bm25Results.results.length,
      bm25TopK: bm25TopK,
      vectorMatches: chunksToRescore.length,
      thresholdFiltered: chunksToRescore.length - rescored.length,
      finalSelected: final.length
    }
  };
}

/**
 * 필터 + BM25 + 벡터 (완전한 통합)
 */
export function searchFullHybrid(
  query,
  chunks,
  vectorStore,
  queryEmbedding,
  bm25SearchFn,
  similarityFn,
  filters = {},
  options = {}
) {
  // Step 1: 메타 필터 적용
  let filtered = chunks;

  if (filters.repo) {
    filtered = filtered.filter(c => c.repo === filters.repo);
  }

  if (filters.version) {
    filtered = filtered.filter(c => c.version === filters.version);
  }

  if (filters.phase) {
    filtered = filtered.filter(c => c.phase === filters.phase);
  }

  if (filtered.length === 0) {
    return {
      query: query,
      error: 'No chunks match filter criteria',
      results: [],
      filters: filters
    };
  }

  // Step 2: BM25 검색
  const bm25Results = bm25SearchFn(filtered, query);

  if (!bm25Results.results || bm25Results.results.length === 0) {
    return {
      query: query,
      error: 'No BM25 matches',
      results: [],
      filters: filters
    };
  }

  // Step 3: 하이브리드 재정렬
  const hybridResult = searchHybrid(
    query,
    bm25Results,
    vectorStore,
    queryEmbedding,
    similarityFn,
    options
  );

  return {
    ...hybridResult,
    filters: filters,
    filterStatistics: {
      totalChunks: chunks.length,
      filteredChunks: filtered.length,
      reductionRate: ((1 - filtered.length / chunks.length) * 100).toFixed(1)
    }
  };
}

/**
 * 의미 유사 Chunk 검색 (벡터만)
 */
export function searchSemanticOnly(
  queryEmbedding,
  vectorStore,
  similarityFn,
  options = {}
) {
  const {
    topK = 5,
    threshold = 0.3,
    diversify = false,
    diversifyBy = 'filePath'
  } = options;

  // 모든 벡터와 유사도 계산
  const similarities = [];

  for (const emb of vectorStore.vectors) {
    const similarity = similarityFn(queryEmbedding, emb.vector);

    if (similarity >= threshold) {
      similarities.push({
        embedding: emb,
        similarity: similarity,
        rank: 0
      });
    }
  }

  // 정렬
  similarities.sort((a, b) => b.similarity - a.similarity);

  // 순위 지정
  similarities.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Top-K 선택
  let selected = similarities.slice(0, topK);

  // 다양성 옵션
  if (diversify && selected.length > 1) {
    const diverse = [];
    const used = new Set();

    for (const item of selected) {
      const key = item.embedding[diversifyBy];
      if (!used.has(key)) {
        diverse.push(item);
        used.add(key);
      }
    }

    selected = diverse;
  }

  return {
    results: selected,
    statistics: {
      totalVectors: vectorStore.vectors.length,
      matchedCount: similarities.length,
      selectedCount: selected.length,
      avgSimilarity: similarities.length > 0
        ? (similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length).toFixed(4)
        : 0
    }
  };
}

/**
 * 버전 간 의미 변화 분석
 */
export function analyzeSemanticShift(
  query,
  queryEmbedding,
  vectorStore,
  version1,
  version2,
  similarityFn,
  options = {}
) {
  const baseOptions = {
    topK: options.topK || 5,
    threshold: options.threshold || 0.3
  };

  // 버전 1에서 검색
  const v1Embeddings = vectorStore.vectors.filter(e => e.version === version1);
  const v1Store = { vectors: v1Embeddings };

  const v1Result = searchSemanticOnly(
    queryEmbedding,
    v1Store,
    similarityFn,
    baseOptions
  );

  // 버전 2에서 검색
  const v2Embeddings = vectorStore.vectors.filter(e => e.version === version2);
  const v2Store = { vectors: v2Embeddings };

  const v2Result = searchSemanticOnly(
    queryEmbedding,
    v2Store,
    similarityFn,
    baseOptions
  );

  return {
    query: query,
    version1: {
      version: version1,
      matches: v1Result.statistics.matchedCount,
      avgSimilarity: v1Result.statistics.avgSimilarity,
      results: v1Result.results
    },
    version2: {
      version: version2,
      matches: v2Result.statistics.matchedCount,
      avgSimilarity: v2Result.statistics.avgSimilarity,
      results: v2Result.results
    },
    shift: {
      matchDiff: v2Result.statistics.matchedCount - v1Result.statistics.matchedCount,
      similarityShift: (
        parseFloat(v2Result.statistics.avgSimilarity) -
        parseFloat(v1Result.statistics.avgSimilarity)
      ).toFixed(4)
    }
  };
}

/**
 * 포맷팅 (테스트용)
 */
export function formatHybridResults(result) {
  const lines = [];

  lines.push(`\n🔍 하이브리드 검색 결과`);
  lines.push(`═══════════════════════════════`);
  lines.push(`쿼리: "${result.query}"`);

  if (result.error) {
    lines.push(`\n❌ 오류: ${result.error}`);
    return lines.join('\n');
  }

  if (result.statistics) {
    lines.push(`\n📊 통계:`);
    lines.push(`   BM25 입력: ${result.statistics.bm25Input}개`);
    lines.push(`   BM25 상위: ${result.statistics.bm25TopK}개`);
    lines.push(`   벡터 매치: ${result.statistics.vectorMatches}개`);
    lines.push(`   임계값 필터됨: ${result.statistics.thresholdFiltered}개`);
    lines.push(`   최종 선택: ${result.statistics.finalSelected}개`);
  }

  lines.push(`\n🏆 결과:`);
  result.results.forEach((item, idx) => {
    lines.push(`\n${idx + 1}. [${item.embedding.fileName}]`);
    lines.push(`   BM25 점수: ${item.bm25Score.toFixed(2)}`);
    lines.push(`   벡터 유사도: ${(item.vectorSimilarity * 100).toFixed(1)}%`);
    lines.push(`   하이브리드: ${(item.hybridScore * 100).toFixed(1)}% (순위: ${item.rank})`);
  });

  lines.push('');
  return lines.join('\n');
}

export default {
  searchHybrid,
  searchFullHybrid,
  searchSemanticOnly,
  analyzeSemanticShift,
  formatHybridResults
};
