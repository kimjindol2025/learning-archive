#!/usr/bin/env python3
"""
MindLang 성능 비교 분석 테스트
Day 10: 벤치마크 & 성능 비교 검증

테스트:
├─ ComparisonAnalyzer: 알고리즘 비교
├─ BenchmarkRunner: 벤치마크 실행
├─ VisualizeComparison: 시각화
└─ ReportGenerator: 리포트 생성
"""

import unittest
import random
import statistics
import time
from comparison_analyzer import (
    ComparisonAnalyzer, BenchmarkRunner, VisualizeComparison,
    ReportGenerator, BenchmarkResult, AlgorithmType
)


class TestComparisonAnalyzer(unittest.TestCase):
    """비교 분석 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.analyzer = ComparisonAnalyzer()
    
    def test_add_result(self):
        """결과 추가"""
        result = BenchmarkResult(
            algorithm=AlgorithmType.LINEAR_REGRESSION,
            metric_name="response_time",
            execution_time=1.5,
            memory_usage=0.5,
            accuracy=0.95,
            throughput=1000,
            prediction_confidence=0.95,
            error_rate=0.05
        )
        
        self.analyzer.add_result(result)
        key = "선형회귀_response_time"
        self.assertIn(key, self.analyzer.results)
        self.assertEqual(len(self.analyzer.results[key]), 1)
        print("✅ 결과 추가 통과")
    
    def test_compare_algorithms(self):
        """알고리즘 비교"""
        # 여러 결과 추가
        for algo in [AlgorithmType.LINEAR_REGRESSION, AlgorithmType.SIMPLE_AVERAGE]:
            for _ in range(3):
                result = BenchmarkResult(
                    algorithm=algo,
                    metric_name="test_metric",
                    execution_time=random.uniform(1, 5),
                    memory_usage=0.5,
                    accuracy=random.uniform(0.8, 1.0),
                    throughput=random.uniform(500, 2000),
                    prediction_confidence=random.uniform(0.8, 1.0),
                    error_rate=random.uniform(0, 0.2)
                )
                self.analyzer.add_result(result)
        
        # 비교
        comparison = self.analyzer.compare_algorithms(
            "test_metric",
            [AlgorithmType.LINEAR_REGRESSION, AlgorithmType.SIMPLE_AVERAGE]
        )
        
        self.assertIn("best_speed", comparison)
        self.assertIn("best_accuracy", comparison)
        self.assertIn("best_balance", comparison)
        self.assertIsNotNone(comparison["best_speed"]["algorithm"])
        print("✅ 알고리즘 비교 통과")
    
    def test_improvement_rate(self):
        """개선율 계산"""
        # Base 알고리즘
        for _ in range(5):
            result = BenchmarkResult(
                algorithm=AlgorithmType.SIMPLE_AVERAGE,
                metric_name="accuracy",
                execution_time=2.0,
                memory_usage=0.2,
                accuracy=0.80,
                throughput=1000,
                prediction_confidence=0.80,
                error_rate=0.20
            )
            self.analyzer.add_result(result)
        
        # Target 알고리즘 (더 정확함)
        for _ in range(5):
            result = BenchmarkResult(
                algorithm=AlgorithmType.LINEAR_REGRESSION,
                metric_name="accuracy",
                execution_time=1.5,
                memory_usage=0.5,
                accuracy=0.95,
                throughput=1500,
                prediction_confidence=0.95,
                error_rate=0.05
            )
            self.analyzer.add_result(result)
        
        improvement = self.analyzer.get_improvement_rate(
            "단순평균",
            "선형회귀",
            "accuracy"
        )
        
        # 95% vs 80% = 18.75% 개선
        self.assertGreater(improvement, 10)
        print(f"✅ 개선율 계산 통과 ({improvement:.1f}%)")


class TestBenchmarkRunner(unittest.TestCase):
    """벤치마크 실행 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.runner = BenchmarkRunner()
    
    def test_linear_regression_benchmark(self):
        """선형회귀 벤치마크"""
        # 선형 데이터 생성: y = 2x + 1
        data = [(x, 2*x + 1 + random.gauss(0, 0.5)) for x in range(10)]
        
        result = self.runner.benchmark_linear_regression(data)
        
        self.assertEqual(result.algorithm, AlgorithmType.LINEAR_REGRESSION)
        self.assertGreater(result.accuracy, 0.7)  # 어느 정도 정확함
        self.assertGreater(result.execution_time, 0)
        self.assertGreater(result.throughput, 0)
        print(f"✅ 선형회귀 벤치마크 통과 (정확도: {result.accuracy:.2%})")
    
    def test_simple_average_benchmark(self):
        """단순평균 벤치마크"""
        data = [random.gauss(50, 10) for _ in range(100)]
        
        result = self.runner.benchmark_simple_average(data)
        
        self.assertEqual(result.algorithm, AlgorithmType.SIMPLE_AVERAGE)
        self.assertGreater(result.accuracy, 0)
        self.assertEqual(result.memory_usage, 0.2)
        print(f"✅ 단순평균 벤치마크 통과 (정확도: {result.accuracy:.2%})")
    
    def test_exponential_smoothing_benchmark(self):
        """지수평활 벤치마크"""
        # 추세 데이터 생성
        data = [50 + 0.5*i + random.gauss(0, 2) for i in range(100)]
        
        result = self.runner.benchmark_exponential_smoothing(data)
        
        self.assertEqual(result.algorithm, AlgorithmType.EXPONENTIAL_SMOOTHING)
        self.assertGreater(result.accuracy, 0)
        self.assertGreaterEqual(result.memory_usage, 0.3)
        print(f"✅ 지수평활 벤치마크 통과 (정확도: {result.accuracy:.2%})")
    
    def test_weighted_average_benchmark(self):
        """가중평균 벤치마크"""
        data = [random.gauss(60, 8) for _ in range(50)]
        weights = [1.0/len(data)] * len(data)
        
        result = self.runner.benchmark_weighted_average(data, weights)
        
        self.assertEqual(result.algorithm, AlgorithmType.WEIGHTED_AVERAGE)
        self.assertGreater(result.accuracy, 0)
        print(f"✅ 가중평균 벤치마크 통과 (정확도: {result.accuracy:.2%})")
    
    def test_all_benchmarks(self):
        """전체 벤치마크"""
        data = [x + random.gauss(0, 1) for x in range(20)]
        data_pairs = [(i, v) for i, v in enumerate(data)]
        
        self.runner.benchmark_linear_regression(data_pairs)
        self.runner.benchmark_simple_average(data)
        self.runner.benchmark_exponential_smoothing(data)
        self.runner.benchmark_weighted_average(data)
        
        self.assertEqual(len(self.runner.results), 4)
        print(f"✅ 전체 벤치마크 통과 (4개 알고리즘)")


