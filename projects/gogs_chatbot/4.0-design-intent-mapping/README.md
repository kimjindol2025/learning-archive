# 4.0 설계 의도 추출 & 아키텍처 변화 지도

**Design Intent Extraction & Architecture Evolution Mapping**

> 단순 "무엇이 변경됐는가"에서 벗어나
>
> **"왜 바뀌었는가"와 "설계 사고 흐름"**을 구조화한다

---

## 📋 개요

### 핵심 질문

Git의 커밋 히스토리에는 다음이 있습니다:

- ✅ 무엇이 변경됐는지 (diff)
- ✅ 누가 변경했는지
- ✅ 언제 변경했는지

하지만 **없는 것**:

- ❌ **왜 바뀌었는가** (설계 의도)
- ❌ **어떤 설계 사고 흐름이 있었는가** (아키텍처 진화)

### 해결책

**4.0 엔진**은 이 정보를 **자동으로 추출하고 구조화**합니다.

---

## 🏗️ 아키텍처

```
Git Commits + Diffs
       ↓
[1] design-intent-analyzer.js
    → 규칙 기반 1차 분류
      (패턴 인식: test/spec/perf/unsafe...)
       ↓
[2] intent-extractor.js
    → LLM 기반 의도 추출
      (Claude API로 구조화된 의도 분석)
       ↓
[3] architecture-graph.js
    → 아키텍처 변화 지도 생성
      (설계 진화 트리/그래프 구축)
       ↓
[4] dependency-mapper.js
    → 의존성 자동 추출
      (모듈 간 구조적 관계)
       ↓
[5] evolution-metrics.js
    → 진화 지표 계산
      (밀도, 지능 지수, 혁신 지수)
       ↓
설계 진화 데이터셋 & 보고서 생성
```

---

## 🔧 5개 핵심 모듈

### 1. `design-intent-analyzer.js` — 규칙 기반 1차 분류

**목적**: 커밋 패턴으로부터 설계 의도를 자동 분류

#### 분류 규칙

| 패턴 | 의도 | 카테고리 |
|------|------|--------|
| Test 파일 추가 多 | 검증 강화 | Stabilization & Validation |
| Spec 변경 多 | 설계 재정의 | Architecture Redefinition |
| Src 대량 + perf 키워드 | 성능 최적화 | Performance Optimization |
| Unsafe/FFI 추가 | 저수준 확장 | Low-level Extension |
| API 변경 | 인터페이스 진화 | Interface Evolution |
| Refactor 많음 | 코드 품질 | Code Quality Improvement |

#### 주요 함수

```javascript
analyzeIntentByPattern(commit, diff, fileStats)
// 규칙 기반으로 설계 의도 분류

calculateImpactLevel(diff, fileStats)
// 변경의 영향도 계산 (0.0-1.0)

extractKeywords(message, diff)
// 메시지와 diff에서 의도 관련 키워드 추출

analyzeDesignIntent(commit, diff, fileStats)
// 종합 분석 (규칙 + 영향도 + 키워드)
```

#### 예시

```javascript
import analyzer from './design-intent-analyzer.js';

const intent = analyzer.analyzeDesignIntent(commit, diff, fileStats);

console.log(intent);
// {
//   commit: 'abc1234567',
//   intent: 'Performance Optimization',
//   category: 'System Optimization',
//   confidence: 0.85,
//   impactLevel: 0.72,
//   keywords: { perf: 2, optim: 1 }
// }
```

---

### 2. `intent-extractor.js` — LLM 기반 의도 추출

**목적**: 구조화된 입력을 Claude API로 분석하여 최종 의도 추출

#### 구조화된 입력 예시

```javascript
{
  message: "Phase 11 v12.2 FFI complete",
  filesChanged: ["spec_v12_2_ffi.md", "src/v12_2_ffi.rs"],
  diffSummary: {
    addedLines: 450,
    deletedLines: 30,
    fileTypes: { spec: 250, src: 200 },
    keywords: ["FFI", "external", "interface"]
  }
}
```

