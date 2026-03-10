# Gogs Chatbot 1.3 - Metadata Filter

메타데이터 기반 필터링으로 **구조적 필터링** 도입

## 🔥 1.3의 개선 사항

버전/Phase 필터링 추가로 **검색 공간 축소**

```
기존 (1.2)           1.3
모든 Chunk ────→ 1. Repo 선택
  ↓             2. Version 필터
점수 계산         3. Phase 필터
                   ↓
                남은 Chunk에서
                점수 계산
```

## 🧱 핵심 모듈

### 1️⃣ filter.js - 메타데이터 필터링

```javascript
// 기본 필터
filter.filterChunks(chunks, { version: 'v1.2' });

// 복합 필터 (AND 조건)
filter.filterByMultipleCriteria(chunks, {
  repo: 'freelang-v6',
  version: 'v12.2',
  phase: 'Phase 11'
});

// 버전 범위
filter.filterByVersionRange(chunks, 'v1.0', 'v2.0');

// 진화 비교
filter.extractVersionComparison(chunks, 'v1.0', 'v2.0');
```

### 2️⃣ search-enhanced.js - 필터 통합 검색

```javascript
// 검색 순서:
// 1. Repo 선택
// 2. 메타 필터 적용
// 3. 남은 chunk에 점수 계산
// 4. Top-K 선택

search.searchWithFilters(chunks, query, {
  repo: 'freelang-v6',
  version: 'v12.2',
  phase: 'Phase 11',
  topK: 5
});

// 버전 비교 검색
search.compareVersionSearch(chunks, query, 'v1.0', 'v2.0');

// Phase 단위 추론
search.searchByPhaseAndTopic(chunks, topic, 'Phase 11');
```

### 3️⃣ prompt-builder.js - 강화된 LLM 프롬프트

```javascript
// 버전 인식 프롬프트
prompt.buildVersionAwarePrompt(query, chunks, 'v12.2');

// Phase 인식 프롬프트
prompt.buildPhaseAwarePrompt(query, chunks, 'Phase 11', 'v12.2');

// 진화 비교 프롬프트
prompt.buildEvolutionComparisonPrompt(query, chunks1, chunks2, 'v1.0', 'v2.0');

// 종합 프롬프트
prompt.buildComprehensivePrompt({
  query: 'FFI 메모리 모델?',
  selectedChunks: chunks,
  filters: { version: 'v12.2', phase: 'Phase 11' },
  mode: 'version-aware'
});
```

## 📋 요청 구조 확장

### 기존 (1.2)
```javascript
{
  "repo": "freelang-v6",
  "question": "FFI memory model?"
}
```

### 1.3
```javascript
{
  "repo": "freelang-v6",
  "version": "v12.2",
  "phase": "Phase 11",
  "question": "FFI memory model?"
}
```

`version`과 `phase`는 **optional**

## 🔍 검색 순서 (1.3 핵심)

```
1️⃣ Repo 선택
   └─ 저장소 고정

2️⃣ 메타 필터 적용
   ├─ version 필터
   ├─ phase 필터
   └─ 검색 공간 축소

3️⃣ 남은 Chunk에 점수 계산
   └─ 필터링된 범위 내에서만

4️⃣ Top-K 선택
   └─ 점수 상위 K개

5️⃣ LLM 전달
   └─ 메타데이터 포함 프롬프트
```

## 🎯 이제 가능한 것

### ✅ 특정 버전만 분석
```
version: "v12.2"
question: "FFI 설명해라"
→ v12.2에서만 검색
```

### ✅ 진화 비교 모드
```
version1: "v12.0"
version2: "v12.2"
question: "어떻게 달라졌나?"
→ 두 버전 각각 검색 후 diff 분석
```

### ✅ Phase 단위 사고 추적
```
phase: "Phase 11"
question: "메모리 모델 정의?"
→ Phase 11에서만 검색
→ 해당 Phase의 설계 의도 파악
```

