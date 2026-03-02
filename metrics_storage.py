#!/usr/bin/env python3
"""
MindLang 메트릭 저장소 시스템
Day 11: 메트릭 수집, 저장, 조회 시스템

컴포넌트:
├─ MetricsCollector: 여러 소스에서 메트릭 수집
├─ StorageLayer: 파일 + 메모리 저장소
├─ RetentionPolicy: TTL 관리 & 자동 삭제
└─ QueryInterface: 메트릭 조회 & 필터링
"""

import time
import json
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
import statistics


class MetricType(Enum):
    """메트릭 유형"""
    GAUGE = "게이지"           # 순간값 (CPU, 메모리)
    COUNTER = "카운터"         # 누적값 (요청 수, 에러 수)
    HISTOGRAM = "히스토그램"   # 분포 (응답시간)
    SUMMARY = "요약"           # 요약 (P50, P99)


@dataclass
class MetricPoint:
    """메트릭 데이터 포인트"""
    timestamp: float
    value: float
    metric_name: str
    labels: Dict[str, str] = field(default_factory=dict)
    metric_type: MetricType = MetricType.GAUGE
    
    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            'timestamp': self.timestamp,
            'value': self.value,
            'metric_name': self.metric_name,
            'labels': self.labels,
            'metric_type': self.metric_type.value
        }


class MetricsCollector:
    """메트릭 수집기"""
    
    def __init__(self, buffer_size: int = 1000):
        """초기화"""
        self.buffer: List[MetricPoint] = []
        self.buffer_size = buffer_size
        self.metrics_count = 0
    
    def collect_prometheus_metric(self, name: str, value: float,
                                 labels: Dict[str, str] = None) -> MetricPoint:
        """Prometheus 스타일 메트릭 수집"""
        if labels is None:
            labels = {}
        
        point = MetricPoint(
            timestamp=time.time(),
            value=value,
            metric_name=name,
            labels=labels,
            metric_type=MetricType.GAUGE
        )
        
        self.buffer.append(point)
        self.metrics_count += 1
        
        # 버퍼 오버플로우 관리
        if len(self.buffer) > self.buffer_size:
            self.buffer.pop(0)
        
        return point
    
    def collect_kubernetes_metric(self, pod_name: str, metric_type: str,
                                 value: float) -> MetricPoint:
        """Kubernetes 메트릭 수집"""
        labels = {
            'pod': pod_name,
            'source': 'kubernetes'
        }
        
        point = MetricPoint(
            timestamp=time.time(),
            value=value,
            metric_name=f"k8s_{metric_type}",
            labels=labels,
            metric_type=MetricType.GAUGE
        )
        
        self.buffer.append(point)
        self.metrics_count += 1
        
        if len(self.buffer) > self.buffer_size:
            self.buffer.pop(0)
        
        return point
    
    def collect_application_metric(self, service: str, metric: str,
                                   value: float) -> MetricPoint:
        """애플리케이션 메트릭 수집"""
        labels = {
            'service': service,
            'source': 'application'
        }
        
        point = MetricPoint(
            timestamp=time.time(),
            value=value,
            metric_name=metric,
            labels=labels,
            metric_type=MetricType.GAUGE
        )
        
        self.buffer.append(point)
        self.metrics_count += 1
        
        if len(self.buffer) > self.buffer_size:
            self.buffer.pop(0)
        
        return point
    
    def get_buffer_state(self) -> Dict[str, Any]:
        """버퍼 상태 조회"""
        return {
            'size': len(self.buffer),
            'capacity': self.buffer_size,
            'total_collected': self.metrics_count,
            'utilization': len(self.buffer) / self.buffer_size * 100
        }


class StorageLayer:
    """저장소 계층"""
    
    def __init__(self, file_path: str = "metrics.jsonl"):
        """초기화"""
        self.file_path = file_path
        self.memory_store: Dict[str, List[MetricPoint]] = {}
        self.index: Dict[str, List[int]] = {}  # 메트릭 이름별 인덱스
    
    def save_metric(self, point: MetricPoint) -> bool:
        """메트릭 저장 (메모리 + 파일)"""
        try:
            # 메모리 저장
            if point.metric_name not in self.memory_store:
                self.memory_store[point.metric_name] = []
            
            self.memory_store[point.metric_name].append(point)
            
            # 파일 저장 (JSONL 형식)
            with open(self.file_path, 'a') as f:
                f.write(json.dumps(point.to_dict()) + '\n')
            
            return True
        except Exception as e:
            return False
    
    def save_batch(self, points: List[MetricPoint]) -> int:
        """배치 저장"""
        saved_count = 0
        for point in points:
            if self.save_metric(point):
                saved_count += 1
        return saved_count
    
    def get_metric(self, metric_name: str, 
                   start_time: Optional[float] = None,
                   end_time: Optional[float] = None) -> List[MetricPoint]:
        """메트릭 조회"""
        if metric_name not in self.memory_store:
            return []
        
        points = self.memory_store[metric_name]
        
        # 시간 범위 필터링
        if start_time is not None or end_time is not None:
            if start_time is None:
                start_time = 0
            if end_time is None:
                end_time = float('inf')
            
            points = [p for p in points if start_time <= p.timestamp <= end_time]
        
        return points
    
    def get_all_metrics(self) -> Dict[str, List[MetricPoint]]:
        """모든 메트릭 조회"""
        return self.memory_store
    
    def delete_metric(self, metric_name: str) -> int:
        """메트릭 삭제"""
        if metric_name in self.memory_store:
            count = len(self.memory_store[metric_name])
            del self.memory_store[metric_name]
            return count
        return 0
    
    def get_storage_size(self) -> Dict[str, Any]:
        """저장소 크기 조회"""
        total_points = sum(len(points) for points in self.memory_store.values())
        metrics_count = len(self.memory_store)
        
        return {
            'total_points': total_points,
            'metrics_count': metrics_count,
            'avg_points_per_metric': total_points / metrics_count if metrics_count > 0 else 0,
            'memory_estimate_mb': (total_points * 200) / (1024 * 1024)  # 대략 200바이트/포인트
        }


