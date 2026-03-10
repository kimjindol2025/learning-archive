# gogs.toml 명세서 (v17.0)

## 🎯 개요

**gogs.toml**은 Gogs-Lang 프로젝트의 메타데이터, 의존성, 빌드 설정을 정의하는 설정 파일입니다.

마치 Rust의 Cargo.toml처럼, Gogs-Lang의 생태계를 통합하는 **중추 설정 파일**입니다.

**철학**: "기록이 증명이다 gogs" — 모든 설정은 명확하고, 재현 가능하고, 추적 가능해야 합니다.

---

## 📋 파일 위치 및 기본 구조

```
my_project/
├── gogs.toml              # 프로젝트 설정 (필수)
├── gogs.lock              # 의존성 lock 파일 (자동 생성)
├── src/
│   ├── main.gogs          # 진입점
│   └── lib.gogs           # 라이브러리
├── examples/
│   └── example.gogs
├── tests/
│   └── integration.test.gogs
└── docs/
    └── README.md
```

---

## 🔧 [package] 섹션

패키지의 기본 메타데이터를 정의합니다.

### 필수 필드

```toml
[package]
name = "my_gogs_project"          # 패키지 이름 (영문, 소문자, 대시 가능)
version = "0.1.0"                 # Semantic Versioning (MAJOR.MINOR.PATCH)
edition = "2026"                  # Gogs 언어 에디션 (2024, 2026 등)
```

### 선택 필드

```toml
[package]
name = "gogs_web_server"
version = "0.1.0"
edition = "2026"

# 작성자 정보
authors = ["Alice <alice@example.com>", "Bob <bob@example.com>"]

# 설명
description = "A high-performance web server written in Gogs"

# 라이선스
license = "MIT"                   # MIT, Apache-2.0, GPL-3.0 등

# 저장소
repository = "https://github.com/user/gogs_web_server"
homepage = "https://example.com"
documentation = "https://docs.example.com"

# 키워드 및 카테고리 (검색 용도)
keywords = ["web", "server", "http", "async"]
categories = ["web", "network-programming"]

# 읽기 파일
readme = "README.md"              # 패키지 매니저에서 표시할 README

# 최소 필요 Gogs 버전
gogs-version = ">=1.0.0"
```

---

## 🔗 [dependencies] 섹션

외부 라이브러리 의존성을 정의합니다.

### 기본 문법

```toml
[dependencies]
# 간단한 버전 지정
serde = "1.0.0"                   # 정확한 버전
tokio = "1.0"                     # 최소 버전 (1.0.x까지 허용)
log = "0.4.*"                     # 와일드카드
regex = ">=0.2, <0.3"             # 범위 지정

# 상세 지정
serde = { version = "1.0.0", features = ["derive"] }

# 로컬 경로 참조
my_lib = { path = "../libs/my_lib" }

# Git 저장소
gogs_http = { git = "https://github.com/gogs/http", branch = "main" }

# 선택적 의존성
openssl = { version = "0.10", optional = true }
```

### 버전 지정 규칙

```toml
[dependencies]
serde = "1.0.0"        # 정확히 1.0.0
tokio = "1.0"          # ^1.0 (1.0.0 이상, 2.0.0 미만)
log = "0.4.*"          # 0.4.x (0.4.0 이상, 0.5.0 미만)
regex = "0.2, <0.3"    # 0.2.0 이상, 0.3.0 미만
```

### 예제: 실전 의존성

```toml
[dependencies]
# 웹 서버 구축
gogs_http = "1.2.0"
gogs_tokio = { version = "1.3.0", features = ["full"] }

# JSON 처리
gogs_json = "0.5.0"

# 로깅
gogs_log = "0.4.0"

# 데이터베이스 (선택적)
gogs_sqlx = { version = "0.7.0", optional = true }

# 로컬 모듈
common_utils = { path = "../common" }

# Git 최신 버전
experimental_feature = { git = "https://github.com/gogs/experimental", branch = "develop" }
```

---

## 🧪 [dev-dependencies] 섹션

테스트와 예제에서만 사용되는 의존성입니다.

```toml
[dev-dependencies]
gogs_test_utils = "1.0.0"
gogs_mockito = "0.8.0"
gogs_criterion = "0.3.0"          # 벤치마크 도구
```

---

## ⚙️ [build-settings] 섹션

컴파일러와 빌드 옵션을 제어합니다.

