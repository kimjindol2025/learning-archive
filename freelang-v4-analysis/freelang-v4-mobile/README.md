# FreeLang v4 Mobile

## 개요

FreeLang v4 Mobile은 iOS, Android, 크로스플랫폼 모바일 애플리케이션 개발을 위한 통합 프레임워크입니다. 네이티브 성능과 크로스플랫폼 생산성을 제공합니다.

## 주요 기능

### 1. 크로스플랫폼 개발
- 단일 코드베이스로 iOS/Android 지원
- 네이티브 API 접근
- 플랫폼별 최적화
- 점진적 마이그레이션 지원

### 2. UI/UX 프레임워크
- 선언형 UI 구성
- 반응형 레이아웃
- 테마 및 스타일 시스템
- 애니메이션 및 전환

### 3. 네트워크 및 데이터
- HTTP/REST 클라이언트
- WebSocket 지원
- 로컬 데이터베이스 (SQLite)
- 동기화 및 캐싱

### 4. 오프라인 지원
- 오프라인 우선 아키텍처
- 자동 동기화
- 충돌 해결
- 캐시 관리

### 5. 성능 최적화
- 메모리 관리
- 배터리 최적화
- 네트워크 대역폭 절감
- 빠른 시작 시간

### 6. 보안
- 생체 인증
- 안전한 저장소
- 데이터 암호화
- TLS/SSL

## 성능 특성

- **시작 시간**: <2초 (콜드 스타트)
- **메모리 사용량**: 50-100MB (기본)
- **배터리 소비**: <5% (1시간 일반 사용)
- **네트워크 지연 시간**: <100ms (평균)

## 설치

```bash
git clone https://gogs.dclub.kr/kim/freelang-v4-mobile.git
cd freelang-v4-mobile
npm install
npm run build
```

## 프로젝트 구조

```
freelang-v4-mobile/
├── core/              # 핵심 라이브러리
├── ui/                # UI 컴포넌트
├── platforms/
│   ├── ios/          # iOS 특화 코드
│   └── android/      # Android 특화 코드
├── examples/          # 예제 앱
├── tests/             # 테스트
└── docs/              # 문서
```

## 사용법

### 기본 앱 구조

```freelang
// App.fl - 메인 애플리케이션
app MyApp {
  state {
    title: String = "My App"
    items: List<Item> = []
  }

  layout {
    view {
      header {
        title(text: state.title)
      }
      body {
        list {
          for item in state.items {
            item_view(item: item)
          }
        }
      }
    }
  }

  actions {
    on_load => {
      load_items()
    }
  }
}
```

### UI 컴포넌트

```freelang
// 텍스트 입력
text_input {
  placeholder: "Enter name"
  on_change: |text| {
    state.name = text
  }
}

// 버튼
button {
  text: "Submit"
  on_press: || {
    submit_form()
  }
}

// 리스트
list {
  items: state.items
  item_template: |item| {
    text(item.title)
  }
}

// 이미지
image {
  source: "https://example.com/image.png"
  width: 200
  height: 200
}
```

### 네트워크 요청

```freelang
let client = HttpClient::new()
  .with_timeout(30)
  .with_interceptor(auth_interceptor)

// GET 요청
let users = client.get("https://api.example.com/users")

// POST 요청
let response = client.post(
  url: "https://api.example.com/users",
  body: {
    name: "John",
    email: "john@example.com"
  }
)

// WebSocket
let ws = WebSocket::connect("wss://api.example.com/events")
ws.on_message(|msg| {
  handle_event(msg)
})
```

### 로컬 데이터베이스

```freelang
let db = Database::open("myapp.db")

// 스키마 정의
db.create_table("users", {
  id: Integer(primary_key: true),
  name: String,
  email: String(unique: true),
  created_at: Timestamp
})

// 데이터 저장
db.insert("users", {
  name: "John",
  email: "john@example.com",
  created_at: now()
})

// 데이터 조회
let users = db.query("SELECT * FROM users WHERE name = ?", ["John"])

// 동기화
db.sync_with_remote(
  url: "https://api.example.com/sync",
  table: "users"
)
```

### 오프라인 지원

```freelang
let sync = SyncManager::new()
  .with_conflict_resolution(ConflictResolution::LastWrite)
  .with_retry_policy(RetryPolicy::Exponential)

// 오프라인 변경사항 추적
let mutation = sync.track_mutation(
  table: "users",
  operation: Operation::Update,
  data: { id: 1, name: "Jane" }
)

// 온라인 복귀 시 동기화
sync.on_online(|| {
  sync.sync_all()
})
```

### 생체 인증

```freelang
let auth = BiometricAuth::new()

// 지문 인증
let result = auth.authenticate(
  type: BiometricType::Fingerprint,
  reason: "로그인이 필요합니다"
)

if result.is_success() {
  login_user()
}

// 얼굴 인식
let face_result = auth.authenticate(
  type: BiometricType::FaceID
)
```

### 푸시 알림

```freelang
let push = PushNotification::new()
  .with_api_key("your-api-key")

// 로컬 알림
push.schedule_local(
  title: "Reminder",
  body: "Don't forget!",
  delay_seconds: 60
)

// 원격 알림 수신
push.on_notification_received(|notification| {
  handle_notification(notification)
})
```

## 모범 사례

### 1. 반응형 설계
- 다양한 화면 크기 지원
- 방향 변경 처리
- Safe Area 고려

### 2. 성능
- 이미지 최적화
- 리스트 가상화
- 메모리 누수 방지
- 배터리 효율

### 3. 사용자 경험
- 부드러운 애니메이션
- 즉시 응답성
- 오류 처리
- 오프라인 모드

### 4. 보안
- 민감 데이터 암호화
- 생체 인증 활용
- HTTPS 강제
- 보안 저장소

### 5. 테스트
- 단위 테스트
- UI 테스트
- 성능 테스트
- 기기별 테스트

## 아키텍처

```
┌─────────────────────────────────────────┐
│   Application Layer                     │
├─────────────────────────────────────────┤
│   FreeLang Mobile Framework             │
│  ┌────────────────────────────────────┐ │
│  │ UI Layer                           │ │
│  │ - Components                       │ │
│  │ - Layouts                          │ │
│  │ - Navigation                       │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Business Logic                     │ │
│  │ - State Management                 │ │
│  │ - Event Handling                   │ │
│  │ - Data Processing                  │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Data Layer                         │ │
│  │ - Network (HTTP/WebSocket)         │ │
│  │ - Local Database                   │ │
│  │ - Synchronization                  │ │
│  │ - Caching                          │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Platform Abstraction               │ │
│  │ - iOS Bridge                       │ │
│  │ - Android Bridge                   │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│   Native Platform APIs                  │
│   - iOS (Swift/Objective-C)             │
│   - Android (Java/Kotlin)               │
└─────────────────────────────────────────┘
```

## 플랫폼 지원

| 기능 | iOS | Android |
|-----|-----|---------|
| UI 렌더링 | ✅ | ✅ |
| 네트워크 | ✅ | ✅ |
| 데이터베이스 | ✅ | ✅ |
| 생체 인증 | ✅ | ✅ |
| 푸시 알림 | ✅ | ✅ |
| 오프라인 | ✅ | ✅ |

## 테스트

```bash
npm test
npm run test:ios
npm run test:android
```

## 빌드

```bash
npm run build:ios
npm run build:android
npm run build:universal
```

## 라이선스

MIT License

---

**마지막 수정**: 2026-02-20
**버전**: 1.0.0
**관리자**: FreeLang Development Team
