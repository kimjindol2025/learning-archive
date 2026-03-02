#!/usr/bin/env python3
"""
MindLang 최종 통합 테스트
Day 14: 시스템 통합, 설정, 상태 검사, 최종 리포트 검증

테스트:
├─ ConfigurationManager: 설정 관리
├─ HealthCheck: 상태 검사
├─ SystemIntegrator: 시스템 통합
└─ FinalSummary: 최종 요약
"""

import unittest
import time
from system_integration import (
    ConfigurationManager, HealthCheck, SystemIntegrator,
    FinalSummary, SystemStatus
)


class TestConfigurationManager(unittest.TestCase):
    """설정 관리자 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.config = ConfigurationManager()
    
    def test_get_set_config(self):
        """설정 설정 & 조회"""
        self.config.set_config('cache_size', 2000)
        
        value = self.config.get_config('cache_size')
        self.assertEqual(value, 2000)
        print("✅ 설정 설정/조회 통과")
    
    def test_invalid_key(self):
        """잘못된 키"""
        result = self.config.set_config('invalid_key', 100)
        self.assertFalse(result)
        print("✅ 잘못된 키 처리 통과")
    
    def test_validate_config_valid(self):
        """설정 검증: 유효"""
        validation = self.config.validate_config()
        
        self.assertTrue(validation['valid'])
        self.assertEqual(len(validation['issues']), 0)
        print("✅ 유효한 설정 검증 통과")
    
    def test_validate_config_invalid(self):
        """설정 검증: 무효"""
        self.config.set_config('cache_size', 5)  # 최소 10
        validation = self.config.validate_config()
        
        self.assertFalse(validation['valid'])
        self.assertGreater(len(validation['issues']), 0)
        print("✅ 무효한 설정 검증 통과")
    
    def test_get_all_config(self):
        """전체 설정 조회"""
        all_config = self.config.get_all_config()
        
        self.assertIn('cache_size', all_config)
        self.assertIn('cache_ttl', all_config)
        self.assertGreater(len(all_config), 5)
        print("✅ 전체 설정 조회 통과")


class TestHealthCheck(unittest.TestCase):
    """상태 검사 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.health = HealthCheck()
    
    def test_register_component(self):
        """컴포넌트 등록"""
        self.health.register_component("test_comp", "1.0.0", 10, 10)
        
        self.assertIn("test_comp", self.health.component_status)
        print("✅ 컴포넌트 등록 통과")
    
    def test_check_component_healthy(self):
        """컴포넌트 상태: 정상"""
        self.health.register_component("comp1", "1.0.0", 10, 10)
        status = self.health.check_component("comp1")
        
        self.assertEqual(status.status, SystemStatus.HEALTHY)
        print("✅ 정상 컴포넌트 상태 통과")
    
    def test_check_component_warning(self):
        """컴포넌트 상태: 경고"""
        self.health.register_component("comp2", "1.0.0", 8, 10)  # 80%
        status = self.health.check_component("comp2")
        
        self.assertEqual(status.status, SystemStatus.WARNING)
        print("✅ 경고 컴포넌트 상태 통과")
    
    def test_check_component_error(self):
        """컴포넌트 상태: 오류"""
        self.health.register_component("comp3", "1.0.0", 5, 10)  # 50%
        status = self.health.check_component("comp3")
        
        self.assertEqual(status.status, SystemStatus.ERROR)
        print("✅ 오류 컴포넌트 상태 통과")
    
    def test_check_all_components(self):
        """모든 컴포넌트 상태 확인"""
        self.health.register_component("comp1", "1.0.0", 10, 10)
        self.health.register_component("comp2", "1.0.0", 8, 10)
        
        statuses = self.health.check_all_components()
        
        self.assertEqual(len(statuses), 2)
        print("✅ 모든 컴포넌트 확인 통과")
    
    def test_overall_status_healthy(self):
        """전체 상태: 정상"""
        self.health.register_component("comp1", "1.0.0", 10, 10)
        self.health.register_component("comp2", "1.0.0", 10, 10)
        
        overall = self.health.get_overall_status()
        self.assertEqual(overall, SystemStatus.HEALTHY)
        print("✅ 전체 상태 정상 통과")
    
    def test_overall_status_warning(self):
        """전체 상태: 경고"""
        self.health.register_component("comp1", "1.0.0", 10, 10)
        self.health.register_component("comp2", "1.0.0", 8, 10)
        
        overall = self.health.get_overall_status()
        self.assertEqual(overall, SystemStatus.WARNING)
        print("✅ 전체 상태 경고 통과")
    
    def test_display_health(self):
        """상태 표시"""
        self.health.register_component("comp1", "1.0.0", 10, 10)
        
        display = self.health.display_health()
        
        self.assertIn("시스템 상태", display)
        self.assertIn("comp1", display)
        print("✅ 상태 표시 통과")


