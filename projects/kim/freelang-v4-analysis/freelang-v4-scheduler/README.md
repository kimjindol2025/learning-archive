# FreeLang v4 Scheduler

## 개요

FreeLang v4 Scheduler는 엔터프라이즈급 작업 스케줄링 및 워크플로우 오케스트레이션 플랫폼입니다. 분산 작업 처리, 동적 스케줄링, 워크플로우 자동화를 제공합니다.

## 주요 기능

### 1. 작업 스케줄링
- Cron 식 지원
- 일회용 작업
- 반복 작업
- 조건부 실행

### 2. 워크플로우 오케스트레이션
- DAG (Directed Acyclic Graph) 기반 워크플로우
- 병렬 작업 실행
- 순차 작업 실행
- 상태 머신 기반 제어

### 3. 분산 처리
- 다중 워커 지원
- 작업 큐 (Job Queue)
- 부하 분산
- 자동 재시도

### 4. 모니터링 및 로깅
- 작업 실행 추적
- 성능 메트릭
- 실시간 로그
- 감사 추적

### 5. 안정성
- 작업 영속성 (Durability)
- 자동 재시도
- Deadletter 큐
- 작업 격리

### 6. 확장성
- 수평 확장
- 동적 워커 추가
- 자동 스케일링
- 리소스 제한

## 성능 특성

- **처리량**: 10,000+ jobs/sec
- **지연 시간**: <100ms (스케줄링)
- **워커 확장성**: 1,000+ 워커
- **메모리 오버헤드**: <10MB (기본)

## 설치

```bash
git clone https://gogs.dclub.kr/kim/freelang-v4-scheduler.git
cd freelang-v4-scheduler
npm install
npm run build
```

## 사용법

### 기본 작업 정의

```freelang
// 단순 작업
task process_data {
  input: {
    file_path: String,
    format: String
  }
  output: {
    result: Map
  }

  execute: || {
    let data = read_file(input.file_path)
    let processed = parse(data, input.format)
    output.result = processed
  }
}

// 작업 예약
scheduler.schedule(
  task: process_data,
  cron: "0 9 * * *",  // 매일 9시
  args: {
    file_path: "/data/input.csv",
    format: "csv"
  }
)
```

### Cron 식 예제

```freelang
// 매일 9시
scheduler.add_job("daily_job", "0 9 * * *", job_func)

// 월요일-금요일 8시 30분
scheduler.add_job("weekday_job", "30 8 * * 1-5", job_func)

// 매시간
scheduler.add_job("hourly_job", "0 * * * *", job_func)

// 5분마다
scheduler.add_job("frequent_job", "*/5 * * * *", job_func)

// 매월 1일 자정
scheduler.add_job("monthly_job", "0 0 1 * *", job_func)
```

### 워크플로우 정의

```freelang
workflow data_pipeline {
  tasks: [
    {
      id: "extract",
      action: extract_data,
      depends_on: []
    },
    {
      id: "transform",
      action: transform_data,
      depends_on: ["extract"]
    },
    {
      id: "load",
      action: load_data,
      depends_on: ["transform"]
    },
    {
      id: "validate",
      action: validate_result,
      depends_on: ["load"]
    }
  ]
}

// 워크플로우 실행
let execution = scheduler.run_workflow(
  workflow: data_pipeline,
  args: { source: "database" }
)
```

### 병렬 처리

```freelang
workflow parallel_processing {
  tasks: [
    {
      id: "process_1",
      action: process_batch,
      depends_on: [],
      args: { batch_id: 1 }
    },
    {
      id: "process_2",
      action: process_batch,
      depends_on: [],
      args: { batch_id: 2 }
    },
    {
      id: "process_3",
      action: process_batch,
      depends_on: [],
      args: { batch_id: 3 }
    },
    {
      id: "aggregate",
      action: aggregate_results,
      depends_on: ["process_1", "process_2", "process_3"]
    }
  ]
}
```

### 조건부 실행

```freelang
workflow conditional_workflow {
  tasks: [
    {
      id: "check_data",
      action: validate_input,
      depends_on: []
    },
    {
      id: "process_success",
      action: process_data,
      depends_on: ["check_data"],
      condition: |result| {
        result.is_valid == true
      }
    },
    {
      id: "process_failure",
      action: handle_error,
      depends_on: ["check_data"],
      condition: |result| {
        result.is_valid == false
      }
    }
  ]
}
```