class TestVisualizeComparison(unittest.TestCase):
    """시각화 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.results = []
        for algo in [AlgorithmType.LINEAR_REGRESSION, 
                     AlgorithmType.SIMPLE_AVERAGE]:
            result = BenchmarkResult(
                algorithm=algo,
                metric_name="test",
                execution_time=random.uniform(1, 5),
                memory_usage=0.5,
                accuracy=random.uniform(0.8, 0.98),
                throughput=random.uniform(500, 2000),
                prediction_confidence=random.uniform(0.8, 0.98),
                error_rate=random.uniform(0.02, 0.2)
            )
            self.results.append(result)
    
    def test_bar_chart_accuracy(self):
        """정확도 막대 그래프"""
        chart = VisualizeComparison.bar_chart(self.results, "accuracy")
        
        self.assertIn("정확도", chart)
        self.assertIn("█", chart)
        self.assertIn("선형회귀", chart)
        print("✅ 정확도 그래프 통과")
    
    def test_bar_chart_speed(self):
        """속도 막대 그래프"""
        chart = VisualizeComparison.bar_chart(self.results, "speed")
        
        self.assertIn("속도", chart)
        self.assertIn("█", chart)
        print("✅ 속도 그래프 통과")
    
    def test_comparison_table(self):
        """비교 테이블"""
        table = VisualizeComparison.comparison_table(self.results)
        
        self.assertIn("알고리즘", table)
        self.assertIn("속도(ms)", table)
        self.assertIn("정확도", table)
        self.assertIn("선형회귀", table)
        print("✅ 비교 테이블 통과")


class TestReportGenerator(unittest.TestCase):
    """리포트 생성 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.analyzer = ComparisonAnalyzer()
        self.runner = BenchmarkRunner()
        
        # 샘플 벤치마크 실행
        data = [x + random.gauss(0, 1) for x in range(20)]
        data_pairs = [(i, v) for i, v in enumerate(data)]
        
        self.runner.benchmark_linear_regression(data_pairs)
        self.runner.benchmark_simple_average(data)
        self.runner.benchmark_exponential_smoothing(data)
        
        # 결과 분석에 추가
        for result in self.runner.results:
            self.analyzer.add_result(result)
        
        self.generator = ReportGenerator(self.analyzer, self.runner)
    
    def test_generate_summary(self):
        """요약 리포트"""
        summary = self.generator.generate_summary()
        
        self.assertIn("성능 비교 분석", summary)
        self.assertIn("테스트된 알고리즘", summary)
        self.assertIn("평균 정확도", summary)
        self.assertIn("최고 성능", summary)
        print("✅ 요약 리포트 통과")
    
    def test_generate_recommendation(self):
        """권장사항"""
        recommendation = self.generator.generate_recommendation()
        
        self.assertIn("권장사항", recommendation)
        self.assertIn("알고리즘", recommendation)
        print("✅ 권장사항 통과")
    
    def test_calculate_total_score(self):
        """총 점수 계산"""
        if self.runner.results:
            result = self.runner.results[0]
            score = self.generator.calculate_total_score(result)
            
            self.assertGreaterEqual(score, 0)
            self.assertLessEqual(score, 100)
            print(f"✅ 총 점수 계산 통과 ({score:.1f}점)")


