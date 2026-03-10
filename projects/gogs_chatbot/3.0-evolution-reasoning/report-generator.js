/**
 * 리포트 생성 모듈
 * 진화 분석 결과 정리
 */

/**
 * 버전 진화 보고서 생성
 */
export function generateVersionReport(versionEvolution, diffStats) {
  const report = {
    type: 'VERSION_EVOLUTION',
    from: versionEvolution.from,
    to: versionEvolution.to,
    commits: versionEvolution.path.length,
    timespan: versionEvolution.timespan,
    changes: diffStats,
    content: []
  };

  // 보고서 내용 구성
  report.content.push({
    section: 'Overview',
    body: `Version evolution from ${versionEvolution.from.message} to ${versionEvolution.to.message}`
  });

  report.content.push({
    section: 'Statistics',
    body: `
Total commits: ${versionEvolution.path.length}
Time span: ${versionEvolution.timespan.days} days
Files changed: ${diffStats.totalFiles}
Lines added: +${diffStats.totalAdditions}
Lines deleted: -${diffStats.totalDeletions}
Net change: ${diffStats.netChange}
`
  });

  return report;
}

/**
 * 기능 생애 주기 보고서
 */
export function generateFeatureLifecycleReport(lifecycle, velocity) {
  const report = {
    type: 'FEATURE_LIFECYCLE',
    feature: lifecycle.name,
    introduced: lifecycle.introduced,
    lastModified: lifecycle.lastModified,
    content: []
  };

  // Introduction 섹션
  report.content.push({
    section: 'Introduction',
    body: `
Feature: ${lifecycle.name}
Introduced: ${lifecycle.introduced.timestamp.toISOString().split('T')[0]}
By: ${lifecycle.introduced.author}

First mention:
${lifecycle.introduced.message}
`
  });

  // Timeline 섹션
  report.content.push({
    section: 'Timeline',
    body: generateTimeline(lifecycle.stages)
  });

  // Velocity 섹션
  if (velocity) {
    report.content.push({
      section: 'Activity',
      body: `
Total commits: ${velocity.totalCommits}
Time span: ${velocity.timeSpanDays} days
Commits per day: ${velocity.commitsPerDay}
Activity density: ${velocity.activityDensity}
`
    });
  }

  // Major Events 섹션
  report.content.push({
    section: 'Major Events',
    body: generateEventsSummary(lifecycle.events)
  });

  return report;
}

/**
 * 타임라인 생성
 */
function generateTimeline(stages) {
  if (stages.length === 0) return 'No stages recorded';

  const lines = ['Stage Evolution:'];

  for (const stage of stages) {
    const date = stage.timestamp.toISOString().split('T')[0];
    lines.push(`  ${date}: ${stage.type}`);
  }

  return lines.join('\n');
}

/**
 * 이벤트 요약 생성
 */
function generateEventsSummary(events) {
  if (events.length === 0) return 'No events recorded';

  const lines = [];

  for (const event of events) {
    const date = event.commit.timestamp.toISOString().split('T')[0];
    lines.push(`${date} [${event.type}]`);
    lines.push(`  ${event.commit.message}`);
  }

  return lines.join('\n');
}

/**
 * 비교 분석 보고서
 */
export function generateComparisonReport(concept, versionData) {
  const report = {
    type: 'COMPARISON',
    concept: concept,
    versions: Object.keys(versionData),
    content: []
  };

  // 각 버전별 상세 정보
  for (const [version, data] of Object.entries(versionData)) {
    report.content.push({
      section: `${version}`,
      body: generateVersionDetail(data)
    });
  }

  // 비교 분석
  report.content.push({
    section: 'Analysis',
    body: generateComparisonAnalysis(versionData)
  });

  return report;
}

/**
 * 버전 상세 정보 생성
 */
function generateVersionDetail(data) {
  return `
Commits: ${data.commits || 0}
Files changed: ${data.filesChanged || 0}
Key changes: ${data.keyChanges || 'None recorded'}
`;
}

/**
 * 비교 분석 생성
 */