class RetentionPolicy:
    """보관 정책 관리"""
    
    def __init__(self, default_ttl_seconds: int = 3600):
        """초기화 (기본 TTL: 1시간)"""
        self.default_ttl = default_ttl_seconds
        self.metric_ttls: Dict[str, int] = {}
    
    def set_metric_ttl(self, metric_name: str, ttl_seconds: int):
        """메트릭별 TTL 설정"""
        self.metric_ttls[metric_name] = ttl_seconds
    
    def get_ttl(self, metric_name: str) -> int:
        """메트릭의 TTL 조회"""
        return self.metric_ttls.get(metric_name, self.default_ttl)
    
    def cleanup_expired(self, storage: StorageLayer) -> Dict[str, Any]:
        """만료된 메트릭 정리"""
        current_time = time.time()
        expired_count = 0
        deleted_metrics = []
        
        for metric_name in list(storage.memory_store.keys()):
            ttl = self.get_ttl(metric_name)
            points = storage.memory_store[metric_name]
            
            # TTL 초과 포인트 제거
            valid_points = [
                p for p in points
                if current_time - p.timestamp < ttl
            ]
            
            expired_count += len(points) - len(valid_points)
            
            if valid_points:
                storage.memory_store[metric_name] = valid_points
            else:
                del storage.memory_store[metric_name]
                deleted_metrics.append(metric_name)
        
        return {
            'expired_points': expired_count,
            'deleted_metrics': deleted_metrics,
            'cleanup_time': datetime.now().isoformat()
        }
    
    def get_expiration_time(self, metric_name: str, 
                           creation_time: float) -> float:
        """메트릭의 만료 시간"""
        ttl = self.get_ttl(metric_name)
        return creation_time + ttl


class QueryInterface:
    """쿼리 인터페이스"""
    
    def __init__(self, storage: StorageLayer):
        """초기화"""
        self.storage = storage
    
    def query_range(self, metric_name: str, start_time: float,
                   end_time: float) -> List[MetricPoint]:
        """시간 범위 쿼리"""
        points = self.storage.get_metric(metric_name, start_time, end_time)
        return sorted(points, key=lambda p: p.timestamp)
    
    def query_latest(self, metric_name: str, count: int = 1) -> List[MetricPoint]:
        """최신 N개 데이터 조회"""
        points = self.storage.get_metric(metric_name)
        return sorted(points, key=lambda p: p.timestamp, reverse=True)[:count]
    
    def query_with_labels(self, metric_name: str,
                         labels: Dict[str, str]) -> List[MetricPoint]:
        """레이블 필터링 쿼리"""
        points = self.storage.get_metric(metric_name)
        
        filtered = []
        for point in points:
            if all(point.labels.get(k) == v for k, v in labels.items()):
                filtered.append(point)
        
        return filtered
    
    def aggregate(self, metric_name: str, start_time: Optional[float] = None,
                 end_time: Optional[float] = None,
                 aggregation: str = "avg") -> Optional[float]:
        """메트릭 집계"""
        points = self.storage.get_metric(metric_name, start_time, end_time)
        
        if not points:
            return None
        
        values = [p.value for p in points]
        
        if aggregation == "avg":
            return statistics.mean(values)
        elif aggregation == "sum":
            return sum(values)
        elif aggregation == "min":
            return min(values)
        elif aggregation == "max":
            return max(values)
        elif aggregation == "median":
            return statistics.median(values)
        elif aggregation == "stdev":
            return statistics.stdev(values) if len(values) > 1 else 0
        else:
            return None
    
    def query_metrics(self, filters: Dict[str, Any] = None) -> Dict[str, List[MetricPoint]]:
        """고급 쿼리 (필터 기반)"""
        results = {}
        
        for metric_name, points in self.storage.get_all_metrics().items():
            if filters is None:
                results[metric_name] = points
                continue
            
            # 필터 적용
            filtered_points = points
            
            if 'source' in filters:
                filtered_points = [
                    p for p in filtered_points
                    if p.labels.get('source') == filters['source']
                ]
            
            if 'min_value' in filters:
                filtered_points = [
                    p for p in filtered_points
                    if p.value >= filters['min_value']
                ]
            
            if 'max_value' in filters:
                filtered_points = [
                    p for p in filtered_points
                    if p.value <= filters['max_value']
                ]
            
            if filtered_points:
                results[metric_name] = filtered_points
        
        return results
    
    def get_statistics(self, metric_name: str) -> Dict[str, Any]:
        """메트릭 통계"""
        points = self.storage.get_metric(metric_name)
        
        if not points:
            return {'error': 'No data'}
        
        values = [p.value for p in points]
        
        return {
            'metric_name': metric_name,
            'count': len(values),
            'mean': statistics.mean(values),
            'median': statistics.median(values),
            'stdev': statistics.stdev(values) if len(values) > 1 else 0,
            'min': min(values),
            'max': max(values),
            'sum': sum(values),
            'first_timestamp': points[0].timestamp,
            'last_timestamp': points[-1].timestamp,
            'duration_seconds': points[-1].timestamp - points[0].timestamp
        }


if __name__ == "__main__":
    print("✅ 메트릭 저장소 시스템 로드됨")
