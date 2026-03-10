import filter from '../filter.js';
import search from '../search-enhanced.js';
import prompt from '../prompt-builder.js';

console.log('\n🧪 메타데이터 필터링 테스트 시작\n');

// 테스트 데이터
const testChunks = [
  // 저장소 1, 버전 1.0
  {
    repo: 'freelang-v6',
    filePath: 'docs/spec.md',
    fileName: 'spec.md',
    version: 'v1.0',
    phase: 'Phase 1',
    chunkIndex: 0,
    totalChunks: 3,
    content: 'Version 1.0 specification document',
    size: 500,
    wordCount: 6
  },
  {
    repo: 'freelang-v6',
    filePath: 'docs/spec.md',
    fileName: 'spec.md',
    version: 'v1.0',
    phase: 'Phase 1',
    chunkIndex: 1,
    totalChunks: 3,
    content: 'Memory model in version 1.0',
    size: 450,
    wordCount: 6
  },
  // 저장소 1, 버전 2.0
  {
    repo: 'freelang-v6',
    filePath: 'docs/ffi.md',
    fileName: 'ffi.md',
    version: 'v2.0',
    phase: 'Phase 2',
    chunkIndex: 0,
    totalChunks: 2,
    content: 'FFI interface definition for version 2.0',
    size: 480,
    wordCount: 7
  },
  {
    repo: 'freelang-v6',
    filePath: 'docs/architecture.md',
    fileName: 'architecture.md',
    version: 'v2.0',
    phase: 'Phase 3',
    chunkIndex: 0,
    totalChunks: 4,
    content: 'System architecture redesign in version 2.0',
    size: 520,
    wordCount: 8
  },
  // 다른 저장소
  {
    repo: 'other-project',
    filePath: 'README.md',
    fileName: 'README.md',
    version: 'v1.0',
    phase: 'Phase 1',
    chunkIndex: 0,
    totalChunks: 1,
    content: 'Other project documentation',
    size: 300,
    wordCount: 4
  }
];

/**
 * 테스트 1: 기본 필터링
 */
function testBasicFiltering() {
  console.log('📝 테스트 1: 기본 필터링');

  const repo1 = filter.filterChunks(testChunks, { repo: 'freelang-v6' });
  const v1 = filter.filterChunks(testChunks, { version: 'v1.0' });
  const phase2 = filter.filterChunks(testChunks, { phase: 'Phase 2' });

  console.log('✅ 성공');
  console.log(`   repo='freelang-v6': ${repo1.length}개`);
  console.log(`   version='v1.0': ${v1.length}개`);
  console.log(`   phase='Phase 2': ${phase2.length}개`);
}

/**
 * 테스트 2: 복합 필터링
 */
function testComplexFiltering() {
  console.log('\n📝 테스트 2: 복합 필터링 (AND 조건)');

  const result = filter.filterByMultipleCriteria(testChunks, {
    repo: 'freelang-v6',
    version: 'v2.0',
    phase: 'Phase 3'
  });

  console.log('✅ 성공');
  console.log(`   freelang-v6 AND v2.0 AND Phase 3: ${result.length}개`);

  if (result.length > 0) {
    result.forEach(chunk => {
      console.log(`   - ${chunk.fileName} (${chunk.version}/${chunk.phase})`);
    });
  }
}

/**
 * 테스트 3: 버전 범위 필터링
 */
function testVersionRange() {
  console.log('\n📝 테스트 3: 버전 범위 필터링');

  const result = filter.filterByVersionRange(testChunks, 'v1.0', 'v2.0');

  console.log('✅ 성공');
  console.log(`   v1.0 ~ v2.0: ${result.length}개`);

  result.forEach(chunk => {
    console.log(`   - ${chunk.version}`);
  });
}

/**
 * 테스트 4: 필터링 통계
 */
function testFilterStatistics() {
  console.log('\n📝 테스트 4: 필터링 통계');

  const stats = filter.getFilterStatistics(testChunks, {
    repo: 'freelang-v6'
  });

  console.log('✅ 성공');
  console.log(`   전체: ${stats.totalChunks}개`);
  console.log(`   필터 후: ${stats.filteredChunks}개`);
  console.log(`   감소율: ${stats.reductionRate}%`);
  console.log(`   남은 비율: ${stats.remainingPercentage}%`);
}

/**
 * 테스트 5: 사용 가능한 메타데이터
 */
function testAvailableMetadata() {
  console.log('\n📝 테스트 5: 사용 가능한 메타데이터');

  const meta = filter.getAvailableMetadata(testChunks);

  console.log('✅ 성공');
  console.log(`   저장소: ${meta.repos.join(', ')}`);
  console.log(`   버전: ${meta.versions.join(', ')}`);
  console.log(`   Phase: ${meta.phases.join(', ')}`);
  console.log(`   파일: ${meta.files.join(', ')}`);
}

/**
 * 테스트 6: 필터 검증
 */
function testFilterValidation() {
  console.log('\n📝 테스트 6: 필터 검증');

  const meta = filter.getAvailableMetadata(testChunks);

  const valid = filter.validateFilters({ version: 'v1.0' }, meta);
  const invalid = filter.validateFilters({ version: 'v99.0' }, meta);

  console.log('✅ 성공');
  console.log(`   v1.0 필터: ${valid.isValid ? '✅ 유효' : '❌ 무효'}`);
  console.log(`   v99.0 필터: ${invalid.isValid ? '✅ 유효' : '❌ 무효'}`);

  if (invalid.warnings.length > 0) {
    console.log(`   경고: ${invalid.warnings[0]}`);
  }
}

