# Gogs Chatbot 1.2 - Chunk Search

문서 전체 검색에서 **Chunk 단위 검색**으로 개선한 버전

## 🔥 1.2의 개선 사항

| 항목 | 1.1 | 1.2 |
|------|-----|-----|
| **단위** | 파일 | Chunk (500~1000 토큰) |
| **긴 문서 대응** | ❌ | ✅ |
| **정확도** | 낮음 | 상승 |
| **메타데이터** | ❌ | ✅ |
| **점수화** | ❌ | ✅ |
| **검증 지표** | 기본 | 상세 (8개) |

## 📦 1.2 전체 구조

```
[Gogs] → [파일 수집] → [Chunk 분할] → [Chunk 인덱스]
   ↓
[키워드 매칭] → [점수 계산] → [Top-K 선택] → [LLM 전달]
   ↓
[검증 지표] → [기록 저장]
```

## 🧱 핵심 모듈

### 1️⃣ chunk.js - Chunk 분할 및 인덱싱

```javascript
// 고급 Chunk 분할 (헤더 기준)
const chunks = chunk.chunkTextAdvanced(text, 800);

// 메타데이터 추가
const withMeta = chunk.addMetadata(chunks, file);

// 인덱스 구축
const index = chunk.buildChunkIndex(withMeta);

// 통계
const stats = chunk.getChunkStatistics(withMeta);
```

**Chunk 메타데이터**:
```javascript
{
  repo: "project-v1",
  filePath: "docs/spec.md",
  fileName: "spec.md",
  version: "v1.2",
  phase: "Phase 3",
  chunkIndex: 3,
  totalChunks: 12,
  content: "...텍스트...",
  size: 800,
  wordCount: 120
}
```

### 2️⃣ scorer.js - 점수 기반 검색

```javascript
// 단일 Chunk 점수
const score = scorer.scoreChunk(chunk, query);

// 점수 계산 및 정렬
const scored = scorer.scoreAndRankChunks(chunks, query);

// Top-K 선택 (다양성 옵션)
const topK = scorer.selectTopChunksDiversified(scored, 5);

// 전체 파이프라인
const result = scorer.searchChunks(chunks, query, {
  topK: 5,
  diversify: true,
  threshold: 0,
  returnScores: true
});
```

**점수 기준**:
- 키워드 포함: +10점/단어
- 키워드 반복: +최대 5점
- 파일 이름 매치: +20점
- Chunk 위치: +0~10점

### 3️⃣ metrics.js - 검증 지표 (핵심)

**8가지 검증 지표**:

```javascript
// 1. 정확도
const relevance = metrics.calculateRelevanceScore(chunks, query);
const topKPerf = metrics.calculateTopKAccuracy(result);
const errorRate = metrics.calculateErrorRate(chunks, query);

// 2. 다양성
const diversity = metrics.calculateDiversity(chunks);
// → 파일, 버전, Phase 다양성

// 3. 커버리지
const coverage = metrics.calculateCoverage(chunks, allChunks);
// → Chunk, 파일 커버리지

// 4. 효율성
const efficiency = metrics.calculateEfficiency(chunks);
// → 토큰, 바이트, 단어 수

// 5. 종합 보고서
const report = metrics.generateMetricsReport(result, allChunks, query);
// → 모든 지표 통합 + 종합 점수 (0~100)

// 6. 메트릭 비교
const comparison = metrics.compareMetrics(report1, report2);
// → 두 검색 결과의 성능 비교
```

## 📊 메트릭 보고서 예시

```
📊 검증 지표 보고서
═══════════════════════════════
쿼리: "authentication jwt tokens"

📈 정확도
  관련성: 85.5%
  오류율: 5.0%
  Top-5 평균 점수: 45.2

🎯 다양성
  파일: 3개 (60.0%)
  버전: 2개
  Phase: 2개

📍 커버리지
  Chunk: 2.5%
  파일: 60.0%

⚡ 효율성
  예상 토큰: 450개
  평균 Chunk 크기: 890 bytes
  평균 단어: 120개

🏆 종합 점수: 82.3/100
```

