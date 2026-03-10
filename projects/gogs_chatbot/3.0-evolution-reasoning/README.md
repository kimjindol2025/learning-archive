# 3.0 시간축 진화 추론 엔진

**Temporal Evolution Reasoning Engine using Git DAG Analysis**

> 검색(Search)에서 진화 분석(Evolution Reasoning)으로의 전환
>
> 버전 인식형 Git DAG 분석을 통한 프로젝트 진화 추론

---

## 📋 개요

### 핵심 개념

3.0 엔진은 **시간축 기반의 진화 분석**에 중점을 두고 있습니다. 검색 중심의 1.0-2.0 버전에서 벗어나, Git 커밋 히스토리를 통해 다음을 분석합니다:

- **버전 진화**: v1.0 → v2.0 간의 변화를 추적
- **기능 생애 주기**: 특정 기능이 도입→확장→안정화→제거되는 과정
- **설계 의도**: 아키텍처, 성능, 안전성 관련 커밋들로부터 설계 의도 추출
- **기능 간 의존성**: 기능 간의 상호작용 관계 파악
- **진화 속도**: 기능별 개발 속도 및 활동 밀도 계산

### 아키텍처

```
Git Repository
    ↓
[1] git-dag.js          → Git DAG 추출 및 분석
    ↓
[2] commit-parser.js    → Commit 메시지 파싱 및 분류
    ↓
[3] diff-analyzer.js    → 변화 분석 및 패턴 감지
    ↓
[4] evolution-tracker.js → 기능 생애 주기 및 의존성
    ↓
[5] report-generator.js  → 최종 리포트 생성 및 마크다운 변환
```

---

## 🔧 모듈 설명

### 1. `git-dag.js` - Git DAG 추출 및 분석

**Directed Acyclic Graph (DAG) 기반 커밋 그래프 구축**

#### 주요 함수

```javascript
// Git 로그 추출
extractCommitLog(repoPath, options)
// 형식: hash|parents|timestamp|message|author|email
// 반환: { hash, parents[], timestamp, message, author, email }[]

// DAG 구축
buildDAG(commits)
// 반환: { commits: {}, edges: [], roots: [], heads: [] }

// 파일 변경 히스토리
getFileHistory(repoPath, filePath)

// 키워드 검색
searchCommitsByKeyword(commits, keyword)

// 버전 간 진화 분석
analyzeVersionEvolution(dag, versionFrom, versionTo)
// 반환: { from, to, path, commitCount, timespan }

// DAG 통계
getDAGStatistics(dag)
// 반환: { totalCommits, totalEdges, roots, heads, authors, timespan }
```

#### 사용 예시

```javascript
import gitDag from './git-dag.js';

const commits = gitDag.extractCommitLog('/path/to/repo');
const dag = gitDag.buildDAG(commits);
const stats = gitDag.getDAGStatistics(dag);

console.log(`총 ${stats.totalCommits}개 commit, ${stats.authors}명 저자`);
console.log(`기간: ${stats.timespan.start} ~ ${stats.timespan.end}`);
```

---

### 2. `commit-parser.js` - Commit 메시지 분석

**구조화된 Commit 메시지 파싱 및 의도 추출**

#### 주요 함수

```javascript
// Commit 메시지 파싱
parseCommitMessage(message)
// 반환: { subject, body, type, scope, hasBreakingChange, references[] }

// 버전/단계 정보 추출
extractVersionInfo(commits)
// 반환: { commit, version, phase, parsed }[]

// 기능 도입 시점 추적
trackFeatureIntroduction(commits, featureName)
// 반환: { featureName, introduced, lastModified, commitCount }

// 주제별 Commit 분류
categorizeCommits(commits)
// 반환: { architecture, memory, safety, performance, testing, ... }[]

// 인과 관계 추론
inferCausality(commits, targetKeyword)
// 반환: { target, potentialCauses[] }
```

#### 지원 Commit 타입

- `feat` - 기능 추가
- `fix` - 버그 수정
- `docs` - 문서 작성
- `style` - 코드 스타일
- `refactor` - 리팩토링
- `perf` - 성능 최적화
- `test` - 테스트 추가
- `chore` - 기타 작업
- `version` - 버전 릴리스
- `phase` - 단계 마크
- `merge` - Merge 커밋

#### 사용 예시

```javascript
import commitParser from './commit-parser.js';

const commits = [/* ... */];
const categories = commitParser.categorizeCommits(commits);

console.log(`Architecture 관련: ${categories.architecture.length}개`);
console.log(`Performance 관련: ${categories.performance.length}개`);

const versions = commitParser.extractVersionInfo(commits);
versions.forEach(v => {
  console.log(`${v.version}: ${v.commit.message}`);
});
```

