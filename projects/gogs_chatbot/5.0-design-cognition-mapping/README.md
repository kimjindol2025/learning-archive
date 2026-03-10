# 5.0 설계 사고 지도 (Design Cognition Map)

**Automatic Generation of Design Cognition Maps from Project Evolution**

> Commit 단위 분석을 넘어서
>
> **프로젝트 전체의 사고 구조를 지도화한다**

---

## 📋 핵심 개념

### 문제 정의

지금까지의 3.0-4.0은:
- **개별 변경점 분석** (Why changed? → Design Intent)
- **진화 추적** (When changed? → Timeline)

하지만 부족한 것:
- ❌ **전체 사고 구조** (How thoughts are interconnected?)
- ❌ **개념 네트워크** (What are the core concepts?)
- ❌ **구조적 중심** (Where is the core axis?)

### 해결책: Design Cognition Map

**개념 네트워크 모델링**으로:
- ✅ 프로젝트 전체의 사고 흐름을 지도화
- ✅ 개념 간 관계를 정량화
- ✅ 구조적 중심과 확장을 가시화
- ✅ 사고 진화 패턴을 자동 감지

---

## 🏗️ 아키텍처

```
Git + Design Intents + Dependencies
       ↓
[1] concept-extractor.js
    → 모든 소스에서 개념 추출
      (명사, 기술 용어, 도메인 키워드)
       ↓
[2] concept-graph-builder.js
    → 개념 그래프 구축
      (4가지 연결 규칙 적용)
       ↓
[3] centrality-analyzer.js
    → 중심성 계산 (Degree/Betweenness/PageRank)
    → 역할 분류 (Core/Expansion/Boundary)
       ↓
[4] cognition-mapper.js
    → 설계 사고 지도 생성
    → 2D 배치 및 시각화
       ↓
[5] pattern-analyzer.js
    → 사고 확장 패턴 분석
    → 단계별 진화 추적
       ↓
설계 사고 모델 & 인사이트 생성
```

---

## 🔧 5개 핵심 모듈

### 1. `concept-extractor.js` — 개념 추출

**목적**: 모든 소스로부터 핵심 개념 자동 추출

#### 추출 대상

| 원천 | 개념 | 예시 |
|------|------|------|
| Commit 메시지 | 기술 용어 | "Unsafe", "FFI", "Type System" |
| 파일 경로 | 도메인 개념 | "memory", "type", "control" |
| Design Intents | 설계 의도 | "메모리 최적화", "타입 안정성" |
| Diff 내용 | 주요 변경 | 성능, 안전성, 구조 |

#### 개념 카테고리

```javascript
{
  memory: ['memory', 'heap', 'stack', 'allocation'],
  unsafe: ['unsafe', 'raw', 'bounds'],
  type: ['type', 'generic', 'trait'],
  control: ['control', 'branch', 'loop'],
  interop: ['ffi', 'extern', 'binding'],
  performance: ['perf', 'optim', 'fast'],
  testing: ['test', 'verify', 'spec'],
  // ... 총 10개 카테고리
}
```

#### 주요 함수

```javascript
extractAllConcepts(commits, diffs, intents)
// 모든 소스로부터 통합 개념 추출
// 반환: 가중치 순 정렬된 개념 배열

extractConceptsFromCommit(commit)
extractConceptsFromDiff(diff, diffContent)
extractConceptsFromFilePath(filePath)

generateConceptTimeline(concepts)
// 개념의 등장 시간선 생성
```

#### 예시

```javascript
import extractor from './concept-extractor.js';

const concepts = extractor.extractAllConcepts(commits, diffs, intents);

console.log(concepts);
// [
//   { concept: 'Memory Layout', weight: 0.91, frequency: 12, ... },
//   { concept: 'Unsafe Pointer', weight: 0.83, frequency: 8, ... },
//   { concept: 'Type System', weight: 0.78, frequency: 10, ... }
// ]
```

---

### 2. `concept-graph-builder.js` — 개념 그래프 구축

**목적**: 개념을 노드로, 관계를 엣지로 하는 네트워크 생성

#### 연결 규칙 (4가지)

| 규칙 | 강도 | 예시 |
|------|------|------|
| **같은 commit** | 0.8 | "memory" + "unsafe" 함께 언급 |
| **같은 파일** | 0.7 | 파일명에서 추출된 개념들 |
| **설계 의도 시퀀스** | 0.65 | 의도 텍스트의 개념 순서 |
| **의존성** | 0.75 | 모듈 간 의존성으로부터 |