### 재시도 정책

```freelang
scheduler.add_job(
  "reliable_job",
  cron: "0 * * * *",
  action: unreliable_operation,
  retry_policy: {
    max_retries: 3,
    backoff_type: "exponential",
    initial_delay: 1000,  // ms
    max_delay: 60000
  }
)
```

### 작업 모니터링

```freelang
// 실행 상태 확인
let status = scheduler.get_job_status("job_id")
// status.state: "running" | "pending" | "completed" | "failed"
// status.started_at: Timestamp
// status.progress: 0.75  // 75% 완료

// 로그 스트리밍
scheduler.stream_logs("execution_id", |log_line| {
  println(log_line)
})

// 메트릭 수집
let metrics = scheduler.get_metrics()
// metrics.total_jobs
// metrics.succeeded_jobs
// metrics.failed_jobs
// metrics.avg_execution_time
```

### 상태 머신 기반 워크플로우

```freelang
workflow state_machine_workflow {
  initial_state: "pending"

  states: {
    "pending": {
      on_enter: prepare_task,
      on_exit: null,
      transitions: {
        "ready": validate_input
      }
    },
    "ready": {
      on_enter: null,
      on_exit: start_processing,
      transitions: {
        "processing": null,
        "failed": handle_validation_error
      }
    },
    "processing": {
      on_enter: execute_task,
      on_exit: null,
      transitions: {
        "completed": validate_output,
        "failed": handle_execution_error
      }
    },
    "completed": {
      on_enter: finalize_task,
      on_exit: null,
      transitions: {}
    },
    "failed": {
      on_enter: log_failure,
      on_exit: null,
      transitions: {
        "pending": retry_task
      }
    }
  }
}
```

## 모범 사례

### 1. 멱등성(Idempotency)
- 작업은 여러 번 실행되어도 같은 결과
- 중복 처리 방지
- 트랜잭션 활용

### 2. 작업 설계
- 작고 집중된 작업
- 명확한 입출력
- 구체적인 에러 처리
- 로깅 포함

### 3. 모니터링
- 주요 메트릭 추적
- 알림 설정
- 정기적인 건강 점검
- SLA 모니터링

### 4. 확장성
- 워커 수평 확장
- 큐 용량 계획
- 리소스 제한 설정
- 동적 할당

### 5. 보안
- 작업 격리
- 민감한 데이터 암호화
- 접근 제어
- 감사 로깅

## 아키텍처

```
┌─────────────────────────────────────────┐
│   Client Applications                   │
├─────────────────────────────────────────┤
│   Scheduler API                         │
│  ┌────────────────────────────────────┐ │
│  │ Workflow Orchestrator               │ │
│  │ - DAG Builder                       │ │
│  │ - Task Dependency Resolver          │ │
│  │ - State Machine Engine              │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Job Scheduler                      │ │
│  │ - Cron Parser                      │ │
│  │ - Job Queue Manager                │ │
│  │ - Execution Planning               │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Execution Engine                   │ │
│  │ - Task Executor                    │ │
│  │ - Retry Handler                    │ │
│  │ - Result Processor                 │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│   Job Queue                             │
│   - Priority Queue                      │
│   - Deadletter Queue                    │
├─────────────────────────────────────────┤
│   Worker Nodes                          │
│   - Task Executor                       │
│   - Local Cache                         │
│   - Health Monitor                      │
├─────────────────────────────────────────┤
│   Storage & State                       │
│   - Persistent Store                    │
│   - Execution History                   │
│   - Metrics & Logs                      │
└─────────────────────────────────────────┘
```

## 구성 요소

| 컴포넌트 | 설명 | 상태 |
|---------|------|------|
| JobScheduler | 작업 스케줄링 엔진 | ✅ 완료 |
| WorkflowOrchestrator | 워크플로우 오케스트레이션 | ✅ 완료 |
| ExecutionEngine | 작업 실행 엔진 | ✅ 완료 |
| JobQueue | 작업 큐 관리 | ✅ 완료 |
| Monitor | 모니터링 시스템 | ⏳ 개발중 |
| Autoscaler | 자동 스케일링 | ⏳ 계획중 |

## 테스트

```bash
npm test
```

## 성능 튜닝

```bash
npm run benchmark
npm run profile
```

## 라이선스

MIT License

---

**마지막 수정**: 2026-02-20
**버전**: 1.0.0
**관리자**: FreeLang Development Team