---

### 3. `diff-analyzer.js` - 변화 분석

**파일 변화 추적 및 패턴 감지**

#### 주요 함수

```javascript
// Diff 라인 파싱
parseDiffLines(diffText)
// 반환: { path, status, additions, deletions, changes }[]

// 파일 통계 계산
calculateFileStats(files)
// 반환: { totalFiles, added, deleted, modified, totalAdditions, totalDeletions }

// 주요 변화 감지
detectMajorChanges(files, threshold = 50)
// 반환: { path, status, change, ratio }[]

// 파일 타입별 분류
classifyByFileType(files)
// 반환: { code[], documentation[], tests[], config[], other[] }

// 개념 진화 추적
trackConceptEvolution(files, conceptKeywords)
// 반환: { file, keyword, change }[]

// 누적 변화 분석
accumulateDifferences(diffSequence)
// 반환: { totalFiles, totalAdditions, fileHistory, evolution[] }

// 변화 패턴 감지
detectChangePatterns(fileHistory)
// 반환: { newFeature[], refactoring[], expansion[], stabilization[] }
```

#### 지원 파일 분류

- **code**: `.rs`, `.ts`, `.js`, `.py`, `.go`, `.c`, `.cpp`, `.h`
- **documentation**: `.md`, `.txt`, `.rst`, `.adoc`
- **tests**: `test`, `spec` 포함
- **config**: `.json`, `.yml`, `.yaml`, `.toml`, `.cfg`
- **other**: 기타 파일

#### 사용 예시

```javascript
import diffAnalyzer from './diff-analyzer.js';

const diffOutput = `diff --git a/src/auth.js ...`;
const files = diffAnalyzer.parseDiffLines(diffOutput);
const stats = diffAnalyzer.calculateFileStats(files);

console.log(`파일: ${stats.totalFiles}개, 추가: +${stats.totalAdditions}, 삭제: -${stats.totalDeletions}`);

const patterns = diffAnalyzer.detectChangePatterns(fileHistory);
console.log(`새 기능: ${patterns.newFeature.length}개`);
console.log(`리팩토링: ${patterns.refactoring.length}개`);
```

---

### 4. `evolution-tracker.js` - 기능 생애 주기 추적

**시간 축 기반 기능 진화 분석**

#### 주요 함수

```javascript
// 기능 생애 주기 추적
traceFeatureLifecycle(dag, commits, featureName)
// 반환: { name, introduced, lastModified, stages[], events[] }

// 버전별 기능 추적
trackFeaturesByVersion(commits, versionCommits)
// 반환: { version: { added[], modified[], fixed[], refactored[] } }

// 기능 간 의존성 분석
analyzeDependencies(commits, features)
// 반환: { feature: { dependsOn[], requiredBy[] } }

// 진화 속도 계산
calculateEvolutionVelocity(commits, featureName)
// 반환: { totalCommits, timeSpanDays, commitsPerDay, activityDensity }

// 진화 요약
generateEvolutionSummary(lifecycle, velocity)
// 반환: { name, introduced, lastModified, totalMentions, stages, events, velocity }
```

#### 기능 진화 단계

- `introduction` - 기능 도입
- `expansion` - 기능 확장
- `modification` - 기능 수정
- `stabilization` - 기능 안정화
- `deprecation` - 기능 제거
- `other` - 기타

#### 사용 예시

```javascript
import evolutionTracker from './evolution-tracker.js';

const dag = gitDag.buildDAG(commits);
const lifecycle = evolutionTracker.traceFeatureLifecycle(dag, commits, 'auth');

console.log(`${lifecycle.name}: 도입 ${lifecycle.introduced.timestamp}`);
console.log(`마지막 수정: ${lifecycle.lastModified.timestamp}`);
console.log(`단계: ${lifecycle.stages.length}개`);
console.log(`주요 이벤트: ${lifecycle.events.length}개`);

const velocity = evolutionTracker.calculateEvolutionVelocity(commits, 'auth');
console.log(`commit/day: ${velocity.commitsPerDay}`);
```

---

### 5. `report-generator.js` - 리포트 생성

**구조화된 리포트 생성 및 마크다운 변환**

#### 주요 함수