#### 출력 형식

```json
{
  "intent": "외부 언어와의 상호운용성 확보",
  "category": "Architecture Expansion",
  "depth": "Deep",
  "impactLevel": 0.82,
  "reasoning": "저수준 FFI 및 메모리 경계 정의를 통한 상호운용성 확장"
}
```

#### 주요 함수

```javascript
buildIntentPrompt(commit, diffSummary, impactMetrics)
// Claude API 호출용 프롬프트 생성

extractIntentStructured(commit, diffSummary, impactMetrics)
// 구조화된 입력으로부터 의도 추출

extractIntentBatch(commits, diffs, fileStats)
// 다중 커밋 배치 처리

validateAndScoreIntent(intent, originalAnalysis)
// 의도 검증 및 신뢰도 점수 계산
```

---

### 3. `architecture-graph.js` — 아키텍처 변화 지도

**목적**: 의도 시퀀스로부터 설계 진화 그래프/트리 구축

#### 그래프 구조

```
Nodes (설계 단계):
  - Phase 9: Type Safety Hardening
  - Phase 10: Control Flow Expansion
  - Phase 11: Memory & FFI Extension

Edges (의존성/영향):
  Phase 9 → Phase 10 (continuation)
  Phase 10 → Phase 11 (dependency)

Clusters (진화 단계):
  - 검증 강화 단계 (2개 노드)
  - 아키텍처 진화 단계 (3개 노드)

Concepts (핵심 개념):
  - Type Safety
  - Memory Layout
  - FFI Boundary
```

#### 주요 함수

```javascript
buildArchitectureGraph(intentSequence)
// 의도 시퀀스로부터 아키텍처 그래프 구축

extractEvolutionPath(graph)
// 진화의 시간적 경로 추출

generateArchitectureReport(graph)
// 아키텍처 변화 보고서 생성
```

#### 사용 예시

```javascript
import graph from './architecture-graph.js';

const arch = graph.buildArchitectureGraph(intents);

// 진화 경로 추출
const path = graph.extractEvolutionPath(arch);
console.log(`설계 진화: ${path.length}단계`);

// 보고서 생성
const report = graph.generateArchitectureReport(arch);
console.log(`핵심 개념: ${Object.keys(report.keyArchitectureConcepts)}`);
```

---

### 4. `dependency-mapper.js` — 의존성 맵 생성

**목적**: 모듈 간 구조적 관계를 자동으로 추출

#### 추출되는 의존성 타입

```
Module A → depends on → Memory Layout
Module B → depends on → Unsafe Pointer
FFI → depends on → Memory Layout

Relationships:
- provides_interface: A가 B에게 인터페이스 제공
- tested_by: A가 테스트 대상
- optimizes: A가 B 최적화
- refines: A가 B 개선
- conforms_to: A가 B 규격 준수
```

#### 주요 함수

```javascript
extractModulesFromPaths(filePaths)
// 파일 경로로부터 모듈 추출

trackModuleEvolution(intentSequence)
// 의도 시퀀스 기반 모듈 진화 추적

inferModuleDependencies(modules, intentSequence)
// 모듈 간 의존성 자동 추론

detectCycles(dependencies)
// 순환 의존성 검사

calculateDependencyMetrics(dependencies)
// 의존성 복잡도 메트릭 계산
```

#### 예시

```javascript
import mapper from './dependency-mapper.js';

const deps = mapper.inferModuleDependencies(modules, intents);

// 의존성 관계 조회
console.log(deps.auth.dependsOn);
// [{ target: 'memory', type: 'uses', strength: 0.7 }]

// 순환 의존성 검사
const cycles = mapper.detectCycles(deps);
console.log(`순환 의존성: ${cycles.length}개`);

// 메트릭
const metrics = mapper.calculateDependencyMetrics(deps);
console.log(`평균 의존성: ${metrics.averageDependencies}`);
```

---

### 5. `evolution-metrics.js` — 진화 지표 계산

