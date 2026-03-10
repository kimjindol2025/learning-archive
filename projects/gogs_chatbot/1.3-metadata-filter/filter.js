/**
 * 메타데이터 기반 필터링 모듈
 * 버전, Phase, Repo 등으로 검색 공간 축소
 */

/**
 * 기본 필터링
 */
export function filterChunks(chunks, filters = {}) {
  let filtered = chunks;

  if (filters.repo) {
    filtered = filtered.filter(c => c.repo === filters.repo);
  }

  if (filters.version) {
    filtered = filtered.filter(c => c.version === filters.version);
  }

  if (filters.phase) {
    filtered = filtered.filter(c => c.phase === filters.phase);
  }

  if (filters.filePath) {
    filtered = filtered.filter(c => c.filePath === filters.filePath);
  }

  return filtered;
}

/**
 * 다중 버전 필터링
 */
export function filterByVersions(chunks, versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return chunks;
  }

  return chunks.filter(c => versions.includes(c.version));
}

/**
 * 다중 Phase 필터링
 */
export function filterByPhases(chunks, phases) {
  if (!Array.isArray(phases) || phases.length === 0) {
    return chunks;
  }

  return chunks.filter(c => phases.includes(c.phase));
}

/**
 * 버전 범위 필터링 (예: v1.0 ~ v2.0)
 */
export function filterByVersionRange(chunks, minVersion, maxVersion) {
  const parseVersion = (v) => {
    const parts = v.replace(/v/i, '').split('.');
    return parts.map(p => parseInt(p) || 0);
  };

  const min = parseVersion(minVersion);
  const max = parseVersion(maxVersion);

  return chunks.filter(c => {
    const v = parseVersion(c.version);

    // 최소값 비교
    for (let i = 0; i < Math.max(min.length, v.length); i++) {
      if ((v[i] || 0) < (min[i] || 0)) return false;
    }

    // 최대값 비교
    for (let i = 0; i < Math.max(max.length, v.length); i++) {
      if ((v[i] || 0) > (max[i] || 0)) return false;
    }

    return true;
  });
}

/**
 * 복합 필터링 (AND 조건)
 */
export function filterByMultipleCriteria(chunks, criteria) {
  let filtered = chunks;

  // Repo
  if (criteria.repo) {
    filtered = filtered.filter(c => c.repo === criteria.repo);
  }

  // Version (단일 또는 범위)
  if (criteria.version) {
    filtered = filtered.filter(c => c.version === criteria.version);
  } else if (criteria.versionRange) {
    filtered = filterByVersionRange(
      filtered,
      criteria.versionRange.min,
      criteria.versionRange.max
    );
  } else if (criteria.versions && Array.isArray(criteria.versions)) {
    filtered = filterByVersions(filtered, criteria.versions);
  }

  // Phase (단일 또는 복수)
  if (criteria.phase) {
    filtered = filtered.filter(c => c.phase === criteria.phase);
  } else if (criteria.phases && Array.isArray(criteria.phases)) {
    filtered = filterByPhases(filtered, criteria.phases);
  }

  // File path (포함 검색)
  if (criteria.filePath) {
    filtered = filtered.filter(c => c.filePath.includes(criteria.filePath));
  }

  // Chunk 크기 범위
  if (criteria.sizeRange) {
    filtered = filtered.filter(c =>
      c.size >= (criteria.sizeRange.min || 0) &&
      c.size <= (criteria.sizeRange.max || Infinity)
    );
  }

  // 단어 수 범위
  if (criteria.wordRange) {
    filtered = filtered.filter(c =>
      c.wordCount >= (criteria.wordRange.min || 0) &&
      c.wordCount <= (criteria.wordRange.max || Infinity)
    );
  }

  return filtered;
}

/**
 * 필터링 통계
 */
