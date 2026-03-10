/**
 * 기능 관리 모듈
 * 운영 안정성을 위한 기능 ON/OFF 제어
 */

/**
 * 기능 설정 정의
 */
export const FEATURE_CONFIG = {
  // 운영형에서 활성화
  CHUNK_PROCESSING: {
    enabled: true,
    version: '1.2',
    description: 'Chunk 단위 처리',
    required: true,
    fallback: null
  },

  METADATA_FILTERING: {
    enabled: true,
    version: '1.3',
    description: '메타데이터 기반 필터링',
    required: true,
    fallback: null
  },

  BM25_RANKING: {
    enabled: true,
    version: '1.4',
    description: 'BM25 기반 1차 검색',
    required: true,
    fallback: null
  },

  HYBRID_SEARCH: {
    enabled: true,
    version: '2.0',
    description: 'BM25 + 벡터 하이브리드 검색',
    required: true,
    fallback: 'BM25_RANKING'
  },

  VECTOR_RANKING: {
    enabled: true,
    version: '2.0',
    description: '벡터 기반 2차 재정렬 (보조)',
    required: false,
    fallback: 'BM25_RANKING'
  },

  // 연구형 기능 (비활성)
  EVOLUTION_REASONING: {
    enabled: false,
    version: '3.0',
    description: '시간축 진화 추론 (연구형)',
    required: false,
    fallback: null
  },

  DESIGN_INTENT_EXTRACTION: {
    enabled: false,
    version: '4.0',
    description: '설계 의도 추출 (연구형)',
    required: false,
    fallback: null
  },

  COGNITION_MAPPING: {
    enabled: false,
    version: '5.0',
    description: '설계 사고 지도 (연구형)',
    required: false,
    fallback: null
  },

  ECOSYSTEM_ANALYSIS: {
    enabled: false,
    version: '6.0',
    description: '생태계 분석 (연구형)',
    required: false,
    fallback: null
  },

  ACTIVE_ADVISOR: {
    enabled: false,
    version: '7.0',
    description: '능동적 설계 보조 (연구형)',
    required: false,
    fallback: null
  }
};

/**
 * 기능 상태 확인
 */
export function isFeatureEnabled(featureName) {
  const feature = FEATURE_CONFIG[featureName];
  if (!feature) {
    console.warn(`Unknown feature: ${featureName}`);
    return false;
  }
  return feature.enabled;
}

/**
 * 기능 활성화 (동적)
 */
export function enableFeature(featureName, reason = 'manual') {
  const feature = FEATURE_CONFIG[featureName];
  if (!feature) {
    throw new Error(`Unknown feature: ${featureName}`);
  }

  const wasEnabled = feature.enabled;
  feature.enabled = true;

  logFeatureChange(featureName, wasEnabled, true, reason);

  return {
    feature: featureName,
    version: feature.version,
    enabled: true,
    timestamp: new Date(),
    reason
  };
}

/**
 * 기능 비활성화 (동적)
 */
export function disableFeature(featureName, reason = 'manual') {
  const feature = FEATURE_CONFIG[featureName];
  if (!feature) {
    throw new Error(`Unknown feature: ${featureName}`);
  }

  if (feature.required) {
    throw new Error(`Cannot disable required feature: ${featureName}`);
  }

  const wasEnabled = feature.enabled;
  feature.enabled = false;

  logFeatureChange(featureName, wasEnabled, false, reason);

  return {
    feature: featureName,
    version: feature.version,
    enabled: false,
    timestamp: new Date(),
    reason
  };
}

/**
 * 필수 기능 검증
 */
export function validateRequiredFeatures() {
  const missing = [];
  const disabled = [];

  for (const [name, config] of Object.entries(FEATURE_CONFIG)) {
    if (config.required && !config.enabled) {
      missing.push({
        feature: name,
        version: config.version,
        description: config.description
      });
    }
    if (config.required && config.enabled) {
      disabled.push(name);
    }
  }

  return {
    isHealthy: missing.length === 0,
    missingRequired: missing,
    enabledRequired: disabled,
    validationTime: new Date()
  };
}

/**
 * 기능 체인 검증
 */
