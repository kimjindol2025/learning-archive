# FreeLang v4 SDN (Software Defined Networking)

## 개요

FreeLang v4 SDN은 소프트웨어 정의 네트워킹을 구현하여 프로그래매틱 네트워크 제어, 동적 라우팅, 네트워크 슬라이싱, 트래픽 엔지니어링을 제공합니다.

## 주요 기능

### 1. 네트워크 제어 평면
- OpenFlow 프로토콜 지원
- 중앙 집중식 네트워크 관리
- 동적 흐름 규칙 설정
- 네트워크 상태 모니터링

### 2. 라우팅 및 전달
- 최단 경로 라우팅 (Dijkstra)
- 트래픽 엔지니어링
- 다중 경로 라우팅 (ECMP)
- QoS 기반 라우팅

### 3. 네트워크 가상화
- 네트워크 슬라이싱
- 가상 LAN (VLAN) 관리
- 네트워크 함수 가상화 (NFV)
- 테넌트 격리

### 4. 트래픽 제어
- 대역폭 제한 및 예약
- 우선순위 큐 (Queue)
- 트래픽 셰이핑
- 혼잡 제어

### 5. 네트워크 보안
- ACL (Access Control List)
- 방화벽 규칙 관리
- 침입 탐지 (IDS)
- DDoS 완화

## 성능 특성

- **흐름 테이블 용량**: 100,000+ entries
- **패킷 처리율**: 10Gbps+
- **흐름 설정 지연**: <10ms
- **제어 평면 스케일**: 1,000+ 스위치

## 설치

```bash
git clone https://gogs.dclub.kr/kim/freelang-v4-sdn.git
cd freelang-v4-sdn
npm install
npm run build
```

## 사용법

### 네트워크 토폴로지 정의

```freelang
let network = SDNNetwork::new()

// 스위치 추가
network.add_switch("s1", OpenFlowVersion::V1_3)
network.add_switch("s2", OpenFlowVersion::V1_3)
network.add_switch("s3", OpenFlowVersion::V1_3)

// 호스트 추가
network.add_host("h1", mac: "00:00:00:00:00:01", ip: "10.0.0.1")
network.add_host("h2", mac: "00:00:00:00:00:02", ip: "10.0.0.2")

// 링크 추가
network.add_link("s1", "s2", bandwidth: 1000)
network.add_link("s2", "s3", bandwidth: 1000)
```

### 흐름 규칙 설정

```freelang
let controller = SDNController::new()

// 기본 전달 규칙
controller.add_flow(
  switch: "s1",
  match: FlowMatch::new()
    .eth_type(0x0800)
    .ipv4_dst("10.0.0.2"),
  actions: vec![
    FlowAction::SetField(Field::EthDst("00:00:00:00:00:02")),
    FlowAction::Output(port: 2)
  ]
)

// 메터링 및 대역폭 제한
controller.add_meter(
  switch: "s1",
  meter_id: 1,
  rate: 1000,  // 1Mbps
  burst_size: 10000
)
```

### 경로 계산 및 라우팅

```freelang
let router = SDNRouter::new()

// 최단 경로 계산
let path = router.compute_shortest_path(
  src: "10.0.0.1",
  dst: "10.0.0.2"
)
// path: ["s1", "s2", "s3"]

// 다중 경로 라우팅
let paths = router.compute_multipath(
  src: "10.0.0.1",
  dst: "10.0.0.2",
  num_paths: 3
)

// 경로에 따른 흐름 규칙 적용
router.apply_path(flow_entry, path)
```

### 네트워크 슬라이싱

```freelang
let slicer = NetworkSlicer::new()

// 슬라이스 생성
let slice_a = slicer.create_slice(
  name: "VoIP",
  priority: 1,
  bandwidth: 100,  // Mbps
  latency_bound: 50  // ms
)

let slice_b = slicer.create_slice(
  name: "Web",
  priority: 2,
  bandwidth: 500,
  latency_bound: 200
)

// 테넌트별 트래픽 분리
slicer.assign_tenant(slice_a, "tenant1")
slicer.assign_tenant(slice_b, "tenant2")
```

### 트래픽 모니터링

```freelang
let monitor = NetworkMonitor::new()

// 포트 통계 수집
let stats = monitor.get_port_stats(switch: "s1", port: 1)
// stats.tx_bytes, stats.rx_bytes, stats.tx_pkts, stats.rx_pkts

// 링크 상태 모니터링
let link_state = monitor.get_link_state("s1", "s2")
// link_state.speed, link_state.latency, link_state.loss

// 흐름 통계
let flow_stats = monitor.get_flow_stats(switch: "s1")
```

## 모범 사례

### 1. 제어 평면 보안
- 암호화된 제어 채널 (TLS)
- 컨트롤러 인증
- 흐름 규칙 서명

### 2. 고가용성
- 컨트롤러 중복화
- 로드 밸런싱
- 빠른 failover (<100ms)

### 3. 성능 최적화
- 흐름 테이블 캐싱
- 번치 명령어 사용
- 제어-데이터 평면 분리

### 4. 네트워크 격리
- 테넌트별 VRF (Virtual Routing & Forwarding)
- VLAN 기반 격리
- 정책 기반 라우팅

### 5. 모니터링 및 디버깅
- 포트별 패킷 카운터
- 흐름 추적
- 네트워크 토폴로지 시각화

## 아키텍처

```
┌─────────────────────────────────────────┐
│   Management & Orchestration            │
├─────────────────────────────────────────┤
│   SDN Controller                        │
│  ┌────────────────────────────────────┐ │
│  │ Control Plane                      │ │
│  │ - Flow Rule Management             │ │
│  │ - Topology Discovery               │ │
│  │ - Path Computation                 │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Network Applications               │ │
│  │ - Routing                          │ │
│  │ - Security Enforcement             │ │
│  │ - Load Balancing                   │ │
│  │ - Network Slicing                  │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│   OpenFlow Protocol                     │
├─────────────────────────────────────────┤
│   Data Plane (Switches)                 │
│  ┌────────────────────────────────────┐ │
│  │ Flow Tables (TCAM)                 │ │
│  │ - Exact Match                      │ │
│  │ - Wildcard Match                   │ │
│  │ - Group Tables                     │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Packet Processing                  │ │
│  │ - Header Modification              │ │
│  │ - Load Balancing                   │ │
│  │ - Metering & Policing              │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│   Physical Network                      │
└─────────────────────────────────────────┘
```

## 구성 요소

| 컴포넌트 | 설명 | 상태 |
|---------|------|------|
| SDNController | 중앙 제어 평면 | ✅ 완료 |
| SDNRouter | 라우팅 엔진 | ✅ 완료 |
| NetworkSlicer | 네트워크 슬라이싱 | ✅ 완료 |
| NetworkMonitor | 모니터링 및 통계 | ✅ 완료 |
| SecurityEngine | 보안 정책 | ⏳ 개발중 |
| LoadBalancer | 부하 분산 | ⏳ 계획중 |

## OpenFlow 버전 지원

- OpenFlow 1.0
- OpenFlow 1.3 (권장)
- OpenFlow 1.4
- OpenFlow 1.5

## 테스트

```bash
npm test
```

## 시뮬레이션

```bash
npm run simulate
```

## 라이선스

MIT License

---

**마지막 수정**: 2026-02-20
**버전**: 1.0.0
**관리자**: FreeLang Development Team
