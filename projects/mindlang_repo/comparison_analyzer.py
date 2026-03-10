#!/usr/bin/env python3
"""
MindLang 성능 비교 분석 시스템
Day 10: 알고리즘 간 성능 비교 & 최적화 분석

컴포넌트:
├─ ComparisonAnalyzer: 지표별 성능 비교
├─ BenchmarkRunner: 여러 알고리즘 벤치마크
├─ VisualizeComparison: 성능 시각화
└─ ReportGenerator: 분석 리포트 생성
"""

import time
import statistics
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import math


class AlgorithmType(Enum):
    """알고리즘 유형"""
    LINEAR_REGRESSION = "선형회귀"
    NAIVE_BAYES = "나이브베이즈"
    EXPONENTIAL_SMOOTHING = "지수평활"
    SIMPLE_AVERAGE = "단순평균"
    WEIGHTED_AVERAGE = "가중평균"


@dataclass
class BenchmarkResult:
    """벤치마크 결과"""
    algorithm: AlgorithmType
    metric_name: str
    execution_time: float  # milliseconds
    memory_usage: float    # MB
    accuracy: float        # 0-1
    throughput: float      # items/sec
    prediction_confidence: float  # 0-1
    error_rate: float      # 0-1


class ComparisonAnalyzer:
    """알고리즘 성능 비교 분석"""
    
    def __init__(self):
        """초기화"""
        self.results: Dict[str, List[BenchmarkResult]] = {}
        self.comparisons: Dict[str, Dict[str, Any]] = {}
    
    def add_result(self, result: BenchmarkResult):
        """벤치마크 결과 추가"""
        key = f"{result.algorithm.value}_{result.metric_name}"
        if key not in self.results:
            self.results[key] = []
        self.results[key].append(result)
    
    def compare_algorithms(self, metric_name: str, 
                          algorithms: List[AlgorithmType]) -> Dict[str, Any]:
        """여러 알고리즘 비교"""
        comparison = {
            'metric': metric_name,
            'algorithms': [],
            'best_speed': None,
            'best_accuracy': None,
            'best_balance': None,
            'statistical_significance': None
        }
        
        # 각 알고리즘의 성과 수집
        algo_data = {}
        for algo in algorithms:
            key = f"{algo.value}_{metric_name}"
            if key in self.results and self.results[key]:
                results = self.results[key]
                algo_data[algo.value] = {
                    'speed': statistics.mean([r.execution_time for r in results]),
                    'accuracy': statistics.mean([r.accuracy for r in results]),
                    'throughput': statistics.mean([r.throughput for r in results]),
                    'count': len(results)
                }
        
        # 속도 기준 최고 알고리즘 찾기
        if algo_data:
            fastest = min(algo_data.items(), 
                         key=lambda x: x[1]['speed'])
            comparison['best_speed'] = {
                'algorithm': fastest[0],
                'speed_ms': fastest[1]['speed']
            }
            
            # 정확도 기준 최고 알고리즘
            most_accurate = max(algo_data.items(),
                               key=lambda x: x[1]['accuracy'])
            comparison['best_accuracy'] = {
                'algorithm': most_accurate[0],
                'accuracy': most_accurate[1]['accuracy']
            }
            
            # 균형 기준 (속도 + 정확도)
            balance_scores = {}
            for algo_name, data in algo_data.items():
                # 속도 정규화 (작을수록 좋음)
                speed_norm = fastest[1]['speed'] / (data['speed'] + 0.001)
                # 정확도 정규화 (클수록 좋음)
                acc_norm = data['accuracy']
                # 균형 점수 = 0.6 * 속도 + 0.4 * 정확도
                balance = (0.6 * speed_norm) + (0.4 * acc_norm)
                balance_scores[algo_name] = balance
            
            best_balance = max(balance_scores.items(),
                             key=lambda x: x[1])
            comparison['best_balance'] = {
                'algorithm': best_balance[0],
                'balance_score': best_balance[1]
            }
            
            # 통계적 유의성 검증
            comparison['statistical_significance'] = \
                self._calculate_significance(algo_data)
            
            comparison['algorithms'] = algo_data
        
        self.comparisons[metric_name] = comparison
        return comparison
    
    def _calculate_significance(self, algo_data: Dict) -> float:
        """통계적 유의성 계산 (0-1)"""
        if len(algo_data) < 2:
            return 0.0
        
        # 정확도 분산 계산
        accuracies = [data['accuracy'] for data in algo_data.values()]
        if len(accuracies) < 2:
            return 0.0
        
        mean_acc = statistics.mean(accuracies)
        variance = statistics.variance(accuracies)
        
        # 분산이 크면 차이가 유의미함
        significance = min(variance * 10, 1.0)
        return significance
    
    def get_improvement_rate(self, base_algorithm: str, 
                            target_algorithm: str,
                            metric: str) -> float:
        """개선율 계산 (%)"""
        base_key = f"{base_algorithm}_{metric}"
        target_key = f"{target_algorithm}_{metric}"
        
        if base_key not in self.results or target_key not in self.results:
            return 0.0
        
        base_results = self.results[base_key]
        target_results = self.results[target_key]
        
        if not base_results or not target_results:
            return 0.0
        
        base_acc = statistics.mean([r.accuracy for r in base_results])
        target_acc = statistics.mean([r.accuracy for r in target_results])
        
        # 개선율 = (target - base) / base * 100
        if base_acc == 0:
            return 0.0
        
        improvement = ((target_acc - base_acc) / base_acc) * 100
        return improvement


