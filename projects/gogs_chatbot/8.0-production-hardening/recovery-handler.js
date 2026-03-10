/**
 * 장애 복구 핸들러
 * 예측 가능한 복구 시나리오 정의 및 실행
 */

/**
 * 복구 시나리오 정의
 */
export const RECOVERY_SCENARIOS = {
  INDEX_CORRUPTION: {
    id: 'INDEX_CORRUPTION',
    severity: 'CRITICAL',
    description: '인덱스 무결성 손상',
    symptoms: ['검색 결과 일관성 없음', '쿼리 타임아웃'],
    steps: [
      { step: 1, action: 'STOP_SEARCH_SERVICE', timeout: 5000 },
      { step: 2, action: 'BACKUP_CURRENT_INDEX', timeout: 10000 },
      { step: 3, action: 'VALIDATE_INDEX', timeout: 30000 },
      { step: 4, action: 'REBUILD_INDEX_FROM_BACKUP', timeout: 60000 },
      { step: 5, action: 'VERIFY_INDEX_INTEGRITY', timeout: 30000 },
      { step: 6, action: 'START_SEARCH_SERVICE', timeout: 5000 }
    ]
  },

  VECTOR_STORE_FAILURE: {
    id: 'VECTOR_STORE_FAILURE',
    severity: 'HIGH',
    description: '벡터 스토어 장애',
    symptoms: ['벡터 검색 오류', '하이브리드 검색 실패'],
    steps: [
      { step: 1, action: 'DISABLE_VECTOR_SEARCH', timeout: 1000 },
      { step: 2, action: 'LOG_VECTOR_ERROR', timeout: 5000 },
      { step: 3, action: 'FALLBACK_TO_BM25', timeout: 1000 },
      { step: 4, action: 'ALERT_OPERATIONS', timeout: 5000 },
      { step: 5, action: 'ATTEMPT_VECTOR_RECOVERY', timeout: 30000 },
      { step: 6, action: 'REENABLE_IF_HEALTHY', timeout: 5000 }
    ]
  },

  LLM_API_FAILURE: {
    id: 'LLM_API_FAILURE',
    severity: 'HIGH',
    description: 'LLM API 연결 장애',
    symptoms: ['응답 생성 실패', 'API 타임아웃'],
    steps: [
      { step: 1, action: 'LOG_API_ERROR', timeout: 1000 },
      { step: 2, action: 'RETRY_WITH_BACKOFF', retries: 3, backoff: 2000 },
      { step: 3, action: 'FALLBACK_TO_CACHED_RESPONSE', timeout: 1000 },
      { step: 4, action: 'ALERT_OPERATIONS', timeout: 5000 },
      { step: 5, action: 'SWITCH_TO_FALLBACK_MODEL', timeout: 5000 }
    ]
  },

  METADATA_SCHEMA_MISMATCH: {
    id: 'METADATA_SCHEMA_MISMATCH',
    severity: 'HIGH',
    description: '메타데이터 스키마 불일치',
    symptoms: ['필드 누락', '타입 오류'],
    steps: [
      { step: 1, action: 'VALIDATE_SCHEMA', timeout: 10000 },
      { step: 2, action: 'IDENTIFY_MISMATCH_FIELDS', timeout: 5000 },
      { step: 3, action: 'LOAD_SCHEMA_VERSION', timeout: 5000 },
      { step: 4, action: 'MIGRATE_DATA', timeout: 60000 },
      { step: 5, action: 'VERIFY_MIGRATION', timeout: 10000 }
    ]
  },

  MEMORY_EXHAUSTION: {
    id: 'MEMORY_EXHAUSTION',
    severity: 'CRITICAL',
    description: '메모리 부족',
    symptoms: ['OOM 오류', '응답 지연'],
    steps: [
      { step: 1, action: 'ALERT_CRITICAL', timeout: 1000 },
      { step: 2, action: 'CLEAR_CACHE', timeout: 5000 },
      { step: 3, action: 'REDUCE_BATCH_SIZE', timeout: 5000 },
      { step: 4, action: 'RESTART_SERVICE', timeout: 30000 },
      { step: 5, action: 'MONITOR_MEMORY', timeout: 60000 }
    ]
  },

  GOGS_SYNC_FAILURE: {
    id: 'GOGS_SYNC_FAILURE',
    severity: 'MEDIUM',
    description: 'Gogs 동기화 실패',
    symptoms: ['인덱스 오래됨', '신규 커밋 누락'],
    steps: [
      { step: 1, action: 'LOG_SYNC_ERROR', timeout: 1000 },
      { step: 2, action: 'CHECK_GOGS_CONNECTIVITY', timeout: 10000 },
      { step: 3, action: 'RETRY_INCREMENTAL_SYNC', timeout: 30000 },
      { step: 4, action: 'IF_FAILED_FULL_REINDEX', timeout: 120000 },
      { step: 5, action: 'VERIFY_INDEX_FRESHNESS', timeout: 10000 }
    ]
  }
};

/**
 * 복구 실행기
 */
export class RecoveryExecutor {
  constructor(versionManager, loggingSystem) {
    this.versionManager = versionManager;
    this.loggingSystem = loggingSystem;
    this.executionHistory = [];
    this.currentRecovery = null;
  }