```toml
[build-settings]
# 최적화 수준
opt-level = 3                     # 0 (none) ~ 3 (max)

# 디버그 정보
debug = false                     # true면 디버그 심볼 포함

# 린트 레벨
lint-level = "warn"              # "allow", "warn", "deny"

# 경고를 오류로 취급
warnings-as-errors = false

# 병렬 컴파일
parallel-jobs = 4                 # 0이면 CPU 코어 수 자동 감지

# 증분 컴파일
incremental = true

# LTO (Link Time Optimization)
lto = "thin"                      # "no", "thin", "fat"

# 코드 생성 단위
codegen-units = 256               # 낮을수록 최적화, 높을수록 컴파일 빠름
```

### 프로필별 설정

```toml
[profile.dev]
opt-level = 0
debug = true
split-debuginfo = "packed"

[profile.release]
opt-level = 3
debug = false
lto = "fat"
codegen-units = 1

[profile.bench]
opt-level = 3
debug = false
lto = "thin"
```

---

## 🎯 [features] 섹션

조건부 컴파일 기능을 정의합니다.

```toml
[features]
default = ["std", "logging"]      # 기본 활성 기능

# 기능 정의
std = []                          # 표준 라이브러리 사용
logging = ["gogs_log"]            # 로깅 활성화 (의존성 필요)
async = ["tokio"]                 # 비동기 지원
database = ["gogs_sqlx"]          # 데이터베이스 지원
all = ["std", "logging", "async", "database"]  # 모든 기능 활성화
```

### 기능 사용

```bash
# 특정 기능 활성화
gogs build --features async
gogs build --features "async,database"

# 기본 기능 제외
gogs build --no-default-features
gogs build --no-default-features --features async
```

---

## 📦 [target] 섹션

플랫폼별 설정 (멀티 플랫폼 지원)

```toml
[target.x86_64-unknown-linux-gnu]
runner = "qemu-x86_64"            # 커스텀 실행기

[target.wasm32-unknown-unknown]
runner = "wasm-runner"
```

---

## 🚀 [publish] 섹션

패키지 배포 설정

```toml
[publish]
# 배포 가능한 저장소
allowed-registries = ["gogs.io", "internal-registry"]

# 배포 제외
exclude = ["*.md", "examples/**"]

# 배포 포함 (명시적)
include = ["src/**/*.gogs", "Cargo.toml"]

# 라이선스 파일 포함
license-file = "LICENSE"
```

---

## 📖 [doc] 섹션

문서화 설정

```toml
[doc]
# 문서 생성
rustdoc-args = ["--default-theme", "light"]

# README 포함
readme = "README.md"

# API 문서 공개
publish = true
```

---

## 🏗️ [workspace] 섹션

멀티 패키지 프로젝트 (모노레포)

```toml
[workspace]
members = [
    "crates/core",
    "crates/cli",
    "crates/macros"
]
exclude = ["crates/deprecated"]
```

---

## 📝 완전한 gogs.toml 예제

### 1. 간단한 CLI 도구

```toml
[package]
name = "gogs_cli_tool"
version = "0.1.0"
edition = "2026"
authors = ["Developer <dev@example.com>"]
description = "A command-line tool written in Gogs"
license = "MIT"
repository = "https://github.com/user/gogs_cli_tool"

[dependencies]
clap = "3.0"                      # CLI 파싱
serde = { version = "1.0", features = ["derive"] }
gogs_json = "0.5"

[dev-dependencies]
gogs_test_utils = "1.0"

[build-settings]
opt-level = 2
debug = false

[features]
default = ["json"]
json = ["gogs_json"]
```

### 2. 웹 서버 (고급)

```toml
[package]
name = "gogs_web_server"
version = "1.0.0"
edition = "2026"
authors = ["The Gogs Team"]
description = "High-performance web server for Gogs applications"
license = "Apache-2.0"
repository = "https://github.com/gogs/web_server"
homepage = "https://gogs.io"
documentation = "https://docs.gogs.io"
keywords = ["web", "http", "server", "async"]
categories = ["web", "network-programming"]

[dependencies]
# 웹 프레임워크
gogs_axum = "1.0.0"

# 비동기 런타임
gogs_tokio = { version = "1.0", features = ["full"] }

# JSON 직렬화
gogs_serde_json = "0.5.0"

# 로깅
gogs_tracing = "0.1.0"
gogs_tracing_subscriber = "0.3.0"

# 로컬 모듈
server_core = { path = "./crates/core" }
middleware = { path = "./crates/middleware" }

# 선택적 의존성
openssl = { version = "0.10", optional = true }
rustls = { version = "0.20", optional = true }

[dev-dependencies]
gogs_tokio_test = "0.4.0"
gogs_mockito = "0.8.0"
gogs_criterion = "0.3.0"

[features]
default = ["std", "http2"]
std = []
http2 = []
https = ["openssl"]
tls = ["rustls"]
all = ["std", "http2", "https", "tls"]

[profile.release]
opt-level = 3
debug = false
lto = "fat"
codegen-units = 1
strip = true

[profile.bench]
opt-level = 3
lto = "thin"

[build-settings]
opt-level = 3
debug = false
parallel-jobs = 8
incremental = true

[publish]
exclude = ["examples/**", "benches/**", ".github/**"]
license-file = "LICENSE"

[workspace]
members = [
    "crates/core",
    "crates/middleware",
    "crates/plugins"
]
```