#### 그래프 구조

```json
{
  "nodes": [
    { "id": "Memory Layout", "weight": 0.91 },
    { "id": "Unsafe Pointer", "weight": 0.83 }
  ],
  "edges": [
    { "from": "Unsafe Pointer", "to": "Memory Layout", "strength": 0.72, "type": "co-occurrence" }
  ]
}
```

#### 주요 함수

```javascript
buildConceptGraph(commits, diffs, intents)
// 개념 그래프 구축

calculateGraphDensity(graph)
// 그래프 밀도 = 실제 엣지 / 최대 가능 엣지

identifyConnectedComponents(graph)
// 그래프의 연결 요소 식별 (서브그래프)

identifyCoreConcepts(graph)
// 가장 많이 연결된 개념 추출
```

---

### 3. `centrality-analyzer.js` — 중심성 분석

**목적**: 그래프 알고리즘으로 개념의 중요도 계산

#### 계산되는 중심성

| 지표 | 의미 | 공식 |
|------|------|------|
| **Degree Centrality** | 직접 연결된 개념 수 | degree(v) / (n-1) |
| **Betweenness** | 최단 경로상 중간 위치 | 경로(s,t)에서 v 통과 비율 |
| **PageRank** | 네트워크 영향력 | rank(v) = (1-d)/n + d·Σ(rank(u)/deg(u)) |

#### 개념 역할 분류

```
Core (핵심)
├─ 높은 PageRank (> 0.06)
└─ 높은 Degree (> 0.6)
   예: Memory Layout, Type System

Expansion (확장)
├─ 중간 PageRank (0.01-0.06)
└─ 중간 Degree (0.3-0.6)
   예: Unsafe Pointer, FFI

Boundary (경계)
├─ 낮은 PageRank (< 0.01)
└─ 낮은 Degree (< 0.3)
   예: Testing, Documentation
```

#### 아키텍처 계층

```
    [Core Layer]
    Memory Layout
        ↑
        │
    [Expansion Layer]
    Unsafe ← FFI
        ↑
        │
    [Boundary Layer]
    Testing, Documentation
```

#### 주요 함수

```javascript
calculateDegreeCentrality(graph)
calculateBetweennessCentrality(graph)
calculatePageRank(graph, iterations = 10)

classifyConceptRoles(graph, degree, pagerank)
// Core/Hub/Expansion/Boundary/Peripheral 분류

generateArchitectureLayers(graph, roles)
// 3단계 계층 구조 생성

calculateCentralityMetrics(graph, roles)
// 중심성 메트릭 종합 계산
```

---

### 4. `cognition-mapper.js` — 사고 지도 생성

**목적**: 개념 그래프를 시각화 가능한 지도로 변환

#### 지도 구조

```javascript
{
  structure: {
    coreLayer: ['Memory Layout', 'Type System'],
    expansionLayer: ['Unsafe Pointer', 'FFI'],
    boundaryLayer: ['Testing', 'Documentation']
  },
  nodes: [
    {
      id: 'Memory Layout',
      role: 'core',
      layer: 'core',
      x: 250,  // 2D 좌표
      y: 100
    }
  ],
  edges: [
    {
      from: 'Unsafe',
      to: 'Memory Layout',
      relationship: 'expansion-core'
    }
  ]
}
```

#### 관계 유형

| 관계 | 의미 |
|------|------|
| `core-core` | 핵심 개념 간 강한 연결 |
| `core-expansion` | 핵심이 확장을 지원 |
| `core-boundary` | 핵심이 경계를 정의 |
| `expansion-expansion` | 확장 영역 간 협력 |
| `boundary-core` | 경계가 핵심을 보호 |

#### 주요 함수

```javascript
generateCognitionMap(graph, roles, layers)
// 최종 사고 지도 생성

generateCognitionInsights(map)
// 구조적 통찰 추출

summarizeCognitionMap(map)
// 지도의 정량적 요약
```

---

### 5. `pattern-analyzer.js` — 사고 확장 패턴

**목적**: 시간축과 결합하여 사고 진화 패턴 분석

#### 분석 내용

| 분석 | 내용 | 의미 |
|------|------|------|
| **Phase Evolution** | 단계별 개념 변화 | Phase 8→9→11의 사고 이동 |
| **Cognition Shift** | 단계 간 개념 추가/제거 | 새로운 개념 도입 vs 폐기 |
| **Concept Diffusion** | 개념의 확산 속도 | 채택률, 영향도, 안정성 |
| **Structural Evolution** | 구조 복잡도 변화 | 노드/엣지 증가 추세 |

