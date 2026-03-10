/**
 * 진화 추적 모듈
 * 기능의 생애 주기 분석
 */

/**
 * 기능의 완전한 진화 경로 추적
 */
export function traceFeatureLifecycle(dag, commits, featureName) {
  const lifecycle = {
    name: featureName,
    introduced: null,
    firstMention: null,
    lastModified: null,
    totalMentions: 0,
    stages: [],
    events: []
  };

  const mentionedCommits = commits.filter(c =>
    c.message.toLowerCase().includes(featureName.toLowerCase())
  );

  if (mentionedCommits.length === 0) {
    return null;
  }

  // 시간순 정렬
  mentionedCommits.sort((a, b) => a.timestamp - b.timestamp);

  lifecycle.introduced = mentionedCommits[0];
  lifecycle.lastModified = mentionedCommits[mentionedCommits.length - 1];
  lifecycle.firstMention = mentionedCommits[0];
  lifecycle.totalMentions = mentionedCommits.length;

  // 진화 단계 분석
  const stages = identifyStages(mentionedCommits);
  lifecycle.stages = stages;

  // 주요 이벤트
  for (const commit of mentionedCommits) {
    const eventType = classifyEvent(commit.message, featureName);

    lifecycle.events.push({
      type: eventType,
      commit: commit,
      description: generateEventDescription(commit, eventType, featureName)
    });
  }

  return lifecycle;
}

/**
 * 진화 단계 식별
 */
function identifyStages(commits) {
  const stages = [];
  const keywords = {
    introduction: /introduce|add|new|initial|first/i,
    expansion: /add|extend|support|implement|feature/i,
    modification: /fix|update|improve|refactor|optimize/i,
    stabilization: /stable|finalize|complete|done/i,
    deprecation: /deprecat|remove|obsolete|legacy/i
  };

  for (const commit of commits) {
    const text = commit.message.toLowerCase();
    let stageType = 'other';

    for (const [stage, pattern] of Object.entries(keywords)) {
      if (pattern.test(text)) {
        stageType = stage;
        break;
      }
    }

    stages.push({
      timestamp: commit.timestamp,
      type: stageType,
      commit: commit.hash
    });
  }

  return stages;
}

/**
 * 이벤트 분류
 */
function classifyEvent(message, featureName) {
  const lower = message.toLowerCase();

  if (lower.includes('introduce') || lower.includes('initial')) {
    return 'introduction';
  } else if (lower.includes('add') || lower.includes('implement')) {
    return 'addition';
  } else if (lower.includes('fix') || lower.includes('bug')) {
    return 'bugfix';
  } else if (lower.includes('refactor') || lower.includes('optimize')) {
    return 'refactoring';
  } else if (lower.includes('remove') || lower.includes('deprecat')) {
    return 'removal';
  } else if (lower.includes('update') || lower.includes('improve')) {
    return 'update';
  }

  return 'modification';
}

/**
 * 이벤트 설명 생성
 */
function generateEventDescription(commit, eventType, featureName) {
  const descriptions = {
    introduction: `${featureName} introduced`,
    addition: `${featureName} feature added`,
    bugfix: `${featureName} bug fix`,
    refactoring: `${featureName} refactored`,
    removal: `${featureName} removed`,
    update: `${featureName} updated`,
    modification: `${featureName} modified`
  };

  return descriptions[eventType] || `${featureName} changed`;
}

/**
 * 버전별 기능 추적
 */
export function trackFeaturesByVersion(commits, versionCommits) {
  const features = {};

  for (let i = 0; i < versionCommits.length; i++) {
    const versionCommit = versionCommits[i];
    const nextVersionCommit = i + 1 < versionCommits.length
      ? versionCommits[i + 1]
      : null;

    const rangeCommits = commits.filter(c => {
      const after = c.timestamp >= versionCommit.timestamp;
      const before = !nextVersionCommit || c.timestamp < nextVersionCommit.timestamp;
      return after && before;
    });

    const version = versionCommit.version || `Phase ${versionCommit.phase}`;

    features[version] = {
      added: [],
      modified: [],
      fixed: [],
      refactored: []
    };

    for (const commit of rangeCommits) {
      const lower = commit.message.toLowerCase();

      if (lower.includes('add') || lower.includes('new') || lower.includes('feature')) {
        features[version].added.push(commit);
      } else if (lower.includes('fix') || lower.includes('bug')) {
        features[version].fixed.push(commit);
      } else if (lower.includes('refactor')) {
        features[version].refactored.push(commit);
      } else {
        features[version].modified.push(commit);
      }
    }
  }

  return features;
}