export function validateFeatureChain() {
  const issues = [];

  // 1. BM25가 비활성이면 HYBRID도 불가
  if (!isFeatureEnabled('BM25_RANKING') && isFeatureEnabled('HYBRID_SEARCH')) {
    issues.push({
      type: 'BROKEN_DEPENDENCY',
      feature: 'HYBRID_SEARCH',
      requires: 'BM25_RANKING',
      severity: 'CRITICAL'
    });
  }

  // 2. Metadata가 비활성이면 필터링 불가
  if (!isFeatureEnabled('METADATA_FILTERING') && isFeatureEnabled('HYBRID_SEARCH')) {
    issues.push({
      type: 'DEPENDENCY_DEGRADATION',
      feature: 'HYBRID_SEARCH',
      degrades: 'METADATA_FILTERING',
      severity: 'HIGH'
    });
  }

  // 3. CHUNK가 비활성이면 모든 기능 불가
  if (!isFeatureEnabled('CHUNK_PROCESSING')) {
    issues.push({
      type: 'FUNDAMENTAL_DISABLED',
      feature: 'CHUNK_PROCESSING',
      affectsAll: true,
      severity: 'CRITICAL'
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    validationTime: new Date()
  };
}

/**
 * 기능 영향도 분석
 */
export function analyzeFeatureImpact(featureName) {
  const feature = FEATURE_CONFIG[featureName];
  if (!feature) {
    return null;
  }

  const impact = {
    feature: featureName,
    version: feature.version,
    currentState: feature.enabled,
    dependents: [],
    dependencies: [],
    fallback: feature.fallback,
    criticality: feature.required ? 'CRITICAL' : 'OPTIONAL'
  };

  // 의존하는 기능 찾기
  for (const [name, config] of Object.entries(FEATURE_CONFIG)) {
    if (config.fallback === featureName) {
      impact.dependents.push(name);
    }
  }

  return impact;
}

/**
 * 기능 상태 리포트
 */
export function generateFeatureReport() {
  const report = {
    timestamp: new Date(),
    sections: {
      active: [],
      inactive: [],
      required: [],
      validation: validateRequiredFeatures(),
      chainValidation: validateFeatureChain()
    }
  };

  for (const [name, config] of Object.entries(FEATURE_CONFIG)) {
    const item = {
      name,
      version: config.version,
      enabled: config.enabled,
      required: config.required,
      description: config.description,
      fallback: config.fallback
    };

    if (config.enabled) {
      report.sections.active.push(item);
    } else {
      report.sections.inactive.push(item);
    }

    if (config.required) {
      report.sections.required.push(item);
    }
  }

  return report;
}

/**
 * 기능 변경 로그
 */
const featureChangeLog = [];

function logFeatureChange(featureName, wasEnabled, isEnabled, reason) {
  featureChangeLog.push({
    timestamp: new Date(),
    feature: featureName,
    change: `${wasEnabled ? 'enabled' : 'disabled'} → ${isEnabled ? 'enabled' : 'disabled'}`,
    reason,
    hostname: getHostname(),
    userId: process.env.USER || 'system'
  });

  // 최근 1000개만 유지
  if (featureChangeLog.length > 1000) {
    featureChangeLog.shift();
  }
}

/**
 * 호스트명 반환
 */
function getHostname() {
  try {
    return require('os').hostname();
  } catch {
    return 'unknown';
  }
}

/**
 * 기능 변경 이력 조회
 */
export function getFeatureChangeLog(featureName = null, limit = 50) {
  let log = featureChangeLog;

  if (featureName) {
    log = log.filter(entry => entry.feature === featureName);
  }

  return log.slice(-limit);
}

/**
 * 포맷팅 (테스트용)
 */
export function formatFeatureStatus() {
  const report = generateFeatureReport();
  const lines = [];

  lines.push('🎛️  기능 상태 리포트');
  lines.push('='.repeat(50));

  lines.push('\n✅ 활성화된 기능:');
  for (const feature of report.sections.active) {
    const required = feature.required ? ' [필수]' : '';
    lines.push(`   - ${feature.name} (v${feature.version})${required}`);
  }

  lines.push('\n❌ 비활성화된 기능:');
  for (const feature of report.sections.inactive) {
    lines.push(`   - ${feature.name} (v${feature.version})`);
  }

  lines.push('\n📊 검증 결과:');
  lines.push(`   필수 기능: ${report.sections.validation.isHealthy ? '✓' : '✗'}`);
  lines.push(`   기능 체인: ${report.sections.chainValidation.isValid ? '✓' : '✗'}`);

  return lines.join('\n');
}

export default {
  FEATURE_CONFIG,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  validateRequiredFeatures,
  validateFeatureChain,
  analyzeFeatureImpact,
  generateFeatureReport,
  getFeatureChangeLog,
  formatFeatureStatus
};
