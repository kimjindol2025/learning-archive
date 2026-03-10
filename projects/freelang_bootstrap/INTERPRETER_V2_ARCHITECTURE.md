# FreeLang v2 Interpreter - Architecture & API Reference

## 📋 개요

**interpreter_v2.fl**은 OS 커널 개념과 신경망 엔진을 통합한 완전한 프로덕션 구조입니다:

```
┌─────────────────────────────────────────────────────┐
│          FreeLang v2 Interpreter                    │
├─────────────────────────────────────────────────────┤
│  Process Scheduler  ←→  Global Synapse Engine      │
│       (PCB)                  (Neurons)              │
│       ↓                         ↓                   │
│  Ready/Wait Queue    Synapse Propagation           │
│       ↓                         ↓                   │
│   Execute Jobs       Activate Processes            │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Overview

### 3-Tier Design

```
┌─────────────────────────────────────────────┐
│ Tier 1: Process Management (OS Kernel)      │
│ - ProcessControlBlock (PCB)                 │
│ - Process Table (processTable)              │
│ - State Management                          │
│ - Stack Operations                          │
└─────────────────────────────────────────────┘
         ↑
         │ Integration Layer
         ↓
┌─────────────────────────────────────────────┐
│ Tier 2: Global Synapse Engine (Neural)      │
│ - Neuron Network (neurons)                  │
│ - Synapse Connections                       │
│ - Propagation Algorithm                     │
│ - Weight Management                         │
└─────────────────────────────────────────────┘
         ↑
         │ Orchestration
         ↓
┌─────────────────────────────────────────────┐
│ Tier 3: Scheduling & Monitoring             │
│ - Round-Robin Scheduler                     │
│ - Metrics Collection                        │
│ - Event Handling                            │
│ - State Synchronization                     │
└─────────────────────────────────────────────┘
```

---

## 🔧 Data Structures

### ProcessControlBlock (PCB)

```freeling
type ProcessControlBlock {
    pid: int,                        // Process ID (unique)
    name: string,                    // Process name
    state: string,                   // READY/RUNNING/WAITING/BLOCKED
    priority: int,                   // Scheduling priority (1-10)
    stack: list,                     // Execution stack (LIFO)
    context: map,                    // Local variables & state
    createdAt: int,                  // Creation timestamp
    executedInstructions: int,       // Total instructions executed
    attachedNeurons: list[int]       // Connected neuron IDs
}
```

**상태 전이:**
```
NEW → READY → RUNNING → WAITING → BLOCKED → TERMINATED
```

### Neuron

```freeling
type Neuron {
    id: int,                         // Neuron ID (unique)
    type: string,                    // INPUT/HIDDEN/OUTPUT
    state: map,                      // Current activation state
    weights: list[float],            // Synapse weights (0.0-1.0)
    connections: list[int],          // Connected neuron IDs
    lastFiredAt: int,                // Last activation timestamp
    fireCount: int,                  // Total activations
    attachedProcesses: list[int]     // Connected process IDs
}
```

**네트워크 구조:**
```
INPUT NEURONS
    ↓
HIDDEN NEURONS (layers)
    ↓
OUTPUT NEURONS
    ↓
BACK TO PROCESSES (event trigger)
```

---

## 📡 API Reference

### Part 1: Process Management

#### `createProcess(pid: int, name: string, priority: int, initContext: map) -> ProcessControlBlock`

프로세스 생성

```freeling
var ctx = {"variable_a": 10}
var proc = createProcess(1, "MyProcess", 1, ctx)
// ProcessControlBlock 반환
```

**Parameters:**
- `pid`: 프로세스 ID (유일해야 함)
- `name`: 프로세스 이름
- `priority`: 우선순위 (1-10, 낮을수록 높은 우선순위)
- `initContext`: 초기 컨텍스트 맵

**Returns:** ProcessControlBlock 객체

---

#### `setProcessState(pid: int, newState: string) -> bool`

프로세스 상태 변경

```freeling
setProcessState(1, PROCESS_RUNNING)  // true
setProcessState(999, PROCESS_READY)  // false (존재하지 않는 PID)
```

**상태 상수:**
- `PROCESS_NEW`: 새로 생성됨
- `PROCESS_READY`: 실행 준비 완료
- `PROCESS_RUNNING`: 현재 실행 중
- `PROCESS_WAITING`: 이벤트 대기
- `PROCESS_BLOCKED`: 리소스 대기
- `PROCESS_TERMINATED`: 완료

---

#### `getProcess(pid: int) -> ProcessControlBlock`

프로세스 조회

```freeling
var proc = getProcess(1)
if proc != null {
    println(proc.name)  // 프로세스 이름 출력
}
```

---

#### `pushStack(pid: int, value: any)` / `popStack(pid: int) -> any`

프로세스 스택 조작

```freeling
pushStack(1, 10)
pushStack(1, 20)
pushStack(1, 30)

