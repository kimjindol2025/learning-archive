# Gogs Chatbot 2.0 - Semantic Search

의미 기반 검색 도입으로 **벡터 공간 검색** 추가

## 🔥 2.0의 개선 사항

**단어 중심 검색** → **의미 중심 검색**

```
기존 (1.4)          2.0
정확한 단어 필요     의미 유사만으로 가능
표현 방식 제한       다양한 표현 대응
짧은 문맥만          장기 문맥 가능
                   학습 없음 (외부 API)
```

## 🧱 핵심 모듈

### 1️⃣ embedding.js - Embedding 생성

```javascript
// 텍스트를 고차원 벡터로 변환
const vector = embedding.generateEmbedding(text);

// 여러 Chunk의 Embedding 생성
const embeddings = await embedding.generateChunkEmbeddings(chunks);

// 캐시 관리
embedding.clearCache();
```

**Embedding 구조**:
```javascript
{
  chunkId: 32,
  vector: [0.023, -0.994, ...],  // 768D
  repo: "freelang-v6",
  version: "v12.2",
  phase: "Phase 11",
  fileName: "spec.md",
  filePath: "docs/spec.md",
  contentLength: 2048
}
```

### 2️⃣ vector-store.js - 벡터 저장소

```javascript
// 저장소 생성
const store = vectorStore.createVectorStore();

// Embedding 추가
vectorStore.addEmbedding(store, embedding);
vectorStore.addEmbeddings(store, embeddings);

// 메타데이터 필터링
const filtered = vectorStore.filterByMetadata(store, { version: 'v1.2' });

// 통계
const stats = vectorStore.getStoreStatistics(store);
```

**저장소 구조**:
```javascript
{
  vectors: [...],        // Embedding 배열
  index: {...},          // chunkId → 위치
  metadata: {...},       // 빠른 검색
  createdAt: "ISO8601"
}
```

### 3️⃣ similarity.js - 유사도 계산

```javascript
// Cosine Similarity
const sim = similarity.cosineSimilarity(vec1, vec2);

// 여러 벡터와 유사도 계산
const similarities = similarity.calculateSimilarities(queryVec, embeddings);

// Top-K 선택
const topK = similarity.selectTopK(similarities, 5);

// 임계값 필터링
const filtered = similarity.filterByThreshold(similarities, 0.5);

// 유사도 분석
const analysis = similarity.analyzeSimilarities(similarities);
```

**Cosine Similarity 공식**:
```
sim = (A·B) / (|A| × |B|)

범위: -1 ~ 1 (정규화 벡터: 0 ~ 1)
```

### 4️⃣ search-hybrid.js - 하이브리드 검색

```javascript
// 벡터만 검색
const result = searchHybrid.searchSemanticOnly(
  queryEmbedding,
  vectorStore,
  similarity.cosineSimilarity
);

// 완전한 하이브리드 (메타필터 → BM25 → 벡터)
const result = searchHybrid.searchFullHybrid(
  query,
  chunks,
  vectorStore,
  queryEmbedding,
  bm25SearchFn,
  similarity.cosineSimilarity,
  { version: 'v1.2' }
);

// 의미 변화 분석
const shift = searchHybrid.analyzeSemanticShift(
  query,
  queryEmbedding,
  vectorStore,
  'v1.0',
  'v2.0',
  similarity.cosineSimilarity
);
```

## 📊 검색 구조 진화

### 1.4 (통계 기반)
```
쿼리 → 토큰화 → BM25 점수 → Top-K
```

### 2.0 (하이브리드 - 최적 구조)
```
쿼리 → Embedding 생성
   ↓
메타 필터 적용
   ↓
BM25 상위 20개 선택
   ↓
그 안에서 벡터 유사도 재정렬
   ↓
최종 Top-5
```

## 🎯 하이브리드 검색의 장점

✅ **1단계 (메타필터)**
- 불필요한 범위 제외
- 계산량 감소

✅ **2단계 (BM25)**
- 통계 기반 1차 정렬
- 키워드 매칭 확보

✅ **3단계 (벡터)**
- 의미 유사도 재정렬
- 표현 다양성 대응

## 📈 검색 품질 개선

