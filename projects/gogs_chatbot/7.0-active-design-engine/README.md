# 7.0 능동적 설계 보조 시스템 (Active Design Engine)

**Proactive Design Advisory System with Structural Warnings and Evolution Prediction**

> 분석을 넘어서
>
> **시스템이 설계 방향을 제안한다**

---

## 📋 핵심 개념

### 문제 정의

6.0까지는:
- **수동 분석** (과거 데이터 분석)
- **사후 보고** (결과 리포팅)

하지만 필요한 것:
- ❌ **능동적 경고** (위험 감지 전에 알기)
- ❌ **미래 예측** (다음 단계 예상)
- ❌ **실시간 제안** (즉시 조언)
- ❌ **설계 동반자** (대화식 조언)

### 해결책: Active Design Engine

**능동적 분석과 제안**으로:
- ✅ 구조 복잡도 경고 (자동 감지)
- ✅ 설계 균형 분석 (코드/테스트/문서)
- ✅ 과거 패턴 기반 제안
- ✅ 진화 예측 모델 (다음 단계 예측)
- ✅ 설계 파트너 역할 (대화식 조언)

---

## 🏗️ 아키텍처

```
분석 데이터 (5.0-6.0 출력)
├─ Concept Graph + Centrality
├─ Dependency Graph
├─ Phase History + Timeline
└─ Change Ratios
       ↓
[1] warning-detector.js
    → Centrality 급상승 감지
    → 의존성 과집중 감지
    → 테스트 증가율 감소 감지
    → 노드 고립 감지
    → 구조 급변 감지
    → 순환 의존성 감지
       ↓
[2] balance-calculator.js
    → 변경 비율 계산
    → 균형 지수 계산
    → 단계별 균형 추이
    → 불균형 점수 & 권장사항
       ↓
[3] pattern-recommender.js
    → 이전 진화 패턴 추출
    → 현재와 패턴 비교
    → 패턴 유사도 계산
    → 다음 단계 제안
       ↓
[4] evolution-predictor.js
    → 개념 확장 속도 분석
    → 테스트 추세 분석
    → 선형 회귀로 예측
    → 위험/기회 식별
       ↓
[5] design-advisor.js
    → 모든 분석 통합
    → 우선순위 액션 아이템
    → 설계 파트너 대화
    → 지혜와 통찰 제공
       ↓
능동적 설계 제안 & 조언
```

---

## 🔧 5개 핵심 모듈

### 1. `warning-detector.js` — 구조 경고 시스템

**목적**: 위험한 설계 상태를 자동으로 감지

#### 감지 유형

| 경고 | 의미 | 예시 |
|------|------|------|
| **Centrality Spike** | 중심성 급상승 | Memory가 0.5 → 0.9 |
| **Dependency Congestion** | 의존성 과집중 | 5개 모듈이 Memory에 의존 |
| **Test Slowdown** | 테스트 증가율 감소 | 이전 +20% → 현재 +5% |
| **Isolated Nodes** | 고립된 개념 | Boundary인데 연결 1개 미만 |
| **Structural Shift** | 급격한 구조 변화 | 노드 10개 → 20개 |
| **Circular Dependency** | 순환 의존성 | A → B → C → A |

#### 주요 함수

```javascript
detectCentralitySpike(current, previous, threshold)
// 중심성 급상승 감지
// 변화율이 임계값 초과 시 경고

detectDependencyCongestion(dependencyGraph, threshold)
// 한 모듈에 과도한 의존성 집중

detectTestGrowthSlowdown(commits, testHistory, window)
// 최근 테스트 증가율 급감

detectIsolatedNodes(conceptGraph, roles)
// 고립된 경계 개념

detectStructuralShift(graphTimeline, threshold)
// 노드/엣지/밀도의 급변

detectCircularDependencies(dependencyGraph)
// 순환 의존성 감지 (DFS)
```

#### 심각도

```
CRITICAL: 즉시 해결 필요
HIGH:     다음 단계에서 집중
MEDIUM:   주의 요함
LOW:      참고
```

---

### 2. `balance-calculator.js` — 설계 균형 점수

**목적**: 코드/테스트/문서의 균형 평가

#### 균형 지수 (Balance Index)

```
지수 = (테스트 + 문서) / 코드

이상적: 0.5 (코드:테스트+문서 = 2:1)
균형: 0.4 ~ 0.6
부족: < 0.2 (심각한 불균형)
과다: > 0.6 (테스트/문서 과다)
```

