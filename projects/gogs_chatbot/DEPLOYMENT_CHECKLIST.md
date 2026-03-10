# 배포 체크리스트 (Deployment Checklist)

## 🎯 배포 대상
- **서버**: 253
- **브랜치**: master
- **커밋**: b19cfa9 (8.0 운영 안정화)
- **상태**: 로컬 테스트 ✅ 완료

---

## 📋 Pre-Deployment (배포 전)

### 1. 코드 검증
- [x] 모든 테스트 통과 (12/12)
- [x] 문법 오류 없음
- [x] 의존성 명시 (없음 - Pure JS)
- [x] 버전 지정 (package.json 작성)

### 2. 기능 상태 확인
- [x] CHUNK_PROCESSING: enabled
- [x] METADATA_FILTERING: enabled
- [x] BM25_RANKING: enabled
- [x] HYBRID_SEARCH: enabled
- [x] VECTOR_RANKING: enabled (보조)
- [x] EVOLUTION_REASONING: disabled
- [x] DESIGN_INTENT_EXTRACTION: disabled
- [x] COGNITION_MAPPING: disabled
- [x] ECOSYSTEM_ANALYSIS: disabled
- [x] ACTIVE_ADVISOR: disabled

### 3. 환경변수 확인
- [x] .env.example 작성
- [x] 필수 변수 60개 정의
- [ ] 253 서버에 .env 파일 생성 필요

### 4. 로깅 준비
- [x] SearchSessionLogger 구현
- [x] CommitTrackingLogger 구현
- [x] IndexVersionLogger 구현
- [x] PromptVersionManager 구현
- [ ] 로그 저장소 준비 필요 (/var/log/gogs-knowledge-engine)

### 5. 재현성 테스트
- [x] ReproducibilityTest 클래스 완성
- [x] ReproducibilityTestSuite 완성
- [x] validateQueryReproducibility 완성
- [ ] 5개 표준 쿼리로 테스트 필요 (배포 후)

### 6. 버전 관리
- [x] VersionManager 구현
- [x] MetadataSchemaVersionManager 구현
- [ ] 초기 버전 등록 필요:
  - [ ] BM25_INDEX: 1.4
  - [ ] VECTOR_INDEX: 2.0
  - [ ] METADATA_SCHEMA: 1.0
  - [ ] LLM_MODEL: gpt-4-latest (LOCKED)
  - [ ] PROMPT: 1.0 (LOCKED)

### 7. 복구 시나리오
- [x] 6가지 시나리오 정의
- [x] RecoveryExecutor 구현
- [ ] 복구 핸들러 구현 (서버별로 필요)
  - [ ] STOP_SEARCH_SERVICE handler
  - [ ] BACKUP_CURRENT_INDEX handler
  - [ ] REBUILD_INDEX_FROM_BACKUP handler
  - [ ] 기타 복구 액션

---

## 📦 Deployment (배포)

### 1. 저장소 준비
```bash
# 253 서버에서
git clone https://gogs.dclub.kr/kim/gogs-knowledge-engine.git
cd gogs-knowledge-engine
git checkout master
```

### 2. 코드 배포
```bash
# 8.0 디렉토리 확인
ls -la 8.0-production-hardening/

# 필수 파일 확인
- feature-manager.js (340줄)
- logging-system.js (385줄)
- reproducibility-tester.js (444줄)
- version-manager.js (385줄)
- recovery-handler.js (356줄)
- tests/test-hardening.js (220줄)
- package.json
- .env.example
- README.md
```

### 3. 환경 설정
```bash
# 로그 디렉토리 생성
mkdir -p /var/log/gogs-knowledge-engine
mkdir -p /var/log/gogs-audit

# 권한 설정
chmod 755 /var/log/gogs-knowledge-engine
chmod 755 /var/log/gogs-audit

# .env 파일 생성 (예시)
cp 8.0-production-hardening/.env.example 8.0-production-hardening/.env
# 필요한 값으로 수정
```