## 🚀 사용 예시

### 1. Chunk 생성

```bash
npm run test:chunk
```

테스트 결과:
- 단순 분할 vs 고급 분할 비교
- 메타데이터 추가 검증
- 인덱스 구축 확인
- 통계 분석

### 2. 검증 지표 테스트

```bash
npm run test:metrics
```

테스트 항목:
- 기본 메트릭
- 정확도 지표
- 다양성 지표
- 커버리지 지표
- 효율성 지표
- 종합 보고서
- 메트릭 비교
- 다양성 검색 효과

### 3. 서버 실행 (예정)

```bash
npm start
```

## 🔍 왜 Chunk가 필요한가?

### 문제 (1.1)
```
spec 파일 (1500줄)
  ↓
통째로 LLM 전달
  ↓
❌ 토큰 초과
❌ 불필요 문맥
❌ 정확도 하락
```

### 해결 (1.2)
```
spec 파일 (1500줄)
  ↓
800 토큰 단위로 분할 (2개 Chunk)
  ↓
키워드 매칭 + 점수 계산
  ↓
Top-1 Chunk 선택 (가장 관련성 높음)
  ↓
✅ 토큰 효율적
✅ 필요한 내용만
✅ 정확도 상승
```

## 🧠 1.2 철학

> "어떤 버전의 어떤 설계 문서 일부가 선택되었는지 추적 가능"

이제부터:
- **응답에 출처 명시 가능**
- **인용 가능** (문서 + Chunk 번호)
- **검증 가능** (메타데이터 포함)

예:
```
Q: 시스템 아키텍처는?

A: [출처] architecture.md (v1.2/Phase 3) - Chunk 2/5

마이크로서비스 아키텍처를 사용합니다...
```

## 📈 1.2 검증 프로세스

```
검색 실행
  ↓
메트릭 수집 (8가지)
  ↓
검증 리포트 생성
  ↓
기록 저장 (파일/DB)
  ↓
성능 비교 (이전 검색과)
```

## 🎯 다음 단계 예고

### 1.3 - 메타데이터 기반 필터링
```javascript
// 특정 버전/Phase만 검색
searchChunks(chunks, query, {
  filterVersion: "v1.2",
  filterPhase: "Phase 3"
});
```

### 1.4 - BM25 개선
```javascript
// TF-IDF 기반 점수화
// 불용어(stopwords) 필터링
// 단어 정규화
```

### 2.0 - 벡터 의미 검색
```javascript
// 임베딩 모델 도입
// 코사인 유사도
// 시맨틱 검색
```

## 📁 파일 구조

```
1.2-chunk-search/
├── chunk.js              (Chunk 분할 및 인덱싱)
├── scorer.js             (점수 기반 검색)
├── metrics.js            (검증 지표 - 핵심!)
├── package.json
├── .env.example
├── README.md
└── tests/
    ├── test-chunk.js     (8가지 테스트)
    └── test-metrics.js   (8가지 메트릭 테스트)
```

## 📊 코드 규모

| 파일 | 라인 수 |
|------|--------|
| chunk.js | ~200 |
| scorer.js | ~180 |
| metrics.js | ~280 |
| test-chunk.js | ~260 |
| test-metrics.js | ~380 |
| **합계** | **~1,300** |

## 🏆 1.2 특징

✅ **Chunk 기반 검색**
- 긴 문서 대응
- 메타데이터 포함
- 정확도 상승

✅ **점수화**
- 키워드 매칭
- 위치 보너스
- 다양성 고려

✅ **검증 지표 상세 설계**
- 정확도 (관련성, 오류율)
- 다양성 (파일, 버전, Phase)
- 커버리지 (Chunk, 파일)
- 효율성 (토큰, 바이트)
- 종합 점수

✅ **기록 기반**
- 모든 검색 메타데이터 기록
- 성능 비교 가능
- 추적 가능

## 📝 라이선스

MIT

---

**상태**: ✅ 검증 지표 완성 (1.2)
**마지막 업데이트**: 2026-02-27
**철학**: "기록이 증명이다" (Your metrics are your proof)
