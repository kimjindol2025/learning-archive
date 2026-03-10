/**
 * Commit 메시지 파싱 모듈
 * 구조화된 정보 추출
 */

/**
 * Commit 메시지 분석
 */
export function parseCommitMessage(message) {
  const lines = message.split('\n');
  const subject = lines[0];
  const body = lines.slice(2).join('\n');

  return {
    subject: subject,
    body: body,
    type: detectCommitType(subject),
    scope: extractScope(subject),
    hasBreakingChange: body.toLowerCase().includes('breaking change'),
    references: extractReferences(body)
  };
}

/**
 * Commit 타입 감지
 */
function detectCommitType(subject) {
  const types = {
    'feat': /^feat(\(.*\))?:/i,
    'fix': /^fix(\(.*\))?:/i,
    'docs': /^docs(\(.*\))?:/i,
    'style': /^style(\(.*\))?:/i,
    'refactor': /^refactor(\(.*\))?:/i,
    'perf': /^perf(\(.*\))?:/i,
    'test': /^test(\(.*\))?:/i,
    'chore': /^chore(\(.*\))?:/i,
    'phase': /phase/i,
    'version': /^v\d+\.\d+/i,
    'bugfix': /bug|fix|hotfix/i,
    'feature': /feature|feat|new/i,
    'merge': /^merge/i
  };

  for (const [type, pattern] of Object.entries(types)) {
    if (pattern.test(subject)) {
      return type;
    }
  }

  return 'other';
}

/**
 * Scope 추출 (feat(scope): message)
 */
function extractScope(subject) {
  const match = subject.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

/**
 * 참조 추출 (#123, fixes #456 등)
 */
function extractReferences(text) {
  const issuePattern = /#(\d+)/g;
  const references = [];

  let match;
  while ((match = issuePattern.exec(text)) !== null) {
    references.push({
      type: 'issue',
      id: match[1]
    });
  }

  return references;
}

/**
 * 버전 정보 추출
 */
export function extractVersionInfo(commits) {
  const versionCommits = [];

  for (const commit of commits) {
    const versionMatch = commit.message.match(/v(\d+\.\d+(?:\.\d+)?)/i);
    const phaseMatch = commit.message.match(/phase\s+(\d+)/i);

    if (versionMatch || phaseMatch) {
      versionCommits.push({
        commit: commit,
        version: versionMatch ? versionMatch[1] : null,
        phase: phaseMatch ? parseInt(phaseMatch[1]) : null,
        parsed: parseCommitMessage(commit.message)
      });
    }
  }

  return versionCommits.sort((a, b) => {
    const versionA = a.version ? parseVersion(a.version) : 0;
    const versionB = b.version ? parseVersion(b.version) : 0;
    return versionB - versionA;
  });
}

/**
 * 버전 문자열을 숫자로 변환
 */
function parseVersion(versionStr) {
  const parts = versionStr.split('.').map(p => parseInt(p) || 0);
  return parts[0] * 10000 + parts[1] * 100 + (parts[2] || 0);
}

/**
 * 기능 도입 시점 추적
 */
export function trackFeatureIntroduction(commits, featureName) {
  const featureCommits = commits.filter(c =>
    c.message.toLowerCase().includes(featureName.toLowerCase())
  );

  if (featureCommits.length === 0) {
    return null;
  }

  // 시간순으로 정렬 (역순 - 최신이 앞)
  featureCommits.sort((a, b) => b.timestamp - a.timestamp);

  return {
    featureName: featureName,
    introduced: featureCommits[featureCommits.length - 1],
    lastModified: featureCommits[0],
    commitCount: featureCommits.length,
    commits: featureCommits
  };
}

/**
 * 주제별 Commit 분류
 */
export function categorizeCommits(commits) {
  const categories = {
    architecture: [],
    memory: [],
    safety: [],
    performance: [],
    testing: [],
    documentation: [],
    bugfix: [],
    feature: [],
    refactor: [],
    other: []
  };

  const keywords = {
    architecture: /architecture|design|structure|layout/i,
    memory: /memory|heap|stack|allocation|pointer|unsafe/i,
    safety: /safety|safe|security|bounds|validate/i,
    performance: /performance|optimize|speed|fast|efficient/i,
    testing: /test|unit|integration|coverage|verify/i,
    documentation: /docs?|documentation|comment|readme/i,
    bugfix: /bug|fix|hotfix|issue|patch/i,
    feature: /feature|feat|add|new|implement/i,
    refactor: /refactor|refactoring|clean|improve|simplify/i
  };

  for (const commit of commits) {
    const text = (commit.message + commit.author).toLowerCase();
    let categorized = false;

    for (const [category, pattern] of Object.entries(keywords)) {
      if (pattern.test(text)) {
        categories[category].push(commit);
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories.other.push(commit);
    }
  }

  return categories;
}

/**
 * Commit 메시지 요약
 */
export function summarizeCommits(commits, limit = 5) {
  const summary = {
    total: commits.length,
    byType: {},
    recent: commits.slice(0, limit),
    topAuthors: getTopAuthors(commits, 5)
  };

  for (const commit of commits) {
    const parsed = parseCommitMessage(commit.message);
    const type = parsed.type;

    summary.byType[type] = (summary.byType[type] || 0) + 1;
  }

  return summary;
}

/**
 * 상위 저자 추출
 */
function getTopAuthors(commits, limit = 5) {
  const authors = {};

  for (const commit of commits) {
    authors[commit.author] = (authors[commit.author] || 0) + 1;
  }

  return Object.entries(authors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([author, count]) => ({ author, count }));
}

/**
 * 인과 관계 추론
 */
export function inferCausality(commits, targetKeyword) {
  const targetCommit = commits.find(c =>
    c.message.toLowerCase().includes(targetKeyword.toLowerCase())
  );

  if (!targetCommit) {
    return null;
  }

  // 이전 Commit 분석
  const previousCommits = commits.filter(c => c.timestamp < targetCommit.timestamp);

  if (previousCommits.length === 0) {
    return {
      target: targetCommit,
      potentialCauses: []
    };
  }

  // 유사한 주제의 이전 commit 찾기
  const potentialCauses = previousCommits
    .filter(c => {
      const targetWords = targetKeyword.split(' ');
      return targetWords.some(word =>
        c.message.toLowerCase().includes(word.toLowerCase())
      );
    })
    .slice(-5); // 최근 5개

  return {
    target: targetCommit,
    potentialCauses: potentialCauses
  };
}

/**
 * 포맷팅 (테스트용)
 */
export function formatParsedCommit(parsed) {
  const lines = [];

  lines.push('📝 Commit 분석');
  lines.push(`   주제: ${parsed.subject}`);
  lines.push(`   타입: ${parsed.type}`);

  if (parsed.scope) {
    lines.push(`   범위: ${parsed.scope}`);
  }

  if (parsed.hasBreakingChange) {
    lines.push(`   ⚠️ Breaking Change`);
  }

  if (parsed.references.length > 0) {
    lines.push(`   참조: ${parsed.references.map(r => `#${r.id}`).join(', ')}`);
  }

  return lines.join('\n');
}

export default {
  parseCommitMessage,
  extractVersionInfo,
  trackFeatureIntroduction,
  categorizeCommits,
  summarizeCommits,
  inferCausality,
  formatParsedCommit
};