#### 주요 함수

```javascript
calculateChangeRatios(commits)
// 파일 타입별 변경 비율
// 코드/테스트/문서/설정/기타

calculateBalanceIndex(ratios)
// 지수 = (test + doc) / code
// 이상적 값과 비교

analyzeBalanceTrend(phaseCommits)
// 단계별 균형 추이
// 개선/악화 추세 파악

assessImbalance(ratios, balance)
// 문제점 식별
// 권장사항 생성
```

#### 균형 상태

```
OVER_TESTING:         테스트/문서 과다 (지수 > 0.6)
BALANCED:             균형잡힘 (지수 0.4-0.6)
UNDER_TESTING:        테스트/문서 부족 (지수 0.2-0.4)
SEVERELY_IMBALANCED:  심각한 불균형 (지수 < 0.2)
```

---

### 3. `pattern-recommender.js` — 패턴 기반 제안

**목적**: 과거 진화 패턴으로부터 다음 단계 추천

#### 패턴 매칭

```javascript
extractEvolutionPatterns(phaseHistories)
// Phase 1→2→3... 진화 패턴 추출
// 개념 추가/제거, 중심성 변화, 시간 간격

compareWithPatterns(currentPhase, patterns)
// 현재 상태를 과거 패턴과 비교
// 유사도 점수 계산 (0-1)

generateRecommendations(current, matches, assessment)
// 유사한 패턴 기반 제안
// 다음 단계 예상
```

#### 제안 유형

```
CONCEPT_PROGRESSION:    "다음 개념 도입 예상"
TEST_REINFORCEMENT:     "테스트 강화 필요"
REFACTORING_SUGGESTED:  "리팩토링 권장"
DOCUMENTATION_NEEDED:   "문서화 필요"
```

#### 예시

```
과거: Unsafe 도입 → 테스트 확장 → FFI 연결
현재: RawPointer 도입 (테스트 증가 없음)

제안: "RawPointer 이후 테스트 강화가 필요할 가능성 높음"
신뢰도: 82%
```

---

### 4. `evolution-predictor.js` — 진화 예측

**목적**: 시간 시계열 분석으로 다음 단계 예측

#### 예측 방법

| 기법 | 설명 | 신뢰도 |
|------|------|--------|
| **선형 회귀** | 개념 수/테스트 추세 | 낮음 (초기) → 높음 (안정화) |
| **이동 평균** | 노이즈 제거 | 75% |
| **가속도** | 추세 변화 속도 | 60% |

#### 주요 함수

```javascript
analyzeConceptGrowth(phaseTimeline)
// 개념 수 추세 분석
// 성장률, 가속도, 궤적 분류

analyzeTestCoverageTrend(phaseTimeline)
// 테스트 커버리지 추세
// 개선/악화 추세

predictNextValues(values, steps)
// 선형 회귀로 다음 3단계 예측
// 신뢰도와 함께

predictNextEvolutionPhase(growth, testTrend, ...)
// 통합 예측
// 위험 & 기회 식별
```

#### 예측 결과

```javascript
{
  expectedConceptCount: 7,           // 예상 개념 수
  expectedTestCoverage: 0.65,        // 예상 테스트율
  conceptGrowthTrend: 'STEADY_GROWTH',
  testImprovementTrend: 'IMPROVING',
  predictedFocus: ['구조 확장', '검증 강화'],
  risks: [{type, severity, description}],
  opportunities: [{type, description}],
  confidence: 0.78
}
```

---

### 5. `design-advisor.js` — 설계 파트너

**목적**: 모든 분석을 통합하여 능동적 조언 제공

#### 조언 구조

```javascript
{
  sections: [
    { title: '⚠️  구조 위험 경고', items: [...] },
    { title: '⚖️  설계 균형 분석', items: [...] },
    { title: '💡 설계 패턴 기반 제안', items: [...] },
    { title: '🔮 진화 예측', items: [...] },
    { title: '🌍 생태계 맥락', items: [...] }
  ],
  actionItems: [{priority, type, action}],
  priority: {
    P0: [...],  // 긴급 (1-2개)
    P1: [...],  // 높음 (2-3개)
    P2: [...]   // 중간 (3-5개)
  }
}
```

#### 대화체 메시지