  /**
   * 복구 시나리오 실행
   */
  async executeRecovery(scenarioId, handlers = {}) {
    const scenario = RECOVERY_SCENARIOS[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioId}`);
    }

    const execution = {
      scenarioId,
      startTime: new Date(),
      steps: [],
      status: 'IN_PROGRESS'
    };

    this.currentRecovery = execution;

    try {
      for (const stepDef of scenario.steps) {
        const stepResult = await executeStep(stepDef, handlers);

        execution.steps.push({
          step: stepDef.step,
          action: stepDef.action,
          result: stepResult.success,
          duration: stepResult.duration,
          message: stepResult.message
        });

        if (!stepResult.success && isStepCritical(stepDef)) {
          execution.status = 'FAILED';
          break;
        }
      }

      if (execution.status !== 'FAILED') {
        execution.status = 'SUCCESS';
      }
    } catch (error) {
      execution.status = 'ERROR';
      execution.error = error.message;
    }

    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;

    this.executionHistory.push(execution);
    this.currentRecovery = null;

    return execution;
  }

  /**
   * 복구 상태 조회
   */
  getRecoveryStatus() {
    if (!this.currentRecovery) {
      return { status: 'IDLE' };
    }

    return {
      status: this.currentRecovery.status,
      scenario: this.currentRecovery.scenarioId,
      stepsCompleted: this.currentRecovery.steps.length,
      startTime: this.currentRecovery.startTime
    };
  }

  /**
   * 복구 이력 조회
   */
  getRecoveryHistory(limit = 10) {
    return {
      totalRecoveries: this.executionHistory.length,
      recentRecoveries: this.executionHistory.slice(-limit),
      successRate: this.calculateSuccessRate()
    };
  }

  /**
   * 성공률 계산
   */
  calculateSuccessRate() {
    if (this.executionHistory.length === 0) return 0;

    const successful = this.executionHistory.filter(e => e.status === 'SUCCESS').length;
    return (successful / this.executionHistory.length * 100).toFixed(1);
  }

  /**
   * 복구 가능 여부 확인
   */
  canRecover(scenarioId) {
    const scenario = RECOVERY_SCENARIOS[scenarioId];
    if (!scenario) return false;

    // 필요한 백업이 있는가?
    // 필요한 핸들러가 등록되어 있는가?
    return true;
  }

  /**
   * 자동 복구 정책
   */
  getAutoRecoveryPolicy(scenarioId) {
    const scenario = RECOVERY_SCENARIOS[scenarioId];
    if (!scenario) return null;

    return {
      scenario: scenarioId,
      autoRecoveryEnabled: scenario.severity === 'CRITICAL' || scenario.severity === 'HIGH',
      maxRetries: 3,
      retryDelay: 5000,
      escalationTime: 300000, // 5분 후 에스컬레이션
      notificationRequired: scenario.severity === 'CRITICAL'
    };
  }
}

/**
 * 단계 실행
 */
async function executeStep(stepDef, handlers) {
  const startTime = Date.now();

  try {
    const handler = handlers[stepDef.action];
    if (!handler) {
      return {
        success: false,
        duration: Date.now() - startTime,
        message: `No handler for ${stepDef.action}`
      };
    }

    const result = await executeWithTimeout(
      handler(stepDef),
      stepDef.timeout || 30000
    );

    return {
      success: result.success !== false,
      duration: Date.now() - startTime,
      message: result.message || 'Success'
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      message: error.message
    };
  }
}

/**
 * 타임아웃 실행
 */
function executeWithTimeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    )
  ]);
}

/**
 * 단계 중요도 판단
 */
function isStepCritical(stepDef) {
  const criticalSteps = ['STOP_SEARCH_SERVICE', 'REBUILD_INDEX_FROM_BACKUP'];
  return criticalSteps.includes(stepDef.action);
}

/**
 * 복구 사전 정의
 */
export const RECOVERY_PLAYBOOK = {
  'HIGH_ERROR_RATE': {
    triggers: ['error_rate > 5%', '5min_avg'],
    actions: [
      { action: 'ALERT_OPERATIONS', priority: 'HIGH' },
      { action: 'ENABLE_DETAILED_LOGGING', duration: 300000 },
      { action: 'MONITOR_ERROR_PATTERNS', duration: 600000 }
    ]
  },

  'SLOW_RESPONSE_TIME': {
    triggers: ['p99_latency > 2000ms', '5min_avg'],
    actions: [
      { action: 'REDUCE_BATCH_SIZE', factor: 0.5 },
      { action: 'CLEAR_CACHE', type: 'PARTIAL' },
      { action: 'INCREASE_TIMEOUT', duration: 5000 }
    ]
  },

  'INDEX_OUT_OF_SYNC': {
    triggers: ['index_age > 1hour', 'last_commit_missing'],
    actions: [
      { action: 'ATTEMPT_INCREMENTAL_SYNC' },
      { action: 'IF_FAILED_SCHEDULE_FULL_REINDEX' },
      { action: 'ALERT_WITH_ETA' }
    ]
  }
};

/**
 * 포맷팅 (테스트용)
 */
export function formatRecoveryStatus(executor) {
  const lines = [];
  const status = executor.getRecoveryStatus();
  const history = executor.getRecoveryHistory(5);

  lines.push('🔄 복구 상태');
  lines.push(`   현재: ${status.status}`);
  lines.push(`   성공률: ${history.successRate}%`);
  lines.push(`   총 복구: ${history.totalRecoveries}회`);

  return lines.join('\n');
}

export default {
  RECOVERY_SCENARIOS,
  RECOVERY_PLAYBOOK,
  RecoveryExecutor,
  formatRecoveryStatus
};
