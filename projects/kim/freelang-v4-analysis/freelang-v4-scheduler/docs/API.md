# FreeLang v4 Scheduler API 문서

## 목차

1. [JobScheduler](#jobscheduler)
2. [WorkflowOrchestrator](#workfloworchestrator)
3. [ExecutionEngine](#executionengine)
4. [JobQueue](#jobqueue)
5. [Monitor](#monitor)

---

## JobScheduler

작업 스케줄링 엔진입니다.

### `JobScheduler::new() -> JobScheduler`

새로운 작업 스케줄러를 생성합니다.

**반환값**: JobScheduler 인스턴스

**예제**:
```freelang
let scheduler = JobScheduler::new()
```

---

### `scheduler.add_job(name: String, cron: String, action: Function) -> Result<String>`

Cron 기반 작업을 추가합니다.

**매개변수**:
- `name` (String): 작업 이름
- `cron` (String): Cron 표현식
- `action` (Function): 실행할 함수

**반환값**: Result<String> (작업 ID)

**예제**:
```freelang
let job_id = scheduler.add_job(
  "daily_cleanup",
  "0 2 * * *",  // 매일 새벽 2시
  || {
    cleanup_old_files()
  }
)?
```

---

### `scheduler.add_once_job(name: String, delay_seconds: Integer, action: Function) -> Result<String>`

일회용 작업을 추가합니다.

**매개변수**:
- `name` (String): 작업 이름
- `delay_seconds` (Integer): 지연 시간 (초)
- `action` (Function): 실행할 함수

**반환값**: Result<String> (작업 ID)

**예제**:
```freelang
let job_id = scheduler.add_once_job(
  "send_email",
  3600,  // 1시간 후
  || {
    send_welcome_email()
  }
)?
```

---

### `scheduler.add_interval_job(name: String, interval_seconds: Integer, action: Function) -> Result<String>`

반복 작업을 추가합니다.

**매개변수**:
- `name` (String): 작업 이름
- `interval_seconds` (Integer): 반복 간격 (초)
- `action` (Function): 실행할 함수

**반환값**: Result<String> (작업 ID)

**예제**:
```freelang
let job_id = scheduler.add_interval_job(
  "check_health",
  300,  // 5분마다
  || {
    health_check()
  }
)?
```

---

### `scheduler.update_job(job_id: String, cron: String) -> Result<void>`

작업의 스케줄을 업데이트합니다.

**매개변수**:
- `job_id` (String): 작업 ID
- `cron` (String): 새로운 Cron 표현식

**반환값**: Result<void>

**예제**:
```freelang
scheduler.update_job("daily_cleanup", "0 3 * * *")?
```

---

### `scheduler.remove_job(job_id: String) -> Result<void>`

작업을 제거합니다.

**매개변수**:
- `job_id` (String): 작업 ID

**반환값**: Result<void>

**예제**:
```freelang
scheduler.remove_job("daily_cleanup")?
```

---

### `scheduler.get_job_status(job_id: String) -> Result<JobStatus>`

작업 상태를 조회합니다.

**매개변수**:
- `job_id` (String): 작업 ID

**반환값**: Result<JobStatus>

**예제**:
```freelang
let status = scheduler.get_job_status("daily_cleanup")?
println("State: " + status.state)  // "running", "pending", "completed"
println("Last run: " + status.last_run_at)
println("Next run: " + status.next_run_at)
```

---

### `scheduler.pause_job(job_id: String) -> Result<void>`

작업을 일시 중지합니다.

**매개변수**:
- `job_id` (String): 작업 ID

**반환값**: Result<void>

**예제**:
```freelang
scheduler.pause_job("daily_cleanup")?
```

---

### `scheduler.resume_job(job_id: String) -> Result<void>`

일시 중지된 작업을 재개합니다.

**매개변수**:
- `job_id` (String): 작업 ID

**반환값**: Result<void>

**예제**:
```freelang
scheduler.resume_job("daily_cleanup")?
```

---

## WorkflowOrchestrator

워크플로우 오케스트레이션 엔진입니다.

### `WorkflowOrchestrator::new() -> WorkflowOrchestrator`

새로운 워크플로우 오케스트레이터를 생성합니다.

**반환값**: WorkflowOrchestrator 인스턴스

**예제**:
```freelang
let orchestrator = WorkflowOrchestrator::new()
```

---

### `orchestrator.register_workflow(name: String, definition: WorkflowDef) -> Result<String>`

워크플로우를 등록합니다.

**매개변수**:
- `name` (String): 워크플로우 이름
- `definition` (WorkflowDef): 워크플로우 정의

**반환값**: Result<String> (워크플로우 ID)

**예제**:
```freelang
let workflow_id = orchestrator.register_workflow(
  "data_pipeline",
  {
    tasks: [
      { id: "extract", action: extract_func },
      { id: "transform", action: transform_func, depends_on: ["extract"] },
      { id: "load", action: load_func, depends_on: ["transform"] }
    ]
  }
)?
```

---

### `orchestrator.execute_workflow(workflow_id: String, args: Map) -> Result<ExecutionId>`

워크플로우를 실행합니다.

**매개변수**:
- `workflow_id` (String): 워크플로우 ID
- `args` (Map): 입력 인수

**반환값**: Result<ExecutionId>

**예제**:
```freelang
let exec_id = orchestrator.execute_workflow(
  "data_pipeline",
  { source: "database", format: "json" }
)?

println("Execution ID: " + exec_id)
```

---

### `orchestrator.get_execution_status(execution_id: ExecutionId) -> Result<ExecutionStatus>`

실행 상태를 조회합니다.

**매개변수**:
- `execution_id` (ExecutionId): 실행 ID

**반환값**: Result<ExecutionStatus>

**예제**:
```freelang
let status = orchestrator.get_execution_status(exec_id)?
println("Status: " + status.state)  // "pending", "running", "completed", "failed"
println("Progress: " + status.progress + "%")
println("Started: " + status.started_at)
```

---

### `orchestrator.get_execution_result(execution_id: ExecutionId) -> Result<Map>`

실행 결과를 조회합니다.

**매개변수**:
- `execution_id` (ExecutionId): 실행 ID

**반환값**: Result<Map>

**예제**:
```freelang
let result = orchestrator.get_execution_result(exec_id)?
println("Result: " + result)
```

---

### `orchestrator.cancel_execution(execution_id: ExecutionId) -> Result<void>`

실행을 취소합니다.

**매개변수**:
- `execution_id` (ExecutionId): 실행 ID

**반환값**: Result<void>

**예제**:
```freelang
orchestrator.cancel_execution(exec_id)?
```

---

### `orchestrator.stream_logs(execution_id: ExecutionId, callback: Function) -> void`

실행 로그를 스트리밍합니다.

**매개변수**:
- `execution_id` (ExecutionId): 실행 ID
- `callback` (Function): 로그 라인 콜백

**예제**:
```freelang
orchestrator.stream_logs(exec_id, |log_line| {
  println("[LOG] " + log_line)
})
```

---

## ExecutionEngine

작업 실행 엔진입니다.

### `ExecutionEngine::new() -> ExecutionEngine`

새로운 실행 엔진을 생성합니다.

**반환값**: ExecutionEngine 인스턴스

**예제**:
```freelang
let engine = ExecutionEngine::new()
```

---

### `engine.with_max_workers(count: Integer) -> ExecutionEngine`

최대 워커 수를 설정합니다.

**매개변수**:
- `count` (Integer): 워커 수

**반환값**: ExecutionEngine (메서드 체이닝)

**예제**:
```freelang
engine.with_max_workers(10)
```

---

### `engine.with_retry_policy(max_retries: Integer, backoff: String) -> ExecutionEngine`

재시도 정책을 설정합니다.

**매개변수**:
- `max_retries` (Integer): 최대 재시도 횟수
- `backoff` (String): 백오프 전략 ("fixed", "exponential", "linear")

**반환값**: ExecutionEngine (메서드 체이닝)

**예제**:
```freelang
engine.with_retry_policy(
  max_retries: 3,
  backoff: "exponential"
)
```

---

### `engine.execute_task(task: Task) -> Result<TaskResult>`

작업을 실행합니다.

**매개변수**:
- `task` (Task): 실행할 작업

**반환값**: Result<TaskResult>

**예제**:
```freelang
let result = engine.execute_task({
  id: "task_1",
  action: || { process_data() }
})?

println("Task status: " + result.status)
println("Output: " + result.output)
```

---

### `engine.execute_tasks(tasks: List<Task>) -> Result<List<TaskResult>>`

여러 작업을 실행합니다.

**매개변수**:
- `tasks` (List<Task>): 작업 목록

**반환값**: Result<List<TaskResult>>

**예제**:
```freelang
let results = engine.execute_tasks([
  { id: "task_1", action: task1_func },
  { id: "task_2", action: task2_func }
])?
```

---

## JobQueue

작업 큐 관리입니다.

### `JobQueue::new() -> JobQueue`

새로운 작업 큐를 생성합니다.

**반환값**: JobQueue 인스턴스

**예제**:
```freelang
let queue = JobQueue::new()
```

---

### `queue.enqueue(job: Job) -> Result<String>`

작업을 큐에 추가합니다.

**매개변수**:
- `job` (Job): 작업 객체

**반환값**: Result<String> (작업 ID)

**예제**:
```freelang
let job_id = queue.enqueue({
  type: "email",
  priority: 1,
  data: { email: "user@example.com", subject: "Hello" }
})?
```

---

### `queue.dequeue() -> Result<Job>`

큐에서 작업을 가져옵니다.

**반환값**: Result<Job>

**예제**:
```freelang
let job = queue.dequeue()?
process_job(job)
queue.acknowledge(job.id)
```

---

### `queue.acknowledge(job_id: String) -> Result<void>`

작업 처리를 확인합니다.

**매개변수**:
- `job_id` (String): 작업 ID

**반환값**: Result<void>

**예제**:
```freelang
queue.acknowledge(job_id)?
```

---

### `queue.move_to_deadletter(job_id: String, reason: String) -> Result<void>`

작업을 Dead Letter Queue로 이동합니다.

**매개변수**:
- `job_id` (String): 작업 ID
- `reason` (String): 이유

**반환값**: Result<void>

**예제**:
```freelang
queue.move_to_deadletter(job_id, "max_retries_exceeded")?
```

---

### `queue.get_queue_stats() -> Result<QueueStats>`

큐 통계를 조회합니다.

**반환값**: Result<QueueStats>

**예제**:
```freelang
let stats = queue.get_queue_stats()?
println("Pending: " + stats.pending_jobs)
println("Processing: " + stats.processing_jobs)
println("Failed: " + stats.failed_jobs)
```

---

## Monitor

모니터링 시스템입니다.

### `Monitor::new() -> Monitor`

새로운 모니터를 생성합니다.

**반환값**: Monitor 인스턴스

**예제**:
```freelang
let monitor = Monitor::new()
```

---

### `monitor.get_metrics() -> Result<SchedulerMetrics>`

스케줄러 메트릭을 조회합니다.

**반환값**: Result<SchedulerMetrics>

**예제**:
```freelang
let metrics = monitor.get_metrics()?
println("Total jobs: " + metrics.total_jobs)
println("Succeeded: " + metrics.succeeded_jobs)
println("Failed: " + metrics.failed_jobs)
println("Avg execution time: " + metrics.avg_execution_time + "ms")
```

---

### `monitor.set_alert(threshold: Integer, callback: Function) -> Result<String>`

경고를 설정합니다.

**매개변수**:
- `threshold` (Integer): 임계값 (예: 실패율 %)
- `callback` (Function): 콜백 함수

**반환값**: Result<String> (경고 ID)

**예제**:
```freelang
let alert_id = monitor.set_alert(
  threshold: 10,  // 실패율이 10%를 넘으면
  |metrics| {
    send_alert_email(metrics)
  }
)?
```

---

### `monitor.get_execution_history(job_id: String, limit: Integer) -> Result<List<Execution>>`

실행 이력을 조회합니다.

**매개변수**:
- `job_id` (String): 작업 ID
- `limit` (Integer): 조회 수

**반환값**: Result<List<Execution>>

**예제**:
```freelang
let history = monitor.get_execution_history("daily_cleanup", 10)?
for execution in history {
  println("Ran: " + execution.started_at + " - " + execution.status)
}
```

---

## 공통 타입

### JobStatus

```freelang
type JobStatus {
  job_id: String
  name: String
  state: String          // "pending", "running", "completed", "failed"
  cron: String
  last_run_at: Timestamp?
  next_run_at: Timestamp?
  success_count: Integer
  failure_count: Integer
}
```

### ExecutionStatus

```freelang
type ExecutionStatus {
  execution_id: ExecutionId
  workflow_id: String
  state: String          // "pending", "running", "completed", "failed"
  progress: Float        // 0.0-1.0
  started_at: Timestamp?
  completed_at: Timestamp?
  duration_seconds: Integer?
}
```

### TaskResult

```freelang
type TaskResult {
  task_id: String
  status: String         // "success", "failure", "skipped"
  output: Any
  error: String?
  duration_ms: Integer
  retries: Integer
}
```

### QueueStats

```freelang
type QueueStats {
  pending_jobs: Integer
  processing_jobs: Integer
  completed_jobs: Integer
  failed_jobs: Integer
  deadletter_jobs: Integer
}
```

---

**문서 버전**: 1.0.0
**최종 수정**: 2026-02-20