class BenchmarkRunner:
    """벤치마크 실행 엔진"""
    
    def __init__(self):
        """초기화"""
        self.results: List[BenchmarkResult] = []
    
    def benchmark_linear_regression(self, data: List[Tuple[float, float]], 
                                    name: str = "linear_regression") -> BenchmarkResult:
        """선형회귀 벤치마크"""
        start = time.time()
        
        # 간단한 선형회귀 구현
        n = len(data)
        sum_x = sum(x for x, _ in data)
        sum_y = sum(y for _, y in data)
        sum_xy = sum(x*y for x, y in data)
        sum_x2 = sum(x*x for x, _ in data)
        
        denominator = n * sum_x2 - sum_x * sum_x
        if denominator == 0:
            slope, intercept = 0, 0
        else:
            slope = (n * sum_xy - sum_x * sum_y) / denominator
            intercept = (sum_y - slope * sum_x) / n
        
        # 예측 정확도 계산
        predictions = [slope * x + intercept for x, _ in data]
        actuals = [y for _, y in data]
        
        ss_res = sum((a - p)**2 for a, p in zip(actuals, predictions))
        ss_tot = sum((y - statistics.mean(actuals))**2 for y in actuals)
        accuracy = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        
        elapsed = (time.time() - start) * 1000  # ms
        throughput = (len(data) / elapsed) * 1000 if elapsed > 0 else 0
        
        result = BenchmarkResult(
            algorithm=AlgorithmType.LINEAR_REGRESSION,
            metric_name=name,
            execution_time=elapsed,
            memory_usage=0.5,
            accuracy=min(accuracy, 1.0),
            throughput=throughput,
            prediction_confidence=min(accuracy, 1.0),
            error_rate=1.0 - min(accuracy, 1.0)
        )
        self.results.append(result)
        return result
    
    def benchmark_simple_average(self, data: List[float],
                                 name: str = "simple_average") -> BenchmarkResult:
        """단순평균 벤치마크"""
        start = time.time()
        
        avg = statistics.mean(data) if data else 0
        
        # 정확도 = 편차 역수
        std_dev = statistics.stdev(data) if len(data) > 1 else 0
        accuracy = 1.0 / (1.0 + std_dev) if std_dev >= 0 else 1.0
        
        elapsed = (time.time() - start) * 1000
        throughput = (len(data) / elapsed) * 1000 if elapsed > 0 else 0
        
        result = BenchmarkResult(
            algorithm=AlgorithmType.SIMPLE_AVERAGE,
            metric_name=name,
            execution_time=elapsed,
            memory_usage=0.2,
            accuracy=min(accuracy, 1.0),
            throughput=throughput,
            prediction_confidence=min(accuracy, 1.0),
            error_rate=1.0 - min(accuracy, 1.0)
        )
        self.results.append(result)
        return result
    
    def benchmark_exponential_smoothing(self, data: List[float],
                                       alpha: float = 0.3,
                                       name: str = "exponential_smoothing") -> BenchmarkResult:
        """지수평활 벤치마크"""
        start = time.time()
        
        if not data:
            return BenchmarkResult(
                algorithm=AlgorithmType.EXPONENTIAL_SMOOTHING,
                metric_name=name,
                execution_time=0,
                memory_usage=0.3,
                accuracy=0,
                throughput=0,
                prediction_confidence=0,
                error_rate=1.0
            )
        
        # 지수평활 구현
        smoothed = [data[0]]
        for i in range(1, len(data)):
            smoothed.append(alpha * data[i] + (1 - alpha) * smoothed[i-1])
        
        # 정확도 계산
        residuals = [data[i] - smoothed[i] for i in range(len(data))]
        mse = statistics.mean([r**2 for r in residuals])
        rmse = math.sqrt(mse)
        mean_val = statistics.mean(data)
        accuracy = max(0, 1.0 - (rmse / (mean_val + 0.001)))
        
        elapsed = (time.time() - start) * 1000
        throughput = (len(data) / elapsed) * 1000 if elapsed > 0 else 0
        
        result = BenchmarkResult(
            algorithm=AlgorithmType.EXPONENTIAL_SMOOTHING,
            metric_name=name,
            execution_time=elapsed,
            memory_usage=0.4,
            accuracy=min(accuracy, 1.0),
            throughput=throughput,
            prediction_confidence=min(accuracy, 1.0),
            error_rate=1.0 - min(accuracy, 1.0)
        )
        self.results.append(result)
        return result
    
    def benchmark_weighted_average(self, data: List[float],
                                   weights: List[float] = None,
                                   name: str = "weighted_average") -> BenchmarkResult:
        """가중평균 벤치마크"""
        start = time.time()
        
        if not data:
            return BenchmarkResult(
                algorithm=AlgorithmType.WEIGHTED_AVERAGE,
                metric_name=name,
                execution_time=0,
                memory_usage=0.25,
                accuracy=0,
                throughput=0,
                prediction_confidence=0,
                error_rate=1.0
            )
        
        if weights is None:
            weights = [1.0 / len(data)] * len(data)
        
        # 가중평균 계산
        weighted_avg = sum(d * w for d, w in zip(data, weights))
        
        # 정확도 = 편차 역수
        mean_val = statistics.mean(data)
        variance = statistics.variance(data) if len(data) > 1 else 0
        accuracy = 1.0 / (1.0 + variance) if variance >= 0 else 1.0
        
        elapsed = (time.time() - start) * 1000
        throughput = (len(data) / elapsed) * 1000 if elapsed > 0 else 0
        
        result = BenchmarkResult(
            algorithm=AlgorithmType.WEIGHTED_AVERAGE,
            metric_name=name,
            execution_time=elapsed,
            memory_usage=0.3,
            accuracy=min(accuracy, 1.0),
            throughput=throughput,
            prediction_confidence=min(accuracy, 1.0),
            error_rate=1.0 - min(accuracy, 1.0)
        )
        self.results.append(result)
        return result


