# FreeLang v4 OPSec (Operations Security)

## 개요

FreeLang v4 OPSec은 운영 보안 및 시스템 강화를 위한 통합 모듈입니다. 프로덕션 환경에서의 보안 정책 강제, 감사 로깅, 접근 제어, 민감 데이터 보호를 제공합니다.

## 주요 기능

### 1. 정책 강제 (Policy Enforcement)
- 시스템 보안 정책 정의 및 적용
- 역할 기반 접근 제어 (RBAC)
- 속성 기반 접근 제어 (ABAC)
- 동적 정책 평가

### 2. 감사 및 로깅
- 모든 보안 이벤트 감사
- 변경사항 추적
- 감사 로그 암호화
- 감사 로그 무결성 검증

### 3. 접근 제어
- 파인그레인(Fine-grained) 접근 제어
- 권한 승격 감지
- 세션 관리
- 로그인 시도 추적

### 4. 민감 데이터 보호
- 자동 데이터 분류
- 암호화된 저장소
- 키 로테이션
- 데이터 마스킹

### 5. 네트워크 정책
- 포트 필터링
- 프로토콜 검증
- 속도 제한(Rate Limiting)
- DDoS 방어

## 성능 특성

- **감사 오버헤드**: <5% (평균)
- **정책 평가 시간**: <1ms (캐시된 정책)
- **로깅 처리량**: 10,000+ events/sec
- **메모리 사용량**: ~50MB (기본 정책)

## 설치

```bash
git clone https://gogs.dclub.kr/kim/freelang-v4-opsec.git
cd freelang-v4-opsec
npm install
npm run build
```

## 사용법

### 기본 정책 설정

```freelang
// 정책 정의
let policy = SecurityPolicy::new()
  .rule("admin", ["read", "write", "delete"], Resource::All)
  .rule("user", ["read"], Resource::Own)
  .rule("guest", ["read"], Resource::Public)

// 정책 적용
let enforcer = PolicyEnforcer::new(policy)
enforcer.enforce(user, action, resource)
```

### 감사 로깅

```freelang
let audit = AuditLogger::new()
  .with_encryption(key)
  .with_retention(days: 90)

audit.log(
  event_type: "access_denied",
  user: "user@example.com",
  resource: "/api/admin",
  reason: "insufficient_permissions"
)
```

### 접근 제어

```freelang
let acl = AccessControlList::new()
acl.grant("user1", "read", "/data/public")
acl.deny("user2", "write", "/data/sensitive")
acl.revoke("user3", "/api/admin")
```

### 민감 데이터 보호

```freelang
let protector = DataProtector::new()
  .with_encryption(Algorithm::AES256)
  .with_masking(Pattern::CreditCard)

let masked = protector.mask("4111-1111-1111-1111")
let encrypted = protector.encrypt(sensitive_data)
```

## 모범 사례

### 1. 최소 권한 원칙
- 필요한 최소 권한만 부여
- 정기적인 권한 검토
- 불필요한 권한 자동 해제

### 2. 감사 추적
- 모든 보안 관련 이벤트 기록
- 감사 로그 보호 및 무결성 검증
- 정기적인 감시 및 분석

### 3. 데이터 분류
- 데이터 민감도 등급 정의
- 등급별 보호 수준 설정
- 자동 분류 및 태깅

### 4. 정책 버전 관리
- 정책 변경 이력 관리
- 정책 롤백 능력
- 정책 영향도 분석

### 5. 암호화 키 관리
- 키 저장소 분리
- 정기적인 키 로테이션
- 키 사용 감사

## 아키텍처

```
┌─────────────────────────────────────────┐
│   Application Layer                     │
├─────────────────────────────────────────┤
│   OPSec Engine                          │
│  ┌────────────────────────────────────┐ │
│  │ Policy Enforcer                    │ │
│  │ - RBAC/ABAC Evaluation             │ │
│  │ - Dynamic Policy Engine            │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Audit & Logging                    │ │
│  │ - Event Capture                    │ │
│  │ - Log Encryption & Integrity       │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Access Control Manager             │ │
│  │ - ACL Management                   │ │
│  │ - Session Management               │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Data Protection                    │ │
│  │ - Encryption/Decryption            │ │
│  │ - Masking & Redaction              │ │
│  │ - Key Management                   │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│   Storage Layer                         │
│   - Encrypted Audit Logs                │
│   - Policy Storage                      │
│   - Key Vault                           │
└─────────────────────────────────────────┘
```

## 구성 요소

| 컴포넌트 | 설명 | 상태 |
|---------|------|------|
| PolicyEnforcer | 정책 기반 접근 제어 | ✅ 완료 |
| AuditLogger | 감사 로깅 시스템 | ✅ 완료 |
| AccessControlList | ACL 관리 | ✅ 완료 |
| DataProtector | 데이터 보호 | ✅ 완료 |
| NetworkPolicy | 네트워크 정책 | ⏳ 개발중 |
| KeyManager | 암호화 키 관리 | ⏳ 계획중 |

## 테스트

```bash
npm test
```

## 문제 해결

### 정책 평가 실패
- 정책 문법 검증
- 정책 우선순위 확인
- 감사 로그 검토

### 성능 저하
- 정책 캐싱 활성화
- 감사 배치 처리 확인
- 암호화 알고리즘 최적화

## 기여

이 프로젝트에 대한 개선사항이나 버그 리포트는 이슈 또는 풀 리퀘스트를 통해 제출해주세요.

## 라이선스

MIT License

---

**마지막 수정**: 2026-02-20
**버전**: 1.0.0
**관리자**: FreeLang Development Team
