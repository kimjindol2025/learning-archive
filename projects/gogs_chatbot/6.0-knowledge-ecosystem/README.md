# 6.0 다중 Repo 통합 & 지식 생태계 모델

**Multi-Repository Knowledge Ecosystem Integration and Cross-Project Concept Transfer Analysis**

> 단일 repo 분석을 넘어서
>
> **여러 저장소를 하나의 사고 생태계로 통합한다**

---

## 📋 핵심 개념

### 문제 정의

5.0까지는:
- **단일 저장소** 내 설계 사고 지도
- **개념 네트워크** 분석

하지만 부족한 것:
- ❌ **다중 저장소** 간 개념 이동
- ❌ **프로젝트 간** 영향력 분석
- ❌ **생태계 건강도** 측정
- ❌ **설계 패턴** 전이 추적

### 해결책: Knowledge Ecosystem Model

**다중 저장소 통합**으로:
- ✅ 여러 gogs 저장소를 단일 생태계로 모델링
- ✅ 개념 전이 경로 추적 및 속도 분석
- ✅ 저장소 간 영향력 계산
- ✅ 설계 패턴 전이 자동 감지
- ✅ 생태계 건강도 평가

---

## 🏗️ 아키텍처

```
다중 Gogs 저장소
├─ repo-1: commits + intents + cognitive map
├─ repo-2: commits + intents + cognitive map
├─ repo-3: commits + intents + cognitive map
└─ repo-N: commits + intents + cognitive map
       ↓
[1] multi-repo-collector.js
    → 메타데이터 정의
    → 전역 데이터 통합
    → 저장소 역할 분류
       ↓
[2] concept-transfer-analyzer.js
    → 개념 전이 감지
    → 전이 속도 분석
    → 영향력 있는 전이 식별
       ↓
[3] ecosystem-analyzer.js
    → 저장소 영향력 점수
    → 생태계 건강도
    → 생태계 성숙도
    → 구조 분석
       ↓
[4] pattern-transfer-detector.js
    → 전이 경로 패턴
    → 개념 궤적 추적
    → 영향 확산 분석
    → 저장소 프로필
       ↓
생태계 인사이트 & 추천
```

---

## 🔧 5개 핵심 모듈

### 1. `multi-repo-collector.js` — 다중 저장소 수집

**목적**: 여러 저장소의 데이터를 하나의 생태계로 통합

#### 주요 함수

```javascript
defineRepositoryMetadata(repos)
// 저장소 메타데이터 정의
// 각 저장소의 타입 자동 분류 (core/theoretical/experimental/application)

aggregateRepositoryData(repoMetadata, allCommits, allIntents, allGraphs)
// 모든 저장소 데이터 통합
// 전역 commit index, concept index 생성
// 개념 원점 추적 (어느 repo에서 처음 나타났는가?)

classifyRepositoryRoles(aggregated)
// 저장소 역할 분류
// 개념 다양성 + commit 밀도 기반
// auxiliary / experimental / core / application / theoretical

calculateGlobalStatistics(aggregated)
// 생태계 전체 통계
// 총 저장소, 총 commit, 고유 개념, 시간폭 계산

calculateCrossRepoConceptSharing(aggregated)
// 저장소 간 개념 공유도
// 각 개념이 몇 개 저장소에서 나타나는가?
```

#### 예시

```javascript
const metadata = collector.defineRepositoryMetadata([
  { name: 'core-lang', type: 'core' },
  { name: 'design-spec', type: 'theoretical' },
  { name: 'test-exp', type: 'experimental' }
]);

const aggregated = collector.aggregateRepositoryData(metadata, commits, intents, graphs);
// {
//   repositories: {...},
//   globalCommits: [...],
//   globalConcepts: Set,
//   conceptOrigins: { concept: [{ repo, timestamp }] },
//   repoIndex: { repo: { commits, intents, cognitiveMap } }
// }

const roles = collector.classifyRepositoryRoles(aggregated);
// {
//   'core-lang': { role: 'core', conceptDiversity: 8, ... },
//   'design-spec': { role: 'theoretical', conceptDiversity: 3, ... }
// }
```

---

### 2. `concept-transfer-analyzer.js` — 개념 전이 분석

**목적**: 저장소 간 개념이 어떻게 이동하는가?

#### 개념 전이의 의미

