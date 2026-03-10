#!/usr/bin/env python3
"""
MindLang 최적화 엔진 테스트
Day 12: 캐싱, 인덱싱, 압축, 성능 조정 검증

테스트:
├─ CacheOptimizer: LRU 캐시
├─ IndexBuilder: 메트릭 인덱싱
├─ CompressionEngine: 데이터 압축
├─ PerformanceTuner: 성능 조정
└─ OptimizationPipeline: 통합 파이프라인
"""

import unittest
import time
import json
import random
from optimization_engine import (
    CacheOptimizer, IndexBuilder, CompressionEngine,
    PerformanceTuner, OptimizationPipeline
)


class TestCacheOptimizer(unittest.TestCase):
    """캐시 최적화 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.cache = CacheOptimizer(max_size=10)
    
    def test_cache_hit(self):
        """캐시 히트"""
        self.cache.set("query1", {}, "result1")
        result = self.cache.get("query1", {})
        
        self.assertEqual(result, "result1")
        self.assertEqual(self.cache.hits, 1)
        self.assertEqual(self.cache.misses, 0)
        print("✅ 캐시 히트 통과")
    
    def test_cache_miss(self):
        """캐시 미스"""
        result = self.cache.get("nonexistent", {})
        
        self.assertIsNone(result)
        self.assertEqual(self.cache.misses, 1)
        print("✅ 캐시 미스 통과")
    
    def test_lru_eviction(self):
        """LRU 제거"""
        # 10개 항목 추가 (최대 10)
        for i in range(10):
            self.cache.set(f"query{i}", {}, f"result{i}")
        
        # 11번째 항목 추가 (가장 오래된 항목 제거)
        self.cache.set("query10", {}, "result10")
        
        self.assertEqual(len(self.cache.cache), 10)
        self.assertEqual(self.cache.evictions, 1)
        
        # query0은 제거되어야 함
        result = self.cache.get("query0", {})
        self.assertIsNone(result)
        print("✅ LRU 제거 통과")
    
    def test_lru_update(self):
        """LRU 업데이트"""
        for i in range(5):
            self.cache.set(f"query{i}", {}, f"result{i}")
        
        # query0 접근 (최근 사용으로 업데이트)
        self.cache.get("query0", {})
        
        # query5 추가하면 query1이 제거되어야 함
        for i in range(5, 11):
            self.cache.set(f"query{i}", {}, f"result{i}")
        
        result = self.cache.get("query0", {})
        self.assertIsNotNone(result)
        print("✅ LRU 업데이트 통과")
    
    def test_cache_statistics(self):
        """캐시 통계"""
        for i in range(5):
            self.cache.set(f"query{i}", {}, f"result{i}")
        
        # 3번 히트, 2번 미스 생성
        for i in range(3):
            self.cache.get(f"query{i}", {})
        
        self.cache.get("nonexistent1", {})
        self.cache.get("nonexistent2", {})
        
        stats = self.cache.get_statistics()
        
        self.assertEqual(stats['hits'], 3)
        self.assertEqual(stats['misses'], 2)
        self.assertAlmostEqual(stats['hit_rate'], 0.6, places=1)
        print("✅ 캐시 통계 통과")


class TestIndexBuilder(unittest.TestCase):
    """인덱싱 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.index = IndexBuilder()
        self.metrics = [
            ("cpu_usage", 1000.0, {"host": "server1"}),
            ("memory_usage", 2000.0, {"host": "server1"}),
            ("cpu_usage", 1100.0, {"host": "server2"}),
            ("memory_usage", 2100.0, {"host": "server2"}),
            ("cpu_usage", 1200.0, {"host": "server1"}),
        ]
    
    def test_build_metric_index(self):
        """메트릭 인덱스 구축"""
        idx = self.index.build_metric_index(self.metrics)
        
        self.assertIn("cpu_usage", idx)
        self.assertIn("memory_usage", idx)
        self.assertEqual(len(idx["cpu_usage"]), 3)
        self.assertEqual(len(idx["memory_usage"]), 2)
        print("✅ 메트릭 인덱스 통과")
    
    def test_search_by_metric(self):
        """메트릭명 검색"""
        self.index.build_metric_index(self.metrics)
        
        results = self.index.search_by_metric("cpu_usage")
        
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0], 0)  # 첫 번째 cpu_usage
        print("✅ 메트릭 검색 통과")
    
    def test_search_by_timestamp_range(self):
        """시간 범위 검색"""
        self.index.build_timestamp_index(self.metrics)
        
        results = self.index.search_by_timestamp_range(1000, 2100)
        
        self.assertGreater(len(results), 0)
        print("✅ 시간 범위 검색 통과")
    
    def test_search_by_label(self):
        """레이블 검색"""
        self.index.build_label_index(self.metrics)
        
        results = self.index.search_by_label("host", "server1")
        
        self.assertEqual(len(results), 3)  # server1 관련 3개
        print("✅ 레이블 검색 통과")
    
    def test_index_performance(self):
        """인덱스 성능"""
        # 대량 데이터 생성
        large_metrics = [
            (f"metric_{i%10}", float(i), {f"label_{j}": f"value_{j}" for j in range(3)})
            for i in range(1000)
        ]
        
        start = time.time()
        self.index.build_metric_index(large_metrics)
        self.index.build_label_index(large_metrics)
        elapsed = (time.time() - start) * 1000
        
        # 검색 성능
        start = time.time()
        results = self.index.search_by_metric("metric_0")
        search_time = (time.time() - start) * 1000000  # 마이크로초
        
        print(f"⚡ 인덱싱: {elapsed:.2f}ms, 검색: {search_time:.2f}µs")
        self.assertLess(search_time, 100)  # <100마이크로초
        print("✅ 인덱스 성능 통과")


