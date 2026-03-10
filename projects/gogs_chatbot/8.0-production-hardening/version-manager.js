/**
 * 버전 관리 모듈
 * 모델, 인덱스, 메타데이터 버전 추적
 */

/**
 * 버전 항목 정의
 */
export class VersionItem {
  constructor(component, version, timestamp = null, metadata = {}) {
    this.component = component;
    this.version = version;
    this.timestamp = timestamp || new Date();
    this.metadata = metadata;
    this.hash = generateVersionHash(component, version);
    this.status = 'ACTIVE';
  }

  /**
   * 버전 정보 조회
   */
  getInfo() {
    return {
      component: this.component,
      version: this.version,
      hash: this.hash,
      timestamp: this.timestamp,
      status: this.status,
      metadata: this.metadata
    };
  }

  /**
   * 상태 변경
   */
  setStatus(status) {
    const validStatuses = ['ACTIVE', 'DEPRECATED', 'ARCHIVED', 'ROLLBACK'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    this.status = status;
  }
}

/**
 * 버전 관리자
 */
export class VersionManager {
  constructor() {
    this.versions = new Map();
    this.timeline = [];
    this.activeVersions = {};
  }

  /**
   * 버전 등록
   */
  registerVersion(component, version, metadata = {}) {
    const versionItem = new VersionItem(component, version, new Date(), metadata);

    if (!this.versions.has(component)) {
      this.versions.set(component, []);
    }

    this.versions.get(component).push(versionItem);
    this.timeline.push({
      action: 'REGISTER',
      component,
      version,
      timestamp: new Date()
    });

    return versionItem;
  }

  /**
   * 버전 활성화
   */
  activateVersion(component, version) {
    const versions = this.versions.get(component);
    if (!versions) {
      throw new Error(`Component not found: ${component}`);
    }

    const target = versions.find(v => v.version === version);
    if (!target) {
      throw new Error(`Version not found: ${component}@${version}`);
    }

    // 이전 활성 버전 비활성화
    const previousActive = versions.find(v => v.status === 'ACTIVE');
    if (previousActive) {
      previousActive.setStatus('DEPRECATED');
    }

    target.setStatus('ACTIVE');
    this.activeVersions[component] = version;

    this.timeline.push({
      action: 'ACTIVATE',
      component,
      version,
      timestamp: new Date(),
      previousVersion: previousActive?.version || null
    });

    return {
      component,
      version,
      activated: true,
      timestamp: new Date()
    };
  }

  /**
   * 버전 롤백
   */
  rollbackVersion(component, targetVersion) {
    const versions = this.versions.get(component);
    if (!versions) {
      throw new Error(`Component not found: ${component}`);
    }

    const target = versions.find(v => v.version === targetVersion);
    if (!target) {
      throw new Error(`Version not found: ${component}@${targetVersion}`);
    }

    const current = this.activeVersions[component];
    if (current === targetVersion) {
      throw new Error('Target version is already active');
    }

    // 현재 버전 아카이브
    const currentVersion = versions.find(v => v.status === 'ACTIVE');
    if (currentVersion) {
      currentVersion.setStatus('ARCHIVED');
    }

    target.setStatus('ACTIVE');
    this.activeVersions[component] = targetVersion;

    this.timeline.push({
      action: 'ROLLBACK',
      component,
      from: current,
      to: targetVersion,
      timestamp: new Date(),
      reason: 'manual'
    });

    return {
      component,
      rolledBackTo: targetVersion,
      timestamp: new Date(),
      message: `Rolled back ${component} from ${current} to ${targetVersion}`
    };
  }

  /**
   * 현재 활성 버전 조회
   */
  getActiveVersions() {
    return {
      ...this.activeVersions,
      timestamp: new Date()
    };
  }

  /**
   * 버전별 히스토리
   */
  getComponentHistory(component) {
    const versions = this.versions.get(component) || [];
    const componentTimeline = this.timeline.filter(e => e.component === component);

    return {
      component,
      versions: versions.map(v => v.getInfo()),
      timeline: componentTimeline,
      totalVersions: versions.length,
      activeVersion: this.activeVersions[component] || null
    };
  }

  /**
   * 호환성 확인
   */
  validateCompatibility() {
    const issues = [];

    // 예: 새 프롬프트는 새 모델이 필요
    const promptVersion = this.activeVersions['PROMPT'];
    const modelVersion = this.activeVersions['LLM_MODEL'];

    if (promptVersion && modelVersion) {
      // 호환성 규칙 정의
      const rules = {
        'PROMPT_v2': { requiredModel: 'GPT_4_LATEST' }
      };

      if (rules[promptVersion] && !modelVersion.includes(rules[promptVersion].requiredModel)) {
        issues.push({
          type: 'INCOMPATIBILITY',
          component: 'PROMPT',
          version: promptVersion,
          requires: rules[promptVersion].requiredModel,
          current: modelVersion,
          severity: 'CRITICAL'
        });
      }
    }

    return {
      compatible: issues.length === 0,
      issues
    };
  }