/**
 * 테스트 7: 진화 비교
 */
function testEvolutionComparison() {
  console.log('\n📝 테스트 7: 진화 비교 (v1.0 vs v2.0)');

  const comparison = filter.extractVersionComparison(testChunks, 'v1.0', 'v2.0');

  console.log('✅ 성공');
  console.log(`   v1.0: ${comparison.version1.chunkCount}개 Chunk`);
  console.log(`   v2.0: ${comparison.version2.chunkCount}개 Chunk`);
  console.log(`   차이: ${comparison.diff.chunkCountDiff > 0 ? '+' : ''}${comparison.diff.chunkCountDiff}개`);
}

/**
 * 테스트 8: 강화된 검색 (필터 포함)
 */
function testEnhancedSearch() {
  console.log('\n📝 테스트 8: 강화된 검색 (필터 포함)');

  const result = search.searchWithFilters(testChunks, 'memory model FFI', {
    version: 'v2.0',
    topK: 3
  });

  console.log('✅ 성공');
  console.log(`   쿼리: "memory model FFI"`);
  console.log(`   필터: version=v2.0`);
  console.log(`   필터 후 Chunk: ${result.statistics.filteredChunks}개`);
  console.log(`   매치: ${result.statistics.matchedChunks}개`);
  console.log(`   선택: ${result.statistics.selectedCount}개`);

  result.results.forEach((item, idx) => {
    console.log(`   ${idx + 1}. [${item.chunk.fileName}] 점수: ${item.score}`);
  });
}

/**
 * 테스트 9: 버전 비교 검색
 */
function testVersionComparison() {
  console.log('\n📝 테스트 9: 버전 비교 검색');

  const comparison = search.compareVersionSearch(
    testChunks,
    'memory model',
    'v1.0',
    'v2.0'
  );

  console.log('✅ 성공');
  console.log(`   쿼리: "${comparison.query}"`);
  console.log(`   v1.0: ${comparison.version1.matches}개 매치, 평균 점수: ${comparison.version1.avgScore}`);
  console.log(`   v2.0: ${comparison.version2.matches}개 매치, 평균 점수: ${comparison.version2.avgScore}`);
  console.log(`   점수 차이: ${comparison.diff.scoreDiff > 0 ? '+' : ''}${comparison.diff.scoreDiff}`);
}

/**
 * 테스트 10: Phase별 추론
 */
function testPhaseAwareSearch() {
  console.log('\n📝 테스트 10: Phase별 추론');

  const result = search.searchByPhaseAndTopic(testChunks, 'specification', 'Phase 1');

  console.log('✅ 성공');
  console.log(`   주제: "specification"`);
  console.log(`   Phase: "Phase 1"`);
  console.log(`   Phase 내 Chunk: ${result.phaseChunks}개`);
  console.log(`   매치 결과: ${result.statistics.matchedChunks}개`);
}

/**
 * 테스트 11: 프롬프트 생성 (버전 인식)
 */
function testVersionAwarePrompt() {
  console.log('\n📝 테스트 11: 프롬프트 생성 (버전 인식)');

  const chunks = testChunks.filter(c => c.version === 'v2.0').slice(0, 2);
  const generatedPrompt = prompt.buildVersionAwarePrompt(
    'FFI 설계는?',
    chunks,
    'v2.0'
  );

  console.log('✅ 성공');
  console.log(`   프롬프트 길이: ${generatedPrompt.length} 문자`);
  console.log(`   포함 내용:`);
  console.log(`   - 버전 정보: ${generatedPrompt.includes('v2.0') ? '✅' : '❌'}`);
  console.log(`   - 지시: ${generatedPrompt.includes('⚠️') ? '✅' : '❌'}`);
  console.log(`   - 기록: ${generatedPrompt.includes('기록') ? '✅' : '❌'}`);
}

/**
 * 테스트 12: 종합 프롬프트
 */
function testComprehensivePrompt() {
  console.log('\n📝 테스트 12: 종합 프롬프트 생성');

  const chunks = testChunks.filter(c => c.version === 'v2.0').slice(0, 2);
  const generatedPrompt = prompt.buildComprehensivePrompt({
    query: '아키텍처 변경사항은?',
    selectedChunks: chunks,
    filters: { version: 'v2.0', phase: 'Phase 3' },
    mode: 'version-aware',
    includeMetadata: true
  });

  const validation = prompt.validatePrompt(generatedPrompt);

  console.log('✅ 성공');
  console.log(`   검증: ${validation.isValid ? '✅ 유효' : '❌ 무효'}`);
  console.log(`   길이: ${validation.length} 문자`);
  console.log(`   포함:`);
  console.log(`   - 콘텐츠: ${validation.validations.hasContent ? '✅' : '❌'}`);
  console.log(`   - 지시: ${validation.validations.hasInstructions ? '✅' : '❌'}`);
  console.log(`   - 경고: ${validation.validations.hasWarnings ? '✅' : '❌'}`);
}

/**
 * 모든 테스트 실행
 */
function runAllTests() {
  testBasicFiltering();
  testComplexFiltering();
  testVersionRange();
  testFilterStatistics();
  testAvailableMetadata();
  testFilterValidation();
  testEvolutionComparison();
  testEnhancedSearch();
  testVersionComparison();
  testPhaseAwareSearch();
  testVersionAwarePrompt();
  testComprehensivePrompt();

  console.log('\n✨ 모든 테스트 완료\n');
}

// 테스트 실행
runAllTests();