class TestCompressionEngine(unittest.TestCase):
    """압축 엔진 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.compressor = CompressionEngine()
    
    def test_compress_decompress(self):
        """압축 & 압축 해제"""
        original = "Hello, World! " * 100
        
        compressed = self.compressor.compress(original)
        decompressed = self.compressor.decompress(compressed)
        
        self.assertEqual(decompressed, original)
        print("✅ 압축/해제 통과")
    
    def test_compression_ratio(self):
        """압축률 계산"""
        # 반복되는 데이터 (압축 잘 됨)
        data = "A" * 1000
        
        self.compressor.original_size = 0
        self.compressor.compressed_size = 0
        
        compressed = self.compressor.compress(data)
        ratio = self.compressor.get_compression_ratio()
        
        # 반복 데이터는 50% 이상 압축 가능
        self.assertGreater(ratio, 50)
        print(f"✅ 압축률 통과 ({ratio:.1f}%)")
    
    def test_compress_metrics(self):
        """메트릭 배치 압축"""
        metrics = [
            {"name": f"metric_{i}", "value": i, "timestamp": time.time()}
            for i in range(100)
        ]
        
        compressed = self.compressor.compress_metrics(metrics)
        
        self.assertIsInstance(compressed, bytes)
        self.assertGreater(len(compressed), 0)
        print("✅ 메트릭 압축 통과")
    
    def test_compression_statistics(self):
        """압축 통계"""
        for i in range(10):
            self.compressor.compress("data" * 100)
        
        stats = self.compressor.get_statistics()
        
        self.assertGreater(stats['original_size'], 0)
        self.assertGreater(stats['space_saved'], 0)
        self.assertGreater(stats['compression_ratio'], 0)
        print("✅ 압축 통계 통과")


class TestPerformanceTuner(unittest.TestCase):
    """성능 조정 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.tuner = PerformanceTuner()
    
    def test_record_metric(self):
        """메트릭 기록"""
        self.tuner.record_metric({'query_time': 5.0})
        self.tuner.record_metric({'query_time': 10.0})
        
        self.assertEqual(len(self.tuner.metrics_history), 2)
        print("✅ 메트릭 기록 통과")
    
    def test_auto_tune_slow_queries(self):
        """느린 쿼리 조정"""
        initial_ttl = self.tuner.cache_ttl
        
        # 느린 쿼리 기록
        for i in range(5):
            self.tuner.record_metric({'query_time': 20.0})
        
        adjustments = self.tuner.auto_tune()
        
        # TTL이 증가해야 함
        self.assertGreater(self.tuner.cache_ttl, initial_ttl)
        self.assertIn('cache_ttl', adjustments)
        print("✅ 느린 쿼리 조정 통과")
    
    def test_auto_tune_batch_size(self):
        """배치 크기 조정"""
        initial_batch = self.tuner.batch_size
        
        # 빠른 쿼리 기록
        for i in range(5):
            self.tuner.record_metric({'query_time': 0.5})
        
        adjustments = self.tuner.auto_tune()
        
        # 배치 크기가 증가해야 함
        self.assertGreater(self.tuner.batch_size, initial_batch)
        print("✅ 배치 크기 조정 통과")
    
    def test_recommendations(self):
        """권장사항 생성"""
        # 느린 쿼리 시뮬레이션
        for i in range(10):
            self.tuner.record_metric({'query_time': 25.0})
        
        recommendations = self.tuner.get_recommendations()
        
        self.assertGreater(len(recommendations), 0)
        print("✅ 권장사항 생성 통과")