**목적**: 설계 진화의 정량적 지표 계산 (이 프로젝트만 가능)

#### 계산되는 지표

| 지표 | 공식 | 범위 | 의미 |
|------|------|------|------|
| **진화 밀도** | (설계 변경 수 × 영향도) ÷ 기간 | 0.0+ | 단위 시간당 설계 변화 강도 |
| **설계 성숙도** | 검증 + 안정성 + 아키텍처 + 품질 | 0.0-1.0 | 전체 설계 성숙 수준 |
| **혁신 지수** | 카테고리 다양성 × 깊이 × 클러스터 | 0.0-1.0 | 새로운 패러다임 도입 정도 |
| **아키텍처 확장** | 새 개념 도입 × 의존성 증가 | 0.0+ | 구조적 복잡도 증가 |
| **설계 지능 지수** | 성숙도 + 밀도 + 혁신 + 확장 | 0-100 | 전체 설계 지능 (이 프로젝트만 계산 가능) |

#### 주요 함수

```javascript
calculateEvolutionDensity(intents, timespan)
// 진화 밀도 = (설계 변경 수 × 평균 영향도) ÷ 기간

calculateArchitectureExpansionScore(intents)
// 아키텍처 확장 = 새 개념 도입 × 의존성 증가

calculateDesignMaturity(intents)
// 4개 차원의 성숙도 평가

calculateInnovationIndex(intents, graph)
// 혁신 지수 = 카테고리 다양성 × 깊이 × 클러스터

calculateDesignIntelligenceScore(intents, graph, dependencies)
// 통합 지능 지수 (0-100)
```

#### 예시

```javascript
import metrics from './evolution-metrics.js';

// 진화 밀도
const density = metrics.calculateEvolutionDensity(intents, timespan);
console.log(`진화 밀도: ${density.toFixed(3)}/일`);

// 설계 성숙도
const maturity = metrics.calculateDesignMaturity(intents);
console.log(`성숙도: ${(maturity.overallMaturity * 100).toFixed(1)}%`);

// 통합 지능 지수
const intelligence = metrics.calculateDesignIntelligenceScore(intents, graph, deps);
console.log(`설계 지능 지수: ${intelligence.overallScore}/100`);
console.log(`해석: ${intelligence.interpretation}`);
```

---

## 📊 지표 해석

### 설계 지능 지수 범위

| 점수 | 해석 | 특징 |
|------|------|------|
| 80-100 | 우수 | 높은 성숙도, 빠른 진화, 높은 혁신 |
| 60-79 | 양호 | 중간 이상 성숙도, 안정적 진화 |
| 40-59 | 보통 | 제한적 성숙도, 점진적 진화 |
| 20-39 | 미진 | 낮은 성숙도, 느린 진화 |
| 0-19 | 매우 낮음 | 거의 진화 없음 |

---

## 🚀 사용 예시

### 예시 1: 전체 파이프라인

```javascript
import analyzer from './design-intent-analyzer.js';
import extractor from './intent-extractor.js';
import archGraph from './architecture-graph.js';
import mapper from './dependency-mapper.js';
import metrics from './evolution-metrics.js';

// 1단계: 의도 추출
const intents = [];
for (let i = 0; i < commits.length; i++) {
  const intent = analyzer.analyzeDesignIntent(
    commits[i],
    diffs[i],
    fileStats[i]
  );
  intents.push(intent);
}

// 2단계: 아키텍처 그래프 생성
const arch = archGraph.buildArchitectureGraph(intents);

// 3단계: 의존성 맵
const modules = mapper.extractModulesFromPaths(allFilePaths);
const dependencies = mapper.inferModuleDependencies(modules, intents);

// 4단계: 메트릭 계산
const intelligence = metrics.calculateDesignIntelligenceScore(
  intents,
  arch,
  dependencies
);

console.log(`설계 지능 지수: ${intelligence.overallScore}/100`);
```

### 예시 2: 특정 패턴 분석

