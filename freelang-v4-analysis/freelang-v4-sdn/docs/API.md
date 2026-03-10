# FreeLang v4 SDN API 문서

## 목차

1. [SDNController](#sdncontroller)
2. [SDNRouter](#sdnrouter)
3. [NetworkSlicer](#networkslicer)
4. [NetworkMonitor](#networkmonitor)

---

## SDNController

중앙 집중식 네트워크 제어 평면입니다.

### `SDNController::new() -> SDNController`

새로운 SDN 컨트롤러를 생성합니다.

**반환값**: SDNController 인스턴스

**예제**:
```freelang
let controller = SDNController::new()
```

---

### `controller.add_switch(switch_id: String, version: OpenFlowVersion) -> Result<void>`

스위치를 추가합니다.

**매개변수**:
- `switch_id` (String): 스위치 ID (예: "s1")
- `version` (OpenFlowVersion): OpenFlow 버전 (V1_0, V1_3, V1_4, V1_5)

**반환값**: Result<void>

**예제**:
```freelang
controller.add_switch("s1", OpenFlowVersion::V1_3)?
controller.add_switch("s2", OpenFlowVersion::V1_3)?
controller.add_switch("s3", OpenFlowVersion::V1_3)?
```

---

### `controller.add_host(host_id: String, mac: String, ip: String) -> Result<void>`

호스트를 추가합니다.

**매개변수**:
- `host_id` (String): 호스트 ID (예: "h1")
- `mac` (String): MAC 주소
- `ip` (String): IP 주소

**반환값**: Result<void>

**예제**:
```freelang
controller.add_host("h1", "00:00:00:00:00:01", "10.0.0.1")?
controller.add_host("h2", "00:00:00:00:00:02", "10.0.0.2")?
```

---

### `controller.add_link(src: String, dst: String, bandwidth: Integer) -> Result<void>`

링크를 추가합니다.

**매개변수**:
- `src` (String): 소스 스위치/호스트 ID
- `dst` (String): 대상 스위치/호스트 ID
- `bandwidth` (Integer): 대역폭 (Mbps)

**반환값**: Result<void>

**예제**:
```freelang
controller.add_link("s1", "s2", bandwidth: 1000)?
controller.add_link("s2", "s3", bandwidth: 1000)?
controller.add_link("s1", "h1", bandwidth: 100)?
```

---

### `controller.add_flow(switch: String, match: FlowMatch, actions: List<FlowAction>) -> Result<FlowId>`

흐름 규칙을 추가합니다.

**매개변수**:
- `switch` (String): 대상 스위치 ID
- `match` (FlowMatch): 매칭 조건
- `actions` (List<FlowAction>): 수행할 액션

**반환값**: Result<FlowId> (규칙 ID)

**예제**:
```freelang
let flow_id = controller.add_flow(
  switch: "s1",
  match: FlowMatch::new()
    .eth_type(0x0800)  // IPv4
    .ipv4_dst("10.0.0.2"),
  actions: vec![
    FlowAction::SetField(Field::EthDst("00:00:00:00:00:02")),
    FlowAction::Output(port: 2)
  ]
)?
```

---

### `controller.add_meter(switch: String, meter_id: Integer, rate: Integer, burst_size: Integer) -> Result<void>`

미터(QoS)를 추가합니다.

**매개변수**:
- `switch` (String): 대상 스위치 ID
- `meter_id` (Integer): 미터 ID
- `rate` (Integer): 요금 제한 (Kbps)
- `burst_size` (Integer): 버스트 크기 (바이트)

**반환값**: Result<void>

**예제**:
```freelang
controller.add_meter(
  switch: "s1",
  meter_id: 1,
  rate: 1000,     // 1Mbps
  burst_size: 10000
)?
```

---

### `controller.remove_flow(switch: String, flow_id: FlowId) -> Result<void>`

흐름 규칙을 제거합니다.

**매개변수**:
- `switch` (String): 대상 스위치 ID
- `flow_id` (FlowId): 제거할 규칙 ID

**반환값**: Result<void>

**예제**:
```freelang
controller.remove_flow("s1", flow_id)?
```

---

### `controller.get_topology() -> NetworkTopology`

네트워크 토폴로지를 조회합니다.

**반환값**: NetworkTopology

**예제**:
```freelang
let topology = controller.get_topology()
println("Switches: " + topology.switches)
println("Links: " + topology.links)
println("Hosts: " + topology.hosts)
```

---

## SDNRouter

라우팅 및 경로 계산 엔진입니다.

### `SDNRouter::new() -> SDNRouter`

새로운 SDN 라우터를 생성합니다.

**반환값**: SDNRouter 인스턴스

**예제**:
```freelang
let router = SDNRouter::new()
```

---

### `router.compute_shortest_path(src: String, dst: String) -> Result<Path>`

최단 경로를 계산합니다.

**매개변수**:
- `src` (String): 소스 IP 주소
- `dst` (String): 대상 IP 주소

**반환값**: Result<Path> (스위치 ID 목록)

**예제**:
```freelang
let path = router.compute_shortest_path("10.0.0.1", "10.0.0.2")?
println("Path: " + path.hops)  // ["s1", "s2", "s3"]
println("Cost: " + path.cost)
```

---

### `router.compute_multipath(src: String, dst: String, num_paths: Integer) -> Result<List<Path>>`

다중 경로를 계산합니다.

**매개변수**:
- `src` (String): 소스 IP 주소
- `dst` (String): 대상 IP 주소
- `num_paths` (Integer): 요청할 경로 수

**반환값**: Result<List<Path>>

**예제**:
```freelang
let paths = router.compute_multipath("10.0.0.1", "10.0.0.2", 3)?
for path in paths {
  println("Path: " + path.hops + " (cost: " + path.cost + ")")
}
```

---

### `router.apply_path(flow_entry: FlowMatch, path: Path) -> Result<void>`

계산된 경로에 따라 흐름 규칙을 적용합니다.

**매개변수**:
- `flow_entry` (FlowMatch): 흐름 매칭 조건
- `path` (Path): 적용할 경로

**반환값**: Result<void>

**예제**:
```freelang
let flow = FlowMatch::new().ipv4_dst("10.0.0.2")
router.apply_path(flow, path)?
```

---

### `router.reroute(flow_id: FlowId) -> Result<void>`

기존 흐름을 다시 경로 설정합니다.

**매개변수**:
- `flow_id` (FlowId): 재경로 설정할 흐름 ID

**반환값**: Result<void>

**예제**:
```freelang
router.reroute(flow_id)?
```

---

## NetworkSlicer

네트워크 슬라이싱 관리입니다.

### `NetworkSlicer::new() -> NetworkSlicer`

새로운 네트워크 슬라이서를 생성합니다.

**반환값**: NetworkSlicer 인스턴스

**예제**:
```freelang
let slicer = NetworkSlicer::new()
```

---

### `slicer.create_slice(name: String, priority: Integer, bandwidth: Integer, latency_bound: Integer) -> Result<SliceId>`

네트워크 슬라이스를 생성합니다.

**매개변수**:
- `name` (String): 슬라이스 이름
- `priority` (Integer): 우선순위 (1=highest)
- `bandwidth` (Integer): 대역폭 할당 (Mbps)
- `latency_bound` (Integer): 지연 제한 (ms)

**반환값**: Result<SliceId>

**예제**:
```freelang
let voip_slice = slicer.create_slice(
  name: "VoIP",
  priority: 1,
  bandwidth: 100,
  latency_bound: 50
)?

let web_slice = slicer.create_slice(
  name: "Web",
  priority: 2,
  bandwidth: 500,
  latency_bound: 200
)?
```

---

### `slicer.assign_tenant(slice_id: SliceId, tenant_id: String) -> Result<void>`

테넌트를 슬라이스에 할당합니다.

**매개변수**:
- `slice_id` (SliceId): 슬라이스 ID
- `tenant_id` (String): 테넌트 ID

**반환값**: Result<void>

**예제**:
```freelang
slicer.assign_tenant(voip_slice, "tenant_voip")?
slicer.assign_tenant(web_slice, "tenant_web")?
```

---

### `slicer.update_slice(slice_id: SliceId, config: SliceConfig) -> Result<void>`

슬라이스 구성을 업데이트합니다.

**매개변수**:
- `slice_id` (SliceId): 슬라이스 ID
- `config` (SliceConfig): 새로운 구성

**반환값**: Result<void>

**예제**:
```freelang
slicer.update_slice(voip_slice, {
  bandwidth: 150,
  latency_bound: 30
})?
```

---

### `slicer.delete_slice(slice_id: SliceId) -> Result<void>`

슬라이스를 삭제합니다.

**매개변수**:
- `slice_id` (SliceId): 삭제할 슬라이스 ID

**반환값**: Result<void>

**예제**:
```freelang
slicer.delete_slice(voip_slice)?
```

---

### `slicer.get_slice_stats(slice_id: SliceId) -> Result<SliceStats>`

슬라이스 통계를 조회합니다.

**매개변수**:
- `slice_id` (SliceId): 슬라이스 ID

**반환값**: Result<SliceStats>

**예제**:
```freelang
let stats = slicer.get_slice_stats(voip_slice)?
println("Used bandwidth: " + stats.used_bandwidth + " Mbps")
println("Average latency: " + stats.avg_latency + " ms")
```

---

## NetworkMonitor

네트워크 모니터링 및 통계입니다.

### `NetworkMonitor::new() -> NetworkMonitor`

새로운 네트워크 모니터를 생성합니다.

**반환값**: NetworkMonitor 인스턴스

**예제**:
```freelang
let monitor = NetworkMonitor::new()
```

---

### `monitor.get_port_stats(switch: String, port: Integer) -> Result<PortStats>`

포트 통계를 조회합니다.

**매개변수**:
- `switch` (String): 스위치 ID
- `port` (Integer): 포트 번호

**반환값**: Result<PortStats>

**예제**:
```freelang
let stats = monitor.get_port_stats("s1", 1)?
println("TX bytes: " + stats.tx_bytes)
println("RX bytes: " + stats.rx_bytes)
println("TX packets: " + stats.tx_pkts)
println("RX packets: " + stats.rx_pkts)
println("Errors: " + stats.errors)
```

---

### `monitor.get_link_state(src: String, dst: String) -> Result<LinkState>`

링크 상태를 조회합니다.

**매개변수**:
- `src` (String): 소스 노드 ID
- `dst` (String): 대상 노드 ID

**반환값**: Result<LinkState>

**예제**:
```freelang
let link = monitor.get_link_state("s1", "s2")?
println("Speed: " + link.speed + " Mbps")
println("Latency: " + link.latency + " ms")
println("Loss: " + link.loss + " %")
println("Status: " + link.status)  // UP, DOWN
```

---

### `monitor.get_flow_stats(switch: String) -> Result<List<FlowStats>>`

흐름 통계를 조회합니다.

**매개변수**:
- `switch` (String): 스위치 ID

**반환값**: Result<List<FlowStats>>

**예제**:
```freelang
let flows = monitor.get_flow_stats("s1")?
for flow in flows {
  println("Flow: " + flow.id)
  println("  Packets: " + flow.packet_count)
  println("  Bytes: " + flow.byte_count)
  println("  Duration: " + flow.duration + " sec")
}
```

---

### `monitor.stream_metrics(interval: Integer, callback: Function) -> void`

메트릭을 주기적으로 스트리밍합니다.

**매개변수**:
- `interval` (Integer): 수집 간격 (초)
- `callback` (Function): 콜백 함수

**예제**:
```freelang
monitor.stream_metrics(5, |metrics| {
  println("CPU: " + metrics.cpu_usage + "%")
  println("Memory: " + metrics.memory_usage + "%")
  println("Throughput: " + metrics.throughput + " Mbps")
})
```

---

### `monitor.detect_anomalies() -> Result<List<Anomaly>>`

이상 징후를 탐지합니다.

**반환값**: Result<List<Anomaly>>

**예제**:
```freelang
let anomalies = monitor.detect_anomalies()?
for anomaly in anomalies {
  println("Anomaly: " + anomaly.type)
  println("  Severity: " + anomaly.severity)
  println("  Description: " + anomaly.description)
}
```

---

## 공통 타입

### FlowMatch

```freelang
type FlowMatch {
  eth_type(type: Integer) -> FlowMatch
  ipv4_src(ip: String) -> FlowMatch
  ipv4_dst(ip: String) -> FlowMatch
  tcp_src(port: Integer) -> FlowMatch
  tcp_dst(port: Integer) -> FlowMatch
  in_port(port: Integer) -> FlowMatch
}
```

### FlowAction

```freelang
type FlowAction {
  SetField(field: Field)
  Output(port: Integer)
  SetMetadata(metadata: Integer)
  ApplyMeter(meter_id: Integer)
  PushVlan(ethertype: Integer)
}
```

### PortStats

```freelang
type PortStats {
  tx_bytes: Integer
  rx_bytes: Integer
  tx_pkts: Integer
  rx_pkts: Integer
  errors: Integer
  dropped: Integer
}
```

### LinkState

```freelang
type LinkState {
  speed: Integer       // Mbps
  latency: Integer     // ms
  loss: Float         // percentage
  status: String      // UP, DOWN
}
```

---

**문서 버전**: 1.0.0
**최종 수정**: 2026-02-20
