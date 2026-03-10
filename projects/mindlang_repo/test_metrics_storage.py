#!/usr/bin/env python3
"""
MindLang 메트릭 저장소 테스트
Day 11: 메트릭 수집, 저장, 조회 검증

테스트:
├─ MetricsCollector: 메트릭 수집
├─ StorageLayer: 저장 & 조회
├─ RetentionPolicy: TTL 관리
└─ QueryInterface: 고급 쿼리
"""

import unittest
import time
import os
import random
from metrics_storage import (
    MetricsCollector, StorageLayer, RetentionPolicy,
    QueryInterface, MetricPoint, MetricType
)


class TestMetricsCollector(unittest.TestCase):
    """메트릭 수집 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.collector = MetricsCollector(buffer_size=100)
    
    def test_collect_prometheus_metric(self):
        """Prometheus 메트릭 수집"""
        point = self.collector.collect_prometheus_metric(
            "cpu_usage", 45.5,
            labels={"host": "server1"}
        )
        
        self.assertEqual(point.metric_name, "cpu_usage")
        self.assertEqual(point.value, 45.5)
        self.assertEqual(point.labels["host"], "server1")
        self.assertGreater(point.timestamp, 0)
        print("✅ Prometheus 메트릭 수집 통과")
    
    def test_collect_kubernetes_metric(self):
        """Kubernetes 메트릭 수집"""
        point = self.collector.collect_kubernetes_metric(
            "nginx-pod-1", "memory_usage", 256
        )
        
        self.assertEqual(point.metric_name, "k8s_memory_usage")
        self.assertEqual(point.value, 256)
        self.assertEqual(point.labels["source"], "kubernetes")
        print("✅ Kubernetes 메트릭 수집 통과")
    
    def test_collect_application_metric(self):
        """애플리케이션 메트릭 수집"""
        point = self.collector.collect_application_metric(
            "api-service", "request_latency", 125.3
        )
        
        self.assertEqual(point.metric_name, "request_latency")
        self.assertEqual(point.value, 125.3)
        self.assertEqual(point.labels["service"], "api-service")
        print("✅ 애플리케이션 메트릭 수집 통과")
    
    def test_buffer_overflow(self):
        """버퍼 오버플로우 관리"""
        # 작은 버퍼로 테스트
        collector = MetricsCollector(buffer_size=5)
        
        for i in range(10):
            collector.collect_prometheus_metric(f"metric_{i}", i)
        
        # 버퍼 크기 유지
        self.assertLessEqual(len(collector.buffer), 5)
        self.assertEqual(collector.metrics_count, 10)  # 수집한 총 메트릭
        print("✅ 버퍼 오버플로우 관리 통과")
    
    def test_collector_state(self):
        """수집기 상태 조회"""
        for i in range(50):
            self.collector.collect_prometheus_metric(f"metric_{i}", random.random())
        
        state = self.collector.get_buffer_state()
        
        self.assertEqual(state['size'], 50)
        self.assertEqual(state['capacity'], 100)
        self.assertEqual(state['total_collected'], 50)
        self.assertAlmostEqual(state['utilization'], 50.0)
        print("✅ 수집기 상태 조회 통과")


class TestStorageLayer(unittest.TestCase):
    """저장소 계층 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.storage = StorageLayer(file_path="/tmp/test_metrics.jsonl")
        if os.path.exists(self.storage.file_path):
            os.remove(self.storage.file_path)
    
    def tearDown(self):
        """테스트 후 정리"""
        if os.path.exists(self.storage.file_path):
            os.remove(self.storage.file_path)
    
    def test_save_single_metric(self):
        """단일 메트릭 저장"""
        point = MetricPoint(
            timestamp=time.time(),
            value=75.5,
            metric_name="cpu_usage"
        )
        
        result = self.storage.save_metric(point)
        
        self.assertTrue(result)
        self.assertIn("cpu_usage", self.storage.memory_store)
        print("✅ 단일 메트릭 저장 통과")
    
    def test_save_batch(self):
        """배치 저장"""
        points = [
            MetricPoint(time.time() + i, float(i), f"metric_{i}")
            for i in range(10)
        ]
        
        saved = self.storage.save_batch(points)
        
        self.assertEqual(saved, 10)
        self.assertEqual(len(self.storage.memory_store), 10)
        print("✅ 배치 저장 통과")
    
    def test_get_metric(self):
        """메트릭 조회"""
        for i in range(5):
            point = MetricPoint(time.time() + i, float(i), "test_metric")
            self.storage.save_metric(point)
        
        retrieved = self.storage.get_metric("test_metric")
        
        self.assertEqual(len(retrieved), 5)
        self.assertEqual(retrieved[0].value, 0)
        print("✅ 메트릭 조회 통과")
    
    def test_get_metric_with_time_range(self):
        """시간 범위 필터링"""
        base_time = time.time()
        for i in range(10):
            point = MetricPoint(
                timestamp=base_time + i,
                value=float(i),
                metric_name="time_test"
            )
            self.storage.save_metric(point)
        
        # 3초부터 7초 범위
        retrieved = self.storage.get_metric(
            "time_test",
            start_time=base_time + 3,
            end_time=base_time + 7
        )
        
        self.assertEqual(len(retrieved), 5)
        print("✅ 시간 범위 필터링 통과")
    
    def test_delete_metric(self):
        """메트릭 삭제"""
        for i in range(5):
            point = MetricPoint(time.time(), float(i), "delete_test")
            self.storage.save_metric(point)
        
        deleted_count = self.storage.delete_metric("delete_test")
        
        self.assertEqual(deleted_count, 5)
        self.assertNotIn("delete_test", self.storage.memory_store)
        print("✅ 메트릭 삭제 통과")
    
    def test_storage_size(self):
        """저장소 크기 조회"""
        for i in range(3):
            for j in range(4):
                point = MetricPoint(
                    time.time(),
                    float(j),
                    f"metric_{i}"
                )
                self.storage.save_metric(point)
        
        size_info = self.storage.get_storage_size()
        
        self.assertEqual(size_info['total_points'], 12)
        self.assertEqual(size_info['metrics_count'], 3)
        self.assertGreater(size_info['memory_estimate_mb'], 0)
        print("✅ 저장소 크기 조회 통과")


