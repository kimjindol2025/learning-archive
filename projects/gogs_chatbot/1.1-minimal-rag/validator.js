/**
 * 기록 기반 응답 검증 모듈
 */

/**
 * 응답이 유효한지 검증
 */
export function validateResponse(response) {
  const validations = {
    hasContent: !!response && response.length > 0,
    hasMinimumLength: response && response.length >= 10,
    isString: typeof response === 'string',
    notErrorMessage: response && !response.toLowerCase().includes('error'),
    hasRelevantContent: checkRelevantContent(response)
  };

  return {
    isValid: Object.values(validations).every(v => v),
    validations: validations,
    score: calculateValidationScore(validations)
  };
}

/**
 * 검증 점수 계산
 */
function calculateValidationScore(validations) {
  const passed = Object.values(validations).filter(v => v).length;
  const total = Object.keys(validations).length;
  return (passed / total) * 100;
}

/**
 * 응답이 관련 콘텐츠를 포함하는지 확인
 */
function checkRelevantContent(response) {
  const relevantPatterns = [
    /코드|function|class|return|const|let|var|import|export/i,
    /프로젝트|저장소|파일|문서|설정|구성|아키텍처/i,
    /예제|예시|샘플|튜토리얼|가이드|문서/i
  ];

  return relevantPatterns.some(pattern => pattern.test(response));
}

/**
 * 검색 결과 레코드가 존재하는지 확인
 */
export function checkRecordExists(record) {
  return {
    hasFile: !!record.file,
    hasFileName: !!record.fileName,
    hasContent: !!record.line,
    hasLineNumber: !!record.lineNumber && record.lineNumber > 0,
    hasScore: !!record.score && record.score > 0,
    isComplete:
      !!record.file &&
      !!record.fileName &&
      !!record.line &&
      !!record.lineNumber &&
      record.lineNumber > 0
  };
}

/**
 * 검색 결과 목록의 무결성 확인
 */
export function validateSearchResults(results) {
  if (!Array.isArray(results)) {
    return {
      isValid: false,
      error: 'Results must be an array',
      count: 0
    };
  }

  const recordValidations = results.map(record => checkRecordExists(record));

  return {
    isValid: recordValidations.every(v => v.isComplete),
    totalRecords: results.length,
    completeRecords: recordValidations.filter(v => v.isComplete).length,
    records: recordValidations,
    completionRate: (
      recordValidations.filter(v => v.isComplete).length / results.length
    ) * 100
  };
}

/**
 * API 응답 구조 검증
 */
export function validateAPIResponse(response) {
  const validations = {
    hasStatus: response && 'status' in response,
    hasData: response && 'data' in response,
    hasTimestamp: response && 'timestamp' in response,
    statusIsValid:
      response && response.status && ['success', 'error'].includes(response.status),
    dataIsValid: response && typeof response.data === 'object'
  };

  return {
    isValid: Object.values(validations).every(v => v),
    validations: validations
  };
}

/**
 * 프롬프트와 응답의 일관성 확인
 */
export function validateConsistency(prompt, response, context) {
  const promptKeywords = extractKeywords(prompt);
  const responseKeywords = extractKeywords(response);

  const matchedKeywords = promptKeywords.filter(kw =>
    responseKeywords.includes(kw)
  );

  return {
    promptKeywords: promptKeywords,
    responseKeywords: responseKeywords,
    matchedKeywords: matchedKeywords,
    consistencyScore: (matchedKeywords.length / promptKeywords.length) * 100,
    hasContext: context && context.length > 0,
    isConsistent: matchedKeywords.length > 0 && context && context.length > 0
  };
}

/**
 * 텍스트에서 키워드 추출
 */
function extractKeywords(text) {
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'at',
    'to',
    'for',
    '이',
    '그',
    '저',
    '것',
    '수',
    '등',
    '들'
  ];

  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 10);
}

/**
 * 종합 검증 보고서
 */
export function generateValidationReport(
  query,
  results,
  response,
  context
) {
  return {
    timestamp: new Date().toISOString(),
    query: query,
    query_length: query.length,
    search_results: validateSearchResults(results),
    response_validation: validateResponse(response),
    consistency: validateConsistency(query, response, context),
    overall: {
      hasResults: results && results.length > 0,
      hasResponse: !!response,
      hasContext: context && context.length > 0,
      isValid:
        results &&
        results.length > 0 &&
        !!response &&
        validateResponse(response).isValid
    }
  };
}

export default {
  validateResponse,
  checkRecordExists,
  validateSearchResults,
  validateAPIResponse,
  validateConsistency,
  generateValidationReport
};