```javascript
// 버전 진화 리포트
generateVersionReport(versionEvolution, diffStats)
// 반환: { type, from, to, commits, timespan, changes, content[] }

// 기능 생애 주기 리포트
generateFeatureLifecycleReport(lifecycle, velocity)
// 반환: { type, feature, introduced, lastModified, content[] }

// 버전 비교 리포트
generateComparisonReport(concept, versionData)
// 반환: { type, concept, versions, content[] }

// 설계 의도 분석 리포트
generateDesignIntentReport(commits)
// 반환: { type, content[] }

// 리포트를 마크다운으로 변환
reportToMarkdown(report)
// 반환: markdown string

// 리포트 검증
validateReport(report)
// 반환: { isValid, validations: { hasType, hasContent, contentValid } }
```

#### 리포트 타입

- `VERSION_EVOLUTION` - 버전 간 진화 분석
- `FEATURE_LIFECYCLE` - 기능 생애 주기
- `COMPARISON` - 버전 비교
- `DESIGN_INTENT` - 설계 의도 분석

#### 사용 예시

```javascript
import reportGenerator from './report-generator.js';

const evolution = gitDag.analyzeVersionEvolution(dag, 'v1.0.0', 'v2.0.0');
const report = reportGenerator.generateVersionReport(evolution, diffStats);

const markdown = reportGenerator.reportToMarkdown(report);
console.log(markdown);

const validation = reportGenerator.validateReport(report);
console.assert(validation.isValid, '리포트가 유효함');
```

---

## 🚀 사용 예시

### 예시 1: 버전 진화 분석

```javascript
import gitDag from './git-dag.js';
import reportGenerator from './report-generator.js';
import diffAnalyzer from './diff-analyzer.js';

// 1. Git DAG 추출
const commits = gitDag.extractCommitLog('/path/to/repo');
const dag = gitDag.buildDAG(commits);

// 2. 버전 간 진화 분석
const evolution = gitDag.analyzeVersionEvolution(dag, 'v1.0.0', 'v2.0.0');
console.log(`${evolution.from.message} → ${evolution.to.message}`);
console.log(`${evolution.commitCount}개 commit, ${evolution.timespan.days}일`);

// 3. 변화 분석
const diffOutput = gitDag.getCommitDiff('/path/to/repo', evolution.to.hash);
const files = diffAnalyzer.parseDiffLines(diffOutput);
const stats = diffAnalyzer.calculateFileStats(files);

// 4. 리포트 생성
const report = reportGenerator.generateVersionReport(evolution, stats);
const markdown = reportGenerator.reportToMarkdown(report);

console.log(markdown);
```

### 예시 2: 기능 생애 주기 분석

```javascript
import evolutionTracker from './evolution-tracker.js';
import reportGenerator from './report-generator.js';

// 1. 기능 생애 주기 추적
const dag = gitDag.buildDAG(commits);
const lifecycle = evolutionTracker.traceFeatureLifecycle(dag, commits, 'auth');

// 2. 진화 속도 계산
const velocity = evolutionTracker.calculateEvolutionVelocity(commits, 'auth');

// 3. 생애 주기 리포트 생성
const report = reportGenerator.generateFeatureLifecycleReport(lifecycle, velocity);
const markdown = reportGenerator.reportToMarkdown(report);

console.log(markdown);
```

### 예시 3: 설계 의도 추출

```javascript
import reportGenerator from './report-generator.js';

// 1. 모든 commit 분석
const commits = gitDag.extractCommitLog('/path/to/repo');

// 2. 설계 의도 분석
const report = reportGenerator.generateDesignIntentReport(commits);

// 3. 마크다운 리포트
const markdown = reportGenerator.reportToMarkdown(report);

console.log(markdown);
```

### 예시 4: 기능 간 의존성 분석

```javascript
import evolutionTracker from './evolution-tracker.js';

// 1. 기능 목록
const features = ['auth', 'cache', 'database', 'api'];

// 2. 의존성 분석
const dependencies = evolutionTracker.analyzeDependencies(commits, features);

// 3. 결과 확인
for (const feature of features) {
  console.log(`${feature}:`);
  console.log(`  - dependsOn: ${dependencies[feature].dependsOn.join(', ')}`);
  console.log(`  - requiredBy: ${dependencies[feature].requiredBy.join(', ')}`);
}
```

---

## 📊 데이터 구조

### Commit 객체

```javascript
{
  hash: 'abc1234567',           // 짧은 commit hash (10자)
  parents: ['def2345678'],      // 부모 commit hash 배열
  timestamp: Date,              // commit 시간
  message: 'feat(auth): ...',   // commit 메시지
  author: 'alice',              // 저자명
  email: 'alice@example.com',   // 저자 이메일
  files: []                     // 변경된 파일 목록
}
```

### DAG 객체