### 3. 라이브러리 (최소)

```toml
[package]
name = "gogs_math"
version = "0.1.0"
edition = "2026"
authors = ["You"]

[dependencies]
# 의존성 없음 (순수 Gogs)

[lib]
name = "gogs_math"
path = "src/lib.gogs"
```

---

## 🔄 gogs.lock 파일

`gogs.lock`은 **의존성 잠금 파일**로, 정확한 버전을 기록합니다 (자동 생성).

```
# gogs.lock 예제
[[package]]
name = "gogs_http"
version = "1.2.0"

[[package]]
name = "gogs_json"
version = "0.5.1"

[[package]]
name = "serde"
version = "1.0.0"
```

**중요**: gogs.lock은 **반드시 버전 관리(Git)에 커밋**해야 합니다.
- 팀원들과 동일한 버전 사용 보장
- 재현 가능한 빌드 보장
- "기록이 증명이다" 철학 구현

---

## 🎓 철학: "기록이 증명이다 gogs"

### gogs.toml이 추구하는 가치

1. **명확성 (Clarity)**
   - 모든 설정은 명시적이고 이해하기 쉬워야 함
   - 암묵적 기본값 최소화

2. **재현성 (Reproducibility)**
   - gogs.lock으로 정확한 버전 기록
   - 누구나 같은 환경에서 빌드 가능

3. **추적 가능성 (Traceability)**
   - 의존성의 출처 명확히 기록
   - Git 저장소 주소, 버전 모두 기록

4. **하위 호환성 (Backward Compatibility)**
   - 이전 gogs.toml은 항상 작동해야 함
   - 언어 발전으로 인한 파괴는 신중히

5. **확장성 (Extensibility)**
   - 새로운 필드 추가 가능
   - 커뮤니티의 피드백 반영

---

## 📋 명령어 참조

```bash
# 새 프로젝트 생성
gogs new my_project
gogs new --lib my_library

# 의존성 추가
gogs add tokio
gogs add serde --features derive
gogs add openssl --optional

# 의존성 업데이트
gogs update                       # 모든 의존성 업데이트
gogs update tokio                 # 특정 의존성만 업데이트

# 빌드
gogs build
gogs build --release
gogs build --features async

# 테스트
gogs test
gogs test --release

# 문서 생성
gogs doc --open

# 배포
gogs publish

# 의존성 확인
gogs tree                         # 의존성 트리 표시
```

---

## 🚀 다음 단계

1. **표준 라이브러리 (gogs-std)**
   - I/O 모듈 (파일, 네트워크)
   - 컬렉션 (Vec, HashMap, BTreeMap)
   - 문자열 처리
   - 수학 함수

2. **패키지 레지스트리 (gogs.io)**
   - 중앙 저장소
   - 버전 관리
   - 다운로드 추적

3. **문서화 도구 (gogs-doc)**
   - 주석에서 자동 문서 생성
   - HTML 출력
   - 검색 기능

4. **CI/CD 통합**
   - GitHub Actions 연동
   - 자동 테스트
   - 자동 배포

---

## 📌 최종 선언

**gogs.toml은 Gogs-Lang의 "사회계약서"입니다.**

이 파일을 통해 개발자들은:
- ✨ 자신의 프로젝트를 명확하게 정의하고
- ✨ 다른 개발자의 코드를 신뢰하고 사용하며
- ✨ 커뮤니티와 협력하여
- ✨ 지속 가능한 생태계를 함께 만듭니다

**"기록이 증명이다 gogs"**

모든 코드의 출처, 버전, 의존성이 명확하게 기록되고,
누구나 그 기록을 검증하고 재현할 수 있을 때,
비로소 우리의 언어는 신뢰받는 언어가 됩니다.

---

**작성일**: 2026-02-23
**Gogs-Lang v17.0 표준 명세**
**철학**: "기록이 증명이다 gogs"
