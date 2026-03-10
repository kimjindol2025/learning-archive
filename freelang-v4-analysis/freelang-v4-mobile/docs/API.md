# FreeLang v4 Mobile API 문서

## 목차

1. [AppBuilder](#appbuilder)
2. [UIComponents](#uicomponents)
3. [HttpClient](#httpclient)
4. [Database](#database)
5. [SyncManager](#syncmanager)
6. [BiometricAuth](#biometricauth)
7. [PushNotification](#pushnotification)

---

## AppBuilder

모바일 앱을 구성하는 빌더입니다.

### `AppBuilder::new(name: String) -> AppBuilder`

새로운 앱 빌더를 생성합니다.

**매개변수**:
- `name` (String): 앱 이름

**반환값**: AppBuilder 인스턴스

**예제**:
```freelang
let app = AppBuilder::new("MyApp")
```

---

### `app.with_version(version: String) -> AppBuilder`

앱 버전을 설정합니다.

**매개변수**:
- `version` (String): 버전 문자열 (예: "1.0.0")

**반환값**: AppBuilder (메서드 체이닝)

**예제**:
```freelang
app.with_version("1.0.0")
```

---

### `app.with_icon(path: String) -> AppBuilder`

앱 아이콘을 설정합니다.

**매개변수**:
- `path` (String): 아이콘 파일 경로

**반환값**: AppBuilder (메서드 체이닝)

**예제**:
```freelang
app.with_icon("assets/icon.png")
```

---

### `app.with_theme(theme: Theme) -> AppBuilder`

앱 테마를 설정합니다.

**매개변수**:
- `theme` (Theme): 테마 객체

**반환값**: AppBuilder (메서드 체이닝)

**예제**:
```freelang
app.with_theme({
  primary_color: "#2196F3",
  accent_color: "#FF5722",
  dark_mode: false
})
```

---

### `app.add_screen(screen_name: String, layout: Layout) -> AppBuilder`

화면을 추가합니다.

**매개변수**:
- `screen_name` (String): 화면 이름
- `layout` (Layout): 레이아웃

**반환값**: AppBuilder (메서드 체이닝)

**예제**:
```freelang
app.add_screen("home", home_layout)
   .add_screen("profile", profile_layout)
   .add_screen("settings", settings_layout)
```

---

### `app.build() -> Result<MobileApp>`

앱을 빌드합니다.

**반환값**: Result<MobileApp>

**예제**:
```freelang
let mobile_app = app.build()?
```

---

## UIComponents

UI 컴포넌트 라이브러리입니다.

### `Text::new(text: String) -> Text`

텍스트 컴포넌트를 생성합니다.

**매개변수**:
- `text` (String): 표시할 텍스트

**반환값**: Text 인스턴스

**예제**:
```freelang
let title = Text::new("Welcome")
  .with_size(24)
  .with_color("#000000")
  .with_bold(true)
```

---

### `Button::new(text: String, on_press: Function) -> Button`

버튼 컴포넌트를 생성합니다.

**매개변수**:
- `text` (String): 버튼 텍스트
- `on_press` (Function): 클릭 콜백

**반환값**: Button 인스턴스

**예제**:
```freelang
let submit_btn = Button::new("Submit", || {
  submit_form()
})
  .with_background("#2196F3")
  .with_text_color("#FFFFFF")
```

---

### `TextInput::new(placeholder: String) -> TextInput`

텍스트 입력 컴포넌트를 생성합니다.

**매개변수**:
- `placeholder` (String): 플레이스홀더 텍스트

**반환값**: TextInput 인스턴스

**예제**:
```freelang
let email_input = TextInput::new("Enter email")
  .with_keyboard_type("email")
  .on_change(|text| {
    state.email = text
  })
```

---

### `List::new(items: List<T>) -> List<T>`

리스트 컴포넌트를 생성합니다.

**매개변수**:
- `items` (List<T>): 리스트 아이템

**반환값**: List<T> 인스턴스

**예제**:
```freelang
let users_list = List::new(users)
  .item_builder(|item, index| {
    ListItem::new(item.name)
  })
  .on_item_click(|item| {
    navigate_to_detail(item.id)
  })
```

---

### `Image::new(source: String) -> Image`

이미지 컴포넌트를 생성합니다.

**매개변수**:
- `source` (String): 이미지 URL 또는 경로

**반환값**: Image 인스턴스

**예제**:
```freelang
let profile_image = Image::new("https://api.example.com/users/1/avatar.png")
  .with_width(100)
  .with_height(100)
  .with_border_radius(50)
```

---

### `Card::new(content: Layout) -> Card`

카드 컴포넌트를 생성합니다.

**매개변수**:
- `content` (Layout): 카드 내용

**반환값**: Card 인스턴스

**예제**:
```freelang
let user_card = Card::new(
  Column::new(vec![
    Text::new("John Doe"),
    Text::new("john@example.com")
  ])
)
  .with_elevation(4)
  .on_click(|| {
    navigate_to_profile()
  })
```

---

## HttpClient

HTTP 클라이언트입니다.

### `HttpClient::new() -> HttpClient`

새로운 HTTP 클라이언트를 생성합니다.

**반환값**: HttpClient 인스턴스

**예제**:
```freelang
let client = HttpClient::new()
```

---

### `client.with_base_url(url: String) -> HttpClient`

기본 URL을 설정합니다.

**매개변수**:
- `url` (String): 기본 URL

**반환값**: HttpClient (메서드 체이닝)

**예제**:
```freelang
client.with_base_url("https://api.example.com")
```

---

### `client.with_timeout(seconds: Integer) -> HttpClient`

타임아웃을 설정합니다.

**매개변수**:
- `seconds` (Integer): 타임아웃 시간 (초)

**반환값**: HttpClient (메서드 체이닝)

**예제**:
```freelang
client.with_timeout(30)
```

---

### `client.with_auth(auth: Auth) -> HttpClient`

인증을 설정합니다.

**매개변수**:
- `auth` (Auth): 인증 정보

**반환값**: HttpClient (메서드 체이닝)

**예제**:
```freelang
client.with_auth(Auth::Bearer("token123"))
client.with_auth(Auth::Basic("user", "password"))
```

---

### `client.get(url: String) -> Result<Response>`

GET 요청을 수행합니다.

**매개변수**:
- `url` (String): 요청 URL

**반환값**: Result<Response>

**예제**:
```freelang
let response = client.get("/users")?
let users = response.json()?
```

---

### `client.post(url: String, body: Map) -> Result<Response>`

POST 요청을 수행합니다.

**매개변수**:
- `url` (String): 요청 URL
- `body` (Map): 요청 본문

**반환값**: Result<Response>

**예제**:
```freelang
let response = client.post("/users", {
  name: "Jane",
  email: "jane@example.com"
})?
let new_user = response.json()?
```

---

### `client.put(url: String, body: Map) -> Result<Response>`

PUT 요청을 수행합니다.

**매개변수**:
- `url` (String): 요청 URL
- `body` (Map): 요청 본문

**반환값**: Result<Response>

**예제**:
```freelang
client.put("/users/1", { name: "Jane Doe" })?
```

---

### `client.delete(url: String) -> Result<Response>`

DELETE 요청을 수행합니다.

**매개변수**:
- `url` (String): 요청 URL

**반환값**: Result<Response>

**예제**:
```freelang
client.delete("/users/1")?
```

---

## Database

로컬 데이터베이스입니다.

### `Database::open(file_name: String) -> Result<Database>`

데이터베이스를 엽니다.

**매개변수**:
- `file_name` (String): 데이터베이스 파일명

**반환값**: Result<Database>

**예제**:
```freelang
let db = Database::open("myapp.db")?
```

---

### `db.create_table(name: String, schema: Map) -> Result<void>`

테이블을 생성합니다.

**매개변수**:
- `name` (String): 테이블 이름
- `schema` (Map): 스키마 정의

**반환값**: Result<void>

**예제**:
```freelang
db.create_table("users", {
  id: {type: "INTEGER", primary_key: true},
  name: {type: "TEXT"},
  email: {type: "TEXT", unique: true},
  created_at: {type: "TIMESTAMP"}
})?
```

---

### `db.insert(table: String, data: Map) -> Result<Integer>`

데이터를 삽입합니다.

**매개변수**:
- `table` (String): 테이블 이름
- `data` (Map): 삽입할 데이터

**반환값**: Result<Integer> (삽입된 행 ID)

**예제**:
```freelang
let row_id = db.insert("users", {
  name: "John",
  email: "john@example.com",
  created_at: now()
})?
```

---

### `db.query(sql: String, params: List) -> Result<List<Map>>`

데이터를 조회합니다.

**매개변수**:
- `sql` (String): SQL 쿼리
- `params` (List): 파라미터

**반환값**: Result<List<Map>>

**예제**:
```freelang
let users = db.query("SELECT * FROM users WHERE name = ?", ["John"])?
for user in users {
  println(user.name + ": " + user.email)
}
```

---

### `db.update(table: String, data: Map, where_clause: String) -> Result<Integer>`

데이터를 업데이트합니다.

**매개변수**:
- `table` (String): 테이블 이름
- `data` (Map): 업데이트할 데이터
- `where_clause` (String): WHERE 조건

**반환값**: Result<Integer> (업데이트된 행 수)

**예제**:
```freelang
let updated = db.update("users",
  {name: "Jane"},
  "id = 1"
)?
```

---

### `db.delete(table: String, where_clause: String) -> Result<Integer>`

데이터를 삭제합니다.

**매개변수**:
- `table` (String): 테이블 이름
- `where_clause` (String): WHERE 조건

**반환값**: Result<Integer> (삭제된 행 수)

**예제**:
```freelang
let deleted = db.delete("users", "id = 1")?
```

---

## SyncManager

동기화 관리자입니다.

### `SyncManager::new() -> SyncManager`

새로운 동기화 관리자를 생성합니다.

**반환값**: SyncManager 인스턴스

**예제**:
```freelang
let sync = SyncManager::new()
```

---

### `sync.with_remote_url(url: String) -> SyncManager`

원격 서버 URL을 설정합니다.

**매개변수**:
- `url` (String): 원격 서버 URL

**반환값**: SyncManager (메서드 체이닝)

**예제**:
```freelang
sync.with_remote_url("https://api.example.com/sync")
```

---

### `sync.track_mutation(table: String, operation: String, data: Map) -> Result<Mutation>`

데이터 변경을 추적합니다.

**매개변수**:
- `table` (String): 테이블 이름
- `operation` (String): 작업 (Insert, Update, Delete)
- `data` (Map): 데이터

**반환값**: Result<Mutation>

**예제**:
```freelang
let mutation = sync.track_mutation(
  table: "users",
  operation: "Update",
  data: {id: 1, name: "Jane"}
)?
```

---

### `sync.sync_all() -> Result<SyncReport>`

모든 변경사항을 동기화합니다.

**반환값**: Result<SyncReport>

**예제**:
```freelang
let report = sync.sync_all()?
println("Synced: " + report.synced_count + " items")
if report.has_conflicts {
  resolve_conflicts(report.conflicts)
}
```

---

### `sync.on_online(callback: Function) -> void`

온라인 복귀 시 콜백을 등록합니다.

**매개변수**:
- `callback` (Function): 콜백 함수

**예제**:
```freelang
sync.on_online(|| {
  println("Back online!")
  sync.sync_all()
})
```

---

## BiometricAuth

생체 인증입니다.

### `BiometricAuth::new() -> BiometricAuth`

새로운 생체 인증을 생성합니다.

**반환값**: BiometricAuth 인스턴스

**예제**:
```freelang
let auth = BiometricAuth::new()
```

---

### `auth.is_available(type: BiometricType) -> bool`

생체 인증의 가용성을 확인합니다.

**매개변수**:
- `type` (BiometricType): 생체 타입 (Fingerprint, FaceID, Iris)

**반환값**: bool

**예제**:
```freelang
if auth.is_available(BiometricType::Fingerprint) {
  println("Fingerprint available")
}
```

---

### `auth.authenticate(type: BiometricType, reason: String) -> Result<AuthResult>`

생체 인증을 수행합니다.

**매개변수**:
- `type` (BiometricType): 생체 타입
- `reason` (String): 인증 이유

**반환값**: Result<AuthResult>

**예제**:
```freelang
let result = auth.authenticate(
  type: BiometricType::Fingerprint,
  reason: "로그인이 필요합니다"
)?

if result.is_success {
  login_user()
} else {
  show_error("인증 실패")
}
```

---

## PushNotification

푸시 알림입니다.

### `PushNotification::new() -> PushNotification`

새로운 푸시 알림을 생성합니다.

**반환값**: PushNotification 인스턴스

**예제**:
```freelang
let push = PushNotification::new()
```

---

### `push.with_api_key(key: String) -> PushNotification`

API 키를 설정합니다.

**매개변수**:
- `key` (String): API 키

**반환값**: PushNotification (메서드 체이닝)

**예제**:
```freelang
push.with_api_key("your-fcm-key")
```

---

### `push.schedule_local(notification: LocalNotification) -> Result<String>`

로컬 알림을 예약합니다.

**매개변수**:
- `notification` (LocalNotification): 알림 객체

**반환값**: Result<String> (알림 ID)

**예제**:
```freelang
let notif_id = push.schedule_local({
  title: "Reminder",
  body: "Don't forget!",
  delay_seconds: 60
})?
```

---

### `push.on_notification_received(callback: Function) -> void`

알림 수신 콜백을 등록합니다.

**매개변수**:
- `callback` (Function): 콜백 함수

**예제**:
```freelang
push.on_notification_received(|notification| {
  println("Notification: " + notification.title)
  handle_notification(notification)
})
```

---

## 공통 타입

### Response

```freelang
type Response {
  status: Integer
  headers: Map
  body: String
  json() -> Result<Map>
  text() -> String
}
```

### AuthResult

```freelang
type AuthResult {
  is_success: bool
  error_message: String?
  authenticated_at: Timestamp
}
```

---

**문서 버전**: 1.0.0
**최종 수정**: 2026-02-20
