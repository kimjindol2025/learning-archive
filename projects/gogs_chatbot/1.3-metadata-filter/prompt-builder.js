/**
 * 강화된 LLM 프롬프트 생성 모듈
 * 메타데이터 정보 포함 및 환각 감소
 */

/**
 * 기본 프롬프트 생성
 */
export function buildBasicPrompt(query, selectedChunks) {
  const contextStr = selectedChunks
    .map((ctx, idx) => {
      const header = `[참고 ${idx + 1}] ${ctx.fileName} - Chunk ${ctx.chunkIndex + 1}/${ctx.totalChunks}`;
      return `${header}\n${ctx.content}`;
    })
    .join('\n\n---\n\n');

  return `당신은 소프트웨어 프로젝트 기술 지원 전문가입니다.

사용자 질문: ${query}

다음은 저장소에서 검색한 관련 정보입니다:
${contextStr || '(검색 결과 없음)'}

질문에 대한 답변을 제공하고, 가능하면 저장소의 관련 정보를 참고하여 구체적인 답변을 제공해주세요.`;
}

/**
 * 버전 인식 프롬프트 생성
 */
export function buildVersionAwarePrompt(query, selectedChunks, version) {
  if (!selectedChunks || selectedChunks.length === 0) {
    return `사용자 질문: ${query}\n\n검색 결과가 없습니다.`;
  }

  const contextStr = selectedChunks
    .map((ctx, idx) => {
      const header = `[참고 ${idx + 1}] ${ctx.fileName} (${ctx.version}) - Chunk ${ctx.chunkIndex + 1}`;
      return `${header}\n${ctx.content}`;
    })
    .join('\n\n---\n\n');

  return `당신은 소프트웨어 프로젝트 버전 인식 기술 지원 전문가입니다.

사용자 질문: ${query}

⚠️ 중요 지시:
- 다음은 버전 ${version}의 기록 문서입니다.
- 반드시 이 버전의 정보에만 기반해서 답하세요.
- 다른 버전의 내용은 사용하지 마세요.
- 이 기록에 없는 정보는 "해당 정보가 없습니다"라고 명시하세요.

기록 문서:
${contextStr}

위 기록을 기반으로 질문에 답변하세요.`;
}

/**
 * Phase 단위 프롬프트 생성
 */
export function buildPhaseAwarePrompt(query, selectedChunks, phase, version) {
  if (!selectedChunks || selectedChunks.length === 0) {
    return `사용자 질문: ${query}\n\n검색 결과가 없습니다.`;
  }

  const contextStr = selectedChunks
    .map((ctx, idx) => {
      const header = `[${ctx.phase}] ${ctx.fileName} - Chunk ${ctx.chunkIndex + 1}`;
      return `${header}\n${ctx.content}`;
    })
    .join('\n\n---\n\n');

  return `당신은 소프트웨어 프로젝트 개발 단계별 기술 지원 전문가입니다.

사용자 질문: ${query}

⚠️ 분석 컨텍스트:
- 버전: ${version}
- 개발 단계: ${phase}
- 분석 범위: 이 단계의 설계 및 구현 기록

지시:
1. 이 단계의 기록에만 기반해서 답하세요.
2. 다른 단계나 버전의 내용은 사용하지 마세요.
3. 이 단계에서의 설계 결정 사항을 명확히 설명하세요.

기록:
${contextStr}

위 기록을 기반으로 질문에 답변하세요.`;
}

/**
 * 진화 비교 프롬프트 생성
 */
export function buildEvolutionComparisonPrompt(query, chunks1, chunks2, version1, version2) {
  const format1 = chunks1
    .map((ctx, idx) => `[${version1} #${idx + 1}] ${ctx.content.substring(0, 200)}...`)
    .join('\n');

  const format2 = chunks2
    .map((ctx, idx) => `[${version2} #${idx + 1}] ${ctx.content.substring(0, 200)}...`)
    .join('\n');

  return `당신은 소프트웨어 설계 진화 분석 전문가입니다.

사용자 질문: ${query}

두 버전의 설계를 비교하고 진화 과정을 분석하세요.

버전 ${version1}의 관련 내용:
${format1 || '(내용 없음)'}

버전 ${version2}의 관련 내용:
${format2 || '(내용 없음)'}

분석 포인트:
1. 두 버전의 차이점
2. 설계 철학의 변화
3. 개선 사항
4. 호환성 영향

비교 분석을 수행하세요.`;
}