  /**
   * 전체 상태 스냅샷
   */
  takeSnapshot() {
    return {
      timestamp: new Date(),
      activeVersions: { ...this.activeVersions },
      allVersions: Array.from(this.versions.entries()).map(([component, versions]) => ({
        component,
        count: versions.length,
        versions: versions.map(v => ({
          version: v.version,
          status: v.status,
          hash: v.hash
        }))
      })),
      timelineLength: this.timeline.length,
      compatibility: this.validateCompatibility()
    };
  }

  /**
   * 배포 전 검증
   */
  validateForDeployment() {
    const checks = {
      allComponentsActive: true,
      allVersionsLocked: true,
      noConflicts: true,
      issues: []
    };

    // 모든 컴포넌트가 활성 버전을 가지는가?
    const requiredComponents = ['BM25_INDEX', 'VECTOR_INDEX', 'METADATA_SCHEMA', 'LLM_MODEL', 'PROMPT'];
    for (const component of requiredComponents) {
      if (!this.activeVersions[component]) {
        checks.issues.push({
          type: 'MISSING_COMPONENT',
          component,
          severity: 'CRITICAL'
        });
        checks.allComponentsActive = false;
      }
    }

    // 호환성 검증
    const compat = this.validateCompatibility();
    if (!compat.compatible) {
      checks.noConflicts = false;
      checks.issues.push(...compat.issues);
    }

    checks.deploymentReady = checks.allComponentsActive && checks.noConflicts;

    return checks;
  }

  /**
   * 버전별 감사 추적
   */
  getAuditTrail(component = null) {
    let trail = this.timeline;

    if (component) {
      trail = trail.filter(e => e.component === component);
    }

    return {
      entries: trail,
      totalChanges: trail.length,
      firstChange: trail.length > 0 ? trail[0].timestamp : null,
      lastChange: trail.length > 0 ? trail[trail.length - 1].timestamp : null
    };
  }
}

/**
 * 메타데이터 스키마 버전 관리
 */
export class MetadataSchemaVersionManager {
  constructor() {
    this.schemas = new Map();
    this.activeSchema = null;
  }

  /**
   * 스키마 버전 등록
   */
  registerSchema(version, schema, description = '') {
    this.schemas.set(version, {
      version,
      schema,
      description,
      registeredAt: new Date(),
      fields: Object.keys(schema),
      fieldCount: Object.keys(schema).length
    });
  }

  /**
   * 스키마 활성화
   */
  activateSchema(version) {
    if (!this.schemas.has(version)) {
      throw new Error(`Schema version not found: ${version}`);
    }

    this.activeSchema = version;
    return {
      version,
      activated: true,
      fieldCount: this.schemas.get(version).fieldCount
    };
  }

  /**
   * 스키마 마이그레이션 경로
   */
  getMigrationPath(fromVersion, toVersion) {
    const from = this.schemas.get(fromVersion);
    const to = this.schemas.get(toVersion);

    if (!from || !to) {
      return null;
    }

    const added = to.fields.filter(f => !from.fields.includes(f));
    const removed = from.fields.filter(f => !to.fields.includes(f));
    const retained = from.fields.filter(f => to.fields.includes(f));

    return {
      from: fromVersion,
      to: toVersion,
      added,
      removed,
      retained,
      migrationRequired: added.length > 0 || removed.length > 0
    };
  }
}

/**
 * 유틸리티: 버전 해시 생성
 */
function generateVersionHash(component, version) {
  const str = `${component}@${version}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 포맷팅 (테스트용)
 */
export function formatVersionStatus(versionManager) {
  const lines = [];
  const snapshot = versionManager.takeSnapshot();

  lines.push('🏷️  버전 상태');
  lines.push('='.repeat(50));

  lines.push('\n활성 버전:');
  for (const [component, version] of Object.entries(snapshot.activeVersions)) {
    lines.push(`   ${component}: ${version}`);
  }

  lines.push('\n배포 준비 상태:');
  const checks = versionManager.validateForDeployment();
  lines.push(`   전체 컴포넌트: ${checks.allComponentsActive ? '✓' : '✗'}`);
  lines.push(`   호환성: ${checks.noConflicts ? '✓' : '✗'}`);
  lines.push(`   배포 준비: ${checks.deploymentReady ? '✓ READY' : '✗ NOT READY'}`);

  if (checks.issues.length > 0) {
    lines.push('\n문제:');
    for (const issue of checks.issues) {
      lines.push(`   - [${issue.severity}] ${issue.type}`);
    }
  }

  return lines.join('\n');
}

export default {
  VersionItem,
  VersionManager,
  MetadataSchemaVersionManager,
  formatVersionStatus
};
