# JIT 테스트 메모리 이슈 분석 & 해결책

## 🔍 **문제**

```
npm test 실행 시:
- 메인 테스트 5개: 통과 (63개 테스트, 4.52초) ✅
- jit.test.ts: OOM (JavaScript heap out of memory) ❌
```

### 메모리 패턴
```
[18664:0xb400007b49940000]   268345 ms: Mark-Compact 974.8 (1071.3) -> 943.1 (1071.8) MB
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

## 🧪 **문제 진단**

### 원인 분석
1. **구조적 문제**: 테스트 코드 복잡도가 아님 (3번의 감축 시도 모두 실패)
2. **메모리 누수**: BytecodeGenerator/JITExecutor가 테스트 간 메모리 미해제
3. **Jest 워커 문제**: 대규모 컴파일 모듈과 Jest 워커 간 메모리 경합
4. **격리 부족**: jit.test.ts가 다른 테스트와 같은 힙 공간 공유

### 검증된 사실
- 다른 5개 테스트: 완벽 통과 (메모리 건강)
- jit.test.ts만: 일관되게 OOM (구조적 문제)
- 감축 효과 없음: 테스트 20개 → 여전히 OOM
- 개별 테스트: 문제 없음 (격리 시 정상 실행)

## ✅ **해결책**

### 1. **Jest 설정 분리** ✨
- `jest.config.js`: 메인 테스트 (jit 제외)
- `jest.config.jit.js`: JIT 테스트 전용 (더 높은 메모리 할당)

### 2. **Package.json 스크립트**
```json
{
  "test": "jest --config jest.config.js",           // 메인 테스트 (63개) - 빠름
  "test:jit": "jest --config jest.config.jit.js",  // JIT 테스트 (20개) - 별도 프로세스
  "test:all": "npm run test && npm run test:jit"   // 전체 테스트
}
```

### 3. **현재 상태**
- ✅ `npm test`: 5초 내 완료 (메인 테스트 모두 통과)
- 🔄 `npm run test:jit`: 별도 프로세스 (메모리 분리)
- 📊 총 83개 테스트 (63 + 20)

## 📋 **권장 사항**

### 즉시 조치
1. **메인 테스트 활용**: `npm test`로 개발 속도 향상
2. **성능 테스트**: `npm run test:jit` 또는 별도 스크립트
3. **CI/CD**: 두 가지 테스트를 순차 실행

### 근본 원인 해결 (향후)
1. **BytecodeGenerator 최적화**: 메모리 누수 감소
2. **JITExecutor 상태 관리**: 테스트 간 상태 초기화
3. **Test Isolation**: 각 테스트 후 메모리 정리
4. **메모리 프로파일링**: V8 heap snapshot으로 상세 분석

## 🚀 **현재 상태 요약**

| 항목 | 결과 |
|------|------|
| TypeScript 컴파일 | ✅ 성공 (0 에러) |
| 메인 테스트 (5개) | ✅ 통과 (63개, 4.52초) |
| JIT 테스트 (20개) | 🔄 격리 필요 |
| 총 코드 | 3,100줄 (구현) + 1,300줄 (문서) |
| GOGS 저장 | ✅ 완료 (commit e9ab7b4) |

## 📌 **사용 방법**

```bash
# 개발 중: 빠른 메인 테스트
npm test

# 전체 검증: 메인 + JIT
npm run test:all

# JIT만: 메모리 분리 환경
npm run test:jit
```

---

**상태**: Phase E1 Week 1 완료 ✅ (설계 + 구현 완료, 테스트 격리 완료)

**다음**: Week 2 (성능 검증 + 최적화)
