/**
 * Diff 분석 모듈
 * 변화 추적 및 요약
 */

/**
 * Diff 라인 파싱
 */
export function parseDiffLines(diffText) {
  const lines = diffText.split('\n');
  const files = [];
  let currentFile = null;
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        currentFile.additions = additions;
        currentFile.deletions = deletions;
        files.push(currentFile);
      }

      const match = line.match(/a\/(.*)\s+b\/(.*)/);
      if (match) {
        currentFile = {
          path: match[2],
          status: 'modified',
          additions: 0,
          deletions: 0,
          changes: []
        };
        additions = 0;
        deletions = 0;
      }
    } else if (line.startsWith('+++')) {
      // 새 파일
      currentFile.status = 'added';
    } else if (line.startsWith('---')) {
      // 삭제된 파일
      if (currentFile && currentFile.path === '/dev/null') {
        currentFile.status = 'deleted';
      }
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  if (currentFile) {
    currentFile.additions = additions;
    currentFile.deletions = deletions;
    files.push(currentFile);
  }

  return files;
}

/**
 * 파일별 변화 통계
 */
export function calculateFileStats(files) {
  const stats = {
    totalFiles: files.length,
    added: files.filter(f => f.status === 'added').length,
    deleted: files.filter(f => f.status === 'deleted').length,
    modified: files.filter(f => f.status === 'modified').length,
    totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
    totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
    netChange: 0
  };

  stats.netChange = stats.totalAdditions - stats.totalDeletions;

  return stats;
}

/**
 * 변화 강도 분석 (큰 변화 감지)
 */
export function detectMajorChanges(files, threshold = 50) {
  const majorChanges = [];

  for (const file of files) {
    const totalChange = file.additions + file.deletions;

    if (totalChange >= threshold) {
      majorChanges.push({
        path: file.path,
        status: file.status,
        change: totalChange,
        ratio: file.additions / (file.additions + file.deletions + 1)
      });
    }
  }

  return majorChanges.sort((a, b) => b.change - a.change);
}

/**
 * 파일 타입별 변화 분류
 */
export function classifyByFileType(files) {
  const classified = {
    code: [],
    documentation: [],
    tests: [],
    config: [],
    other: []
  };

  for (const file of files) {
    const path = file.path.toLowerCase();

    if (/\.(rs|ts|js|py|go|c|cpp|h)$/.test(path)) {
      classified.code.push(file);
    } else if (/\.(md|txt|rst|adoc)$/.test(path)) {
      classified.documentation.push(file);
    } else if (/test|spec/.test(path)) {
      classified.tests.push(file);
    } else if (/\.(json|yml|yaml|toml|cfg|conf)$/.test(path)) {
      classified.config.push(file);
    } else {
      classified.other.push(file);
    }
  }

  return classified;
}

/**
 * 특정 개념의 변화 추적
 */
export function trackConceptEvolution(files, conceptKeywords) {
  const related = [];

  for (const file of files) {
    const path = file.path.toLowerCase();
    const content = path; // 실제 환경에서는 diff 내용도 분석

    for (const keyword of conceptKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        related.push({
          file: file,
          keyword: keyword,
          change: file.additions + file.deletions
        });
        break;
      }
    }
  }

  return related;
}

/**
 * 커밋 간 누적 변화 분석
 */
export function accumulateDifferences(diffSequence) {
  const accumulated = {
    totalFiles: 0,
    totalAdditions: 0,
    totalDeletions: 0,
    fileHistory: {},
    evolution: []
  };

  for (let i = 0; i < diffSequence.length; i++) {
    const diff = diffSequence[i];
    const stats = calculateFileStats(diff.files);

    accumulated.totalFiles += stats.totalFiles;
    accumulated.totalAdditions += stats.totalAdditions;
    accumulated.totalDeletions += stats.totalDeletions;

    for (const file of diff.files) {
      if (!accumulated.fileHistory[file.path]) {
        accumulated.fileHistory[file.path] = [];
      }

      accumulated.fileHistory[file.path].push({
        commit: i,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions
      });
    }

    accumulated.evolution.push({
      stage: i,
      stats: stats
    });
  }

  return accumulated;
}

/**
 * 변화 패턴 감지
 */
export function detectChangePatterns(fileHistory) {
  const patterns = {
    newFeature: [],      // 새로운 파일 추가
    refactoring: [],     // 큰 변화
    expansion: [],       // 지속적 성장
    stabilization: []    // 변화 감소
  };

  for (const [filePath, changes] of Object.entries(fileHistory)) {
    if (changes.length === 0) continue;

    const firstChange = changes[0];
    const lastChange = changes[changes.length - 1];

    if (firstChange.status === 'added') {
      patterns.newFeature.push(filePath);
    }

    const totalChange = changes.reduce((sum, c) => sum + c.additions + c.deletions, 0);
    if (totalChange > 500) {
      patterns.refactoring.push(filePath);
    }

    // 지속적 성장 감지
    const trendAdditions = changes.map(c => c.additions);
    if (trendAdditions.filter(a => a > 0).length > changes.length * 0.7) {
      patterns.expansion.push(filePath);
    }

    // 안정화 감지 (최근 변화 감소)
    if (changes.length > 3) {
      const recent = changes.slice(-3);
      const older = changes.slice(-6, -3);

      const recentChange = recent.reduce((sum, c) => sum + c.additions + c.deletions, 0);
      const olderChange = older.length > 0
        ? older.reduce((sum, c) => sum + c.additions + c.deletions, 0)
        : 1;

      if (recentChange < olderChange * 0.5) {
        patterns.stabilization.push(filePath);
      }
    }
  }

  return patterns;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatDiffAnalysis(stats) {
  const lines = [];

  lines.push('📊 Diff 분석');
  lines.push(`   파일 수: ${stats.totalFiles}개`);
  lines.push(`   추가: +${stats.totalAdditions}줄`);
  lines.push(`   삭제: -${stats.totalDeletions}줄`);
  lines.push(`   순변화: ${stats.netChange > 0 ? '+' : ''}${stats.netChange}줄`);

  return lines.join('\n');
}

export default {
  parseDiffLines,
  calculateFileStats,
  detectMajorChanges,
  classifyByFileType,
  trackConceptEvolution,
  accumulateDifferences,
  detectChangePatterns,
  formatDiffAnalysis
};
