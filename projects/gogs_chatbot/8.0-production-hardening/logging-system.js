/**
 * 로깅 시스템
 * 재현성 확보를 위한 완전한 추적 체계
 */

/**
 * 검색 세션 로그
 */
export class SearchSessionLogger {
  constructor(sessionId = null) {
    this.sessionId = sessionId || generateSessionId();
    this.startTime = new Date();
    this.entries = [];
    this.endTime = null;
    this.resultSummary = null;
  }

  /**
   * 쿼리 로깅
   */
  logQuery(query, options = {}) {
    this.entries.push({
      type: 'QUERY',
      timestamp: new Date(),
      query,
      options,
      position: this.entries.length
    });
  }

  /**
   * 검색 결과 로깅
   */
  logSearchResults(results, metadata = {}) {
    this.entries.push({
      type: 'SEARCH_RESULTS',
      timestamp: new Date(),
      resultCount: results.length,
      topResults: results.slice(0, 5).map(r => ({
        commitHash: r.commitHash,
        score: r.score,
        source: r.source
      })),
      metadata,
      position: this.entries.length
    });
  }

  /**
   * 필터 적용 로깅
   */
  logFilterApplied(filterName, filterParams, affectedCount) {
    this.entries.push({
      type: 'FILTER_APPLIED',
      timestamp: new Date(),
      filterName,
      filterParams,
      affectedResults: affectedCount,
      position: this.entries.length
    });
  }

  /**
   * 프롬프트 로깅
   */
  logPrompt(systemPrompt, userPrompt, promptVersion) {
    this.entries.push({
      type: 'PROMPT_USED',
      timestamp: new Date(),
      systemPromptHash: hashString(systemPrompt),
      systemPromptVersion: promptVersion,
      userPromptLength: userPrompt.length,
      userPromptHash: hashString(userPrompt),
      position: this.entries.length
    });
  }

  /**
   * LLM 응답 로깅
   */
  logLLMResponse(response, model, temperature, tokens) {
    this.entries.push({
      type: 'LLM_RESPONSE',
      timestamp: new Date(),
      model,
      temperature,
      responseLength: response.length,
      responseHash: hashString(response),
      tokensUsed: tokens,
      position: this.entries.length
    });
  }

  /**
   * 메타데이터 로깅
   */
  logMetadata(metadataUsed) {
    this.entries.push({
      type: 'METADATA_USED',
      timestamp: new Date(),
      fields: Object.keys(metadataUsed),
      schema: metadataUsed,
      position: this.entries.length
    });
  }

  /**
   * 오류 로깅
   */
  logError(errorType, errorMessage, errorContext = {}) {
    this.entries.push({
      type: 'ERROR',
      timestamp: new Date(),
      errorType,
      errorMessage,
      errorContext,
      position: this.entries.length
    });
  }

  /**
   * 세션 종료 및 요약
   */
  closeSession(finalResult) {
    this.endTime = new Date();
    this.resultSummary = {
      success: finalResult.success,
      duration: this.endTime - this.startTime,
      totalEntries: this.entries.length,
      resultHash: hashString(JSON.stringify(finalResult))
    };

    return this.generateReport();
  }

  /**
   * 세션 리포트 생성
   */
  generateReport() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.resultSummary?.duration || null,
      entries: this.entries,
      summary: this.resultSummary,
      reproducibilityKey: generateReproducibilityKey(this)
    };
  }
}

/**
 * 재현성 키 생성
 */
export function generateReproducibilityKey(session) {
  const components = [
    session.sessionId,
    session.startTime.toISOString(),
    hashString(JSON.stringify(session.entries))
  ];

  return components.join(':');
}

/**
 * 커밋 추적 로거
 */
export class CommitTrackingLogger {
  constructor(queryId) {
    this.queryId = queryId;
    this.commits = [];
  }

  /**
   * 커밋 추가
   */
  addCommit(commitHash, commitMessage, relevanceScore, source) {
    this.commits.push({
      hash: commitHash,
      message: commitMessage,
      score: relevanceScore,
      source, // BM25, VECTOR, etc.
      timestamp: new Date(),
      position: this.commits.length
    });
  }

  /**
   * 커밋 순서 변경 로깅 (재정렬)
   */
  logReranking(originalOrder, newOrder) {
    return {
      queryId: this.queryId,
      originalRanking: originalOrder,
      newRanking: newOrder,
      changes: calculateRankingChanges(originalOrder, newOrder),
      timestamp: new Date()
    };
  }

  /**
   * 최종 커밋 목록
   */
  getFinalCommitList() {
    return this.commits.map(c => ({
      hash: c.hash,
      message: c.message,
      score: c.score,
      source: c.source
    }));
  }
}

