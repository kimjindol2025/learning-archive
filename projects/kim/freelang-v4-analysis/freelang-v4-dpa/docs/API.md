# FreeLang v4 DPA API 문서

## 목차

1. [DataClassifier](#dataclassifier)
2. [PrivacyManager](#privacymanager)
3. [CryptoManager](#cryptomanager)
4. [DataLeakagePrevention](#dataleakageprevention)
5. [ComplianceAuditor](#complianceauditor)

---

## DataClassifier

데이터 자동 분류 엔진입니다.

### `DataClassifier::new() -> DataClassifier`

새로운 데이터 분류기를 생성합니다.

**반환값**: DataClassifier 인스턴스

**예제**:
```freelang
let classifier = DataClassifier::new()
```

---

### `classifier.register_pattern(data_type: DataType, pattern: String) -> DataClassifier`

분류 패턴을 등록합니다.

**매개변수**:
- `data_type` (DataType): 데이터 타입 (CreditCard, SSN, Email, Phone 등)
- `pattern` (String): 정규표현식 패턴

**반환값**: DataClassifier (메서드 체이닝)

**예제**:
```freelang
classifier
  .register_pattern(DataType::CreditCard, "\\d{4}-\\d{4}-\\d{4}-\\d{4}")
  .register_pattern(DataType::SSN, "\\d{3}-\\d{2}-\\d{4}")
  .register_pattern(DataType::Email, ".+@.+\\..+")
  .register_pattern(DataType::Phone, "\\d{3}-\\d{4}-\\d{4}")
```

---

### `classifier.classify(data: String) -> ClassificationResult`

데이터를 분류합니다.

**매개변수**:
- `data` (String): 분류할 데이터

**반환값**: ClassificationResult

**예제**:
```freelang
let result = classifier.classify("My SSN is 123-45-6789 and credit card is 4111-1111-1111-1111")
println("Categories: " + result.categories)  // [SSN, CreditCard]
println("Sensitivity: " + result.sensitivity)  // HIGH
```

---

### `classifier.classify_file(file_path: String) -> ClassificationResult`

파일을 분류합니다.

**매개변수**:
- `file_path` (String): 파일 경로

**반환값**: ClassificationResult

**예제**:
```freelang
let file_result = classifier.classify_file("/path/to/customer_data.csv")
```

---

### `classifier.bulk_classify(data_list: List<String>) -> List<ClassificationResult>`

여러 데이터를 일괄 분류합니다.

**매개변수**:
- `data_list` (List<String>): 분류할 데이터 목록

**반환값**: List<ClassificationResult>

**예제**:
```freelang
let data = ["john@example.com", "4111-1111-1111-1111", "public data"]
let results = classifier.bulk_classify(data)
```

---

## PrivacyManager

개인정보 보호 및 권리 관리입니다.

### `PrivacyManager::new() -> PrivacyManager`

새로운 개인정보 관리자를 생성합니다.

**반환값**: PrivacyManager 인스턴스

**예제**:
```freelang
let privacy = PrivacyManager::new()
```

---

### `privacy.consent_required(data_type: String) -> PrivacyManager`

데이터 타입에 대한 동의 필요성을 설정합니다.

**매개변수**:
- `data_type` (String): 데이터 타입

**반환값**: PrivacyManager (메서드 체이닝)

**예제**:
```freelang
privacy
  .consent_required("email")
  .consent_required("phone")
  .consent_required("location")
```

---

### `privacy.record_consent(user_id: String, data_type: String, granted: bool) -> Result<void>`

사용자 동의를 기록합니다.

**매개변수**:
- `user_id` (String): 사용자 ID
- `data_type` (String): 데이터 타입
- `granted` (bool): 동의 여부

**반환값**: Result<void>

**예제**:
```freelang
privacy.record_consent("user123", "email", true)?
privacy.record_consent("user123", "marketing", false)?
```

---

### `privacy.get_all_personal_data(user_id: String) -> Result<PersonalData>`

사용자의 모든 개인정보를 조회합니다. (DSAR - Data Subject Access Request)

**매개변수**:
- `user_id` (String): 사용자 ID

**반환값**: Result<PersonalData>

**예제**:
```freelang
let personal_data = privacy.get_all_personal_data("user123")?
println("Data types: " + personal_data.data_types)
println("Last modified: " + personal_data.last_modified)
```

---

### `privacy.delete_personal_data(user_id: String) -> Result<DeletionReport>`

사용자의 개인정보를 삭제합니다. (Right to be Forgotten)

**매개변수**:
- `user_id` (String): 사용자 ID

**반환값**: Result<DeletionReport>

**예제**:
```freelang
let deletion = privacy.delete_personal_data("user123")?
println("Deleted records: " + deletion.records_deleted)
println("Deletion ID: " + deletion.deletion_id)
```

---

### `privacy.export_data(user_id: String, format: String) -> Result<String>`

사용자의 개인정보를 내보냅니다. (Data Portability)

**매개변수**:
- `user_id` (String): 사용자 ID
- `format` (String): 내보내기 형식 (json, csv, xml)

**반환값**: Result<String> (내보낸 데이터)

**예제**:
```freelang
let json_data = privacy.export_data("user123", "json")?
println("Exported: " + json_data)

let csv_data = privacy.export_data("user123", "csv")?
```

---

### `privacy.set_retention_policy(data_type: String, days: Integer) -> PrivacyManager`

데이터 보존 기간을 설정합니다.

**매개변수**:
- `data_type` (String): 데이터 타입
- `days` (Integer): 보존 기간 (일)

**반환값**: PrivacyManager (메서드 체이닝)

**예제**:
```freelang
privacy
  .set_retention_policy("user_profile", 365)
  .set_retention_policy("activity_log", 90)
  .set_retention_policy("deleted_account", 30)
```

---

## CryptoManager

암호화 및 키 관리입니다.

### `CryptoManager::new() -> CryptoManager`

새로운 암호화 관리자를 생성합니다.

**반환값**: CryptoManager 인스턴스

**예제**:
```freelang
let crypto = CryptoManager::new()
```

---

### `crypto.with_algorithm(algorithm: String) -> CryptoManager`

암호화 알고리즘을 설정합니다.

**매개변수**:
- `algorithm` (String): 알고리즘 (AES256GCM, AES256CBC, ChaCha20Poly1305)

**반환값**: CryptoManager (메서드 체이닝)

**예제**:
```freelang
crypto.with_algorithm(Algorithm::AES256GCM)
```

---

### `crypto.with_kms(kms_type: String) -> CryptoManager`

KMS (Key Management Service)를 설정합니다.

**매개변수**:
- `kms_type` (String): KMS 타입 (AWS, GCP, Azure, Local)

**반환값**: CryptoManager (메서드 체이닝)

**예제**:
```freelang
crypto
  .with_kms("AWS")
  .with_rotation_days(90)
```

---

### `crypto.encrypt_at_rest(data: String) -> Result<String>`

저장소 암호화 (At-Rest)를 수행합니다.

**매개변수**:
- `data` (String): 암호화할 데이터

**반환값**: Result<String> (암호화된 데이터)

**예제**:
```freelang
let sensitive = "database_password=secret123"
let encrypted = crypto.encrypt_at_rest(sensitive)?
```

---

### `crypto.decrypt_at_rest(encrypted_data: String) -> Result<String>`

저장소 복호화를 수행합니다.

**매개변수**:
- `encrypted_data` (String): 암호화된 데이터

**반환값**: Result<String> (복호화된 데이터)

**예제**:
```freelang
let decrypted = crypto.decrypt_at_rest(encrypted)?
```

---

### `crypto.enable_transit_encryption() -> CryptoManager`

전송 암호화 (In-Transit)를 활성화합니다.

**반환값**: CryptoManager (메서드 체이닝)

**예제**:
```freelang
crypto.enable_transit_encryption()  // TLS 활성화
```

---

### `crypto.encrypt_searchable(data: String, field: String) -> Result<SearchableEncrypted>`

검색 가능 암호화를 수행합니다.

**매개변수**:
- `data` (String): 암호화할 데이터
- `field` (String): 필드명

**반환값**: Result<SearchableEncrypted>

**예제**:
```freelang
let se = crypto.encrypt_searchable("john@example.com", "email")?
// 암호화되었지만 쿼리는 가능
let search_result = query("WHERE email = ?", [se.token])
```

---

### `crypto.rotate_keys() -> Result<KeyRotationReport>`

암호화 키를 회전시킵니다.

**반환값**: Result<KeyRotationReport>

**예제**:
```freelang
let rotation = crypto.rotate_keys()?
println("Old key version: " + rotation.old_key_version)
println("New key version: " + rotation.new_key_version)
```

---

## DataLeakagePrevention

데이터 유출 방지 시스템입니다.

### `DataLeakagePrevention::new() -> DataLeakagePrevention`

새로운 DLP 엔진을 생성합니다.

**반환값**: DataLeakagePrevention 인스턴스

**예제**:
```freelang
let dlp = DataLeakagePrevention::new()
```

---

### `dlp.add_rule(name: String, pattern: Pattern, action: Action) -> DataLeakagePrevention`

DLP 규칙을 추가합니다.

**매개변수**:
- `name` (String): 규칙 이름
- `pattern` (Pattern): 패턴 (CreditCard, SSN, Email 등)
- `action` (Action): 액션 (Block, Warn, Log, Redact)

**반환값**: DataLeakagePrevention (메서드 체이닝)

**예제**:
```freelang
dlp
  .add_rule("block_cc_numbers", Pattern::CreditCard, Action::Block)
  .add_rule("warn_ssn", Pattern::SSN, Action::Warn)
  .add_rule("log_emails", Pattern::Email, Action::Log)
  .add_rule("redact_phones", Pattern::Phone, Action::Redact)
```

---

### `dlp.scan_message(message: String) -> ScanResult`

메시지를 스캔합니다.

**매개변수**:
- `message` (String): 스캔할 메시지

**반환값**: ScanResult

**예제**:
```freelang
let scan = dlp.scan_message("Email: john@example.com, Card: 4111-1111-1111-1111")
println("Matches: " + scan.matches)  // [Email, CreditCard]
println("Action taken: " + scan.action)  // Block
```

---

### `dlp.scan_file(file_path: String) -> ScanResult`

파일을 스캔합니다.

**매개변수**:
- `file_path` (String): 파일 경로

**반환값**: ScanResult

**예제**:
```freelang
let file_scan = dlp.scan_file("/path/to/report.pdf")
if file_scan.has_violations {
  println("Policy violations found!")
}
```

---

### `dlp.scan_email(email: Email) -> ScanResult`

이메일을 스캔합니다.

**매개변수**:
- `email` (Email): 이메일 객체 (to, subject, body 포함)

**반환값**: ScanResult

**예제**:
```freelang
let email_scan = dlp.scan_email({
  to: "external@example.com",
  subject: "Customer data",
  body: "SSN: 123-45-6789"
})
```

---

## ComplianceAuditor

규정 준수 감시입니다.

### `ComplianceAuditor::new() -> ComplianceAuditor`

새로운 규정 준수 감시자를 생성합니다.

**반환값**: ComplianceAuditor 인스턴스

**예제**:
```freelang
let auditor = ComplianceAuditor::new()
```

---

### `auditor.generate_report(regulation: String, period: DateRange) -> Result<ComplianceReport>`

규정 준수 리포트를 생성합니다.

**매개변수**:
- `regulation` (String): 규정명 (GDPR, CCPA, HIPAA, KIP)
- `period` (DateRange): 기간 (start, end)

**반환값**: Result<ComplianceReport>

**예제**:
```freelang
let gdpr_report = auditor.generate_report(
  regulation: "GDPR",
  period: DateRange::new("2026-01-01", "2026-02-20")
)?

println("Violations: " + gdpr_report.violations)
println("Compliance score: " + gdpr_report.score)  // 0-100
```

---

### `auditor.check_gdpr_compliance() -> GDPRReport`

GDPR 준수 여부를 확인합니다.

**반환값**: GDPRReport

**예제**:
```freelang
let gdpr = auditor.check_gdpr_compliance()
println("Data processing agreements: " + gdpr.has_dpa)
println("Privacy policy exists: " + gdpr.has_privacy_policy)
println("Encryption enabled: " + gdpr.has_encryption)
println("DPIA completed: " + gdpr.has_dpia)
```

---

### `auditor.check_ccpa_compliance() -> CCPAReport`

CCPA 준수 여부를 확인합니다.

**반환값**: CCPAReport

**예제**:
```freelang
let ccpa = auditor.check_ccpa_compliance()
println("Data sale opt-out: " + ccpa.has_opt_out)
println("Consumer rights: " + ccpa.supports_dsar)
```

---

### `auditor.track_data_lifecycle(data_id: String) -> DataLifecycleReport`

데이터의 생명주기를 추적합니다.

**매개변수**:
- `data_id` (String): 데이터 ID

**반환값**: DataLifecycleReport

**예제**:
```freelang
let lifecycle = auditor.track_data_lifecycle("customer_123")
println("Created at: " + lifecycle.created_at)
println("Last accessed: " + lifecycle.last_accessed)
println("Scheduled deletion: " + lifecycle.scheduled_deletion)
```

---

### `auditor.generate_dpia(project_name: String) -> Result<DPIAReport>`

데이터 보호 영향 평가(DPIA) 리포트를 생성합니다.

**매개변수**:
- `project_name` (String): 프로젝트명

**반환값**: Result<DPIAReport>

**예제**:
```freelang
let dpia = auditor.generate_dpia("new_marketing_app")?
println("Risk level: " + dpia.risk_level)  // Low, Medium, High
println("Recommendations: " + dpia.recommendations)
```

---

## 공통 타입

### ClassificationResult

```freelang
type ClassificationResult {
  categories: List<String>
  sensitivity: String  // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  confidence: Float  // 0.0-1.0
  details: Map
}
```

### PersonalData

```freelang
type PersonalData {
  user_id: String
  data_types: List<String>
  records_count: Integer
  total_size: Integer
  last_modified: Timestamp
  encrypted: bool
}
```

### ScanResult

```freelang
type ScanResult {
  matches: List<String>
  action: String  // "Allow" | "Block" | "Warn" | "Redact"
  has_violations: bool
  details: List<ViolationDetail>
}
```

---

## 에러 처리

```freelang
match crypto.encrypt_at_rest(data) {
  Ok(encrypted) => println("Encrypted: " + encrypted),
  Err(err) => println("Encryption failed: " + err.message)
}
```

---

**문서 버전**: 1.0.0
**최종 수정**: 2026-02-20