function generateComparisonAnalysis(versionData) {
  const versions = Object.entries(versionData);

  if (versions.length < 2) {
    return 'Insufficient data for comparison';
  }

  const lines = ['Key Differences:'];

  // 간단한 비교 (실제로는 더 정교한 분석 필요)
  for (let i = 1; i < versions.length; i++) {
    const [prevVersion, prevData] = versions[i - 1];
    const [currVersion, currData] = versions[i];

    lines.push(`\n${prevVersion} → ${currVersion}:`);
    lines.push(`  Commits: ${(currData.commits || 0) - (prevData.commits || 0)}`);
    lines.push(`  Files: ${(currData.filesChanged || 0) - (prevData.filesChanged || 0)}`);
  }

  return lines.join('\n');
}

/**
 * 설계 의도 분석 보고서
 */
export function generateDesignIntentReport(commits) {
  const report = {
    type: 'DESIGN_INTENT',
    content: []
  };

  // 아키텍처 관련 commits
  const architectureCommits = commits.filter(c =>
    c.message.toLowerCase().includes('architecture') ||
    c.message.toLowerCase().includes('design')
  );

  if (architectureCommits.length > 0) {
    report.content.push({
      section: 'Architecture Decisions',
      body: generateDesignDecisions(architectureCommits)
    });
  }

  // Performance 관련
  const perfCommits = commits.filter(c =>
    c.message.toLowerCase().includes('performance') ||
    c.message.toLowerCase().includes('optimize')
  );

  if (perfCommits.length > 0) {
    report.content.push({
      section: 'Performance Optimizations',
      body: generatePerformanceDecisions(perfCommits)
    });
  }

  // Safety 관련
  const safetyCommits = commits.filter(c =>
    c.message.toLowerCase().includes('safety') ||
    c.message.toLowerCase().includes('safe') ||
    c.message.toLowerCase().includes('secure')
  );

  if (safetyCommits.length > 0) {
    report.content.push({
      section: 'Safety & Security',
      body: generateSafetyDecisions(safetyCommits)
    });
  }

  return report;
}

/**
 * 설계 결정 생성
 */
function generateDesignDecisions(commits) {
  const lines = ['Design Principles:'];

  for (const commit of commits) {
    lines.push(`\n${commit.message}`);
    lines.push(`By: ${commit.author} on ${commit.timestamp.toISOString().split('T')[0]}`);
  }

  return lines.join('\n');
}

/**
 * 성능 결정 생성
 */
function generatePerformanceDecisions(commits) {
  const lines = ['Performance Improvements:'];

  for (const commit of commits) {
    lines.push(`- ${commit.message.substring(0, 80)}`);
  }

  return lines.join('\n');
}

/**
 * 안전성 결정 생성
 */
function generateSafetyDecisions(commits) {
  const lines = ['Safety Measures:'];

  for (const commit of commits) {
    lines.push(`- ${commit.message.substring(0, 80)}`);
  }

  return lines.join('\n');
}

/**
 * 리포트를 마크다운으로 변환
 */
export function reportToMarkdown(report) {
  let markdown = `# ${report.type}\n\n`;

  if (report.feature) {
    markdown += `## Feature: ${report.feature}\n\n`;
  }

  if (report.from && report.to) {
    markdown += `## Version Evolution\n\n`;
    markdown += `**From**: ${report.from.message}\n`;
    markdown += `**To**: ${report.to.message}\n\n`;
  }

  for (const section of report.content) {
    markdown += `## ${section.section}\n\n`;
    markdown += section.body + '\n\n';
  }

  return markdown;
}

/**
 * 리포트 검증
 */
export function validateReport(report) {
  const validations = {
    hasType: !!report.type,
    hasContent: report.content && report.content.length > 0,
    contentValid: report.content.every(c => c.section && c.body)
  };

  return {
    isValid: Object.values(validations).every(v => v),
    validations: validations
  };
}

export default {
  generateVersionReport,
  generateFeatureLifecycleReport,
  generateComparisonReport,
  generateDesignIntentReport,
  reportToMarkdown,
  validateReport
};