/**
 * 인덱스 버전 로거
 */
export class IndexVersionLogger {
  constructor() {
    this.versions = [];
  }

  /**
   * 인덱스 버전 기록
   */
  recordIndexVersion(indexName, version, commitCount, timestamp) {
    this.versions.push({
      indexName,
      version,
      commitCount,
      builtAt: timestamp || new Date(),
      hash: generateIndexHash(indexName, version, commitCount)
    });
  }

  /**
   * 현재 활성 버전
   */
  getCurrentVersions() {
    const current = {};
    for (const version of this.versions) {
      current[version.indexName] = version;
    }
    return current;
  }

  /**
   * 버전 호환성 확인
   */
  validateVersionCompatibility() {
    if (this.versions.length < 2) return true;

    const latest = this.versions[this.versions.length - 1];
    const previous = this.versions[this.versions.length - 2];

    // 같은 인덱스의 연속된 버전이어야 함
    return latest.indexName === previous.indexName;
  }
}

/**
 * 프롬프트 버전 관리
 */
export class PromptVersionManager {
  constructor() {
    this.versions = [];
    this.activeVersion = null;
  }

  /**
   * 프롬프트 버전 등록
   */
  registerPrompt(name, systemPrompt, userPromptTemplate, version) {
    const versionEntry = {
      name,
      version,
      systemPromptHash: hashString(systemPrompt),
      templateHash: hashString(userPromptTemplate),
      registeredAt: new Date(),
      active: false,
      changeLog: null
    };

    this.versions.push(versionEntry);
    return versionEntry;
  }

  /**
   * 프롬프트 활성화
   */
  activatePrompt(version) {
    for (const v of this.versions) {
      v.active = v.version === version;
    }
    this.activeVersion = version;

    return {
      activated: version,
      timestamp: new Date()
    };
  }

  /**
   * 버전 호환성 확인
   */
  validatePromptVersion(version) {
    const found = this.versions.find(v => v.version === version);
    return {
      exists: !!found,
      active: found?.active || false,
      version
    };
  }
}

/**
 * 유틸리티: 문자열 해싱
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * 유틸리티: 세션 ID 생성
 */
function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 유틸리티: 순위 변경 계산
 */
function calculateRankingChanges(original, newRanking) {
  const changes = [];
  for (let i = 0; i < Math.min(original.length, newRanking.length); i++) {
    if (original[i] !== newRanking[i]) {
      changes.push({
        position: i,
        from: original[i],
        to: newRanking[i]
      });
    }
  }
  return changes;
}

/**
 * 유틸리티: 인덱스 해시 생성
 */
function generateIndexHash(name, version, count) {
  const components = [name, version, count, Date.now()];
  return hashString(components.join(':'));
}

/**
 * 통합 로깅 서비스
 */
export class UnifiedLogger {
  constructor() {
    this.sessions = {};
    this.commitTracking = {};
    this.indexVersionLog = new IndexVersionLogger();
    this.promptVersionManager = new PromptVersionManager();
  }

  /**
   * 새 검색 세션 시작
   */
  startSearchSession(sessionId = null) {
    const session = new SearchSessionLogger(sessionId);
    this.sessions[session.sessionId] = session;
    return session;
  }

  /**
   * 세션 종료 및 저장
   */
  closeSession(sessionId, finalResult) {
    const session = this.sessions[sessionId];
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const report = session.closeSession(finalResult);
    delete this.sessions[sessionId];
    return report;
  }

  /**
   * 전체 로그 통계
   */
  getLogStatistics() {
    return {
      totalSessions: Object.keys(this.sessions).length,
      activeSessions: Object.keys(this.sessions).filter(id => this.sessions[id].endTime === null).length,
      indexVersions: this.indexVersionLog.versions.length,
      promptVersions: this.promptVersionManager.versions.length,
      timestamp: new Date()
    };
  }
}

/**
 * 포맷팅 (테스트용)
 */
export function formatSessionLog(session) {
  const lines = [];

  lines.push('📋 검색 세션 로그');
  lines.push(`   세션 ID: ${session.sessionId}`);
  lines.push(`   시작: ${session.startTime}`);
  lines.push(`   종료: ${session.endTime}`);
  lines.push(`   항목 수: ${session.entries.length}`);

  lines.push('\n   이벤트 타입:');
  const types = new Set(session.entries.map(e => e.type));
  for (const type of types) {
    const count = session.entries.filter(e => e.type === type).length;
    lines.push(`     - ${type}: ${count}`);
  }

  return lines.join('\n');
}

export default {
  SearchSessionLogger,
  CommitTrackingLogger,
  IndexVersionLogger,
  PromptVersionManager,
  UnifiedLogger,
  generateReproducibilityKey,
  formatSessionLog
};
