/**
 * 다중 Repo 데이터 수집 모듈
 * 여러 저장소의 데이터를 통합
 */

/**
 * 저장소 메타데이터 정의
 */
export function defineRepositoryMetadata(repos) {
  const metadata = {};

  for (const repo of repos) {
    metadata[repo.name] = {
      name: repo.name,
      path: repo.path,
      url: repo.url,
      description: repo.description || '',
      type: classifyRepoType(repo.name),
      commits: [],
      concepts: new Set(),
      phases: [],
      firstCommit: null,
      lastCommit: null,
      totalCommits: 0,
      cognitiveLayer: null // core/theory/application
    };
  }

  return metadata;
}

/**
 * 저장소 타입 분류
 */
function classifyRepoType(repoName) {
  const lower = repoName.toLowerCase();

  if (lower.includes('experiment') || lower.includes('test')) return 'experimental';
  if (lower.includes('design') || lower.includes('spec') || lower.includes('theory')) return 'theoretical';
  if (lower.includes('lang') || lower.includes('core') || lower.includes('main')) return 'core';
  if (lower.includes('app') || lower.includes('impl') || lower.includes('application')) return 'application';

  return 'mixed';
}

/**
 * 다중 저장소 데이터 통합
 */
export function aggregateRepositoryData(repoMetadata, allCommits, allIntents, allGraphs) {
  const aggregated = {
    repositories: repoMetadata,
    globalCommits: [],
    globalConcepts: new Set(),
    globalPhases: new Set(),
    repoIndex: {}, // repo → commits/intents 매핑
    conceptOrigins: {}, // concept → [repo, phase, timestamp]
    timestamp: new Date()
  };

  // 커밋 인덱싱
  for (const repo in repoMetadata) {
    aggregated.repoIndex[repo] = {
      commits: [],
      intents: [],
      cognitiveMap: null
    };
  }

  // 모든 커밋 수집 및 인덱싱
  for (let i = 0; i < allCommits.length; i++) {
    const commits = allCommits[i];
    const repoName = Object.keys(repoMetadata)[i];

    for (const commit of commits) {
      aggregated.globalCommits.push({
        ...commit,
        repo: repoName,
        globalId: `${repoName}:${commit.hash}`
      });

      aggregated.repoIndex[repoName].commits.push(commit);
    }

    // 저장소별 시간범위 설정
    if (commits.length > 0) {
      repoMetadata[repoName].firstCommit = commits[commits.length - 1].timestamp;
      repoMetadata[repoName].lastCommit = commits[0].timestamp;
      repoMetadata[repoName].totalCommits = commits.length;
    }
  }

  // 의도 및 개념 수집
  for (let i = 0; i < allIntents.length; i++) {
    const intents = allIntents[i];
    const repoName = Object.keys(repoMetadata)[i];

    aggregated.repoIndex[repoName].intents = intents;

    for (const intent of intents) {
      aggregated.globalConcepts.add(intent.intent);
      aggregated.globalPhases.add(intent.category);

      // 개념 원점 기록
      if (!aggregated.conceptOrigins[intent.intent]) {
        aggregated.conceptOrigins[intent.intent] = [];
      }

      aggregated.conceptOrigins[intent.intent].push({
        repo: repoName,
        timestamp: intent.commit.timestamp,
        category: intent.category
      });
    }
  }

  // 인지 지도 저장
  for (let i = 0; i < allGraphs.length; i++) {
    const repoName = Object.keys(repoMetadata)[i];
    aggregated.repoIndex[repoName].cognitiveMap = allGraphs[i];
  }

  // 저장소별 개념 수집
  for (const repo in aggregated.repoIndex) {
    const concepts = new Set();
    for (const intent of aggregated.repoIndex[repo].intents) {
      concepts.add(intent.intent);
    }
    repoMetadata[repo].concepts = Array.from(concepts);
  }

  return aggregated;
}

/**
 * 저장소 역할 분류 (인지 계층)
 */
export function classifyRepositoryRoles(aggregated) {
  const roles = {};

  for (const repo in aggregated.repositories) {
    const metadata = aggregated.repositories[repo];
    const intentCount = aggregated.repoIndex[repo].intents.length;
    const conceptDiversity = metadata.concepts.length;
    const commitDensity = metadata.totalCommits / Math.max(1, metadata.concepts.length);

    let role = 'auxiliary';

    // 높은 다양성 + 낮은 밀도 = 실험소
    if (conceptDiversity > 8 && commitDensity < 3) {
      role = 'experimental';
    }
    // 높은 다양성 + 높은 밀도 = 핵심
    else if (conceptDiversity > 6 && commitDensity > 5) {
      role = 'core';
    }
    // 낮은 다양성 + 높은 밀도 = 응용
    else if (conceptDiversity <= 6 && commitDensity > 4) {
      role = 'application';
    }
    // 이론
    else if (metadata.type === 'theoretical') {
      role = 'theoretical';
    }

    roles[repo] = {
      repo,
      role,
      conceptDiversity,
      commitDensity,
      type: metadata.type
    };
  }

  return roles;
}

/**
 * 전역 통계 계산
 */
export function calculateGlobalStatistics(aggregated) {
  const stats = {
    totalRepositories: Object.keys(aggregated.repositories).length,
    totalCommits: aggregated.globalCommits.length,
    uniqueConcepts: aggregated.globalConcepts.size,
    uniqueCategories: aggregated.globalPhases.size,
    repoStats: {},
    timespan: null,
    conceptGrowth: 0,
    communicationDensity: 0
  };

  // 저장소별 통계
  for (const repo in aggregated.repositories) {
    const metadata = aggregated.repositories[repo];
    stats.repoStats[repo] = {
      commits: metadata.totalCommits,
      concepts: metadata.concepts.length,
      phases: metadata.totalCommits > 0 ? Math.ceil(metadata.totalCommits / 5) : 0
    };
  }

  // 전체 기간
  if (aggregated.globalCommits.length > 0) {
    const times = aggregated.globalCommits.map(c => new Date(c.timestamp).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    stats.timespan = maxTime - minTime;
  }

  // 개념 성장
  stats.conceptGrowth = aggregated.globalConcepts.size / Math.max(1, stats.totalRepositories);

  return stats;
}

/**
 * 저장소 간 개념 공유도 계산
 */
export function calculateCrossRepoConceptSharing(aggregated) {
  const sharing = {};

  for (const concept of aggregated.globalConcepts) {
    const origins = aggregated.conceptOrigins[concept] || [];
    const reposWithConcept = new Set(origins.map(o => o.repo));

    sharing[concept] = {
      concept,
      repoCount: reposWithConcept.size,
      repos: Array.from(reposWithConcept),
      firstAppearance: origins.length > 0 ? origins[0].timestamp : null,
      appearances: origins.length
    };
  }

  return sharing;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatEcosystemOverview(aggregated, stats, roles) {
  const lines = [];

  lines.push('🌍 지식 생태계 개요');
  lines.push(`   저장소: ${stats.totalRepositories}개`);
  lines.push(`   총 커밋: ${stats.totalCommits}개`);
  lines.push(`   고유 개념: ${stats.uniqueConcepts}개`);

  lines.push('   저장소 역할:');
  for (const [repo, role] of Object.entries(roles)) {
    lines.push(`     - ${repo}: ${role.role}`);
  }

  return lines.join('\n');
}

export default {
  defineRepositoryMetadata,
  classifyRepoType,
  aggregateRepositoryData,
  classifyRepositoryRoles,
  calculateGlobalStatistics,
  calculateCrossRepoConceptSharing,
  formatEcosystemOverview
};