class VisualizeComparison:
    """성능 비교 시각화"""
    
    @staticmethod
    def bar_chart(results: List[BenchmarkResult], metric: str = "accuracy") -> str:
        """막대 그래프"""
        if not results:
            return "No results to visualize"

        # 메트릭 이름 한글화
        metric_names = {
            "accuracy": "정확도",
            "speed": "속도",
            "throughput": "처리량"
        }
        metric_name = metric_names.get(metric, metric)

        chart = f"\n📊 {metric_name} 비교\n"
        chart += "=" * 60 + "\n"
        
        # 지표별 값 추출
        values = []
        for r in results:
            if metric == "accuracy":
                val = r.accuracy
            elif metric == "speed":
                val = r.execution_time
            elif metric == "throughput":
                val = r.throughput
            else:
                val = 0
            values.append((r.algorithm.value, val))
        
        # 정규화
        if metric == "speed":
            max_val = max(v[1] for v in values) if values else 1
            values = [(name, max_val - v + 1) for name, v in values]  # 역방향
        else:
            max_val = max(v[1] for v in values) if values else 1
        
        # 그래프 생성
        for name, val in sorted(values, key=lambda x: x[1], reverse=True):
            bar_width = int((val / (max_val + 0.001)) * 40)
            bar = "█" * bar_width
            chart += f"{name:20} {bar} {val:.2f}\n"
        
        chart += "=" * 60
        return chart
    
    @staticmethod
    def comparison_table(results: List[BenchmarkResult]) -> str:
        """비교 테이블"""
        if not results:
            return "No results to visualize"
        
        table = "\n📋 성능 비교 테이블\n"
        table += "=" * 100 + "\n"
        table += f"{'알고리즘':<20} {'속도(ms)':<15} {'정확도':<15} {'처리량(items/s)':<15} {'신뢰도':<15}\n"
        table += "-" * 100 + "\n"
        
        for r in sorted(results, key=lambda x: x.accuracy, reverse=True):
            table += f"{r.algorithm.value:<20} {r.execution_time:<15.2f} {r.accuracy:<15.2%} {r.throughput:<15.0f} {r.prediction_confidence:<15.2%}\n"
        
        table += "=" * 100
        return table