class TestRetentionPolicy(unittest.TestCase):
    """보관 정책 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.policy = RetentionPolicy(default_ttl_seconds=10)
        self.storage = StorageLayer()
    
    def test_set_metric_ttl(self):
        """메트릭별 TTL 설정"""
        self.policy.set_metric_ttl("important_metric", 3600)
        self.policy.set_metric_ttl("temporary_metric", 60)
        
        self.assertEqual(self.policy.get_ttl("important_metric"), 3600)
        self.assertEqual(self.policy.get_ttl("temporary_metric"), 60)
        self.assertEqual(self.policy.get_ttl("unknown_metric"), 10)
        print("✅ TTL 설정 통과")
    
    def test_cleanup_expired(self):
        """만료된 메트릭 정리"""
        current_time = time.time()
        
        # 최근 데이터
        fresh = MetricPoint(current_time, 1, "metric1")
        self.storage.save_metric(fresh)
        
        # 오래된 데이터 (수동으로 설정)
        old = MetricPoint(current_time - 20, 2, "metric2")
        self.storage.save_metric(old)
        
        # TTL 설정 (10초)
        self.policy.set_metric_ttl("metric1", 100)
        self.policy.set_metric_ttl("metric2", 10)
        
        # 정리 실행
        cleanup_result = self.policy.cleanup_expired(self.storage)
        
        self.assertGreater(cleanup_result['expired_points'], 0)
        print("✅ 만료 정리 통과")
    
    def test_expiration_time(self):
        """만료 시간 계산"""
        creation_time = time.time()
        
        self.policy.set_metric_ttl("test_metric", 3600)
        expiration = self.policy.get_expiration_time("test_metric", creation_time)
        
        expected = creation_time + 3600
        self.assertAlmostEqual(expiration, expected, delta=1)
        print("✅ 만료 시간 계산 통과")


class TestQueryInterface(unittest.TestCase):
    """쿼리 인터페이스 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.storage = StorageLayer()
        self.query = QueryInterface(self.storage)
        
        # 테스트 데이터 생성
        base_time = time.time()
        for i in range(10):
            point = MetricPoint(
                timestamp=base_time + i,
                value=float(10 + i),
                metric_name="temperature",
                labels={"location": "room1"}
            )
            self.storage.save_metric(point)
    
    def test_query_range(self):
        """시간 범위 쿼리"""
        base_time = time.time()
        points = self.query.query_range(
            "temperature",
            base_time + 2,
            base_time + 7
        )

        # base_time + 2, 3, 4, 5, 6, 7 중에서 조회
        # 값은 2, 3, 4, 5, 6, 7 (base_time + i이므로)
        # 정렬되어 있으므로 첫 번째는 가장 낮은 값
        self.assertGreaterEqual(len(points), 5)
        self.assertLessEqual(len(points), 6)
        # 범위 내 모든 값이 10 이상 20 미만
        for point in points:
            self.assertGreaterEqual(point.value, 10)
            self.assertLess(point.value, 20)
        print("✅ 시간 범위 쿼리 통과")
    
    def test_query_latest(self):
        """최신 데이터 쿼리"""
        latest = self.query.query_latest("temperature", count=3)
        
        self.assertEqual(len(latest), 3)
        self.assertGreater(latest[0].value, latest[-1].value)
        print("✅ 최신 데이터 쿼리 통과")
    
    def test_query_with_labels(self):
        """레이블 필터링 쿼리"""
        results = self.query.query_with_labels(
            "temperature",
            {"location": "room1"}
        )
        
        self.assertEqual(len(results), 10)
        print("✅ 레이블 필터링 쿼리 통과")
    
    def test_aggregate_avg(self):
        """평균 집계"""
        avg = self.query.aggregate("temperature", aggregation="avg")
        
        self.assertIsNotNone(avg)
        self.assertGreater(avg, 10)
        self.assertLess(avg, 20)
        print(f"✅ 평균 집계 통과 (avg={avg:.1f})")
    
    def test_aggregate_sum(self):
        """합계 집계"""
        total = self.query.aggregate("temperature", aggregation="sum")
        
        self.assertIsNotNone(total)
        self.assertGreater(total, 100)
        print(f"✅ 합계 집계 통과 (sum={total:.1f})")
    
    def test_aggregate_min_max(self):
        """최소/최대 집계"""
        min_val = self.query.aggregate("temperature", aggregation="min")
        max_val = self.query.aggregate("temperature", aggregation="max")
        
        self.assertEqual(min_val, 10)
        self.assertEqual(max_val, 19)
        print("✅ 최소/최대 집계 통과")
    
    def test_query_metrics_with_filters(self):
        """필터 기반 쿼리"""
        # 범위 필터 테스트
        results = self.query.query_metrics(
            filters={'min_value': 15, 'max_value': 18}
        )
        
        self.assertIn("temperature", results)
        self.assertEqual(len(results["temperature"]), 4)  # 15, 16, 17, 18
        print("✅ 필터 기반 쿼리 통과")
    
    def test_get_statistics(self):
        """메트릭 통계"""
        stats = self.query.get_statistics("temperature")
        
        self.assertEqual(stats['count'], 10)
        self.assertGreater(stats['mean'], 10)
        self.assertLess(stats['mean'], 20)
        self.assertEqual(stats['min'], 10)
        self.assertEqual(stats['max'], 19)
        self.assertGreater(stats['stdev'], 0)
        print("✅ 메트릭 통계 통과")