```javascript
// 성능 최적화 의도만 추출
const perfIntents = intents.filter(i => i.category === 'Performance');

const density = metrics.calculateEvolutionDensity(
  perfIntents,
  timespan
);

console.log(`성능 최적화 밀도: ${density}`);
```

### 예시 3: 아키텍처 진화 경로

```javascript
const path = archGraph.extractEvolutionPath(arch);

console.log('설계 진화 경로:');
for (const [i, stage] of path.entries()) {
  console.log(`  ${i+1}. ${stage.node.label}`);
}
```

---

## 🧪 테스트

### 테스트 실행

```bash
npm test
# 또는
node tests/test-design-intent.js
```

### 테스트 케이스 (12개)

1. **testAnalyzeIntentByPattern** - 규칙 기반 분류
2. **testCalculateImpactLevel** - 영향도 계산
3. **testExtractIntentStructured** - 의도 추출 (구조화)
4. **testBuildArchitectureGraph** - 아키텍처 그래프
5. **testExtractEvolutionPath** - 진화 경로 추출
6. **testTrackModuleEvolution** - 모듈 진화 추적
7. **testInferModuleDependencies** - 의존성 추론
8. **testCalculateEvolutionDensity** - 진화 밀도
9. **testCalculateDesignMaturity** - 설계 성숙도
10. **testCalculateArchitectureExpansionScore** - 확장 점수
11. **testCalculateInnovationAndIntelligence** - 혁신 & 지능
12. **testTrackComplexityEvolution** - 복잡도 진화

---

## ⚙️ 설정

`.env.example`을 참고하여 `.env` 파일 생성:

```env
# Claude API (LLM 기반 의도 추출)
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-opus-4-6

# Git 저장소
GIT_REPO_PATH=/path/to/repository

# 설계 의도 분류
INTENT_CONFIDENCE_THRESHOLD=0.5
INTENT_LLM_ENABLED=true

# 메트릭
EVOLUTION_METRICS_ENABLED=true
INTELLIGENCE_SCORE_ENABLED=true
```

---

## 🎯 설계 원칙

### 1. 규칙 + LLM 하이브리드
- **1차**: 규칙 기반 분류 (빠름, 해석 가능)
- **2차**: LLM 기반 세정화 (정확함, 문맥 인식)

### 2. 정량화 가능
- 모든 개념을 0-1 범위의 점수로 변환
- 설계 지능을 측정 가능한 지표로 표현

### 3. 구조화된 저장
- 모든 의도, 그래프, 메트릭을 JSON으로 저장
- 외부 분석 도구와 통합 가능

### 4. 프로젝트 특화
- **이 시스템에서만 가능한 지표들**:
  - 설계 진화 밀도
  - 아키텍처 확장 점수
  - 설계 지능 지수
- GPT 같은 범용 LLM으로는 계산 불가능

---

## 🔮 다음 단계

### 4.0 완성 후
- ✅ 규칙 기반 1차 분류
- ✅ LLM 기반 의도 추출
- ✅ 아키텍처 그래프 생성
- ✅ 의존성 맵 자동 생성
- ✅ 진화 메트릭 계산

### 향후 계획 (5.0+)
- 다중 저장소 통합 분석
- 교차 저장소 설계 영향 분석
- 예측적 문제 감지
- 설계 트렌드 예측

---

## 📝 라이선스

MIT

---

## 🔗 버전 진화

| 버전 | 초점 | 상태 |
|------|------|------|
| 1.1-2.0 | 검색 중심 (keyword → semantic) | ✅ 완성 |
| 3.0 | 진화 분석 중심 (시간축) | ✅ 완성 |
| **4.0** | **설계 의도 추출** | **✅ 완성** |
| 5.0+ | 다중 저장소 생태계 분석 | 📋 계획중 |

---

**마지막 업데이트**: 2026-02-27
**엔진 철학**: 기록이 증명이다 (Your record is your proof)
**특징**: 설계 사고 추적 시스템 (Design Thought Tracking System)