/**
 * 멀티 소스 프롬프트 생성 (여러 Phase의 정보)
 */
export function buildMultiSourcePrompt(query, chunksGroupedByPhase) {
  let contextStr = '';

  for (const [phase, chunks] of Object.entries(chunksGroupedByPhase)) {
    contextStr += `\n## ${phase}\n`;
    chunks.forEach((chunk, idx) => {
      contextStr += `[${idx + 1}] ${chunk.content.substring(0, 100)}...\n`;
    });
  }

  return `당신은 소프트웨어 프로젝트 전체 아키텍처 분석 전문가입니다.

사용자 질문: ${query}

다음은 개발 단계별 관련 정보입니다:
${contextStr}

전체 개발 단계를 고려하여 통합적인 답변을 제공하세요.
각 단계에서의 설계 의도와 연계성을 설명하세요.`;
}

/**
 * 메타데이터 요약 추가 (프롬프트 헤더)
 */
export function buildMetadataHeader(filters, selectedChunks) {
  const lines = [];

  lines.push('=== 검색 컨텍스트 ===');

  if (filters.repo) {
    lines.push(`저장소: ${filters.repo}`);
  }

  if (filters.version) {
    lines.push(`버전: ${filters.version}`);
  }

  if (filters.phase) {
    lines.push(`개발 단계: ${filters.phase}`);
  }

  lines.push(`선택된 문서: ${selectedChunks.length}개`);

  if (selectedChunks.length > 0) {
    const files = new Set(selectedChunks.map(c => c.fileName));
    lines.push(`파일: ${Array.from(files).join(', ')}`);
  }

  lines.push('===================\n');

  return lines.join('\n');
}

/**
 * 프롬프트 생성 (모든 정보 포함)
 */
export function buildComprehensivePrompt(options) {
  const {
    query,
    selectedChunks = [],
    filters = {},
    mode = 'default',
    includeMetadata = true
  } = options;

  let prompt = '';

  // 메타데이터 헤더 추가
  if (includeMetadata && Object.keys(filters).length > 0) {
    prompt += buildMetadataHeader(filters, selectedChunks);
  }

  // 모드별 프롬프트 생성
  if (mode === 'version-aware' && filters.version) {
    prompt += buildVersionAwarePrompt(query, selectedChunks, filters.version);
  } else if (mode === 'phase-aware' && filters.phase) {
    prompt += buildPhaseAwarePrompt(
      query,
      selectedChunks,
      filters.phase,
      filters.version || 'unknown'
    );
  } else {
    prompt += buildBasicPrompt(query, selectedChunks);
  }

  return prompt;
}

/**
 * 프롬프트 검증
 */
export function validatePrompt(prompt) {
  const validations = {
    hasContent: !!prompt && prompt.length > 0,
    minLength: prompt && prompt.length >= 50,
    hasInstructions: prompt && prompt.includes('질문') || prompt.includes('question'),
    hasContext: prompt && (prompt.includes('참고') || prompt.includes('기록') || prompt.includes('내용')),
    hasWarnings: prompt && prompt.includes('⚠️')
  };

  return {
    isValid: validations.hasContent && validations.minLength,
    validations: validations,
    length: prompt ? prompt.length : 0
  };
}

/**
 * 프롬프트 포맷팅 (출력용)
 */
export function formatPrompt(prompt) {
  const lines = [];
  lines.push('\n' + '='.repeat(60));
  lines.push('📝 LLM 프롬프트');
  lines.push('='.repeat(60));
  lines.push(prompt);
  lines.push('='.repeat(60) + '\n');

  return lines.join('\n');
}

export default {
  buildBasicPrompt,
  buildVersionAwarePrompt,
  buildPhaseAwarePrompt,
  buildEvolutionComparisonPrompt,
  buildMultiSourcePrompt,
  buildMetadataHeader,
  buildComprehensivePrompt,
  validatePrompt,
  formatPrompt
};
