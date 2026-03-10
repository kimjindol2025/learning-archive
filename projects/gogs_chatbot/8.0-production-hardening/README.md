# 8.0 운영 안정화 시스템 (Production Hardening)

**Operational Stability and Recovery Framework for Production Deployment**

> 연구형 → 운영형으로 전환
>
> **예측 가능하고 재현 가능한 내부 챗봇**

---

## 📋 핵심 원칙

### 문제 정의

1.0-7.0은 **기능 확장 중심**이었다:
- 더 많은 분석 → 더 많은 모듈
- 더 복잡한 모델 → 더 깊은 이해

하지만 운영에는 **다른 요구사항**이 있다:
- 예측 가능성 (재현성 100%)
- 안정성 (장애 자동 복구)
- 통제성 (명확한 의존성)
- 추적성 (모든 결정의 이유)

---

## 🏗️ 운영형 아키텍처 5단계

```
[1] 기능 동결 (Feature Freeze)
    ↓ 불필요한 기능은 OFF

[2] 로깅 체계 (Reproducibility Logging)
    ↓ 모든 결정의 이유 기록

[3] 재현성 검증 (Stability Verification)
    ↓ 동일 입력 = 동일 출력

[4] 버전 관리 (Version Control)
    ↓ 모든 컴포넌트의 버저닝

[5] 장애 복구 (Recovery Scenarios)
    ↓ 예측 가능한 복구 경로

→ 실사용 가능한 내부 챗봇
```

---

## 🔧 5개 핵심 모듈

### 1. `feature-manager.js` — 기능 관리

**목적**: 운영에 필요한 기능만 활성화, 나머지는 OFF

#### 기능 상태

```
활성 (Production Ready):
✅ CHUNK_PROCESSING (1.2)
✅ METADATA_FILTERING (1.3)
✅ BM25_RANKING (1.4)
✅ HYBRID_SEARCH (2.0)
✅ VECTOR_RANKING (2.0 보조)

비활성 (Research Only):
❌ EVOLUTION_REASONING (3.0)
❌ DESIGN_INTENT_EXTRACTION (4.0)
❌ COGNITION_MAPPING (5.0)
❌ ECOSYSTEM_ANALYSIS (6.0)
❌ ACTIVE_ADVISOR (7.0)
```

#### 주요 함수

```javascript
isFeatureEnabled(featureName)
// 기능 활성화 여부 확인

validateRequiredFeatures()
// 필수 기능 검증

validateFeatureChain()
// 기능 의존성 검증

enableFeature(name, reason)
// 동적 활성화 (로그 기록)

disableFeature(name, reason)
// 동적 비활성화 (필수 기능 보호)
```

#### 특징

- **명시적 제어**: 모든 기능이 ON/OFF 관리됨
- **의존성 추적**: 기능 간 의존성 자동 검증
- **변경 로그**: 누가 언제 뭘 바꿨는지 추적

---

### 2. `logging-system.js` — 로깅 체계

**목적**: 모든 검색 결정의 이유를 완벽히 기록

#### 로깅 대상

```javascript
SearchSessionLogger:
  ├─ Query: 입력 쿼리
  ├─ SearchResults: 반환된 커밋 (top-5)
  ├─ FilterApplied: 어떤 필터를 사용했나
  ├─ PromptUsed: 어떤 프롬프트 버전
  ├─ LLMResponse: LLM의 응답
  ├─ MetadataUsed: 메타데이터 스키마
  └─ Error: 발생한 오류들

CommitTrackingLogger:
  ├─ commitHash: 어느 커밋을 사용했나
  ├─ relevanceScore: 점수는 얼마나
  ├─ source: BM25인지 VECTOR인지
  └─ reranking: 순서가 바뀐 기록

IndexVersionLogger:
  ├─ indexName: 어떤 인덱스인가
  ├─ version: 몇 버전인가
  └─ commitCount: 몇 개의 커밋이 포함되나

PromptVersionManager:
  ├─ name: 프롬프트 이름
  ├─ version: 버전
  └─ activeVersion: 현재 활성 버전
```

#### 재현성 키

```javascript
reproducibilityKey = sessionId + startTime + entriesHash

이 키로:
- 동일한 검색 결과 재현 가능
- 어떤 로직으로 이 결과가 나왔는지 추적
- 언제든 그 시점으로 돌아가서 분석 가능
```

#### 주요 함수

```javascript
startSearchSession(sessionId)
// 새 검색 시작

logQuery(query, options)
// 쿼리 기록

logSearchResults(results)
// 검색 결과 기록 (top-5만)

logPrompt(systemPrompt, userPrompt, version)
// 사용한 프롬프트 기록

closeSession(finalResult)
// 세션 종료 및 생성
```

---

### 3. `reproducibility-tester.js` — 재현성 검증

**목적**: 동일 입력에 대한 동일 출력 보장

