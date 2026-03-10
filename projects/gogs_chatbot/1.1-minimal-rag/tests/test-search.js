import search from '../search.js';
import validator from '../validator.js';

console.log('\n🧪 검색 및 검증 테스트 시작\n');

// 테스트 데이터
const testContent = `
# Project Documentation

## Installation
To install the project, run:
\`\`\`bash
npm install
\`\`\`

## Usage
Use the CLI tool to start the server:
\`\`\`bash
npm start
\`\`\`

## Configuration
Set the following environment variables:
- GOGS_API_URL: Your Gogs API URL
- GOGS_TOKEN: Your Gogs API token
- CLAUDE_API_KEY: Your Claude API key

## Testing
Run tests with:
\`\`\`bash
npm test
\`\`\`

## API Endpoints
- POST /chat - Chat with the bot
- GET /search - Search in repository
- GET /cache - View cache status

## Features
- Keyword-based search
- Claude AI integration
- Gogs repository support
- Response validation
- Caching system
`;

const testFiles = [
  {
    path: 'README.md',
    name: 'README.md',
    content: testContent,
    size: testContent.length
  },
  {
    path: 'docs/guide.md',
    name: 'guide.md',
    content: 'Installation guide content...\nNpm usage instructions...',
    size: 50
  },
  {
    path: 'src/server.js',
    name: 'server.js',
    content: 'const express = require("express");\nconst app = express();',
    size: 60
  }
];

/**
 * 테스트 1: 콘텐츠에서 키워드 검색
 */
function testSearchInContent() {
  console.log('📝 테스트 1: 콘텐츠에서 키워드 검색');

  const results = search.searchInContent(testContent, 'install');

  console.log('✅ 성공');
  console.log(`   찾은 라인: ${results.length}개`);

  results.slice(0, 2).forEach(r => {
    console.log(`   - L${r.lineNumber}: ${r.content.substring(0, 50)}`);
  });
}

/**
 * 테스트 2: 여러 파일에서 검색
 */
function testSearchInFiles() {
  console.log('\n📝 테스트 2: 여러 파일에서 검색');

  const results = search.searchInFiles(testFiles, 'npm');

  console.log('✅ 성공');
  console.log(`   매치된 파일: ${results.length}개`);

  results.forEach(r => {
    console.log(`   - ${r.fileName} (${r.matchCount}개 매치)`);
  });
}

/**
 * 테스트 3: 검색 결과 순위 지정
 */
function testRankResults() {
  console.log('\n📝 테스트 3: 검색 결과 순위 지정');

  const results = search.searchInFiles(testFiles, 'api');
  const ranked = search.rankResults(results);

  console.log('✅ 성공');
  console.log('   순위별 결과:');

  ranked.forEach((r, idx) => {
    console.log(`   ${idx + 1}. ${r.fileName} (점수: ${r.score})`);
  });
}

/**
 * 테스트 4: 미리보기 추출
 */
function testExtractPreview() {
  console.log('\n📝 테스트 4: 미리보기 추출');

  const preview = search.extractPreview(testContent, 'npm', 100);

  console.log('✅ 성공');
  console.log(`   미리보기: "${preview}"`);
}

/**
 * 테스트 5: 포맷된 결과 출력
 */
function testFormatSearchResults() {
  console.log('\n📝 테스트 5: 포맷된 검색 결과');

  const results = search.searchInFiles(testFiles, 'install');
  const formatted = search.formatSearchResults(results, 3);

  console.log('✅ 성공');
  console.log('   포맷된 결과:');
  console.log(formatted);
}

/**
 * 테스트 6: 콘텍스트 추출
 */
function testExtractContext() {
  console.log('\n📝 테스트 6: 콘텍스트 추출');

  const searchResults = search.searchInFiles(testFiles, 'npm');
  const context = search.extractContext(searchResults, 3);

  console.log('✅ 성공');
  console.log(`   추출된 콘텍스트: ${context.length}개`);

  context.forEach((ctx, idx) => {
    console.log(
      `   ${idx + 1}. ${ctx.fileName} (L${ctx.lineNumber}): ${ctx.line.substring(0, 40)}...`
    );
  });
}

/**
 * 테스트 7: 응답 검증
 */
function testValidateResponse() {
  console.log('\n📝 테스트 7: 응답 검증');

  const validResponse =
    '이 프로젝트는 Gogs 저장소와 Claude AI를 통합한 챗봇입니다.';
  const invalidResponse = '';

  const valid = validator.validateResponse(validResponse);
  const invalid = validator.validateResponse(invalidResponse);

  console.log('✅ 성공');
  console.log(`   유효한 응답: ${valid.isValid ? '✅' : '❌'} (점수: ${valid.score.toFixed(1)}%)`);
  console.log(`   빈 응답: ${invalid.isValid ? '✅' : '❌'} (점수: ${invalid.score.toFixed(1)}%)`);
}

/**
 * 테스트 8: 검색 결과 검증
 */
function testValidateSearchResults() {
  console.log('\n📝 테스트 8: 검색 결과 검증');

  const results = search.searchInFiles(testFiles, 'npm');
  const validation = validator.validateSearchResults(results);

  console.log('✅ 성공');
  console.log(`   총 레코드: ${validation.totalRecords}개`);
  console.log(`   완전한 레코드: ${validation.completeRecords}개`);
  console.log(`   완성도: ${validation.completionRate.toFixed(1)}%`);
}

/**
 * 테스트 9: 일관성 검증
 */
function testValidateConsistency() {
  console.log('\n📝 테스트 9: 일관성 검증');

  const prompt = 'npm 설치 방법을 알려주세요';
  const response = 'npm install 명령으로 설치할 수 있습니다';
  const context = [
    {
      file: 'README.md',
      fileName: 'README.md',
      line: 'npm install',
      lineNumber: 5,
      score: 10
    }
  ];

  const consistency = validator.validateConsistency(prompt, response, context);

  console.log('✅ 성공');
  console.log(`   프롬프트 키워드: ${consistency.promptKeywords.join(', ')}`);
  console.log(`   응답 키워드: ${consistency.responseKeywords.join(', ')}`);
  console.log(`   매치된 키워드: ${consistency.matchedKeywords.join(', ')}`);
  console.log(`   일관성 점수: ${consistency.consistencyScore.toFixed(1)}%`);
}

/**
 * 테스트 10: 종합 검증 보고서
 */
function testGenerateValidationReport() {
  console.log('\n📝 테스트 10: 종합 검증 보고서');

  const query = 'npm install 방법';
  const results = search.searchInFiles(testFiles, 'npm');
  const response = '프로젝트를 설치하려면 npm install을 실행하세요.';
  const context = search.extractContext(results, 2);

  const report = validator.generateValidationReport(
    query,
    results,
    response,
    context
  );

  console.log('✅ 성공');
  console.log(`   전체 유효: ${report.overall.isValid ? '✅' : '❌'}`);
  console.log(`   검색 결과: ${report.search_results.totalRecords}개`);
  console.log(`   응답 점수: ${report.response_validation.score.toFixed(1)}%`);
  console.log(`   일관성: ${report.consistency.isConsistent ? '✅' : '❌'}`);
}

/**
 * 모든 테스트 실행
 */
function runAllTests() {
  testSearchInContent();
  testSearchInFiles();
  testRankResults();
  testExtractPreview();
  testFormatSearchResults();
  testExtractContext();
  testValidateResponse();
  testValidateSearchResults();
  testValidateConsistency();
  testGenerateValidationReport();

  console.log('\n✨ 모든 테스트 완료\n');
}

// 테스트 실행
runAllTests();
