/**
 * 토큰화 및 전처리 모듈
 * BM25 검색을 위한 기초 작업
 */

// 한글 불용어 (stopwords)
const KOREAN_STOPWORDS = new Set([
  '이', '그', '저', '것', '수', '등', '들', '및', '또는',
  '와', '이', '가', '을', '를', '에', '에서', '으로', '있다',
  '되다', '하다', '같다', '없다', '이다', '아니다',
  '전', '하', '않', '있', '되', '수', '것', '있고'
]);

// 영문 불용어
const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'at', 'to', 'for',
  'of', 'is', 'are', 'am', 'be', 'been', 'being', 'have', 'has',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
]);

/**
 * 기본 토큰화
 */
export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * 불용어 제거
 */
export function removeStopwords(tokens, language = 'both') {
  const stopwords = new Set();

  if (language === 'korean' || language === 'both') {
    KOREAN_STOPWORDS.forEach(w => stopwords.add(w));
  }

  if (language === 'english' || language === 'both') {
    ENGLISH_STOPWORDS.forEach(w => stopwords.add(w));
  }

  return tokens.filter(token => !stopwords.has(token));
}

/**
 * 단어 정규화 (형태소 수준)
 */
export function normalize(word) {
  // 기본 정규화
  let normalized = word.toLowerCase();

  // 한글 처리
  if (/[가-힣]/.test(normalized)) {
    // 뒤의 조사/어미 제거 (간단 버전)
    normalized = normalized.replace(/([가-힣])\s*($|[은는이가을를에서로부터])$/, '$1');
  }

  // 영문 처리
  if (/[a-z]/i.test(normalized)) {
    // 기본형으로 (간단 버전)
    if (normalized.endsWith('ed')) {
      normalized = normalized.slice(0, -2);
    } else if (normalized.endsWith('ing')) {
      normalized = normalized.slice(0, -3);
    } else if (normalized.endsWith('s')) {
      normalized = normalized.slice(0, -1);
    }
  }

  return normalized;
}

/**
 * 전체 전처리 파이프라인
 */
export function preprocess(text, options = {}) {
  const {
    removeStops = true,
    normalize: shouldNormalize = true,
    minLength = 1,
    language = 'both'
  } = options;

  let tokens = tokenize(text);

  if (removeStops) {
    tokens = removeStopwords(tokens, language);
  }

  if (shouldNormalize) {
    tokens = tokens.map(t => normalize(t));
  }

  // 중복 제거
  tokens = [...new Set(tokens)];

  // 최소 길이 필터
  tokens = tokens.filter(t => t.length >= minLength);

  return tokens;
}

/**
 * Chunk 전처리 (메타데이터 추출)
 */
export function preprocessChunk(chunk, options = {}) {
  const tokens = preprocess(chunk.content, options);

  // TF (Term Frequency) 맵 생성
  const tfMap = {};
  for (const token of tokenize(chunk.content)) {
    if (!removeStopwords([token], options.language).length) continue;
    const normalized = options.normalize !== false ? normalize(token) : token;
    tfMap[normalized] = (tfMap[normalized] || 0) + 1;
  }

  return {
    ...chunk,
    tokens: tokens,
    tfMap: tfMap,
    termCount: Object.values(tfMap).reduce((a, b) => a + b, 0),
    uniqueTerms: Object.keys(tfMap).length
  };
}

/**
 * 여러 Chunk 전처리
 */
export function preprocessChunks(chunks, options = {}) {
  return chunks.map(chunk => preprocessChunk(chunk, options));
}

/**
 * 쿼리 토큰화
 */
export function tokenizeQuery(query, options = {}) {
  const {
    removeStops = true,
    normalize: shouldNormalize = true,
    language = 'both'
  } = options;

  let tokens = tokenize(query);

  if (removeStops) {
    tokens = removeStopwords(tokens, language);
  }

  if (shouldNormalize) {
    tokens = tokens.map(t => normalize(t));
  }

  return tokens;
}

/**
 * 통계 계산
 */
export function calculateStatistics(preprocessedChunks) {
  const stats = {
    totalChunks: preprocessedChunks.length,
    totalTerms: 0,
    uniqueTerms: new Set(),
    avgTermsPerChunk: 0,
    avgUniqueTerms: 0,
    termFrequency: {}
  };

  for (const chunk of preprocessedChunks) {
    stats.totalTerms += chunk.termCount;
    stats.avgUniqueTerms += chunk.uniqueTerms;

    for (const term of chunk.tokens) {
      stats.uniqueTerms.add(term);
      stats.termFrequency[term] = (stats.termFrequency[term] || 0) + 1;
    }
  }

  stats.uniqueTerms = stats.uniqueTerms.size;
  stats.avgTermsPerChunk = stats.totalTerms / stats.totalChunks;
  stats.avgUniqueTerms = stats.avgUniqueTerms / stats.totalChunks;

  return stats;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatTokens(tokens, limit = 20) {
  return tokens.slice(0, limit).join(', ') + (tokens.length > limit ? '...' : '');
}

export default {
  tokenize,
  removeStopwords,
  normalize,
  preprocess,
  preprocessChunk,
  preprocessChunks,
  tokenizeQuery,
  calculateStatistics,
  formatTokens,
  KOREAN_STOPWORDS,
  ENGLISH_STOPWORDS
};