var val = popStack(1)  // 30 (LIFO)
```

---

### Part 2: Global Synapse Engine

#### `registerNeuron(id: int, type: string, connections: list[int]) -> Neuron`

Neuron 등록

```freeling
var neuron = registerNeuron(1, NEURON_INPUT, [2, 3])
// 입력 뉴런, 뉴런 2,3과 연결
```

**Parameters:**
- `id`: Neuron ID (유일)
- `type`: NEURON_INPUT, NEURON_HIDDEN, NEURON_OUTPUT
- `connections`: 연결된 다른 뉴런의 ID 리스트

**Returns:** Neuron 객체

---

#### `attachProcessToNeuron(neuronId: int, pid: int) -> bool`

프로세스와 Neuron 연결

```freeling
var success = attachProcessToNeuron(1, 1)
// 프로세스 1을 뉴런 1에 연결
```

이제 프로세스 1이 뉴런 1의 발화 이벤트를 받을 수 있음

---

#### `gse_propagate(sourceNeuronId: int, data: map, strength: float)`

Synapse 전파 (신경망 활성화)

```freeling
var data = {"signal": 1.0, "intensity": 0.8}
gse_propagate(1, data, 0.9)
// 뉴런 1에서 신호 전파 (강도 0.9)
```

**동작:**
1. 소스 뉴런 활성화
2. 모든 연결된 뉴런으로 신호 전파
3. 가중치 적용 (weight * strength)
4. 연결된 프로세스에 이벤트 발생

---

### Part 3: Integration APIs

#### `processFiresNeuron(pid: int, neuronId: int, data: map, strength: float) -> bool`

프로세스가 Neuron을 발화시킴

```freeling
var success = processFiresNeuron(1, 1, {"signal": 1.0}, 0.8)
// 프로세스 1이 뉴런 1을 강도 0.8로 발화
```

**조건:**
- 프로세스 상태: RUNNING
- Neuron ID 존재

---

#### `neuronActivatesProcess(neuronId: int) -> list[int]`

Neuron이 연결된 프로세스 깨우기

```freeling
var activatedPids = neuronActivatesProcess(1)
// 뉴런 1에 연결된 모든 WAITING 프로세스를 READY로 변경
```

**Returns:** 활성화된 프로세스 ID 리스트

---

### Part 4: Scheduler

#### `enqueueReady(pid: int)`

Ready Queue에 프로세스 추가

```freeling
enqueueReady(1)
enqueueReady(2)
enqueueReady(3)
```

---

#### `selectNextProcess() -> int`

Ready Queue에서 다음 실행 프로세스 선택

```freeling
var nextPid = selectNextProcess()  // -1 if empty
```

**알고리즘:** FIFO (First-In-First-Out)

---

#### `schedule()`

한 시간 슬라이스 동안 스케줄링 실행

```freeling
schedule()  // 한 프로세스 실행 + Ready Queue로 재입력
```

---

#### `run(cycles: int)`

N개 시간 슬라이스 실행

```freeling
run(100)  // 100개 사이클 실행 (Round Robin)
```

---

### Part 5: Monitoring

#### `collectMetrics() -> SystemMetrics`

시스템 메트릭 수집

```freeling
var metrics = collectMetrics()
println("Processes: " + metrics.totalProcesses)
println("Running: " + metrics.runningProcesses)
println("Neurons: " + metrics.totalNeurons)
println("Activated: " + metrics.activatedNeurons)
```

**Returns:**
```freeling
type SystemMetrics {
    totalProcesses: int,
    runningProcesses: int,
    readyProcesses: int,
    waitingProcesses: int,
    totalNeurons: int,
    activatedNeurons: int,
    timestamp: int
}
```

---

#### `initInterpreter()`

전체 시스템 초기화

```freeling
initInterpreter()  // 모든 테이블/큐 초기화
```

---

#### `status() -> SystemMetrics`

현재 시스템 상태 조회

```freeling
var status = status()
// collectMetrics()의 별칭
```

---

## 🔄 Workflow Examples

### Example 1: 프로세스 생성 → 실행

```freeling
// 1. 초기화
initInterpreter()