export function getFilterStatistics(allChunks, filters) {
  const filtered = filterChunks(allChunks, filters);

  const stats = {
    applied: filters,
    totalChunks: allChunks.length,
    filteredChunks: filtered.length,
    reductionRate: ((1 - filtered.length / allChunks.length) * 100).toFixed(1),
    remainingPercentage: ((filtered.length / allChunks.length) * 100).toFixed(1)
  };

  // 필터별 분석
  if (filters.repo) {
    const repoOnly = allChunks.filter(c => c.repo === filters.repo);
    stats.byRepo = repoOnly.length;
  }

  if (filters.version) {
    const versionOnly = allChunks.filter(c => c.version === filters.version);
    stats.byVersion = versionOnly.length;
  }

  if (filters.phase) {
    const phaseOnly = allChunks.filter(c => c.phase === filters.phase);
    stats.byPhase = phaseOnly.length;
  }

  return stats;
}

/**
 * 사용 가능한 메타데이터 옵션 조회
 */
export function getAvailableMetadata(chunks) {
  const repos = new Set();
  const versions = new Set();
  const phases = new Set();
  const files = new Set();

  for (const chunk of chunks) {
    repos.add(chunk.repo);
    versions.add(chunk.version);
    phases.add(chunk.phase);
    files.add(chunk.filePath);
  }

  return {
    repos: Array.from(repos).sort(),
    versions: Array.from(versions).sort(),
    phases: Array.from(phases).sort(),
    files: Array.from(files).sort(),
    totalRepos: repos.size,
    totalVersions: versions.size,
    totalPhases: phases.size,
    totalFiles: files.size
  };
}

/**
 * 필터 유효성 검증
 */
export function validateFilters(filters, availableMetadata) {
  const errors = [];
  const warnings = [];

  if (filters.repo && !availableMetadata.repos.includes(filters.repo)) {
    errors.push(`Repo '${filters.repo}' not found`);
  }

  if (filters.version && !availableMetadata.versions.includes(filters.version)) {
    warnings.push(`Version '${filters.version}' may not exist in selected repo`);
  }

  if (filters.phase && !availableMetadata.phases.includes(filters.phase)) {
    warnings.push(`Phase '${filters.phase}' may not exist in selected repo`);
  }

  if (filters.filePath && !availableMetadata.files.some(f => f.includes(filters.filePath))) {
    warnings.push(`File matching '${filters.filePath}' not found`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

/**
 * 필터링 결과 포맷팅
 */
export function formatFilterResults(allChunks, filteredChunks, filters) {
  const stats = getFilterStatistics(allChunks, filters);

  const lines = [];
  lines.push(`\n🔍 필터링 결과`);
  lines.push(`═══════════════════════════════`);

  if (Object.keys(filters).length > 0) {
    lines.push(`📋 적용된 필터:`);
    Object.entries(filters).forEach(([key, value]) => {
      lines.push(`   - ${key}: ${value}`);
    });
  } else {
    lines.push(`📋 필터: 없음 (전체 검색)`);
  }

  lines.push(`\n📊 결과:`);
  lines.push(`   전체 Chunk: ${stats.totalChunks}개`);
  lines.push(`   필터된 Chunk: ${stats.filteredChunks}개`);
  lines.push(`   감소율: ${stats.reductionRate}%`);
  lines.push(`   남은 비율: ${stats.remainingPercentage}%\n`);

  return lines.join('\n');
}

/**
 * 진화 비교 모드: 두 버전의 Chunk 추출
 */
export function extractVersionComparison(chunks, version1, version2) {
  const v1Chunks = chunks.filter(c => c.version === version1);
  const v2Chunks = chunks.filter(c => c.version === version2);

  return {
    version1: {
      version: version1,
      chunkCount: v1Chunks.length,
      files: new Set(v1Chunks.map(c => c.filePath)).size,
      chunks: v1Chunks
    },
    version2: {
      version: version2,
      chunkCount: v2Chunks.length,
      files: new Set(v2Chunks.map(c => c.filePath)).size,
      chunks: v2Chunks
    },
    diff: {
      chunkCountDiff: v2Chunks.length - v1Chunks.length,
      fileCountDiff: new Set(v2Chunks.map(c => c.filePath)).size -
                     new Set(v1Chunks.map(c => c.filePath)).size
    }
  };
}

export default {
  filterChunks,
  filterByVersions,
  filterByPhases,
  filterByVersionRange,
  filterByMultipleCriteria,
  getFilterStatistics,
  getAvailableMetadata,
  validateFilters,
  formatFilterResults,
  extractVersionComparison
};
