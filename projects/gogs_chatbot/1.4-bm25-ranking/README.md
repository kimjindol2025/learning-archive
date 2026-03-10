# Gogs Chatbot 1.4 - BM25 Ranking

통계 기반 랭킹 개선으로 **검색 엔진 레벨 1 완성**

## 🔥 1.4의 개선 사항

단순 "단어 포함 개수"를 버리고 **TF-IDF 기반 점수 계산** 도입

```
1.2~1.3:              1.4:
단어 1번 등장 = 1점    TF-IDF 기반
개수만 계산           문서 길이 정규화
흔한 단어 과대평가     흔한 단어 패널티
                     BM25 수준 접근
```

## 🧱 핵심 모듈

### 1️⃣ tokenizer.js - 토큰화 및 전처리

```javascript
// 기본 토큰화
tokenizer.tokenize(text);

// 불용어 제거
tokenizer.removeStopwords(tokens, 'korean');

// 단어 정규화
tokenizer.normalize(word);

// 전체 전처리 파이프라인
tokenizer.preprocess(text, { removeStops: true, normalize: true });

// Chunk 전처리 (TF 맵 생성)
tokenizer.preprocessChunk(chunk);

// 쿼리 토큰화
tokenizer.tokenizeQuery(query);
```

### 2️⃣ index-builder.js - Inverted Index 생성

```javascript
// Inverted Index 구축
const index = indexBuilder.buildInvertedIndex(preprocessedChunks);

// IDF 계산
const idf = indexBuilder.calculateIDF(index, totalChunks);

// 평균 길이
const avgLength = indexBuilder.calculateAverageLength(chunks);

// 완전한 인덱스 (원스텝)
const completeIndex = indexBuilder.buildCompleteIndex(chunks);
```

**Index 구조**:
```javascript
{
  "term": {
    "df": 12,              // Document Frequency
    "postings": [
      { "chunkId": 1, "tf": 3 },
      { "chunkId": 8, "tf": 1 }
    ]
  }
}
```

### 3️⃣ bm25-scorer.js - BM25 점수 계산

```javascript
// 단일 Term 점수
bm25Scorer.scoreTerm(term, tf, idf, chunkLen, avgLen);

// Chunk 전체 점수
bm25Scorer.scoreChunk(queryTerms, chunk, index, idf, avgLen);

// 여러 Chunk 점수 매기기
bm25Scorer.scoreChunks(queryTerms, chunks, index, idf, avgLen);

// 점수 분석
bm25Scorer.analyzeScores(scored);

// Term별 기여도 분석
bm25Scorer.analyzeTermContributions(queryTerms, topChunks, idf);
```

**BM25 공식**:
```
score = IDF × (TF × (k+1)) / (TF + k × (1-b + b × (len/avglen)))

기본값: k=1.5, b=0.75
```

### 4️⃣ search-bm25.js - 완전한 검색 파이프라인

```javascript
// 기본 BM25 검색
searchBM25.searchBM25(chunks, query, {
  k1: 1.5,
  b: 0.75,
  topK: 5,
  removeStops: true
});

// 필터 + BM25 검색
searchBM25.searchBM25WithFilters(
  chunks,
  query,
  { version: 'v1.2', phase: 'Phase 11' },
  { topK: 5 }
);

// 버전 비교 검색
searchBM25.compareBM25Search(chunks, query, 'v1.0', 'v2.0');
```

## 📋 검색 흐름 (완전한 파이프라인)

```
1. Gogs → 파일 수집
   ↓
2. Chunk 생성
   ↓
3. 토큰화 + 불용어 제거 + 정규화
   ↓
4. Inverted Index 생성
   ↓
5. IDF 계산
   ↓
6. 메타 필터 적용 (optional)
   ↓
7. BM25 점수 계산
   ↓
8. 점수 정렬
   ↓
9. Top-K 선택
   ↓
10. LLM 전달
```

## 🔍 BM25 특징

### ✅ 장점

1. **문서 길이 정규화**
   - 짧은 문서 과대평가 방지
   - 긴 문서 과소평가 방지

2. **자주 등장하는 단어 패널티**
   - "the", "a" 같은 단어는 낮은 IDF
   - 고유한 단어는 높은 IDF