```
core-lang (2026-01-05)
  ├─ "Type System" 도입
     ↓
design-spec (2026-01-06)
  └─ "Type System" 언급 (Spec 문서에)
     ↓
test-exp (2026-01-08)
  └─ "Type System" 검증
     ↓
app-impl (2026-01-12)
  └─ "Type System" 적용

전이 경로: core → spec → test → app (4일 간격)
```

#### 주요 함수

```javascript
detectConceptTransfers(aggregated, conceptSharing)
// 시간순 개념 이동 감지
// 각 개념이 어떤 repo에서 어디로 이동했는가?

analyzeTransferVelocity(transfers)
// 전이 속도 분석
// 평균 lag 계산
// 빠른 전이 vs 느린 전이 구분

buildTransferNetwork(transfers)
// 전이 네트워크 구축
// 저장소 노드, 개념 전이 경로
// 밀도 매트릭스 (어느 repo 쌍이 많이 교류?)

identifyInfluentialTransfers(transfers, aggregated)
// 영향력 있는 전이 식별
// 점수 = 개념 중요도 × 전이 속도
// 상위 전이만 추출
```

#### 전이 방향 분류

```
experiment_to_core
  실험 저장소 → 핵심 저장소 (학습 → 통합)

core_to_application
  핵심 저장소 → 응용 저장소 (설계 → 구현)

lateral
  같은 계층 간 (이론 ↔ 실험)
```

---

### 3. `ecosystem-analyzer.js` — 생태계 분석

**목적**: 전체 생태계의 건강도와 성숙도 측정

#### 생태계 건강도 (0-1)

| 지표 | 의미 | 계산 |
|------|------|------|
| **다양성** | 저장소 타입 분포 | #types / 5 |
| **안정성** | 개념 공유도 | avg(influence) |
| **성장성** | 빠른 전이 비율 | #fast_transfers / total |
| **연결성** | 저장소 간 연결 밀도 | #edges / max_edges |

#### 생태계 성숙도

- **균형성**: 저장소 간 영향력 분포 균등도
- **집중도**: 개념 분산도 (집중 vs 확산)
- **역할명확성**: 저장소 역할 다양성

#### 주요 함수

```javascript
calculateRepositoryInfluence(aggregated, transfers, sharing)
// 각 저장소의 영향력 점수
// = (개념수 × 전이동학 × 타입가중치)

calculateEcosystemHealth(aggregated, influence, transfers)
// 생태계 전체 건강도

analyzeEcosystemStructure(aggregated, transfers)
// 저장소 분류 + 통신 경로 + 병목 감지

calculateEcosystemMaturity(aggregated, influence, health)
// 생태계 성숙도 평가

generateEcosystemRecommendations(health, maturity, structure)
// 개선 권장사항 생성
```

#### 예시: 생태계 건강도

```javascript
{
  overall: 0.72,           // 전체: 72점
  diversity: 0.80,        // 다양성: 80%
  stability: 0.65,        // 안정성: 65%
  growth: 0.85,           // 성장성: 85%
  connectivity: 0.58,     // 연결성: 58%
  repoCount: 4,
  transferCount: 12,
  conceptCount: 8
}
```

---

### 4. `pattern-transfer-detector.js` — 패턴 전이 감지

**목적**: 개념 전이의 패턴을 분류하고 추적

#### 전이 경로 패턴 (5가지)

```
Linear Chain (선형 체인)
A → B → C → D

Fan-Out (확산)
    ┌─→ B
A ─┼─→ C
    └─→ D

Fan-In (수렴)
    ┌─ A
B ←┼─ C
    └─ D

Cycle (순환)
A ↔ B
↑   ↓
└───┘

Diamond (다이아몬드)
    ┌─ B
A ─┤   ├─ D
    └─ C
```

#### 개념 궤적 추적

```javascript
{
  concept: "Memory Layout",
  path: [
    { from: "core-lang", to: "test-exp" },
    { from: "test-exp", to: "app-impl" }
  ],
  adoptionRate: 0.75,    // 75% 저장소에서 채택
  totalHops: 2
}
```

#### 전이 분류

| 유형 | 속도 | 채택 | 의미 |
|------|------|------|------|
| **Conservative** | 느림 | 낮음 | 신중한 확산 |
| **Progressive** | 중간 | 중간 | 단계적 진화 |
| **Revolutionary** | 빠름 | 높음 | 급격한 도입 |
| **Stagnant** | 없음 | 없음 | 단절된 개념 |

#### 주요 함수