```
🤝 설계 진화 동반 지능
==================================================

📊 현재 상황 평가: HIGH

⚠️  구조 위험 경고
   Memory Module이 과도한 중심화 상태입니다.
   ...

⚖️  설계 균형 분석
   균형 지수: 0.18 (이상적: 0.50)
   상태: UNDER_TESTING
   → 테스트 작성 강화 필요
   → 문서화 개선 필요

💡 설계 패턴 기반 제안
   매칭 패턴: Phase 3 → Phase 4
   신뢰도: 78%
   예상 변화: "Type System 도입"

🎯 우선 조치 사항
   [긴급] 순환 의존성 제거
   [높음] 테스트 커버리지 80% 달성

💭 설계 파트너의 조언:
   현재 구조가 매우 위험한 상태입니다.
   즉시 개선이 필요합니다.

==================================================
```

---

## 📊 통합 사용 예시

```javascript
import warningDetector from './warning-detector.js';
import balanceCalculator from './balance-calculator.js';
import patternRecommender from './pattern-recommender.js';
import evolutionPredictor from './evolution-predictor.js';
import designAdvisor from './design-advisor.js';

// 1. 경고 감지
const warnings = warningDetector.detectCentralitySpike(
  currentRoles, previousRoles, 0.3
);

// 2. 균형 분석
const ratios = balanceCalculator.calculateChangeRatios(commits);
const balance = balanceCalculator.calculateBalanceIndex(ratios);

// 3. 패턴 비교
const patterns = patternRecommender.extractEvolutionPatterns(phaseTimeline);
const matches = patternRecommender.compareWithPatterns(currentPhase, patterns);

// 4. 진화 예측
const growth = evolutionPredictor.analyzeConceptGrowth(phaseTimeline);
const testTrend = evolutionPredictor.analyzeTestCoverageTrend(phaseTimeline);
const prediction = evolutionPredictor.predictNextEvolutionPhase(
  growth, testTrend, commitHistory, densityHistory
);

// 5. 설계 조언 생성
const advice = designAdvisor.generateDesignAdvice(
  warnings,
  balance,
  matches,
  prediction,
  ecosystemHealth,
  currentPhase
);

// 6. 대화체 메시지 생성
const message = designAdvisor.generateAdvisoryMessage(advice);
console.log(message);
```

---

## 🎯 핵심 철학

### 단순한 챗봇이 아니다 ❌

**GPT**:
- 일반 지식 기반 확률 모델
- 샘플링 기반 출력
- 재현성 낮음 (~80%)

**이 엔진**:
- **특정 프로젝트** 구조 기반
- **결정론적** 분석 (규칙 기반)
- **100% 재현성**
- **근거 기반** (모든 제안이 데이터 기반)

### 이것은 ✅

- 📊 **설계 진화 분석 플랫폼**
- 🧠 **구조적 사고 동반자**
- 📚 **프로젝트 메타 엔진**
- 🎯 **설계 지능 측정 시스템**

---

## 🌟 차이점: 수동 → 능동

### 이전 (1.0-6.0)

```
개발자: "이전에 뭐했더라?"
시스템: "Phase 1-2를 봤더니... (분석 리포트)"
→ 개발자가 판단하고 결정
```

### 지금 (7.0)

```
시스템: "⚠️  Memory 모듈 중심화 주의!
        테스트 강화 권장.
        다음은 Type-Memory 통합이 자연스러울 듯."
개발자: (반영하거나 피드백)
→ 시스템이 제안하고 개발자가 선택
```

---

## 🚀 다음 논리적 단계

### 현재 (7.0)
- ✅ 구조 경고 시스템
- ✅ 설계 균형 분석
- ✅ 패턴 기반 제안
- ✅ 진화 예측
- ✅ 설계 파트너 역할

### 향후 (7.1+)
- 📊 **자기 피드백 루프** (제안의 정확도 추적)
- 🔄 **설계 스타일 학습** (프로젝트별 진화 패턴 커스터마이징)
- 🌐 **크로스 프로젝트 비교** (어느 생태계가 더 건강한가?)
- 🎯 **장기 안정성 예측** (5년 후 구조는?)
- 🤖 **자가 개선 모델** (피드백으로 제안 정확도 향상)

---

## 📝 라이선스

MIT

---

**마지막 업데이트**: 2026-02-27
**엔진 철학**: 기록이 증명이다 (Your record is your proof)
**시스템 정체**: 설계 진화 동반 지능 (Design Evolution Companion Intelligence)
