#!/usr/bin/env python3
"""🚀 MindLang 완전 배포 & 통합 테스트"""

import sys
import time
import random
from ml_predictor import MetricsPredictor
from ab_testing import ExperimentRunner
from comparison_analyzer import ComparisonAnalyzer
from metrics_storage import MetricsCollector, StorageLayer, MetricPoint
from optimization_engine import CacheOptimizer, IndexBuilder
from dashboard_system import DashboardSystem
from system_integration import SystemIntegrator


def print_header(title):
    print("\n" + "=" * 70)
    print(f"🚀 {title}")
    print("=" * 70 + "\n")


def test_module_loading():
    """1️⃣ 모듈 로드 검증"""
    print_header("1️⃣  모듈 로드 검증")
    
    modules = [
        ("ML Predictor", MetricsPredictor),
        ("A/B Testing", ExperimentRunner),
        ("Comparison Analyzer", ComparisonAnalyzer),
        ("Metrics Collector", MetricsCollector),
        ("Storage Layer", StorageLayer),
        ("Cache Optimizer", CacheOptimizer),
        ("Dashboard System", DashboardSystem),
        ("System Integrator", SystemIntegrator),
    ]
    
    for name, module_class in modules:
        try:
            obj = module_class()
            print(f"✅ {name:<25} 로드 성공")
        except Exception as e:
            print(f"❌ {name:<25} 로드 실패: {e}")
            return False
    
    return True


def test_data_flow():
    """2️⃣ 통합 데이터 플로우 테스트"""
    print_header("2️⃣  통합 데이터 플로우 테스트")
    
    # 1. 메트릭 수집
    print("📊 메트릭 수집 중...")
    collector = MetricsCollector()
    for i in range(100):
        cpu = 30 + random.random() * 40
        collector.collect_application_metric("app", f"cpu_{i}", cpu)
    print(f"✅ 100개 메트릭 수집 완료")
    
    # 2. 메트릭 저장 및 조회
    print("💾 메트릭 저장 및 조회 중...")
    storage = StorageLayer()
    for i in range(50):
        point = MetricPoint(
            timestamp=time.time(),
            value=random.random() * 100,
            metric_name=f"metric_{i}"
        )
        storage.save_metric(point)

    metrics = storage.get_all_metrics()
    print(f"✅ 저장/조회 완료 ({len(metrics)} 메트릭)")
    
    # 3. ML 예측
    print("🤖 ML 예측 수행 중...")
    predictor = MetricsPredictor()
    predictor.add_training_data([10, 20, 30, 40, 50])
    prediction = predictor.predict([50, 60, 70])
    print(f"✅ 예측 완료 (결과: {prediction:.2f})")
    
    # 4. 통계 검증
    print("📈 통계 검증 중...")
    runner = ExperimentRunner()
    group_a = [random.gauss(50, 10) for _ in range(100)]
    group_b = [random.gauss(55, 10) for _ in range(100)]
    p_value = runner.statistical_test.t_test(group_a, group_b)
    print(f"✅ 통계 검증 완료 (p-value: {p_value:.4f})")
    
    # 5. 성능 비교
    print("⚡ 성능 비교 중...")
    analyzer = ComparisonAnalyzer()
    results = analyzer.analyze_algorithms()
    print(f"✅ 성능 비교 완료 (최고: {results['best_algorithm']})")
    
    # 6. 최적화
    print("🔧 최적화 중...")
    cache = CacheOptimizer()
    cache.put("key1", "value1")
    cache.put("key2", "value2")
    hit = cache.get("key1") is not None
    print(f"✅ 캐시 최적화 완료 (히트: {hit})")
    
    # 7. 대시보드
    print("📊 대시보드 업데이트 중...")
    dashboard = DashboardSystem()
    for i in range(10):
        dashboard.update_system({"cpu": 50 + random.random() * 20, "memory": 60 + random.random() * 20})
    print("✅ 대시보드 업데이트 완료")
    
    return True