class ReportGenerator:
    """분석 리포트 생성"""
    
    def __init__(self, analyzer: ComparisonAnalyzer, 
                 runner: BenchmarkRunner):
        """초기화"""
        self.analyzer = analyzer
        self.runner = runner
    
    def generate_summary(self) -> str:
        """요약 리포트"""
        report = "\n" + "=" * 70 + "\n"
        report += "📊 성능 비교 분석 리포트\n"
        report += "=" * 70 + "\n"
        
        # 테스트한 알고리즘 수
        algorithms = set(r.algorithm.value for r in self.runner.results)
        report += f"\n📌 테스트된 알고리즘: {len(algorithms)}\n"
        for algo in algorithms:
            report += f"  - {algo}\n"
        
        # 지표별 분석
        report += f"\n📈 지표별 성능 (총 {len(self.runner.results)} 벤치마크)\n"
        
        # 전체 평균
        if self.runner.results:
            avg_speed = statistics.mean(r.execution_time for r in self.runner.results)
            avg_accuracy = statistics.mean(r.accuracy for r in self.runner.results)
            avg_throughput = statistics.mean(r.throughput for r in self.runner.results)
            
            report += f"  - 평균 속도: {avg_speed:.2f}ms\n"
            report += f"  - 평균 정확도: {avg_accuracy:.2%}\n"
            report += f"  - 평균 처리량: {avg_throughput:.0f} items/sec\n"
        
        # 최고 성능
        if self.runner.results:
            fastest = min(self.runner.results, key=lambda r: r.execution_time)
            most_accurate = max(self.runner.results, key=lambda r: r.accuracy)
            
            report += f"\n🏆 최고 성능\n"
            report += f"  - 최고 속도: {fastest.algorithm.value} ({fastest.execution_time:.2f}ms)\n"
            report += f"  - 최고 정확도: {most_accurate.algorithm.value} ({most_accurate.accuracy:.2%})\n"
        
        report += "\n" + "=" * 70 + "\n"
        return report
    
    def generate_recommendation(self) -> str:
        """권장사항"""
        recommendation = "\n💡 권장사항\n"
        recommendation += "-" * 70 + "\n"
        
        if not self.runner.results:
            return recommendation + "분석 데이터 없음\n"
        
        # 속도 최적화 필요 시
        avg_speed = statistics.mean(r.execution_time for r in self.runner.results)
        fastest = min(self.runner.results, key=lambda r: r.execution_time)
        
        if avg_speed > 5.0:  # 5ms 초과 시
            recommendation += f"⚡ 성능 최적화\n"
            recommendation += f"   {fastest.algorithm.value}를 사용하면 {(avg_speed - fastest.execution_time):.2f}ms 절감 가능\n\n"
        
        # 정확도 개선 필요 시
        avg_accuracy = statistics.mean(r.accuracy for r in self.runner.results)
        most_accurate = max(self.runner.results, key=lambda r: r.accuracy)
        
        if avg_accuracy < 0.9 and most_accurate.accuracy > 0.95:
            recommendation += f"📈 정확도 개선\n"
            recommendation += f"   {most_accurate.algorithm.value}로 변경하면 {(most_accurate.accuracy - avg_accuracy):.1%} 개선 가능\n\n"
        
        # 균형 최적화
        recommendation += f"⚖️  권장 알고리즘\n"
        recommendation += f"   속도 중시: {fastest.algorithm.value}\n"
        recommendation += f"   정확도 중시: {most_accurate.algorithm.value}\n"
        
        recommendation += "-" * 70
        return recommendation
    
    def calculate_total_score(self, result: BenchmarkResult) -> float:
        """총 점수 계산 (0-100)"""
        # 정확도 60% + 속도 40%
        avg_speed = statistics.mean(r.execution_time for r in self.runner.results)
        max_speed = max(r.execution_time for r in self.runner.results)
        
        speed_score = max(0, (max_speed - result.execution_time) / (max_speed + 0.001)) * 40
        accuracy_score = result.accuracy * 60
        
        total = speed_score + accuracy_score
        return min(total, 100.0)


if __name__ == "__main__":
    # 테스트용 실행
    runner = BenchmarkRunner()
    analyzer = ComparisonAnalyzer()
    
    print("✅ 성능 비교 분석 시스템 로드됨")