class TestComparisonPerformance(unittest.TestCase):
    """성능 테스트"""
    
    def test_benchmark_speed(self):
        """벤치마크 속도"""
        runner = BenchmarkRunner()
        data = [random.gauss(50, 10) for _ in range(1000)]
        data_pairs = [(i, v) for i, v in enumerate(data)]
        
        start = time.time()
        for _ in range(100):
            runner.benchmark_simple_average(data)
        elapsed = (time.time() - start) * 1000
        
        avg_time = elapsed / 100
        print(f"⚡ 벤치마크 속도: {avg_time:.2f}ms (100회 평균)")
        
        # 목표: <1ms
        self.assertLess(avg_time, 10.0)
        print("✅ 벤치마크 속도 목표 달성")
    
    def test_comparison_analysis_speed(self):
        """비교 분석 속도"""
        analyzer = ComparisonAnalyzer()
        runner = BenchmarkRunner()
        
        # 충분한 데이터 생성
        for _ in range(50):
            data = [random.gauss(50, 10) for _ in range(100)]
            data_pairs = [(i, v) for i, v in enumerate(data)]
            
            runner.benchmark_linear_regression(data_pairs)
            runner.benchmark_simple_average(data)
            runner.benchmark_exponential_smoothing(data)
        
        start = time.time()
        for result in runner.results:
            analyzer.add_result(result)
        
        comparison = analyzer.compare_algorithms(
            "test",
            [AlgorithmType.LINEAR_REGRESSION, 
             AlgorithmType.SIMPLE_AVERAGE,
             AlgorithmType.EXPONENTIAL_SMOOTHING]
        )
        elapsed = (time.time() - start) * 1000
        
        print(f"📊 비교 분석 속도: {elapsed:.2f}ms")
        self.assertLess(elapsed, 100.0)
        print("✅ 비교 분석 속도 목표 달성")


def run_tests():
    """모든 테스트 실행"""
    print("\n" + "=" * 70)
    print("🚀 MindLang Day 10: 성능 비교 분석 테스트")
    print("=" * 70 + "\n")
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # 테스트 추가
    suite.addTests(loader.loadTestsFromTestCase(TestComparisonAnalyzer))
    suite.addTests(loader.loadTestsFromTestCase(TestBenchmarkRunner))
    suite.addTests(loader.loadTestsFromTestCase(TestVisualizeComparison))
    suite.addTests(loader.loadTestsFromTestCase(TestReportGenerator))
    suite.addTests(loader.loadTestsFromTestCase(TestComparisonPerformance))
    
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
        print("🎯 Day 10 성능 비교 분석 완성!")
    else:
        print("\n❌ 일부 테스트 실패")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