class TestMetricsPerformance(unittest.TestCase):
    """성능 테스트"""
    
    def test_collection_speed(self):
        """메트릭 수집 속도"""
        import time
        collector = MetricsCollector(buffer_size=10000)
        
        start = time.time()
        for i in range(1000):
            collector.collect_prometheus_metric(f"metric_{i%10}", random.random())
        elapsed = (time.time() - start) * 1000
        
        rate = 1000 / (elapsed / 1000)
        print(f"⚡ 수집 속도: {rate:.0f} metrics/sec ({elapsed:.2f}ms)")
        
        self.assertGreater(rate, 1000)  # 1000 메트릭/초 이상
        print("✅ 수집 속도 목표 달성")
    
    def test_query_speed(self):
        """쿼리 속도"""
        import time
        storage = StorageLayer()
        query = QueryInterface(storage)
        
        # 테스트 데이터 생성
        base_time = time.time()
        for i in range(1000):
            point = MetricPoint(
                timestamp=base_time + (i % 100),
                value=float(i),
                metric_name=f"metric_{i%10}"
            )
            storage.save_metric(point)
        
        start = time.time()
        for _ in range(100):
            query.query_latest("metric_0", count=10)
        elapsed = (time.time() - start) * 1000
        
        avg_time = elapsed / 100
        print(f"⚡ 쿼리 속도: {avg_time:.2f}ms (100회 평균)")
        
        self.assertLess(avg_time, 10.0)
        print("✅ 쿼리 속도 목표 달성")


def run_tests():
    """모든 테스트 실행"""
    print("\n" + "=" * 70)
    print("🚀 MindLang Day 11: 메트릭 저장소 테스트")
    print("=" * 70 + "\n")
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # 테스트 추가
    suite.addTests(loader.loadTestsFromTestCase(TestMetricsCollector))
    suite.addTests(loader.loadTestsFromTestCase(TestStorageLayer))
    suite.addTests(loader.loadTestsFromTestCase(TestRetentionPolicy))
    suite.addTests(loader.loadTestsFromTestCase(TestQueryInterface))
    suite.addTests(loader.loadTestsFromTestCase(TestMetricsPerformance))
    
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
        print("🎯 Day 11 메트릭 저장소 완성!")
    else:
        print("\n❌ 일부 테스트 실패")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