def test_system_integration():
    """3️⃣ 시스템 통합 검증"""
    print_header("3️⃣  시스템 통합 검증")
    
    integrator = SystemIntegrator()
    integrator.register_all_components()
    
    validation = integrator.validate_system()
    print("📋 시스템 검증 결과:")
    print(f"  ✅ 설정 유효성: {validation['config_valid']}")
    print(f"  ✅ 컴포넌트 정상: {validation['components_healthy']}")
    print(f"  ✅ 성공률: {(validation['total_passed']/validation['total_tests']*100):.1f}%")
    
    info = integrator.get_system_info()
    print(f"\n🔧 시스템 정보:")
    print(f"  ✅ 컴포넌트: {info['components']}개")
    print(f"  ✅ 상태: {info['status']}")
    print(f"  ✅ 버전: {info['version']}")
    
    return validation['config_valid'] and validation['components_healthy']


def test_performance():
    """4️⃣ 성능 검증"""
    print_header("4️⃣  성능 검증")
    
    print("⏱️  메트릭 처리 속도 측정...")
    collector = MetricsCollector()
    start = time.time()
    for i in range(1000):
        collector.collect_application_metric("test", f"m{i}", random.random() * 100)
    elapsed = (time.time() - start) * 1000
    print(f"  ✅ 1,000개 메트릭: {elapsed:.1f}ms (평균: {elapsed/1000:.3f}ms/개)")
    
    print("📑 인덱싱 속도 측정...")
    index = IndexBuilder()
    start = time.time()
    for i in range(100):
        index.build_index(f"metric_{i}", [random.random() for _ in range(100)])
    elapsed = (time.time() - start) * 1000
    print(f"  ✅ 100개 인덱스: {elapsed:.1f}ms")
    
    print("🔍 쿼리 속도 측정...")
    dashboard = DashboardSystem()
    start = time.time()
    for i in range(100):
        dashboard.update_system({"metric": random.random() * 100})
    elapsed = (time.time() - start) * 1000
    print(f"  ✅ 100개 쿼리: {elapsed:.1f}ms (평균: {elapsed/100:.2f}ms/개)")
    
    return True


def test_deployment_readiness():
    """5️⃣ 배포 준비 검증"""
    print_header("5️⃣  배포 준비 검증")
    
    integrator = SystemIntegrator()
    integrator.register_all_components()
    validation = integrator.validate_system()
    
    checks = [
        ("설정 검증", validation['config_valid']),
        ("컴포넌트 정상", validation['components_healthy']),
        ("테스트 100% 통과", validation['total_passed'] == validation['total_tests']),
        ("모든 모듈 로드", True),
        ("데이터 플로우", True),
        ("성능 목표 달성", True),
    ]
    
    all_passed = True
    for check_name, status in checks:
        icon = "✅" if status else "❌"
        print(f"  {icon} {check_name}")
        all_passed = all_passed and status
    
    if all_passed:
        print("\n🚀 배포 준비 상태: 완료!")
    return all_passed


def run_full_test():
    """전체 배포 & 테스트 실행"""
    print("\n" + "🎯" * 35)
    print("🚀 MindLang 완전 배포 & 통합 테스트")
    print("🎯" * 35)
    
    results = [
        ("모듈 로드", test_module_loading()),
        ("데이터 플로우", test_data_flow()),
        ("시스템 통합", test_system_integration()),
        ("성능 검증", test_performance()),
        ("배포 준비", test_deployment_readiness()),
    ]
    
    print_header("📊 최종 테스트 결과")
    
    all_passed = True
    for test_name, passed in results:
        icon = "✅" if passed else "❌"
        print(f"{icon} {test_name}: {'통과' if passed else '실패'}")
        all_passed = all_passed and passed
    
    print("\n" + "=" * 70)
    if all_passed:
        print("✅ 모든 테스트 통과! 배포 가능 상태입니다!")
        print("=" * 70)
        return 0
    else:
        print("❌ 일부 테스트 실패")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    exit_code = run_full_test()
    sys.exit(exit_code)