class TestSystemIntegrator(unittest.TestCase):
    """시스템 통합자 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.integrator = SystemIntegrator()
    
    def test_register_all_components(self):
        """모든 컴포넌트 등록"""
        self.integrator.register_all_components()
        
        self.assertEqual(len(self.integrator.components), 6)
        print("✅ 모든 컴포넌트 등록 통과")
    
    def test_validate_system(self):
        """시스템 검증"""
        self.integrator.register_all_components()
        validation = self.integrator.validate_system()
        
        self.assertIn('config_valid', validation)
        self.assertIn('health_status', validation)
        self.assertIn('components_count', validation)
        print("✅ 시스템 검증 통과")
    
    def test_get_system_info(self):
        """시스템 정보"""
        self.integrator.register_all_components()
        info = self.integrator.get_system_info()
        
        self.assertIn('uptime', info)
        self.assertIn('components', info)
        self.assertIn('status', info)
        print("✅ 시스템 정보 통과")
    
    def test_system_healthy(self):
        """시스템 정상"""
        self.integrator.register_all_components()
        validation = self.integrator.validate_system()
        
        self.assertTrue(validation['config_valid'])
        self.assertTrue(validation['components_healthy'])
        print("✅ 시스템 정상 통과")


class TestFinalSummary(unittest.TestCase):
    """최종 요약 테스트"""
    
    def setUp(self):
        """테스트 전 초기화"""
        self.integrator = SystemIntegrator()
        self.integrator.register_all_components()
    
    def test_week_summary(self):
        """Week 2 요약"""
        summary = FinalSummary.generate_week_summary(self.integrator)
        
        self.assertIn("Week 2 최종", summary)
        self.assertIn("구현 현황", summary)
        self.assertIn("성능 달성", summary)
        print("✅ Week 2 요약 통과")
    
    def test_deployment_checklist(self):
        """배포 체크리스트"""
        checklist = FinalSummary.generate_deployment_checklist(self.integrator)
        
        self.assertIn("배포 체크리스트", checklist)
        self.assertIn("✅", checklist)
        print("✅ 배포 체크리스트 통과")
    
    def test_statistics_report(self):
        """통계 리포트"""
        report = FinalSummary.generate_statistics_report(self.integrator)
        
        self.assertIn("통계 리포트", report)
        self.assertIn("개발 통계", report)
        self.assertIn("목표 달성", report)
        print("✅ 통계 리포트 통과")


class TestIntegrationPerformance(unittest.TestCase):
    """통합 성능 테스트"""
    
    def test_validation_speed(self):
        """검증 속도"""
        import time
        integrator = SystemIntegrator()
        integrator.register_all_components()
        
        start = time.time()
        for _ in range(100):
            integrator.validate_system()
        elapsed = (time.time() - start) * 1000
        
        avg_time = elapsed / 100
        print(f"⚡ 검증 속도: {avg_time:.2f}ms (100회)")
        
        self.assertLess(avg_time, 10.0)
        print("✅ 검증 속도 목표 달성")
    
    def test_summary_generation_speed(self):
        """요약 생성 속도"""
        import time
        integrator = SystemIntegrator()
        integrator.register_all_components()
        
        start = time.time()
        FinalSummary.generate_week_summary(integrator)
        FinalSummary.generate_deployment_checklist(integrator)
        FinalSummary.generate_statistics_report(integrator)
        elapsed = (time.time() - start) * 1000
        
        print(f"⚡ 요약 생성 속도: {elapsed:.1f}ms")
        
        self.assertLess(elapsed, 100)
        print("✅ 요약 생성 속도 목표 달성")


def run_tests():
    """모든 테스트 실행"""
    print("\n" + "=" * 70)
    print("🚀 MindLang Day 14: 최종 통합 시스템 테스트")
    print("=" * 70 + "\n")
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # 테스트 추가
    suite.addTests(loader.loadTestsFromTestCase(TestConfigurationManager))
    suite.addTests(loader.loadTestsFromTestCase(TestHealthCheck))
    suite.addTests(loader.loadTestsFromTestCase(TestSystemIntegrator))
    suite.addTests(loader.loadTestsFromTestCase(TestFinalSummary))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegrationPerformance))
    
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
        print("🎯 Day 14 최종 통합 완성!")
    else:
        print("\n❌ 일부 테스트 실패")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
