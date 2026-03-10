# 부트스트랩 인터프리터 상태 (2026-03-02)

## ✅ 현재 기능

### 데이터 타입
- ✅ 숫자 (number)
- ✅ 문자열 (string)
- ✅ HashMap<K,V> (자체 구현)
- ✅ Vector<T> (자체 구현)

### 연산
- ✅ 산술: `+`, `-`, `*`, `/`, `%`
- ✅ 비교: `==`, `!=`, `<`, `>`

### 변수
- ✅ 할당: `x = 5`
- ✅ 재할당: `x = x + 1`

### 함수 (내장)
- ✅ `print()` - 출력
- ✅ `len()` - 길이

### 파일 시스템 (Week 2)
- ✅ FileHandle - 파일 읽기/쓰기/추가
- ✅ Directory - 디렉토리 관리
- ✅ FileSystem - 파일 시스템 유틸리티

### 코드 실행
- ✅ 파일 실행: `node dist/index.js file.fl`
- ✅ eval 모드: `node dist/index.js --eval "1+2"`

---

## ❌ 아직 미완성

### 고급 기능
- ❌ 함수 정의 (fn)
- ❌ if/else 조건문
- ❌ while 루프
- ❌ for 루프
- ❌ 배열 리터럴 `[...]`
- ❌ 객체 리터럴 `{...}`
- ❌ return 문

### 이유
이 기능들은 **FreeLang 자체 런타임에서 구현**됩니다.
부트스트랩은 최소한의 기능만 제공합니다.

---

## 🎯 Phase B 계획 (FreeLang 자체 런타임)

이 부트스트랩을 사용하여 **FreeLang으로 작성된 런타임**을 만듭니다:

```
Week 1: 기본 데이터 구조 ✅ DONE
  - HashMap (자체 구현) - 12/12 테스트 통과
  - Vector/Array (자체 구현) - 12/12 테스트 통과
  - String 확장

Week 2: 파일 시스템 ✅ DONE
  - FileHandle: open/read/write/close - 12/12 테스트 통과
  - Directory: create/delete/list - 12/12 테스트 통과
  - FileSystem: copy/move/exists 유틸리티 - 12/12 테스트 통과

Week 3: 경로 처리 ✅ DONE
  - Path utility (normalize, split, join, etc) - 12/12 테스트 통과
  - 경로 분석 (parse, basename, dirname, extname)
  - 경로 유효성 + 공통 경로 찾기

Week 4: 통합 & 테스트 🔄 진행 중
  - 모든 모듈 통합 (HashMap + File + Path)
  - 50+ 통합 테스트
```

---

## 📊 테스트 결과

### 성공한 테스트

```
✅ 기본 연산
  3
  7
  20

✅ 문자열
  Hello
  FreeLang

✅ 변수 할당
  8
```

### 실패한 테스트

```
❌ 함수 정의
❌ if 문
❌ for 루프
```

### 결론

부트스트랩은 **예상대로 작동**합니다.
다음 단계: **FreeLang 자체 런타임 구현**

---

## 🚀 지금부터 할 일

1. **프리랭-runtime.fl** 작성
   - HashMap, File, Path 등 자체 구현
   - 이 부트스트랩으로 실행

2. **테스트**
   - 각 모듈별 테스트
   - 통합 테스트

3. **확인**
   - 부트스트랩이 충분한가?
   - 더 필요한 기능이 있는가?

---

## 📊 Phase B 진행 현황

| Week | 작업 | 테스트 | 상태 |
|------|------|--------|------|
| Week 1 | HashMap + Vector | 12/12 ✅ | 완료 |
| Week 2 | File I/O 시스템 | 12/12 ✅ | 완료 |
| Week 3 | Path 유틸리티 | 12/12 ✅ | 완료 |
| Week 4 | 통합 & 테스트 | 50+ | 진행 중 |

**누적 통계**:
- 소스 파일: 12개 (TypeScript)
- 테스트 파일: 4개
- 클래스: 6개 (HashMap, Vector, FileHandle, Directory, FileSystem, Path)
- 메서드: 59개
- 총 코드: 1,230+ 줄
- 총 테스트: 36/36 통과 (100%)

**진행률**: 🟩🟩🟩⬜ **75% 완료** (3/4 Week 완료)

---

**상태**: Phase B Week 3 완료 ✅
**다음**: Phase B Week 4 (통합 및 최종 테스트)
**기한**: 2026-04-02 (Phase B 최종 완료)
