/**
 * BM25 통합 검색 모듈
 * 완전한 검색 파이프라인
 */

import tokenizer from './tokenizer.js';
import indexBuilder from './index-builder.js';
import bm25Scorer from './bm25-scorer.js';

/**
 * 전체 BM25 검색 파이프라인
 */
export function searchBM25(chunks, query, options = {}) {
  const {
    k1 = 1.5,
    b = 0.75,
    topK = 5,
    diversify = false,
    threshold = 0,
    removeStops = true,
    language = 'both'
  } = options;

  // Step 1: Chunk 전처리
  const preprocessedChunks = tokenizer.preprocessChunks(chunks, {
    removeStops: removeStops,
    normalize: true,
    language: language
  });

  // Step 2: 인덱스 구축
  const completeIndex = indexBuilder.buildCompleteIndex(preprocessedChunks);
  const { index, idf, avgLength, stats } = completeIndex;

  // Step 3: 쿼리 토큰화
  const queryTerms = tokenizer.tokenizeQuery(query, {
    removeStops: removeStops,
    normalize: true,
    language: language
  });

  if (queryTerms.length === 0) {
    return {
      query: query,
      queryTerms: [],
      error: 'No valid query terms after preprocessing',
      results: [],
      statistics: stats
    };
  }

  // Step 4: 점수 계산
  const scored = bm25Scorer.scoreChunks(
    queryTerms,
    preprocessedChunks,
    index,
    idf,
    avgLength,
    k1,
    b
  );

  // Step 5: 임계값 필터링
  let filtered = scored;
  if (threshold > 0) {
    filtered = bm25Scorer.filterByThreshold(scored, threshold);
  }

  // Step 6: Top-K 선택
  let selected;
  if (diversify) {
    selected = bm25Scorer.selectTopKDiversified(filtered, topK);
  } else {
    selected = bm25Scorer.selectTopK(filtered, topK);
  }

  // Step 7: 결과 구성
  return {
    query: query,
    queryTerms: queryTerms,
    results: selected,
    statistics: {
      indexStats: stats,
      scoreStats: bm25Scorer.analyzeScores(scored),
      totalMatches: scored.length,
      selectedCount: selected.length,
      termContributions: bm25Scorer.analyzeTermContributions(
        queryTerms,
        selected,
        idf,
        avgLength,
        k1,
        b
      )
    }
  };
}

/**
 * 필터링 + BM25 검색 (1.3과 통합)
 */
export function searchBM25WithFilters(chunks, query, filters = {}, options = {}) {
  // 메타 필터 적용
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
      filters: filters,
      error: 'No chunks match filter criteria',
      results: [],
      statistics: {}
    };
  }

  // BM25 검색
  const searchResult = searchBM25(filtered, query, options);

  return {
    ...searchResult,
    filters: filters,
    filterStatistics: {
      totalChunks: chunks.length,
      filteredChunks: filtered.length,
      reductionRate: ((1 - filtered.length / chunks.length) * 100).toFixed(1)
    }
  };
}

/**
 * 버전 비교 검색 (BM25)
 */
export function compareBM25Search(chunks, query, version1, version2, options = {}) {
  const baseOptions = {
    k1: options.k1 || 1.5,
    b: options.b || 0.75,
    topK: options.topK || 5,
    removeStops: options.removeStops !== false,
    language: options.language || 'both'
  };

  // 버전 1 검색
  const result1 = searchBM25WithFilters(
    chunks,
    query,
    { version: version1 },
    baseOptions
  );

  // 버전 2 검색
  const result2 = searchBM25WithFilters(
    chunks,
    query,
    { version: version2 },
    baseOptions
  );

  return {
    query: query,
    version1: {
      version: version1,
      matches: result1.statistics.totalMatches,
      topScore: result1.results.length > 0 ? result1.results[0].score : 0,
      avgScore: result1.statistics.scoreStats.avg,
      results: result1.results
    },
    version2: {
      version: version2,
      matches: result2.statistics.totalMatches,
      topScore: result2.results.length > 0 ? result2.results[0].score : 0,
      avgScore: result2.statistics.scoreStats.avg,
      results: result2.results
    },
    comparison: {
      matchDiff: result2.statistics.totalMatches - result1.statistics.totalMatches,
      scoreDiff: Math.round((result2.statistics.scoreStats.avg -
                             result1.statistics.scoreStats.avg) * 100) / 100,
      improved: result2.statistics.scoreStats.avg > result1.statistics.scoreStats.avg
    }
  };
}

/**
 * 포맷팅 (테스트용)
 */
export function formatBM25Results(searchResult) {
  const lines = [];

  lines.push(`\n🔍 BM25 검색 결과`);
  lines.push(`═══════════════════════════════`);
  lines.push(`쿼리: "${searchResult.query}"`);
  lines.push(`쿼리 Terms: ${searchResult.queryTerms.join(', ') || '(없음)'}`);

  if (searchResult.error) {
    lines.push(`\n❌ 오류: ${searchResult.error}`);
    return lines.join('\n');
  }

  lines.push(`\n📊 통계:`);
  lines.push(`   인덱스 Terms: ${searchResult.statistics.indexStats.totalTerms}개`);
  lines.push(`   평균 Chunk 길이: ${searchResult.statistics.indexStats.avgChunkLength} 토큰`);
  lines.push(`   총 매치: ${searchResult.statistics.totalMatches}개`);
  lines.push(`   선택: ${searchResult.statistics.selectedCount}개`);

  lines.push(`\n📈 점수 분포:`);
  const scoreStats = searchResult.statistics.scoreStats;
  lines.push(`   최소: ${scoreStats.min.toFixed(2)}`);
  lines.push(`   최대: ${scoreStats.max.toFixed(2)}`);
  lines.push(`   평균: ${scoreStats.avg.toFixed(2)}`);
  lines.push(`   중앙: ${scoreStats.median.toFixed(2)}`);

  lines.push(`\n🏆 선택된 Chunk:`);
  searchResult.results.forEach((item, idx) => {
    lines.push(`\n${idx + 1}. [${item.chunk.fileName}] (${item.chunk.version}/${item.chunk.phase})`);
    lines.push(`   점수: ${item.score.toFixed(2)} | 순위: ${item.rank}`);
    lines.push(`   내용: ${item.chunk.content.substring(0, 70)}...`);
  });

  if (searchResult.statistics.termContributions) {
    lines.push(`\n📝 Term 기여도:`);
    const contribs = searchResult.statistics.termContributions;
    Object.entries(contribs)
      .sort((a, b) => b[1].totalScore - a[1].totalScore)
      .slice(0, 5)
      .forEach(([term, contrib]) => {
        lines.push(`   - ${term}: ${contrib.totalScore.toFixed(2)} (IDF: ${contrib.idf.toFixed(2)})`);
      });
  }

  lines.push('');
  return lines.join('\n');
}

export default {
  searchBM25,
  searchBM25WithFilters,
  compareBM25Search,
  formatBM25Results
};
