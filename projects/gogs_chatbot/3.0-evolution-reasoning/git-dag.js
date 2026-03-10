/**
 * Git DAG 추출 및 분석 모듈
 * Commit 그래프 기반 진화 추론
 */

import { execSync } from 'child_process';

/**
 * Gogs 저장소에서 Commit 로그 추출
 */
export function extractCommitLog(repoPath, options = {}) {
  const {
    format = '%H|%P|%ai|%s|%an|%ae',
    limit = 1000
  } = options;

  try {
    const command = `cd ${repoPath} && git log --format="${format}" -${limit}`;
    const output = execSync(command, { encoding: 'utf-8' });

    const commits = [];

    for (const line of output.split('\n')) {
      if (!line.trim()) continue;

      const [hash, parents, timestamp, message, author, email] = line.split('|');

      commits.push({
        hash: hash.substring(0, 10),
        parents: parents.split(' ').filter(p => p.length > 0),
        timestamp: new Date(timestamp),
        message: message,
        author: author,
        email: email,
        files: []
      });
    }

    return commits;
  } catch (error) {
    console.error('Failed to extract commit log:', error);
    return [];
  }
}

/**
 * Commit의 변경 파일 추출
 */
export function getCommitDiff(repoPath, commitHash, options = {}) {
  const {
    nameOnly = false,
    stat = false
  } = options;

  try {
    let command = `cd ${repoPath} && git show ${commitHash}`;

    if (nameOnly) {
      command += ' --name-only';
    } else if (stat) {
      command += ' --stat';
    } else {
      command += ' --no-patch';
    }

    const output = execSync(command, { encoding: 'utf-8' });

    return output;
  } catch (error) {
    console.error(`Failed to get diff for ${commitHash}:`, error);
    return '';
  }
}

/**
 * 범위의 Commit들 추출
 */
export function getCommitRange(repoPath, from, to, options = {}) {
  const {
    format = '%H|%ai|%s'
  } = options;

  try {
    const command = `cd ${repoPath} && git log ${from}...${to} --format="${format}"`;
    const output = execSync(command, { encoding: 'utf-8' });

    return output.split('\n').filter(l => l.trim());
  } catch (error) {
    console.error(`Failed to get commit range ${from}...${to}:`, error);
    return [];
  }
}

/**
 * Commit DAG 구축
 */
export function buildDAG(commits) {
  const dag = {
    commits: {},
    edges: [],
    roots: [],
    heads: []
  };

  // Commit 노드 생성
  for (const commit of commits) {
    dag.commits[commit.hash] = {
      ...commit,
      children: []
    };
  }

  // 엣지 생성
  for (const commit of commits) {
    for (const parent of commit.parents) {
      if (dag.commits[parent]) {
        dag.commits[parent].children.push(commit.hash);
        dag.edges.push({
          from: parent,
          to: commit.hash
        });
      }
    }
  }

  // Root와 Head 식별
  for (const hash in dag.commits) {
    if (dag.commits[hash].parents.length === 0) {
      dag.roots.push(hash);
    }

    if (dag.commits[hash].children.length === 0) {
      dag.heads.push(hash);
    }
  }

  return dag;
}

/**
 * 특정 파일의 변경 히스토리 추출
 */
export function getFileHistory(repoPath, filePath, options = {}) {
  const {
    format = '%H|%ai|%s|%an'
  } = options;

  try {
    const command = `cd ${repoPath} && git log --follow --format="${format}" -- "${filePath}"`;
    const output = execSync(command, { encoding: 'utf-8' });

    const history = [];

    for (const line of output.split('\n')) {
      if (!line.trim()) continue;

      const [hash, timestamp, message, author] = line.split('|');

      history.push({
        hash: hash.substring(0, 10),
        timestamp: new Date(timestamp),
        message: message,
        author: author,
        filePath: filePath
      });
    }

    return history;
  } catch (error) {
    console.error(`Failed to get file history for ${filePath}:`, error);
    return [];
  }
}

/**
 * 키워드 기반 Commit 검색
 */
export function searchCommitsByKeyword(commits, keyword, options = {}) {
  const {
    searchFields = ['message', 'author'],
    caseSensitive = false
  } = options;

  const pattern = caseSensitive
    ? new RegExp(keyword)
    : new RegExp(keyword, 'i');

  const results = [];

  for (const commit of commits) {
    for (const field of searchFields) {
      if (commit[field] && pattern.test(commit[field])) {
        results.push(commit);
        break;
      }
    }
  }

  return results;
}

/**
 * 버전 간 변화 추적
 */
export function analyzeVersionEvolution(dag, versionFrom, versionTo) {
  const commits = Object.values(dag.commits);

  const versionFromCommit = commits.find(c =>
    c.message.toLowerCase().includes(versionFrom.toLowerCase())
  );

  const versionToCommit = commits.find(c =>
    c.message.toLowerCase().includes(versionTo.toLowerCase())
  );

  if (!versionFromCommit || !versionToCommit) {
    return {
      error: 'Version commits not found'
    };
  }

  // 두 버전 사이의 경로 찾기
  const path = findCommitPath(dag, versionFromCommit.hash, versionToCommit.hash);

  return {
    from: versionFromCommit,
    to: versionToCommit,
    path: path,
    commitCount: path.length,
    timespan: {
      start: versionFromCommit.timestamp,
      end: versionToCommit.timestamp,
      days: Math.floor(
        (versionToCommit.timestamp - versionFromCommit.timestamp) /
        (1000 * 60 * 60 * 24)
      )
    }
  };
}

/**
 * Commit 간 경로 찾기 (BFS)
 */
function findCommitPath(dag, from, to) {
  const queue = [[from]];
  const visited = new Set([from]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current === to) {
      return path;
    }

    const commit = dag.commits[current];
    if (!commit) continue;

    for (const child of commit.children) {
      if (!visited.has(child)) {
        visited.add(child);
        queue.push([...path, child]);
      }
    }
  }

  return [];
}

/**
 * Commit 통계
 */
export function getDAGStatistics(dag) {
  const commits = Object.values(dag.commits);

  if (commits.length === 0) {
    return {};
  }

  const timestamps = commits.map(c => c.timestamp);
  const earliest = new Date(Math.min(...timestamps));
  const latest = new Date(Math.max(...timestamps));

  const authorCount = new Set(commits.map(c => c.author)).size;

  return {
    totalCommits: commits.length,
    totalEdges: dag.edges.length,
    roots: dag.roots.length,
    heads: dag.heads.length,
    authors: authorCount,
    timespan: {
      start: earliest,
      end: latest,
      days: Math.floor((latest - earliest) / (1000 * 60 * 60 * 24))
    }
  };
}

/**
 * 포맷팅 (테스트용)
 */
export function formatDAGInfo(dag) {
  const stats = getDAGStatistics(dag);
  const lines = [];

  lines.push('📊 Git DAG 정보');
  lines.push(`   총 Commit: ${stats.totalCommits}개`);
  lines.push(`   엣지: ${stats.totalEdges}개`);
  lines.push(`   Root: ${stats.roots}개`);
  lines.push(`   Head: ${stats.heads}개`);
  lines.push(`   저자: ${stats.authors}명`);
  lines.push(`   기간: ${stats.timespan.days}일`);

  return lines.join('\n');
}

export default {
  extractCommitLog,
  getCommitDiff,
  getCommitRange,
  buildDAG,
  getFileHistory,
  searchCommitsByKeyword,
  analyzeVersionEvolution,
  getDAGStatistics,
  formatDAGInfo
};
