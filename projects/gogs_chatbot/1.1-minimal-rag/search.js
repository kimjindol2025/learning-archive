/**
 * 키워드 기반 검색 모듈
 * 정규식과 스코어링을 사용한 단순 검색
 */

/**
 * 콘텐츠에서 키워드 검색
 */
export function searchInContent(content, keyword) {
  if (!content || !keyword) return [];

  const lines = content.split('\n');
  const results = [];
  const regex = new RegExp(keyword, 'gi');

  lines.forEach((line, index) => {
    if (regex.test(line)) {
      results.push({
        lineNumber: index + 1,
        content: line.trim(),
        matches: (line.match(new RegExp(keyword, 'gi')) || []).length
      });
    }
  });

  return results;
}

/**
 * 여러 파일에서 검색
 */
export function searchInFiles(files, keyword) {
  const allResults = [];

  files.forEach(file => {
    const matches = searchInContent(file.content, keyword);

    if (matches.length > 0) {
      allResults.push({
        file: file.path,
        fileName: file.name,
        matchCount: matches.length,
        matches: matches,
        preview: extractPreview(file.content, keyword, 200)
      });
    }
  });

  return allResults;
}

/**
 * 검색 결과 순위 지정
 */
export function rankResults(results) {
  return results
    .map(result => ({
      ...result,
      score: calculateScore(result)
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 결과 스코어 계산
 */
function calculateScore(result) {
  let score = 0;

  // 파일 이름에 키워드가 있으면 높은 점수
  if (result.fileName && result.fileName.toLowerCase().includes('readme')) {
    score += 50;
  }

  // 매치 수에 따른 점수
  score += result.matchCount * 10;

  // 첫 번째 매치가 빠를수록 높은 점수
  if (result.matches.length > 0) {
    const firstLineNumber = result.matches[0].lineNumber;
    score += Math.max(0, 100 - firstLineNumber);
  }

  return score;
}

/**
 * 콘텐츠 미리보기 추출
 */
export function extractPreview(content, keyword, maxLength = 200) {
  const regex = new RegExp(`([^.!?]*${keyword}[^.!?]*)`, 'gi');
  const match = content.match(regex);

  if (!match) return content.substring(0, maxLength) + '...';

  const preview = match[0].substring(0, maxLength);
  return preview + (preview.length === maxLength ? '...' : '');
}

/**
 * 검색 결과를 포맷된 문자열로 변환
 */
export function formatSearchResults(results, limit = 5) {
  if (results.length === 0) {
    return '검색 결과가 없습니다.';
  }

  const ranked = rankResults(results);
  const topResults = ranked.slice(0, limit);

  return topResults
    .map((result, index) => {
      const header = `📄 ${index + 1}. ${result.fileName} (${result.matchCount}개 매치)`;
      const matchLines = result.matches
        .slice(0, 3)
        .map(m => `   L${m.lineNumber}: ${m.content}`)
        .join('\n');
      const preview = `   미리보기: ${result.preview}`;

      return [header, matchLines, preview].join('\n');
    })
    .join('\n\n');
}

/**
 * 검색 결과에서 콘텍스트 추출
 */
export function extractContext(searchResults, contextLength = 3) {
  const contexts = [];

  searchResults.forEach(result => {
    result.matches.forEach(match => {
      contexts.push({
        file: result.file,
        fileName: result.fileName,
        line: match.content,
        lineNumber: match.lineNumber,
        score: match.matches
      });
    });
  });

  return contexts.slice(0, contextLength);
}

export default {
  searchInContent,
  searchInFiles,
  rankResults,
  extractPreview,
  formatSearchResults,
  extractContext
};