```javascript
{
  commits: {
    'abc1234567': {
      ...commit,
      children: ['def2345678']  // 자식 commit hash 배열
    }
  },
  edges: [
    { from: 'abc1234567', to: 'def2345678' }
  ],
  roots: ['abc1234567'],        // root commit hash 배열
  heads: ['vwx8901234']         // head commit hash 배열
}
```

### Lifecycle 객체

```javascript
{
  name: 'auth',                 // 기능명
  introduced: commit,           // 도입 commit
  lastModified: commit,         // 마지막 수정 commit
  totalMentions: 5,             // 언급 횟수
  stages: [
    {
      timestamp: Date,
      type: 'introduction',     // 단계 타입
      commit: 'abc1234567'
    }
  ],
  events: [
    {
      type: 'introduction',     // 이벤트 타입
      commit: commit,
      description: 'auth introduced'
    }
  ]
}
```

### Report 객체

```javascript
{
  type: 'VERSION_EVOLUTION',    // 리포트 타입
  from: commit,                 // 시작 버전
  to: commit,                   // 종료 버전
  commits: 42,                  // commit 수
  timespan: { days: 60 },       // 기간
  changes: { totalFiles: 15 },  // 변화 통계
  content: [
    {
      section: 'Overview',      // 섹션명
      body: '...'               // 섹션 내용
    }
  ]
}
```

---

## 🧪 테스트

### 테스트 실행

```bash
npm test
# 또는
node tests/test-evolution.js
```

### 테스트 케이스 (12개)

1. **testBuildDAG** - DAG 구축 및 통계
2. **testParseCommitMessage** - Commit 메시지 파싱
3. **testCategorizeCommits** - Commit 분류
4. **testParseDiffLines** - Diff 파싱 및 분석
5. **testDetectChangePatterns** - 변화 패턴 감지
6. **testTraceFeatureLifecycle** - 기능 생애 주기 추적
7. **testCalculateEvolutionVelocity** - 진화 속도 계산
8. **testAnalyzeVersionEvolution** - 버전 비교 분석
9. **testGenerateVersionReport** - 리포트 생성 및 마크다운 변환
10. **testGenerateDesignIntentReport** - 설계 의도 분석
11. **testAnalyzeDependencies** - 기능 간 의존성 분석
12. **testTrackFeaturesByVersion** - 버전별 기능 추적

---

## ⚙️ 설정

`.env.example`을 참고하여 `.env` 파일 생성:

```env
GIT_REPO_PATH=/path/to/repository
GIT_LOG_LIMIT=1000
DIFF_MAJOR_CHANGE_THRESHOLD=50
FEATURE_TRACKING_ENABLED=true
REPORT_FORMAT=markdown
DEBUG_MODE=false
```

---

## 🎯 설계 원칙

### 1. 시간축 기반 추론
- Git 커밋 히스토리를 정확한 시간 축으로 분석
- 인과 관계(causality) 기반 추론

### 2. 메타데이터 보존
- 모든 변화에 대해 버전/단계/저자 정보 유지
- 완전한 추적 가능성(traceability) 보장

### 3. 결정론적 분석
- 학습(Learning) 없음 - 규칙 기반 분석만 수행
- 외부 API 활용 가능하지만, 메인 로직은 순수 함수로 구현

### 4. 기록이 증명
- "기록이 증명이다" (Your record is your proof)
- 모든 분석 결과는 Git 히스토리 상의 명확한 근거를 가짐

---

## 📈 버전 진화

### 1.1-2.0: 검색 중심 (Search-Centric)
- Keyword-based retrieval
- Chunk-based search with metadata
- BM25 statistical ranking
- Vector semantic similarity (Hybrid)

### 3.0: 진화 분석 중심 (Evolution-Centric)
- Temporal reasoning on Git DAG
- Version-aware feature tracking
- Design intent extraction
- Causality inference

### 향후 계획 (4.0+)
- Multi-repository analysis
- Cross-repository dependency tracking
- Evolutionary pattern learning
- Predictive issue detection

---

## 📝 라이선스

MIT

---

## 🔗 관련 모듈

- **1.1-minimal-rag**: 기본 검색 엔진
- **1.2-chunk-search**: 청크 기반 검색
- **1.3-metadata-filter**: 메타데이터 필터링
- **1.4-bm25-ranking**: 통계 기반 랭킹
- **2.0-semantic-search**: 의미 기반 하이브리드 검색
- **3.0-evolution-reasoning**: 시간축 진화 분석 (현재)

---

**마지막 업데이트**: 2026-02-27
**엔진 철학**: 기록이 증명이다 (Your record is your proof)