### 4. 테스트 실행
```bash
# 로컬 테스트 (이미 완료)
node 8.0-production-hardening/tests/test-hardening.js

# 기능 검증
node -e "import('./8.0-production-hardening/feature-manager.js').then(m => console.log(m.default.generateFeatureReport()))"
```

### 5. 버전 초기화
```bash
# 버전 매니저 초기화 스크립트 필요
# 다음 버전들을 등록:
# - BM25_INDEX: 1.4
# - VECTOR_INDEX: 2.0
# - METADATA_SCHEMA: 1.0
# - LLM_MODEL: gpt-4-latest
# - PROMPT: 1.0
```

---

## ✅ Post-Deployment (배포 후)

### 1. 헬스 체크
- [ ] feature-manager.validateRequiredFeatures() = HEALTHY
- [ ] version-manager.validateForDeployment() = READY
- [ ] 로그 파일이 생성되는가?
- [ ] 에러 로그는 없는가?

### 2. 재현성 검증
```javascript
// 표준 테스트 쿼리 5개 실행
const testQueries = [
  'memory layout',
  'unsafe pointers',
  'type system',
  'performance optimization',
  'testing framework'
];

// 각 쿼리를 3회 실행해서 결과가 동일한가?
for (const query of testQueries) {
  const test = new ReproducibilityTest(query);
  // ... 3회 실행 후 CONSISTENT 확인
}
```

### 3. 로깅 검증
- [ ] /var/log/gogs-knowledge-engine/sessions.log 생성?
- [ ] /var/log/gogs-audit/changes.log 생성?
- [ ] 로그 형식이 JSON인가?

### 4. 성능 측정
- [ ] 평균 응답 시간 측정
- [ ] 메모리 사용량 모니터링
- [ ] 에러율 확인

### 5. 복구 테스트
- [ ] INDEX_CORRUPTION 시나리오 수동 테스트
- [ ] LLM_API_FAILURE 폴백 테스트
- [ ] VECTOR_STORE_FAILURE 복구 테스트

---

## 🚀 Go-Live (운영 개시)

### 1. 모니터링 활성화
- [ ] 헬스 체크 스케줄 설정 (매 1분)
- [ ] 에러 알림 채널 설정
- [ ] 메트릭 수집 시작

### 2. 문서 준비
- [ ] 운영 가이드 배포
- [ ] 복구 플레이북 공유
- [ ] 담당자 연락처 정리

### 3. 롤백 계획
- [ ] 롤백 버전 명확히 (7.0)
- [ ] 롤백 스크립트 준비
- [ ] 롤백 시간 측정 (목표: < 5분)

### 4. 초기 모니터링 (24시간)
- [ ] 시간당 오류율 추적
- [ ] p99 응답 시간 모니터링
- [ ] 복구 이벤트 없음 확인

---

## 📊 배포 체크리스트 요약

| 항목 | 상태 | 담당 |
|------|------|------|
| 로컬 테스트 | ✅ 완료 | 시스템 |
| 코드 검증 | ✅ 완료 | 시스템 |
| 기능 동결 | ✅ 완료 | 시스템 |
| 환경 준비 | ⏳ 진행중 | 운영팀 |
| 배포 | ⏳ 예정 | 운영팀 |
| 헬스 체크 | ⏳ 예정 | 운영팀 |
| 모니터링 | ⏳ 예정 | 운영팀 |

---

## 📌 긴급 연락처

배포 중 문제 발생 시:
- **롤백**: 즉시 7.0으로 롤백 (< 5분)
- **에스컬레이션**: 운영팀장에 보고
- **복구**: 6가지 자동 복구 시나리오 시작

---

**배포 승인자**: _________________
**배포 실행자**: _________________
**배포 완료 시간**: _________________

**마지막 업데이트**: 2026-02-27
**배포 상태**: Pre-Deployment Ready ✅
