#!/usr/bin/env python3
"""
MindLang 최적화 엔진
Day 12: 캐싱, 인덱싱, 압축, 성능 조정

컴포넌트:
├─ CacheOptimizer: LRU 캐시 & 쿼리 결과 캐싱
├─ IndexBuilder: 메트릭 인덱싱
├─ CompressionEngine: 데이터 압축
└─ PerformanceTuner: 동적 성능 조정
"""

import time
import zlib
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from collections import OrderedDict
from dataclasses import dataclass, field
import statistics
import math


@dataclass
class CacheEntry:
    """캐시 항목"""
    key: str
    value: Any
    timestamp: float
    access_count: int = 0
    last_access: float = field(default_factory=time.time)
    ttl: int = 300  # 5분


class CacheOptimizer:
    """LRU 캐시 최적화"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        """초기화"""
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.hits = 0
        self.misses = 0
        self.evictions = 0
    
    def _make_key(self, query: str, params: Dict) -> str:
        """쿼리 키 생성"""
        param_str = str(sorted(params.items()))
        combined = f"{query}:{param_str}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def get(self, query: str, params: Dict = None) -> Optional[Any]:
        """캐시에서 조회"""
        if params is None:
            params = {}
        
        key = self._make_key(query, params)
        
        if key in self.cache:
            entry = self.cache[key]
            
            # TTL 확인
            if time.time() - entry.timestamp > entry.ttl:
                del self.cache[key]
                self.misses += 1
                return None
            
            # LRU 업데이트: 최근 사용 항목을 끝으로 이동
            self.cache.move_to_end(key)
            entry.access_count += 1
            entry.last_access = time.time()
            self.hits += 1
            return entry.value
        
        self.misses += 1
        return None
    
    def set(self, query: str, params: Dict, value: Any, ttl: int = None):
        """캐시에 저장"""
        if ttl is None:
            ttl = self.default_ttl
        
        key = self._make_key(query, params)
        
        # 이미 존재하면 업데이트
        if key in self.cache:
            self.cache.move_to_end(key)
            self.cache[key].value = value
            self.cache[key].timestamp = time.time()
            self.cache[key].ttl = ttl
            return
        
        # 새 항목 추가
        if len(self.cache) >= self.max_size:
            # LRU: 가장 오래된 항목 제거
            removed_key, _ = self.cache.popitem(last=False)
            self.evictions += 1
        
        entry = CacheEntry(key, value, time.time(), 0, time.time(), ttl)
        self.cache[key] = entry
    
    def clear(self):
        """캐시 전체 삭제"""
        self.cache.clear()
    
    def get_statistics(self) -> Dict[str, Any]:
        """캐시 통계"""
        total_requests = self.hits + self.misses
        hit_rate = self.hits / total_requests if total_requests > 0 else 0
        
        return {
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': hit_rate,
            'evictions': self.evictions,
            'size': len(self.cache),
            'capacity': self.max_size,
            'utilization': len(self.cache) / self.max_size * 100
        }


class IndexBuilder:
    """메트릭 인덱싱"""
    
    def __init__(self):
        """초기화"""
        self.metric_index: Dict[str, List[int]] = {}  # 메트릭명 -> 포인트 인덱스
        self.timestamp_index: Dict[float, List[int]] = {}  # 타임스탐프 -> 포인트 인덱스
        self.label_index: Dict[Tuple[str, str], List[int]] = {}  # (레이블명, 값) -> 포인트 인덱스
    
    def build_metric_index(self, metrics: List[Tuple[str, float, Dict]]) -> Dict[str, List[int]]:
        """메트릭명 인덱스 구축"""
        self.metric_index.clear()
        
        for idx, (metric_name, _, _) in enumerate(metrics):
            if metric_name not in self.metric_index:
                self.metric_index[metric_name] = []
            self.metric_index[metric_name].append(idx)
        
        return self.metric_index
    
    def build_timestamp_index(self, metrics: List[Tuple[str, float, Dict]]) -> Dict[float, List[int]]:
        """타임스탐프 인덱스 구축"""
        self.timestamp_index.clear()
        
        for idx, (_, timestamp, _) in enumerate(metrics):
            # 1초 단위 버킷팅
            bucket = int(timestamp)
            if bucket not in self.timestamp_index:
                self.timestamp_index[bucket] = []
            self.timestamp_index[bucket].append(idx)
        
        return self.timestamp_index
    
    def build_label_index(self, metrics: List[Tuple[str, float, Dict]]) -> Dict[Tuple[str, str], List[int]]:
        """레이블 인덱스 구축"""
        self.label_index.clear()
        
        for idx, (_, _, labels) in enumerate(metrics):
            for label_name, label_value in labels.items():
                key = (label_name, label_value)
                if key not in self.label_index:
                    self.label_index[key] = []
                self.label_index[key].append(idx)
        
        return self.label_index
    
    def search_by_metric(self, metric_name: str) -> List[int]:
        """메트릭명으로 검색 (O(1))"""
        return self.metric_index.get(metric_name, [])
    
    def search_by_timestamp_range(self, start: float, end: float) -> List[int]:
        """시간 범위 검색 (O(log n) + O(k))"""
        result = []
        start_bucket = int(start)
        end_bucket = int(end)
        
        for bucket in range(start_bucket, end_bucket + 1):
            if bucket in self.timestamp_index:
                result.extend(self.timestamp_index[bucket])
        
        return result
    
    def search_by_label(self, label_name: str, label_value: str) -> List[int]:
        """레이블로 검색 (O(1))"""
        key = (label_name, label_value)
        return self.label_index.get(key, [])
    
    def get_index_size(self) -> Dict[str, Any]:
        """인덱스 크기"""
        return {
            'metric_index_entries': len(self.metric_index),
            'timestamp_index_entries': len(self.timestamp_index),
            'label_index_entries': len(self.label_index),
            'total_entries': sum(len(v) for v in self.metric_index.values())
        }


class CompressionEngine:
    """데이터 압축 엔진"""
    
    def __init__(self):
        """초기화"""
        self.original_size = 0
        self.compressed_size = 0
    
    def compress(self, data: str) -> bytes:
        """데이터 압축"""
        self.original_size += len(data.encode())
        compressed = zlib.compress(data.encode(), level=6)
        self.compressed_size += len(compressed)
        return compressed
    
    def decompress(self, data: bytes) -> str:
        """데이터 압축 해제"""
        return zlib.decompress(data).decode()
    
    def compress_metrics(self, metrics: List[Dict]) -> bytes:
        """메트릭 배치 압축"""
        import json
        data = json.dumps(metrics)
        return self.compress(data)
    
    def get_compression_ratio(self) -> float:
        """압축률 계산"""
        if self.original_size == 0:
            return 0.0
        return (1 - self.compressed_size / self.original_size) * 100
    
    def get_statistics(self) -> Dict[str, Any]:
        """압축 통계"""
        return {
            'original_size': self.original_size,
            'compressed_size': self.compressed_size,
            'compression_ratio': self.get_compression_ratio(),
            'space_saved': self.original_size - self.compressed_size
        }


class PerformanceTuner:
    """성능 자동 조정"""
    
    def __init__(self):
        """초기화"""
        self.batch_size = 100
        self.cache_ttl = 300
        self.index_refresh_interval = 60
        self.compression_threshold = 1000  # 바이트
        
        self.metrics_history: List[Dict[str, float]] = []
        self.max_history = 100
    
    def record_metric(self, metric: Dict[str, float]):
        """성능 메트릭 기록"""
        self.metrics_history.append({
            'timestamp': time.time(),
            **metric
        })
        
        # 최근 100개만 유지
        if len(self.metrics_history) > self.max_history:
            self.metrics_history.pop(0)
    
    def auto_tune(self) -> Dict[str, Any]:
        """자동 조정"""
        if not self.metrics_history:
            return {'status': 'no_data'}
        
        # 최근 쿼리 성능 분석
        query_times = [m.get('query_time', 0) for m in self.metrics_history[-10:]]
        cache_hits = [m.get('cache_hits', 0) for m in self.metrics_history[-10:]]
        
        adjustments = {}
        
        # 쿼리 시간이 느리면 캐시 TTL 증가
        if query_times and statistics.mean(query_times) > 10:
            self.cache_ttl = min(self.cache_ttl * 1.5, 3600)
            adjustments['cache_ttl'] = self.cache_ttl
        
        # 캐시 히트율이 낮으면 캐시 크기 증가
        if cache_hits and statistics.mean(cache_hits) < 0.5:
            # 캐시 최적화 신호 (실제로는 외부에서 처리)
            adjustments['cache_optimization'] = 'increase_size'
        
        # 배치 크기 동적 조정
        if query_times and statistics.mean(query_times) < 1:
            self.batch_size = min(self.batch_size * 2, 10000)
        elif query_times and statistics.mean(query_times) > 50:
            self.batch_size = max(self.batch_size // 2, 10)
        
        adjustments['batch_size'] = self.batch_size
        
        return adjustments
    
    def get_recommendations(self) -> List[str]:
        """권장사항 생성"""
        recommendations = []
        
        if not self.metrics_history:
            return recommendations
        
        # 최근 성능 분석
        recent = self.metrics_history[-10:]
        query_times = [m.get('query_time', 0) for m in recent]
        
        if statistics.mean(query_times) > 20:
            recommendations.append("캐시 TTL을 증가시키세요")
            recommendations.append("인덱싱을 다시 구축하세요")
        
        if statistics.mean([m.get('cache_hit_rate', 0) for m in recent]) < 0.7:
            recommendations.append("캐시 크기를 증가시키세요")
        
        return recommendations
    
    def get_tuning_status(self) -> Dict[str, Any]:
        """조정 상태"""
        return {
            'batch_size': self.batch_size,
            'cache_ttl': self.cache_ttl,
            'index_refresh_interval': self.index_refresh_interval,
            'compression_threshold': self.compression_threshold,
            'metrics_collected': len(self.metrics_history)
        }


class OptimizationPipeline:
    """최적화 파이프라인"""
    
    def __init__(self, cache_size: int = 1000):
        """초기화"""
        self.cache = CacheOptimizer(max_size=cache_size)
        self.index = IndexBuilder()
        self.compression = CompressionEngine()
        self.tuner = PerformanceTuner()
        self.metrics_data: List[Tuple[str, float, Dict]] = []
    
    def process_metrics(self, metrics: List[Tuple[str, float, Dict]]) -> Dict[str, Any]:
        """메트릭 처리 (캐싱 + 인덱싱 + 압축)"""
        import time
        start = time.time()
        
        self.metrics_data = metrics
        
        # 인덱스 구축
        self.index.build_metric_index(metrics)
        self.index.build_timestamp_index(metrics)
        self.index.build_label_index(metrics)
        
        # 압축 (필요시)
        import json
        metrics_json = json.dumps([
            {'name': m[0], 'timestamp': m[1], 'labels': m[2]}
            for m in metrics
        ])
        
        if len(metrics_json) > self.tuner.compression_threshold:
            self.compression.compress(metrics_json)
        
        elapsed = (time.time() - start) * 1000
        
        # 성능 기록
        self.tuner.record_metric({
            'query_time': elapsed,
            'cache_hits': self.cache.hits,
            'cache_misses': self.cache.misses
        })
        
        return {
            'processing_time_ms': elapsed,
            'metrics_count': len(metrics),
            'index_size': self.index.get_index_size(),
            'compression_ratio': self.compression.get_compression_ratio()
        }
    
    def get_full_status(self) -> Dict[str, Any]:
        """전체 상태"""
        return {
            'cache': self.cache.get_statistics(),
            'compression': self.compression.get_statistics(),
            'tuner': self.tuner.get_tuning_status(),
            'recommendations': self.tuner.get_recommendations()
        }


if __name__ == "__main__":
    print("✅ 최적화 엔진 로드됨")
