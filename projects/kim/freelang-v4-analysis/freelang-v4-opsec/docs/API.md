# FreeLang v4 OPSec API 문서

## 목차

1. [PolicyEnforcer](#policyenforcer)
2. [AuditLogger](#auditlogger)
3. [AccessControlList](#accesscontrollist)
4. [DataProtector](#dataprotector)
5. [NetworkPolicy](#networkpolicy)

---

## PolicyEnforcer

정책 기반 접근 제어를 위한 엔진입니다.

### `PolicyEnforcer::new() -> PolicyEnforcer`

새로운 정책 강제자를 생성합니다.

**반환값**: PolicyEnforcer 인스턴스

**예제**:
```freelang
let enforcer = PolicyEnforcer::new()
```

---

### `enforcer.rule(role: String, actions: List<String>, resource: Resource) -> PolicyEnforcer`

역할에 대한 규칙을 추가합니다.

**매개변수**:
- `role` (String): 역할 이름 (예: "admin", "user", "guest")
- `actions` (List<String>): 허용된 액션 배열 (예: ["read", "write", "delete"])
- `resource` (Resource): 리소스 (Resource::All, Resource::Own, Resource::None)

**반환값**: PolicyEnforcer (메서드 체이닝)

**예제**:
```freelang
enforcer
  .rule("admin", ["read", "write", "delete"], Resource::All)
  .rule("user", ["read"], Resource::Own)
  .rule("guest", ["read"], Resource::Public)
```

---

### `enforcer.enforce(user: User, action: String, resource: String) -> Result<bool>`

정책을 강제합니다.

**매개변수**:
- `user` (User): 사용자 객체
- `action` (String): 수행할 액션
- `resource` (String): 대상 리소스

**반환값**: Result<bool> (성공 시 true, 실패 시 false)

**예제**:
```freelang
let result = enforcer.enforce(user, "write", "/data/sensitive")
if result.is_ok() && result.unwrap() {
  println("Access granted")
} else {
  println("Access denied")
}
```

---

### `enforcer.set_policy(policy: Policy) -> void`

전체 정책을 설정합니다.

**매개변수**:
- `policy` (Policy): 정책 객체

**예제**:
```freelang
let policy = Policy::from_file("policies.json")
enforcer.set_policy(policy)
```

---

## AuditLogger

감시 및 로깅 시스템입니다.

### `AuditLogger::new() -> AuditLogger`

새로운 감시 로거를 생성합니다.

**반환값**: AuditLogger 인스턴스

**예제**:
```freelang
let audit = AuditLogger::new()
```

---

### `audit.with_encryption(key: String) -> AuditLogger`

암호화 키를 설정합니다.

**매개변수**:
- `key` (String): 암호화 키

**반환값**: AuditLogger (메서드 체이닝)

**예제**:
```freelang
audit.with_encryption("my-secret-key-32-chars-long")
```

---

### `audit.with_retention(days: Integer) -> AuditLogger`

로그 보존 기간을 설정합니다.

**매개변수**:
- `days` (Integer): 보존 기간 (일)

**반환값**: AuditLogger (메서드 체이닝)

**예제**:
```freelang
audit.with_retention(days: 90)
```

---

### `audit.log(event: AuditEvent) -> Result<String>`

감시 이벤트를 기록합니다.

**매개변수**:
- `event` (AuditEvent): 감시 이벤트

**반환값**: Result<String> (로그 ID 또는 에러)

**예제**:
```freelang
let event_id = audit.log(
  event_type: "access_denied",
  user: "user@example.com",
  resource: "/api/admin",
  timestamp: now(),
  details: { reason: "insufficient_permissions" }
).unwrap()

println("Log ID: " + event_id)
```

---

### `audit.query(filter: AuditFilter) -> List<AuditEvent>`

감시 로그를 조회합니다.

**매개변수**:
- `filter` (AuditFilter): 조회 필터

**반환값**: List<AuditEvent>

**예제**:
```freelang
let logs = audit.query(
  filter: AuditFilter::new()
    .user("user@example.com")
    .event_type("access_denied")
    .time_range(start: "2026-02-01", end: "2026-02-20")
)

for log in logs {
  println(log.user + " - " + log.event_type)
}
```

---

## AccessControlList

접근 제어 목록 관리입니다.

### `AccessControlList::new() -> AccessControlList`

새로운 ACL을 생성합니다.

**반환값**: AccessControlList 인스턴스

**예제**:
```freelang
let acl = AccessControlList::new()
```

---

### `acl.grant(user: String, permission: String, resource: String) -> Result<void>`

권한을 부여합니다.

**매개변수**:
- `user` (String): 사용자 ID
- `permission` (String): 권한 (read, write, delete, execute)
- `resource` (String): 리소스 경로

**반환값**: Result<void>

**예제**:
```freelang
acl.grant("user1", "read", "/data/public")?
acl.grant("user2", "write", "/data/user2")?
acl.grant("admin", "delete", "/data/sensitive")?
```

---

### `acl.deny(user: String, permission: String, resource: String) -> Result<void>`

권한을 거부합니다.

**매개변수**:
- `user` (String): 사용자 ID
- `permission` (String): 권한
- `resource` (String): 리소스 경로

**반환값**: Result<void>

**예제**:
```freelang
acl.deny("user3", "write", "/data/sensitive")?
```

---

### `acl.check(user: String, permission: String, resource: String) -> bool`

권한을 확인합니다.

**매개변수**:
- `user` (String): 사용자 ID
- `permission` (String): 권한
- `resource` (String): 리소스 경로

**반환값**: bool (true: 허용, false: 거부)

**예제**:
```freelang
if acl.check("user1", "read", "/data/public") {
  println("Access granted")
}
```

---

### `acl.revoke(user: String, resource: String) -> Result<void>`

모든 권한을 철회합니다.

**매개변수**:
- `user` (String): 사용자 ID
- `resource` (String): 리소스 경로

**반환값**: Result<void>

**예제**:
```freelang
acl.revoke("user3", "/api/admin")?
```

---

## DataProtector

데이터 보호 및 암호화입니다.

### `DataProtector::new() -> DataProtector`

새로운 데이터 보호기를 생성합니다.

**반환값**: DataProtector 인스턴스

**예제**:
```freelang
let protector = DataProtector::new()
```

---

### `protector.with_encryption(algorithm: String) -> DataProtector`

암호화 알고리즘을 설정합니다.

**매개변수**:
- `algorithm` (String): 암호화 알고리즘 ("AES256", "AES128", "ChaCha20")

**반환값**: DataProtector (메서드 체이닝)

**예제**:
```freelang
protector.with_encryption(Algorithm::AES256)
```

---

### `protector.with_masking(pattern: Pattern) -> DataProtector`

마스킹 패턴을 설정합니다.

**매개변수**:
- `pattern` (Pattern): 패턴 (Pattern::CreditCard, Pattern::SSN, Pattern::Email)

**반환값**: DataProtector (메서드 체이닝)

**예제**:
```freelang
protector.with_masking(Pattern::CreditCard)
```

---

### `protector.encrypt(data: String) -> Result<String>`

데이터를 암호화합니다.

**매개변수**:
- `data` (String): 평문 데이터

**반환값**: Result<String> (암호화된 데이터)

**예제**:
```freelang
let encrypted = protector.encrypt("sensitive_data")?
println("Encrypted: " + encrypted)
```

---

### `protector.decrypt(encrypted_data: String) -> Result<String>`

데이터를 복호화합니다.

**매개변수**:
- `encrypted_data` (String): 암호화된 데이터

**반환값**: Result<String> (복호화된 데이터)

**예제**:
```freelang
let decrypted = protector.decrypt(encrypted)?
println("Decrypted: " + decrypted)
```

---

### `protector.mask(data: String) -> String`

데이터를 마스킹합니다.

**매개변수**:
- `data` (String): 원본 데이터

**반환값**: String (마스킹된 데이터)

**예제**:
```freelang
let card = "4111-1111-1111-1111"
let masked = protector.mask(card)
// 결과: "4111-****-****-1111"
```

---

## NetworkPolicy

네트워크 정책 관리입니다.

### `NetworkPolicy::new() -> NetworkPolicy`

새로운 네트워크 정책을 생성합니다.

**반환값**: NetworkPolicy 인스턴스

**예제**:
```freelang
let policy = NetworkPolicy::new()
```

---

### `policy.allow_port(port: Integer, protocol: String) -> NetworkPolicy`

포트를 허용합니다.

**매개변수**:
- `port` (Integer): 포트 번호
- `protocol` (String): 프로토콜 (tcp, udp)

**반환값**: NetworkPolicy (메서드 체이닝)

**예제**:
```freelang
policy
  .allow_port(80, "tcp")
  .allow_port(443, "tcp")
  .allow_port(53, "udp")
```

---

### `policy.block_port(port: Integer) -> NetworkPolicy`

포트를 차단합니다.

**매개변수**:
- `port` (Integer): 포트 번호

**반환값**: NetworkPolicy (메서드 체이닝)

**예제**:
```freelang
policy.block_port(23)  // Telnet 차단
```

---

### `policy.rate_limit(request_per_sec: Integer) -> NetworkPolicy`

요청 속도 제한을 설정합니다.

**매개변수**:
- `request_per_sec` (Integer): 초당 요청 수

**반환값**: NetworkPolicy (메서드 체이닝)

**예제**:
```freelang
policy.rate_limit(100)  // 초당 100 요청
```

---

### `policy.enable_ddos_protection() -> NetworkPolicy`

DDoS 방어를 활성화합니다.

**반환값**: NetworkPolicy (메서드 체이닝)

**예제**:
```freelang
policy.enable_ddos_protection()
```

---

## 공통 타입

### User 타입

```freelang
type User {
  id: String
  name: String
  role: String
  permissions: List<String>
  created_at: Timestamp
}
```

### Resource 타입

```freelang
type Resource {
  All        // 모든 리소스
  Own        // 자신의 리소스만
  Public     // 공개 리소스만
  None       // 리소스 없음
}
```

### AuditEvent 타입

```freelang
type AuditEvent {
  id: String
  event_type: String
  user: String
  resource: String
  action: String
  timestamp: Timestamp
  status: String  // "success" | "failure"
  details: Map
}
```

---

## 에러 처리

모든 API는 Result 타입을 반환하므로 에러 처리가 필요합니다.

```freelang
match enforcer.enforce(user, action, resource) {
  Ok(true) => println("Access granted"),
  Ok(false) => println("Access denied"),
  Err(err) => println("Error: " + err.message)
}
```

---

**문서 버전**: 1.0.0
**최종 수정**: 2026-02-20