/**
 * 기능 간 의존성 분석 (초기)
 */
export function analyzeDependencies(commits, features) {
  const dependencies = {};

  for (const feature of features) {
    dependencies[feature] = {
      dependsOn: [],
      requiredBy: []
    };
  }

  for (const commit of commits) {
    const lower = commit.message.toLowerCase();

    for (const feature1 of features) {
      if (lower.includes(feature1.toLowerCase())) {
        for (const feature2 of features) {
          if (feature1 !== feature2 && lower.includes(feature2.toLowerCase())) {
            if (!dependencies[feature1].dependsOn.includes(feature2)) {
              dependencies[feature1].dependsOn.push(feature2);
            }

            if (!dependencies[feature2].requiredBy.includes(feature1)) {
              dependencies[feature2].requiredBy.push(feature1);
            }
          }
        }
      }
    }
  }

  return dependencies;
}

/**
 * 진화 속도 계산
 */
export function calculateEvolutionVelocity(commits, featureName) {
  const featureCommits = commits.filter(c =>
    c.message.toLowerCase().includes(featureName.toLowerCase())
  );

  if (featureCommits.length < 2) {
    return null;
  }

  featureCommits.sort((a, b) => a.timestamp - b.timestamp);

  const firstCommit = featureCommits[0];
  const lastCommit = featureCommits[featureCommits.length - 1];

  const timeSpanMs = lastCommit.timestamp - firstCommit.timestamp;
  const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);
  const velocity = featureCommits.length / (timeSpanDays || 1);

  return {
    name: featureName,
    totalCommits: featureCommits.length,
    timeSpanDays: Math.round(timeSpanDays),
    commitsPerDay: Math.round(velocity * 10) / 10,
    activityDensity: calculateActivityDensity(featureCommits)
  };
}

/**
 * 활동 밀도 계산
 */
function calculateActivityDensity(commits) {
  if (commits.length < 2) return 0;

  const intervals = [];

  for (let i = 1; i < commits.length; i++) {
    const interval = commits[i].timestamp - commits[i - 1].timestamp;
    intervals.push(interval);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const avgDaysPerCommit = avgInterval / (1000 * 60 * 60 * 24);

  return Math.round((1 / avgDaysPerCommit) * 100) / 100;
}

/**
 * 진화 리포트 생성 (요약)
 */
export function generateEvolutionSummary(lifecycle, velocity) {
  return {
    name: lifecycle.name,
    introduced: lifecycle.introduced.timestamp,
    lastModified: lifecycle.lastModified.timestamp,
    totalMentions: lifecycle.totalMentions,
    stages: lifecycle.stages.length,
    events: lifecycle.events.length,
    velocity: velocity
  };
}

/**
 * 포맷팅 (테스트용)
 */
export function formatLifecycle(lifecycle) {
  const lines = [];

  lines.push(`🔄 ${lifecycle.name} 진화`);
  lines.push(`   도입: ${lifecycle.introduced.timestamp.toISOString().split('T')[0]}`);
  lines.push(`   마지막 수정: ${lifecycle.lastModified.timestamp.toISOString().split('T')[0]}`);
  lines.push(`   언급 횟수: ${lifecycle.totalMentions}회`);
  lines.push(`   단계: ${lifecycle.stages.length}개`);
  lines.push(`   주요 이벤트: ${lifecycle.events.length}개`);

  return lines.join('\n');
}

export default {
  traceFeatureLifecycle,
  trackFeaturesByVersion,
  analyzeDependencies,
  calculateEvolutionVelocity,
  generateEvolutionSummary,
  formatLifecycle
};