```javascript
identifyTransferPathPatterns(transfers)
// 5가지 전이 경로 패턴 식별

traceConceptTrajectories(transfers, aggregated)
// 개념별 궤적 추적
// 경로 + 타임라인 + 채택률

classifyPatternTransfers(transfers, trajectories)
// 전이 유형 분류 (Conservative/Progressive/Revolutionary/Stagnant)

analyzeInfluenceDiffusion(aggregated, transfers, concepts)
// 영향 확산 분석
// 확산 속도 + 가속도 계산

buildRepositoryInfluenceProfile(transfers, aggregated)
// 저장소별 영향 프로필
// 영향 미치는 저장소 + 영향 받는 저장소
// 지수 = reach × 고유개념 / 평균시간
```

---

## 📊 통합 사용 예시

```javascript
import collector from './multi-repo-collector.js';
import transferAnalyzer from './concept-transfer-analyzer.js';
import ecosystemAnalyzer from './ecosystem-analyzer.js';
import patternDetector from './pattern-transfer-detector.js';

// 1. 메타데이터 정의
const repos = [
  { name: 'core-lang', path: '/core', type: 'core' },
  { name: 'design-spec', path: '/spec', type: 'theoretical' },
  { name: 'test-exp', path: '/test', type: 'experimental' },
  { name: 'app-impl', path: '/app', type: 'application' }
];

const metadata = collector.defineRepositoryMetadata(repos);

// 2. 데이터 통합
const aggregated = collector.aggregateRepositoryData(
  metadata,
  allCommits,
  allIntents,
  allGraphs
);

// 3. 개념 전이 분석
const sharing = collector.calculateCrossRepoConceptSharing(aggregated);
const transfers = transferAnalyzer.detectConceptTransfers(aggregated, sharing);
const influential = transferAnalyzer.identifyInfluentialTransfers(transfers, aggregated);

// 4. 생태계 분석
const influence = ecosystemAnalyzer.calculateRepositoryInfluence(aggregated, transfers, sharing);
const health = ecosystemAnalyzer.calculateEcosystemHealth(aggregated, influence, transfers);
const structure = ecosystemAnalyzer.analyzeEcosystemStructure(aggregated, transfers);

// 5. 패턴 감지
const patterns = patternDetector.identifyTransferPathPatterns(transfers);
const profiles = patternDetector.buildRepositoryInfluenceProfile(transfers, aggregated);

// 결과
console.log(`생태계 건강도: ${(health.overall * 100).toFixed(1)}%`);
console.log(`저장소 수: ${health.repoCount}`);
console.log(`전이 경로: ${health.transferCount}`);
console.log(`고유 개념: ${health.conceptCount}`);
```

---

## 🎯 핵심 메트릭

### 저장소별 메트릭

```javascript
{
  repo: "core-lang",
  score: 0.85,              // 전체 영향력 점수
  outflow: 5,               // 나가는 개념 전이
  inflow: 2,                // 들어오는 개념 전이
  conceptContribution: 8,   // 도입한 고유 개념
  type: "core",
  role: "core"
}
```

### 생태계 건강도 메트릭

```javascript
{
  overall: 0.72,            // 전체 건강도 (0-1)
  diversity: 0.80,          // 저장소 타입 다양성
  stability: 0.65,          // 개념 공유 안정성
  growth: 0.85,             // 새로운 개념 도입 속도
  connectivity: 0.58        // 저장소 간 연결 밀도
}
```

### 생태계 성숙도 메트릭

```javascript
{
  score: 0.68,              // 전체 성숙도 (0-1)
  balance: 0.75,            // 영향력 분포 균등도
  concentration: 0.72,      // 개념 확산도
  roleCertainty: 0.60       // 역할 명확성
}
```

---

## 🚀 다음 논리적 단계

### 현재 (6.0)
- ✅ **다중 저장소** 생태계 모델
- ✅ **개념 전이** 추적 & 분석
- ✅ **패턴 감지** (선형, 확산, 수렴, 순환)

### 향후 (6.1+)
- 📚 **시간축 생태계 진화** (6개월/년 단위 변화)
- 🔗 **분산 Gogs** 간 네트워크 (외부 저장소 연결)
- 🌐 **다중 조직** 지식 그래프 (팀 간 협력 패턴)
- 📊 **비교 분석** (어느 생태계가 더 건강한가?)
- 🎯 **예측 모델** (다음 전이 예측)

---

## 📝 라이선스

MIT

---

**마지막 업데이트**: 2026-02-27
**엔진 철학**: 기록이 증명이다 (Your record is your proof)
**시스템 정체**: 지식 생태계 모델 (Knowledge Ecosystem Model)