#### 감지되는 패턴

```javascript
{
  coreStabilization: true,    // 핵심 개념 안정화
  peripheralExpansion: true,  // 주변 개념 확장
  conceptMerge: false,        // 개념 통합
  conceptDivergence: false,   // 개념 분화
  cyclicDependency: false     // 순환 의존성
}
```

#### 예시: Phase별 사고 이동

```
Phase 8 (Control Flow 중심)
├─ Control Flow
└─ Testing

Phase 9 (Type System 강화)
├─ Type System (신규)
├─ Control Flow
└─ Testing

Phase 11 (Memory 중심으로 이동)
├─ Memory Layout (신규, 핵심으로 승격)
├─ Type System
├─ Unsafe (신규)
└─ FFI (신규)
```

---

## 🧠 시스템의 정체성

### 단순 챗봇이 아니다 ❌

**GPT와의 근본적인 차이**:

| 특성 | 5.0 엔진 | GPT |
|------|---------|-----|
| 데이터 형식 | 구조화된 그래프 | 압축된 확률 분포 |
| 작동 방식 | 결정론적 (규칙 기반) | 확률론적 (샘플링) |
| 재현성 | 100% (같은 입력 = 같은 출력) | ~80% (확률적 변동) |
| 설명 가능성 | 매우 높음 (경로 추적 가능) | 낮음 (블랙박스) |
| 학습 능력 | 규칙 기반만 (진화 패턴 감지) | 가능하지만 비효율적 |

### 이것은 ✅

- 📊 **설계 진화 분석 플랫폼**
- 🧠 **기록 기반 사고 추적 시스템**
- 📚 **언어 설계 메타 엔진**
- 🎯 **설계 지능 측정 시스템**

---

## 📊 사용 예시

### 예시 1: 전체 지도 생성

```javascript
import extractor from './concept-extractor.js';
import builder from './concept-graph-builder.js';
import analyzer from './centrality-analyzer.js';
import mapper from './cognition-mapper.js';

// 1. 개념 추출
const concepts = extractor.extractAllConcepts(commits, diffs, intents);

// 2. 그래프 구축
const graph = builder.buildConceptGraph(commits, diffs, intents);

// 3. 중심성 분석
const degree = analyzer.calculateDegreeCentrality(graph);
const pagerank = analyzer.calculatePageRank(graph);
const roles = analyzer.classifyConceptRoles(graph, degree, pagerank);
const layers = analyzer.generateArchitectureLayers(graph, roles);

// 4. 지도 생성
const map = mapper.generateCognitionMap(graph, roles, layers);
const summary = mapper.summarizeCognitionMap(map);

console.log(`설계 사고 지도: ${summary.totalConcepts}개 개념`);
console.log(`핵심 개념: ${summary.coreConceptCount}개`);
console.log(`구조 안정성: ${(summary.structuralStability * 100).toFixed(1)}%`);
```

### 예시 2: 사고 진화 추적

```javascript
import pattern from './pattern-analyzer.js';

// 단계별 사고 진화
const phaseMaps = pattern.generatePhaseEvolutionMaps(commits, []);
const shifts = pattern.analyzeCognitionShift(phaseMaps);

for (const shift of shifts) {
  console.log(`${shift.from} → ${shift.to}:`);
  console.log(`  새로운 개념: ${shift.introduced}`);
  console.log(`  제거된 개념: ${shift.removed}`);
}
```

### 예시 3: 패턴 감지

```javascript
const patterns = pattern.detectDesignPatterns(map, intents);

if (patterns.coreStabilization) {
  console.log('✓ 핵심 개념이 안정화됨');
}
if (patterns.peripheralExpansion) {
  console.log('✓ 주변 개념이 확장되는 중');
}
```

---

## 🚀 다음 논리적 단계

### 현재 (5.0)
- ✅ **단일 저장소** 설계 사고 지도

### 향후 (5.1+)
- 📚 **다중 저장소** 통합 분석
- 🔗 **프로젝트 간** 사고 교차 분석
- 🌐 **분산 Gogs** 간 지성 네트워크
- 📈 **진화 속도** 비교
- 🎯 **설계 패턴** 자동 발견

---

## 📝 라이선스

MIT

---

**마지막 업데이트**: 2026-02-27
**엔진 철학**: 기록이 증명이다 (Your record is your proof)
**시스템 정체**: 설계 사고 모델 (Design Thinking Model)