#### 테스트 방식

```javascript
ReproducibilityTest:
  const test = new ReproducibilityTest('rt-1', 'memory layout');

  // 3번 실행
  for (let i = 0; i < 3; i++) {
    const result = search('memory layout');
    test.recordExecution(result);
  }

  // 결과 해시 비교
  // 모두 같으면 CONSISTENT ✓
  // 다르면 INCONSISTENT ✗

ReproducibilityTestSuite:
  const suite = new ReproducibilityTestSuite('stability');
  suite.addTest('query-1', '메모리 레이아웃');
  suite.addTest('query-2', 'unsafe 포인터');

  const results = suite.runAll(handlers, iterations=3);
  // 여러 쿼리의 안정성 한 번에 검증
```

#### 검증 대상

| 항목 | 의미 |
|------|------|
| **Query Reproducibility** | 같은 쿼리 → 같은 결과 |
| **Parameter Stability** | 파라미터 변화 → 얼마나 영향? |
| **Metadata Schema Validation** | 메타데이터 타입 일관성 |
| **Version Compatibility** | 버전 간 호환성 |

#### 주요 함수

```javascript
validateQueryReproducibility(query, searchFn, iterations=5)
// 쿼리 재현성 검증

validateMetadataSchema(commits, schema)
// 메타데이터 스키마 검증

testParameterVariation(query, paramGrid, searchFn)
// 파라미터 변동 테스트

validateVersionCompatibility(v1, v2, testCases)
// 버전 간 호환성 확인
```

---

### 4. `version-manager.js` — 버전 관리

**목적**: 모든 컴포넌트의 버전을 명시적으로 관리

#### 관리 대상

```
BM25_INDEX:       1.4
VECTOR_INDEX:     2.0
METADATA_SCHEMA:  1.0
LLM_MODEL:        gpt-4-latest
PROMPT:           1.0
```

#### 주요 함수

```javascript
registerVersion(component, version, metadata)
// 버전 등록 (불변)

activateVersion(component, version)
// 버전 활성화 (교체 기록)

rollbackVersion(component, targetVersion)
// 버전 롤백 (자동 로깅)

validateForDeployment()
// 배포 전 검증
// - 모든 컴포넌트 활성화?
// - 호환성 확인?
// - 필수 버전 지정?

getAuditTrail(component)
// 버전 변경 이력 조회
```

#### 배포 검증

```javascript
const checks = versionManager.validateForDeployment();

checks = {
  allComponentsActive: true,      // 모든 컴포넌트 활성?
  noConflicts: true,              // 호환성 문제 없음?
  deploymentReady: true,          // 배포 가능?
  issues: []                      // 문제점 목록
}

deploymentReady가 false면 배포 중단
```

---

### 5. `recovery-handler.js` — 장애 복구

**목적**: 예측 가능한 장애 복구 시나리오 정의 및 실행

#### 복구 시나리오 (6가지)

```javascript
INDEX_CORRUPTION (CRITICAL)
├─ 증상: 검색 결과 일관성 없음
├─ 단계:
│  1. 검색 서비스 중지 (5초)
│  2. 현재 인덱스 백업 (10초)
│  3. 인덱스 검증 (30초)
│  4. 백업에서 재구축 (60초)
│  5. 무결성 검증 (30초)
│  6. 서비스 재개 (5초)
└─ 총 소요 시간: ~140초

VECTOR_STORE_FAILURE (HIGH)
├─ 증상: 벡터 검색 오류
├─ 단계:
│  1. 벡터 검색 비활성화
│  2. BM25로 폴백
│  3. 운영팀 알림
│  4. 벡터 복구 시도
│  5. 복구 성공 시 재활성화
└─ 영향: 벡터 재정렬 불가 (BM25만 사용)

LLM_API_FAILURE (HIGH)
├─ 증상: 응답 생성 실패
├─ 단계:
│  1. 재시도 (지수 백오프)
│  2. 캐시된 응답 폴백
│  3. 폴백 모델로 전환 (gpt-3.5)
│  4. 운영팀 알림
└─ 영향: 응답 지연 가능

METADATA_SCHEMA_MISMATCH (HIGH)
MEMORY_EXHAUSTION (CRITICAL)
GOGS_SYNC_FAILURE (MEDIUM)
```

#### 자동 복구 정책

```javascript
getAutoRecoveryPolicy(scenario) = {
  autoRecoveryEnabled: scenario.severity === 'CRITICAL' || 'HIGH',
  maxRetries: 3,
  retryDelay: 5000ms,
  escalationTime: 300000ms,    // 5분 후 수동 개입 필요
  notificationRequired: scenario.severity === 'CRITICAL'
}
```

#### 주요 함수

