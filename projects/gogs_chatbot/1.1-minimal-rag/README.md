# Gogs Chatbot 1.1 - Minimal RAG

최소한의 기능으로 작동하는 Gogs 저장소 기반 챗봇 (Minimal Retrieval-Augmented Generation)

## 📦 1.1 전체 구조

```
1️⃣ gogs-api.js        → Gogs API 통합
2️⃣ search.js          → 키워드 기반 검색
3️⃣ llm.js            → Claude API 통합
4️⃣ validator.js      → 기록 기반 응답 검증
5️⃣ server.js         → Express 서버
🧪 tests/             → 테스트 모듈
```

## 🚀 시작하기

### 설치

```bash
npm install
```

### 환경 설정

`.env` 파일 생성 (`.env.example` 참고):

```env
GOGS_API_URL=https://gogs.dclub.kr/api/v1
GOGS_TOKEN=your_token_here
CLAUDE_API_KEY=your_key_here
PORT=3000
DEFAULT_REPO_OWNER=kim
DEFAULT_REPO_NAME=zlang-project
```

### 서버 시작

```bash
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 📚 모듈 설명

### 1️⃣ gogs-api.js (Gogs API 통합)

저장소 접근 및 파일 콘텐츠 조회:

```javascript
// 파일 콘텐츠 조회
const content = await gogsApi.getFileContent('kim', 'zlang-project', 'README.md');

// 파일 목록 조회
const files = await gogsApi.listFiles('kim', 'zlang-project', '');

// 마크다운 파일 수집
const mdFiles = await gogsApi.collectMarkdownFiles('kim', 'zlang-project');
```

### 2️⃣ search.js (키워드 검색)

정규식 기반의 단순 검색:

```javascript
// 콘텐츠에서 검색
const results = search.searchInContent(content, 'npm');

// 여러 파일에서 검색
const fileResults = search.searchInFiles(files, 'install');

// 결과 순위 지정
const ranked = search.rankResults(fileResults);
```

### 3️⃣ llm.js (Claude API)

Claude AI를 통한 자연어 응답:

```javascript
// 프롬프트 생성
const prompt = llm.generatePrompt(query, context);

// 답변 생성
const answer = await llm.generateAnswer(query, context);
```

### 4️⃣ validator.js (응답 검증)

기록 기반 검증:

```javascript
// 응답 검증
const validation = validator.validateResponse(response);

// 검색 결과 검증
const searchValidation = validator.validateSearchResults(results);

// 일관성 확인
const consistency = validator.validateConsistency(prompt, response, context);
```

### 5️⃣ server.js (Express 서버)

REST API 엔드포인트:

```
POST /chat          - 채팅 요청
GET /search         - 검색
GET /cache          - 캐시 상태
GET /info           - 저장소 정보
GET /               - 헬스 체크
```

## 🧪 테스트

### Gogs API 테스트

```bash
npm run test:gogs
```

저장소 접근 및 파일 조회 테스트:
- 저장소 정보 조회
- 파일 목록 조회
- 파일 콘텐츠 조회
- 파일 검색
- 마크다운 파일 수집

### 검색 및 검증 테스트

```bash
npm run test:search
```

검색 및 검증 기능 테스트:
- 키워드 검색
- 결과 순위 지정
- 응답 검증
- 일관성 확인

## 🔗 API 사용 예시

### 1. 채팅 요청

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "npm 설치 방법"}'
```

응답:

```json
{
  "status": "success",
  "query": "npm 설치 방법",
  "answer": "프로젝트를 설치하려면...",
  "searchResults": {
    "total": 5,
    "ranked": [...]
  },
  "context": [...],
  "validation": {...},
  "metadata": {...}
}
```

### 2. 검색

```bash
curl "http://localhost:3000/search?q=npm&limit=10"
```

### 3. 캐시 상태

```bash
curl http://localhost:3000/cache
```

### 4. 저장소 정보

```bash
curl http://localhost:3000/info
```

## 🧱 1.1 구성 요소

| 파일 | 기능 | 라인 수 |
|------|------|--------|
| gogs-api.js | Gogs API 통합 | ~130 |
| search.js | 키워드 검색 | ~130 |
| llm.js | Claude API | ~110 |
| validator.js | 응답 검증 | ~180 |
| server.js | Express 서버 | ~220 |
| test-gogs.js | API 테스트 | ~150 |
| test-search.js | 검색 테스트 | ~280 |

**총계**: ~1,200 줄

## 📊 1.1 특징

✅ **Minimal RAG**
- 벡터 DB 없음
- ML 모델 훈련 없음
- 순수 텍스트 검색

✅ **기록 기반 검증**
- 응답 유효성 확인
- 검색 결과 검증
- 일관성 확인

✅ **완전한 테스트**
- Gogs API 테스트 (5가지)
- 검색 테스트 (10가지)

✅ **프로덕션 구조**
- 캐싱 시스템
- 에러 핸들링
- 메타데이터 수집

## 🔄 동작 흐름

```
사용자 질문
    ↓
1. Gogs에서 파일 수집 (캐시)
    ↓
2. 키워드 검색
    ↓
3. 결과 순위 지정
    ↓
4. 콘텍스트 추출 (상위 3개)
    ↓
5. Claude API로 답변 생성
    ↓
6. 응답 검증
    ↓
7. 결과 반환
```

## 🎯 다음 단계 (1.2 예정)

- 청킹 (Chunking) 도입
- 시맨틱 유사성 (추가 검색)
- 응답 캐싱
- 대화 기록 관리

## 📝 라이선스

MIT

## 👤 작성자

Claude Haiku 4.5

---

**상태**: ✅ Production Ready (1.1)
**마지막 업데이트**: 2026-02-27