3. **Term Frequency 포화**
   - 같은 단어 반복해도 점수 무한 증가 X
   - k 파라미터로 조절

4. **완전 결정론적**
   - 벡터 없음
   - 학습 불필요
   - 디버깅 가능

## 📊 성능 특성

| 항목 | 1.3 | 1.4 |
|------|-----|-----|
| 단어 가중치 | 단순 카운트 | TF-IDF |
| 문서 길이 보정 | ❌ | ✅ |
| 흔한 단어 패널티 | ❌ | ✅ |
| 점수 포화 | ❌ | ✅ |
| 검색 품질 | 중간 | 높음 |

## 🚀 사용 예시

### 1. 테스트 실행

```bash
npm test
```

테스트 항목 (12개):
- 토큰화
- Chunk 전처리
- Inverted Index 생성
- IDF 계산
- 인덱스 통계
- 단일 Term 점수
- Chunk 점수 계산
- 점수 분석
- Top-K 선택
- 전체 BM25 검색
- 필터 + BM25 검색
- Term 기여도 분석

### 2. 기본 검색

```javascript
const result = searchBM25.searchBM25(chunks, 'memory model');
// 쿼리 토큰화 → 인덱싱 → BM25 점수 → Top-K
```

### 3. 필터 + 검색

```javascript
const result = searchBM25.searchBM25WithFilters(
  chunks,
  'FFI memory',
  { version: 'v1.2' }
);
// 먼저 v1.2만 필터 → BM25 검색
```

## 📈 인덱싱 통계

```
📊 인덱스 통계
   전체 Terms: 1,245개
   Chunks: 156개
   평균 길이: 98 토큰
   Postings: 3,427개
   단어 분포:
   - 희귀: 542개 (df <= 1)
   - 중간: 456개 (2-10)
   - 흔함: 198개 (11-100)
   - 매우흔함: 49개 (>100)
```

## 🎯 Term 기여도 예시

```
쿼리: "memory allocation model"

Term: "memory"
- IDF: 1.85
- 기여도: 28.5
- 나타난 Chunk: 3개

Term: "allocation"
- IDF: 2.12
- 기여도: 15.3
- 나타난 Chunk: 2개

Term: "model"
- IDF: 1.92
- 기여도: 22.1
- 나타난 Chunk: 4개
```

## 🧠 1.4 철학

> "검색 엔진 레벨 1 완성"

### 특징
1. **벡터 없음** - 로컬 계산만
2. **GPU 불필요** - CPU 연산
3. **학습 불필요** - 결정론적
4. **디버깅 가능** - 각 단계 명확
5. **확장 가능** - BM25+ 또는 벡터로

## 📁 파일 구조

```
1.4-bm25-ranking/
├── tokenizer.js       (토큰화 + 전처리)
├── index-builder.js   (Inverted Index)
├── bm25-scorer.js     (BM25 점수)
├── search-bm25.js     (통합 검색)
├── package.json
├── .env.example
├── README.md
└── tests/
    └── test-bm25.js   (12가지 테스트)
```

## 📊 코드 규모

| 파일 | 라인 수 |
|------|--------|
| tokenizer.js | ~200 |
| index-builder.js | ~170 |
| bm25-scorer.js | ~220 |
| search-bm25.js | ~210 |
| test-bm25.js | ~400 |
| **합계** | **~1,200** |

## 🏆 1.4 특징

✅ **TF-IDF 기반 점수화**
- Term Frequency 가중치
- Inverse Document Frequency 패널티
- 문서 길이 정규화

✅ **BM25 알고리즘**
- k=1.5, b=0.75 기본값
- 점수 포화 방지
- 최적의 성능

✅ **전처리 파이프라인**
- 토큰화
- 불용어 제거
- 단어 정규화

✅ **완전 인덱싱**
- Inverted Index 구조
- IDF 테이블
- 평균 길이 캐시

✅ **검색 엔진 품질**
- 벡터 없음
- 로컬 계산
- 결정론적 결과

---

**상태**: ✅ BM25 통계 랭킹 완성 (1.4)
**철학**: "검색 엔진 레벨 1" - 벡터 도입 전 최적화