// 2. 프로세스 생성
var proc = createProcess(1, "Worker", 1, {})

// 3. Ready Queue에 추가
enqueueReady(1)

// 4. 스케줄링 실행
run(5)  // 5개 사이클

// 5. 메트릭 확인
var metrics = status()
println("Executed: " + proc.executedInstructions + " instructions")
```

---

### Example 2: 프로세스 ← 신경망 통신

```freeling
// 1. 뉴런 네트워크 구성
var n1 = registerNeuron(1, NEURON_INPUT, [2])
var n2 = registerNeuron(2, NEURON_OUTPUT, [])

// 2. 프로세스와 뉴런 연결
var proc = createProcess(1, "Listener", 1, {})
attachProcessToNeuron(2, 1)  // 프로세스 1이 뉴런 2 이벤트 리스닝

// 3. 프로세스를 RUNNING으로 설정
setProcessState(1, PROCESS_RUNNING)

// 4. 프로세스가 뉴런 발화
processFiresNeuron(1, 1, {"signal": 1.0}, 0.9)
// 뉴런 1 → 뉴런 2로 전파
// 프로세스 1에 이벤트 발생

// 5. 프로세스를 대기 상태로
setProcessState(1, PROCESS_WAITING)

// 6. 뉴런이 프로세스 깨우기
var activated = neuronActivatesProcess(2)
// 프로세스 1이 READY로 변경
```

---

### Example 3: 신경망 활성화 흐름

```freeling
// 신경망 구성
registerNeuron(1, NEURON_INPUT, [2, 3])
registerNeuron(2, NEURON_HIDDEN, [4])
registerNeuron(3, NEURON_HIDDEN, [4])
registerNeuron(4, NEURON_OUTPUT, [])

// 프로세스 생성
var p1 = createProcess(1, "Sensor", 1, {})
setProcessState(1, PROCESS_RUNNING)

// 신호 시작
gse_propagate(1, {"input": 1.0}, 1.0)
// 뉴런 1 → 2, 3
// 뉴런 2, 3 → 4

// 메트릭 확인
var metrics = status()
println("Activated neurons: " + metrics.activatedNeurons)
```

---

## 📊 State Diagram

### Process State Machine

```
    create()
        ↓
    ┌─────────┐
    │   NEW   │
    └────┬────┘
         │
    enqueueReady()
         │
         ↓
    ┌─────────────┐
    │   READY     │
    └────┬────────┘
         │
    schedule() or selectNextProcess()
         │
         ↓
    ┌─────────────┐
    │  RUNNING    │
    └────┬────────┘
         │
      (time slice expired or neuron activated)
         │
         ├─────────────────┐
         │                 │
         ↓                 ↓
    ┌─────────┐    ┌─────────────┐
    │ WAITING │    │  READY (re)  │
    └────┬────┘    └──────────────┘
         │
    (neuron activates)
         │
         └──────────────┘
```

---

## 🧠 Neuron Propagation Algorithm

```
gse_propagate(sourceId, data, strength):
    1. source = neurons[sourceId]
    2. source.state = data
    3. source.fireCount++
    4. source.lastFiredAt = now()

    5. for each targetId in source.connections:
        5a. target = neurons[targetId]
        5b. weight = source.weights[connectionIndex]
        5c. effective_strength = weight * strength
        5d. target.state = mergeMaps(target.state, data, effective_strength)

    6. for each attachedPid in source.attachedProcesses:
        6a. if processTable[attachedPid].state == WAITING:
            6b. setProcessState(attachedPid, READY)
            6c. enqueueReady(attachedPid)