```javascript
executeRecovery(scenarioId, handlers)
// 복구 시나리오 실행
// - 각 단계 순서 보장
// - 타임아웃 관리
// - 실패 시 롤백

getRecoveryStatus()
// 현재 복구 진행 상황

getRecoveryHistory(limit=10)
// 최근 복구 이력 및 성공률

canRecover(scenarioId)
// 특정 시나리오 복구 가능 여부

getAutoRecoveryPolicy(scenarioId)
// 자동 복구 정책 조회
```

---

## 📊 통합 운영 플로우

```
Gogs 저장소
   ↓
검색 요청 (쿼리)
   ↓
[Feature Check]
   └─ 1.2-2.0 활성화 확인
   └─ 3.0+ 비활성화 확인
   ↓
[1. BM25 검색] (1.4)
   ├─ 커밋 인덱스 조회
   ├─ 메타데이터 필터 적용 (1.3)
   └─ 상위 K개 반환
   ↓
[2. 벡터 재정렬] (2.0)
   ├─ 벡터 점수 계산 (선택사항)
   └─ 재정렬 (BM25를 기준으로)
   ↓
[Logging]
   ├─ searchResults 로깅
   ├─ commitHash 기록
   ├─ filters 기록
   └─ scores 기록
   ↓
[LLM 응답]
   ├─ 프롬프트 v1.0 사용 (고정)
   ├─ 모델 gpt-4 사용 (고정)
   ├─ temperature 0.3 (일관성)
   └─ 응답 생성
   ↓
[Response + Logging]
   ├─ 응답 텍스트
   ├─ 사용 커밋 목록
   ├─ 재현성 키
   └─ 세션 로그 URL
```

---

## 🔐 운영 보증

### 재현성 (Reproducibility)

```javascript
동일 쿼리 + 동일 환경 = 동일 결과 (100%)

보장 방법:
1. 모든 쿼리 로깅
2. 프롬프트 고정 (v1.0)
3. 모델 고정 (gpt-4)
4. temperature 고정 (0.3)
5. 인덱스 버전 고정

검증: reproducibility-tester로 지속적 검증
```

### 안정성 (Stability)

```javascript
장애 발생 → 자동 복구 → 서비스 계속

복구 가능한 장애:
- 인덱스 손상 (CRITICAL)
- 벡터 스토어 실패 (HIGH)
- LLM API 실패 (HIGH)
- 메모리 부족 (CRITICAL)
- Gogs 동기화 실패 (MEDIUM)

비복구 장애:
- 네트워크 완전 차단
- 디스크 풀 (용량 초과)
- 하드웨어 실패
```

### 추적성 (Traceability)

```javascript
모든 결정의 이유를 추적 가능:

"왜 이 결과가 나왔는가?"
→ sessionId로 로그 조회
→ 사용된 필터 확인
→ 사용된 커밋 확인
→ 프롬프트 버전 확인
→ LLM 응답 확인
→ 재현성 키로 재실행 가능
```

---

## 📋 운영 체크리스트

배포 전 반드시 확인:

```
□ 기능 동결
  □ 1.2-2.0만 활성화
  □ 3.0+ 모두 비활성화
  □ validateRequiredFeatures() = HEALTHY

□ 로깅 체계
  □ 모든 쿼리 로깅 활성화
  □ commitHash 기록 활성화
  □ 프롬프트 버전 로깅 활성화
  □ 로그 저장소 확보 (1000 세션)

□ 재현성
  □ 5개 표준 쿼리로 재현성 테스트
  □ 5회 반복 = 모두 CONSISTENT
  □ 자동 재현성 테스트 스케줄링

□ 버전 관리
  □ BM25_INDEX: 1.4
  □ VECTOR_INDEX: 2.0
  □ METADATA_SCHEMA: 1.0
  □ LLM_MODEL: gpt-4-latest (LOCKED)
  □ PROMPT: 1.0 (LOCKED)
  □ validateForDeployment() = READY

□ 복구 시나리오
  □ 6가지 복구 시나리오 정의
  □ 자동 복구 정책 수립
  □ 복구 핸들러 구현
  □ 복구 테스트 완료
```

---

## 🎯 운영형 vs 연구형 비교

| 항목 | 연구형 (1.0-7.0) | 운영형 (8.0) |
|------|-----------------|-------------|
| 기능 | 계속 확장 | 동결 (필요시만) |
| 모델 | 실험 가능 | 고정 |
| 프롬프트 | 변경 가능 | 버저닝 관리 |
| 재현성 | ~80% | 100% |
| 오류 처리 | 예외 | 자동 복구 |
| 로깅 | 기본 | 완전한 추적 |
| 버전 관리 | 자유 | 명시적 |
| 배포 | 수동 | 자동 검증 |

---

## 📝 라이선스

MIT

---

**마지막 업데이트**: 2026-02-27
**시스템 정체**: 운영 안정화 시스템 (Production Hardening Framework)
**철학**: 통제 범위 내에서의 안정성 (Control Surface Stability)