### 예시 1
```
Q: "포인터 위험성"

1.4 (BM25):
✅ "unsafe pointer operations"
✅ "pointer safety concerns"
❌ "memory vulnerability in FFI"

2.0 (Hybrid):
✅ "unsafe pointer operations"
✅ "pointer safety concerns"
✅ "memory vulnerability in FFI" ← NEW
```

### 예시 2
```
Q: "설계 철학은?"

1.4 (BM25):
❌ "설계", "철학" 단어 필요

2.0 (Hybrid):
✅ "system design principles"
✅ "architectural guidelines"
✅ "design patterns and philosophy"
```

## 🧠 2.0 철학

> "기록은 원본 그대로 유지, 벡터는 탐색 도구일 뿐"

### 구조
1. **기록 (원본)**
   - Chunk 콘텐츠 유지
   - 메타데이터 명시
   - 추적 가능

2. **벡터 (인덱스)**
   - 접근 도구
   - 의미 공간 표현
   - 가중치 업데이트 없음

3. **하이브리드 (검색)**
   - 통계 + 의미
   - 견고성 + 유연성
   - 명확한 출처

## 🚀 사용 예시

### 1. 테스트 실행

```bash
npm test
```

테스트 항목 (10개):
- Embedding 생성
- Chunk Embedding
- 저장소 생성
- 저장소 검증
- Cosine Similarity
- 유사도 계산
- Top-K 선택
- 임계값 필터링
- 유사도 분석
- 의미 검색

### 2. 의미 검색

```javascript
const queryEmb = embedding.generateSimulatedEmbedding(
  'memory safe pointer'
);

const results = searchHybrid.searchSemanticOnly(
  queryEmb,
  vectorStore,
  similarity.cosineSimilarity,
  { topK: 5, threshold: 0.3 }
);
```

### 3. 하이브리드 검색

```javascript
const result = searchHybrid.searchFullHybrid(
  query,
  chunks,
  vectorStore,
  queryEmbedding,
  bm25SearchFn,
  similarity.cosineSimilarity,
  { version: 'v1.2' },
  {
    bm25TopK: 20,
    finalTopK: 5,
    bm25Weight: 0.4,
    vectorWeight: 0.6
  }
);
```

## 📊 하이브리드 점수 계산

```
하이브리드 점수 = BM25정규화 × 0.4 + 벡터유사도 × 0.6

예시:
BM25 점수: 45.2 → 정규화: 1.0
벡터 유사도: 0.82 → 정규화: 0.82

하이브리드 = (1.0 × 0.4) + (0.82 × 0.6) = 0.892 (89.2%)
```

## 📁 파일 구조

```
2.0-semantic-search/
├── embedding.js       (벡터 생성)
├── vector-store.js    (벡터 저장소)
├── similarity.js      (유사도 계산)
├── search-hybrid.js   (하이브리드 검색)
├── package.json
├── .env.example
├── README.md
└── tests/
    └── test-embedding.js  (10가지 테스트)
```

## 📊 코드 규모

| 파일 | 라인 수 |
|------|--------|
| embedding.js | ~150 |
| vector-store.js | ~220 |
| similarity.js | ~230 |
| search-hybrid.js | ~310 |
| test-embedding.js | ~420 |
| **합계** | **~1,330** |

## 🏆 2.0 특징

✅ **의미 기반 검색**
- 텍스트 벡터화
- Cosine Similarity
- 의미 공간 탐색

✅ **벡터 저장소**
- 메타데이터 유지
- 효율적 인덱싱
- 직렬화 지원

✅ **하이브리드 아키텍처**
- 메타필터 (범위 축소)
- BM25 (통계 기반)
- 벡터 (의미 기반)

✅ **학습 없음**
- 외부 Embedding API만 사용
- 가중치 업데이트 없음
- 결정론적 결과

✅ **기록 기반**
- 원본 콘텐츠 유지
- 벡터는 인덱스
- 완전 추적 가능

## 🎓 다음 단계 (미래)

시간축 진화 추론:
- 버전 간 의미 변화 추적
- 설계 의도 자동 추출
- Commit DAG 추론

이제 단순 검색을 넘어
**지식 구조 분석 엔진**으로 진화

---

**상태**: ✅ 벡터 의미 검색 완성 (2.0)
**철학**: "벡터는 탐색 도구, 기록이 증명"