```

---

## 🧪 Test Coverage

### 5 Test Suites (44 assertions)

1. **Process Creation & Management** (9 assertions)
   - Creation
   - State Transition
   - Stack Operations

2. **Global Synapse Engine** (8 assertions)
   - Neuron Registration
   - Synapse Propagation

3. **Integration** (10 assertions)
   - Process-Neuron Attachment
   - Process Fires Neuron
   - Neuron Activates Process

4. **Scheduler** (8 assertions)
   - Round-Robin Execution
   - Instruction Counting

5. **Metrics** (9 assertions)
   - Metrics Collection
   - State Validation

### Test Execution

```bash
freelang interpreter_v2_test.fl
```

**Expected Output:**
```
╔════════════════════════════════════════════════════╗
║ FreeLang v2 Interpreter - Test Suite             ║
╚════════════════════════════════════════════════════╝

TEST: Process Creation & Management
  ✅ PASS: Process ID should be 1
  ✅ PASS: Process name should be Process1
  ... (total 44 assertions)

TEST SUMMARY
═════════════════════════════════════════════════════
Passed: 44 ✅
Failed: 0 ❌
Total: 44
Success Rate: 100%

🎉 All tests passed!
```

---

## 💡 Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| createProcess | O(1) | Hash map insertion |
| getProcess | O(1) | Hash map lookup |
| registerNeuron | O(n) | n = connections size |
| gse_propagate | O(m) | m = connected neurons |
| schedule | O(1) | FIFO queue operation |
| collectMetrics | O(p+n) | p = processes, n = neurons |

### Space Complexity

```
Total Memory = O(p + n + c)
where:
  p = number of processes
  n = number of neurons
  c = number of connections
```

---

## 🎓 Design Patterns

### 1. **Module Pattern**

```freeling
module interpreter_v2 {
    // Encapsulated state
    var processTable: map[int, ProcessControlBlock] = {}
    var neurons: map[int, Neuron] = {}

    // Public APIs
    fn createProcess(...) { ... }
    fn registerNeuron(...) { ... }
}
```

### 2. **Type Safety**

```freeling
type ProcessControlBlock { ... }
type Neuron { ... }
type SystemMetrics { ... }
```

### 3. **State Machine**

```
Process: NEW → READY ←→ RUNNING ← WAITING/BLOCKED
```

### 4. **Event-Driven Architecture**

```
Process Action
    ↓
gse_propagate()
    ↓
Neuron Activation
    ↓
Process Event
```

---

## 🚀 Usage Guidelines

### ✅ Do's

- ✅ 프로세스 생성 후 `enqueueReady()` 호출
- ✅ `setProcessState()` 사용하여 상태 변경
- ✅ 정기적으로 `run()` 호출하여 스케줄링
- ✅ 통계를 위해 `collectMetrics()` 사용
- ✅ 신경망 전에 `registerNeuron()` 호출

### ❌ Don'ts

- ❌ 같은 PID로 프로세스 재생성
- ❌ RUNNING이 아닌 프로세스에서 `processFiresNeuron()` 호출
- ❌ Ready Queue 순서를 수동으로 조정
- ❌ 프로세스 테이블 직접 수정

---

## 📈 Extension Points

### 1. Priority Scheduling

```freeling
// 현재: FIFO
// 개선: Priority Queue로 변경
fn selectNextProcessByPriority() -> int {
    // priority 필드 기반 정렬
}
```

### 2. Context Switching

```freeling
// 현재: 단순 상태 변경
// 개선: CPU 상태 저장/복원
fn contextSwitch(oldPid: int, newPid: int) {
    // 스택, 레지스터 등 저장
}
```

### 3. Advanced Propagation

```freeling
// 현재: Instant propagation
// 개선: Delayed propagation with queue
fn queuePropagation(neuronId: int, delay: int) {
    // 지연된 신호 전파
}
```

---

## 📚 References

- **OS Concepts**: Process Control Block, Scheduling, State Machine
- **Neural Networks**: Neurons, Synapses, Weights, Activation
- **FreeLang**: Module system, Types, Collections

---

**Version**: 1.0
**Status**: Production-Ready ✅
**Last Updated**: 2026-03-10