## 📊 LLM 프롬프트 강화

### 기존 프롬프트
```
다음은 저장소에서 검색한 정보입니다:
[관련 내용]

질문에 답하세요.
```

### 1.3 프롬프트
```
⚠️ 버전 v12.2의 기록입니다.
반드시 이 버전 정보에만 기반해서 답하세요.
다른 버전의 내용은 사용하지 마세요.
이 기록에 없는 정보는 "해당 정보가 없습니다"라고 명시하세요.

버전: v12.2
Phase: Phase 11
파일: spec_v12_2_ffi.md

[기록 문서]

위 기록을 기반으로 질문에 답변하세요.
```

### 효과
- ✅ 환각(hallucination) 감소
- ✅ 버전 혼동 방지
- ✅ 명확한 범위 지정
- ✅ 추적 가능한 응답

## 🚀 사용 예시

### 1. 필터링 테스트
```bash
npm test
```

테스트 항목 (12개):
- 기본 필터링
- 복합 필터링 (AND)
- 버전 범위 필터링
- 필터 통계
- 메타데이터 조회
- 필터 검증
- 진화 비교
- 강화된 검색 (필터 포함)
- 버전 비교 검색
- Phase별 추론
- 버전 인식 프롬프트
- 종합 프롬프트

### 2. 특정 버전 검색
```javascript
const result = search.searchWithFilters(
  chunks,
  'FFI memory model',
  {
    version: 'v12.2',
    topK: 5
  }
);
```

### 3. 진화 분석
```javascript
const comparison = search.compareVersionSearch(
  chunks,
  'memory allocation',
  'v12.0',
  'v12.2'
);
// v12.0과 v12.2에서 각각 검색
// 점수 차이 분석
```

## 🧠 1.3 철학

> "버전 인지형 기록 추론 엔진"

### 특징
1. **구조적 필터링**
   - 검색 전에 공간을 줄인다
   - 불필요한 정보 제외

2. **버전 추적**
   - 어떤 버전의 정보인지 명확
   - 진화 분석 가능

3. **Phase 단위 사고**
   - 개발 단계별 설계 의도 파악
   - 시간순 추론

4. **환각 감소**
   - 명확한 범위 지정
   - 프롬프트에서 경고

## 📈 성능 효과

| 항목 | 1.2 | 1.3 |
|------|-----|-----|
| 검색 공간 | 전체 | 필터링됨 |
| 점수 분산 | 넓음 | 좁음 |
| 오류율 | 높음 | 감소 |
| 추적성 | 낮음 | 높음 |
| 진화 분석 | ❌ | ✅ |

## 📁 파일 구조

```
1.3-metadata-filter/
├── filter.js              (메타데이터 필터링)
├── search-enhanced.js     (필터 통합 검색)
├── prompt-builder.js      (강화 프롬프트)
├── package.json
├── .env.example
├── README.md
└── tests/
    └── test-filter.js     (12가지 테스트)
```

## 📊 코드 규모

| 파일 | 라인 수 |
|------|--------|
| filter.js | ~220 |
| search-enhanced.js | ~180 |
| prompt-builder.js | ~280 |
| test-filter.js | ~380 |
| **합계** | **~1,060** |

## 🏆 1.3 특징

✅ **메타데이터 필터링**
- Repo, Version, Phase, File 단위
- 복합 필터 (AND 조건)
- 버전 범위 필터

✅ **구조적 검색**
- 필터 후 점수 계산
- 필터 가중치 추가
- 다양성 고려

✅ **강화된 프롬프트**
- 버전 인식
- Phase 인식
- 진화 비교
- 멀티 소스

✅ **버전 인지형 엔진**
- 진화 비교 가능
- Phase별 추론
- 추적 가능한 응답

---

**상태**: ✅ 메타데이터 필터링 완성 (1.3)
**철학**: "버전 인식형 기록 추론 엔진"