class TestOptimizationPipeline(unittest.TestCase):
    """통합 파이프라인 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.pipeline = OptimizationPipeline(cache_size=100)
        self.metrics = [
            (f"metric_{i%5}", float(i), {"type": f"type_{i%3}"})
            for i in range(100)
        ]
    
    def test_process_metrics(self):
        """메트릭 처리"""
        result = self.pipeline.process_metrics(self.metrics)
        
        self.assertIn('processing_time_ms', result)
        self.assertIn('metrics_count', result)
        self.assertEqual(result['metrics_count'], 100)
        print("✅ 메트릭 처리 통과")
    
    def test_full_optimization(self):
        """완전 최적화"""
        # 여러 배치 처리
        for batch in range(5):
            metrics = [
                (f"metric_{i%3}", float(i), {"batch": str(batch)})
                for i in range(50)
            ]
            self.pipeline.process_metrics(metrics)
        
        status = self.pipeline.get_full_status()
        
        self.assertIn('cache', status)
        self.assertIn('compression', status)
        self.assertIn('tuner', status)
        self.assertIn('recommendations', status)
        print("✅ 완전 최적화 통과")
    
    def test_pipeline_performance(self):
        """파이프라인 성능"""
        import time
        start = time.time()
        
        for i in range(10):
            metrics = [
                (f"metric_{j%5}", float(j), {"id": str(j)})
                for j in range(100)
            ]
            self.pipeline.process_metrics(metrics)
        
        elapsed = (time.time() - start) * 1000
        avg_time = elapsed / 10
        
        print(f"⚡ 파이프라인 성능: {avg_time:.2f}ms/배치")
        self.assertLess(avg_time, 50)
        print("✅ 파이프라인 성능 통과")


class TestOptimizationPerformance(unittest.TestCase):
    """전체 성능 테스트"""
    
    def test_cache_hit_rate(self):
        """캐시 히트율"""
        cache = CacheOptimizer(max_size=100)
        
        # 반복되는 쿼리 패턴
        for _ in range(3):
            for i in range(20):
                cache.set(f"query_{i}", {}, f"result_{i}")
                cache.get(f"query_{i}", {})
        
        stats = cache.get_statistics()
        
        # 반복 쿼리는 높은 히트율
        self.assertGreater(stats['hit_rate'], 0.7)
        print(f"✅ 캐시 히트율: {stats['hit_rate']:.1%}")
    
    def test_index_speedup(self):
        """인덱싱 속도 개선"""
        metrics = [
            (f"metric_{i%10}", float(i), {"label": f"value_{i%5}"})
            for i in range(10000)
        ]
        
        index = IndexBuilder()
        index.build_metric_index(metrics)
        
        # 인덱스를 사용한 검색
        start = time.time()
        results = index.search_by_metric("metric_0")
        indexed_time = (time.time() - start) * 1000000
        
        # 선형 검색
        start = time.time()
        linear_results = [m for m in metrics if m[0] == "metric_0"]
        linear_time = (time.time() - start) * 1000000
        
        speedup = linear_time / indexed_time if indexed_time > 0 else 1
        print(f"⚡ 인덱싱 속도 향상: {speedup:.0f}배")
        self.assertGreater(speedup, 10)
        print("✅ 인덱싱 속도 개선 통과")


def run_tests():
    """모든 테스트 실행"""
    print("\n" + "=" * 70)
    print("🚀 MindLang Day 12: 최적화 엔진 테스트")
    print("=" * 70 + "\n")
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # 테스트 추가
    suite.addTests(loader.loadTestsFromTestCase(TestCacheOptimizer))
    suite.addTests(loader.loadTestsFromTestCase(TestIndexBuilder))
    suite.addTests(loader.loadTestsFromTestCase(TestCompressionEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformanceTuner))
    suite.addTests(loader.loadTestsFromTestCase(TestOptimizationPipeline))
    suite.addTests(loader.loadTestsFromTestCase(TestOptimizationPerformance))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # 요약
    print("\n" + "=" * 70)
    print("📊 테스트 결과 요약")
    print("=" * 70)
    print(f"총 테스트: {result.testsRun}")
    print(f"성공: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"실패: {len(result.failures)}")
    print(f"에러: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✅ 모든 테스트 통과!")
        print("🎯 Day 12 최적화 엔진 완성!")
    else:
        print("\n❌ 일부 테스트 실패")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
