import chunk from '../chunk.js';

console.log('\n🧪 Chunk 분할 테스트 시작\n');

// 테스트 데이터
const testDocument = `# Project Documentation

## Overview
This is a comprehensive project documentation covering all aspects of the system architecture and implementation details.

## Installation
To install the project, run the following commands:
\`\`\`bash
npm install
npm run build
\`\`\`

## Configuration
Configure the system with the following environment variables:
- DATABASE_URL: Connection string to your database
- API_KEY: Your API key for authentication
- LOG_LEVEL: Logging level (debug, info, warn, error)

## Architecture
The system is divided into several modules:

### Module A
Module A handles data processing and transformation. It provides efficient algorithms for handling large datasets.

### Module B
Module B manages user authentication and authorization. It implements industry-standard security practices.

### Module C
Module C coordinates communication between different components. It ensures reliable message delivery.

## Usage
Use the CLI tool to interact with the system. Examples:
\`\`\`bash
cli-tool --help
cli-tool process --input file.txt
cli-tool serve --port 3000
\`\`\`

## Testing
Run the test suite with:
\`\`\`bash
npm test
npm run test:coverage
\`\`\`

## Performance
The system achieves the following performance metrics:
- Throughput: 10,000 requests/second
- Latency: <100ms (p95)
- Memory: <512MB

## Troubleshooting
Common issues and solutions:
1. Connection timeout: Check network connectivity
2. Authentication error: Verify credentials
3. Performance degradation: Check system resources

## Contributing
To contribute to the project, follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
This project is licensed under the MIT License.
`;

const testFile = {
  path: 'docs/README.md',
  name: 'README.md',
  repo: 'test-project',
  version: 'v1.0',
  phase: 'Phase 1',
  content: testDocument
};

/**
 * 테스트 1: 단순 Chunk 분할
 */
function testSimpleChunking() {
  console.log('📝 테스트 1: 단순 Chunk 분할 (800 토큰)');

  const chunks = chunk.chunkText(testDocument, 800);

  console.log('✅ 성공');
  console.log(`   생성된 Chunk: ${chunks.length}개`);

  chunks.forEach((c, idx) => {
    console.log(`   - Chunk ${idx + 1}: ${c.length} bytes, ${c.split(/\s+/).length} words`);
  });
}

/**
 * 테스트 2: 고급 Chunk 분할 (헤더 기준)
 */
function testAdvancedChunking() {
  console.log('\n📝 테스트 2: 고급 Chunk 분할 (헤더 기준)');

  const chunks = chunk.chunkTextAdvanced(testDocument, 800);

  console.log('✅ 성공');
  console.log(`   생성된 Chunk: ${chunks.length}개`);

  chunks.forEach((c, idx) => {
    const firstLine = c.split('\n')[0].substring(0, 50);
    console.log(`   - Chunk ${idx + 1}: ${firstLine}...`);
  });
}

/**
 * 테스트 3: 메타데이터 추가
 */
function testMetadataAdding() {
  console.log('\n📝 테스트 3: 메타데이터 추가');

  const chunks = chunk.chunkTextAdvanced(testDocument, 800);
  const chunkedWithMeta = chunk.addMetadata(chunks, testFile);

  console.log('✅ 성공');
  console.log(`   Chunk with metadata: ${chunkedWithMeta.length}개`);

  const firstChunk = chunkedWithMeta[0];
  console.log(`\n   첫 번째 Chunk 정보:`);
  console.log(`   - 저장소: ${firstChunk.repo}`);
  console.log(`   - 파일: ${firstChunk.filePath}`);
  console.log(`   - 버전: ${firstChunk.version}`);
  console.log(`   - Phase: ${firstChunk.phase}`);
  console.log(`   - Index: ${firstChunk.chunkIndex}/${firstChunk.totalChunks}`);
  console.log(`   - 크기: ${firstChunk.size} bytes, ${firstChunk.wordCount} words`);
}

/**
 * 테스트 4: Chunk 인덱스 구축
 */
function testIndexBuilding() {
  console.log('\n📝 테스트 4: Chunk 인덱스 구축');

  const chunks = chunk.chunkTextAdvanced(testDocument, 800);
  const chunkedWithMeta = chunk.addMetadata(chunks, testFile);
  const index = chunk.buildChunkIndex(chunkedWithMeta);

  console.log('✅ 성공');
  console.log(`   총 Chunk: ${index.totalChunks}개`);
  console.log(`   파일 인덱스 항목: ${Object.keys(index.fileIndex).length}개`);
  console.log(`   버전 인덱스 항목: ${Object.keys(index.versionIndex).length}개`);
  console.log(`   Phase 인덱스 항목: ${Object.keys(index.phaseIndex).length}개`);
}

/**
 * 테스트 5: Chunk 통계
 */
function testStatistics() {
  console.log('\n📝 테스트 5: Chunk 통계');

  const chunks = chunk.chunkTextAdvanced(testDocument, 800);
  const chunkedWithMeta = chunk.addMetadata(chunks, testFile);
  const stats = chunk.getChunkStatistics(chunkedWithMeta);

  console.log('✅ 성공');
  console.log(`   총 Chunk: ${stats.totalChunks}개`);
  console.log(`   전체 크기: ${stats.totalSize} bytes`);
  console.log(`   평균 크기: ${stats.avgChunkSize} bytes`);
  console.log(`   평균 단어: ${stats.avgWords}개`);
  console.log(`   파일 수: ${stats.files}개`);
  console.log(`   크기 분포:`);
  console.log(`     - 작음: ${stats.sizeDistribution.small}개`);
  console.log(`     - 중간: ${stats.sizeDistribution.medium}개`);
  console.log(`     - 큼: ${stats.sizeDistribution.large}개`);
}

/**
 * 테스트 6: Chunk 필터링
 */
function testChunkFiltering() {
  console.log('\n📝 테스트 6: Chunk 필터링');

  const chunks = chunk.chunkTextAdvanced(testDocument, 800);
  const chunkedWithMeta = chunk.addMetadata(chunks, testFile);

  // 버전별 필터링
  const v1Chunks = chunk.getChunksByVersion(chunkedWithMeta, 'v1.0');
  console.log('✅ 성공');
  console.log(`   버전 v1.0: ${v1Chunks.length}개`);

  // Phase별 필터링
  const phase1Chunks = chunk.getChunksByPhase(chunkedWithMeta, 'Phase 1');
  console.log(`   Phase 1: ${phase1Chunks.length}개`);

  // 파일별 필터링
  const readmeChunks = chunk.getChunksByFile(chunkedWithMeta, 'docs/README.md');
  console.log(`   docs/README.md: ${readmeChunks.length}개`);
}

/**
 * 테스트 7: Chunk 포맷팅
 */
function testChunkFormatting() {
  console.log('\n📝 테스트 7: Chunk 포맷팅 (LLM 전달용)');

  const chunks = chunk.chunkTextAdvanced(testDocument, 800);
  const chunkedWithMeta = chunk.addMetadata(chunks, testFile);

  const formatted = chunk.formatChunkForLLM(chunkedWithMeta[0]);

  console.log('✅ 성공');
  console.log('   포맷된 결과:');
  console.log(formatted.substring(0, 200) + '...');
}

/**
 * 테스트 8: 여러 파일 처리
 */
function testMultipleFiles() {
  console.log('\n📝 테스트 8: 여러 파일 처리');

  const testFiles = [
    testFile,
    {
      path: 'docs/API.md',
      name: 'API.md',
      repo: 'test-project',
      version: 'v1.0',
      phase: 'Phase 2',
      content: testDocument.substring(0, 500)
    }
  ];

  const allChunks = chunk.createChunksFromFiles(testFiles);

  console.log('✅ 성공');
  console.log(`   생성된 Chunk: ${allChunks.length}개`);

  const files = new Set(allChunks.map(c => c.filePath));
  console.log(`   파일: ${files.size}개`);

  files.forEach(f => {
    const count = allChunks.filter(c => c.filePath === f).length;
    console.log(`   - ${f}: ${count}개 Chunk`);
  });
}

/**
 * 모든 테스트 실행
 */
function runAllTests() {
  testSimpleChunking();
  testAdvancedChunking();
  testMetadataAdding();
  testIndexBuilding();
  testStatistics();
  testChunkFiltering();
  testChunkFormatting();
  testMultipleFiles();

  console.log('\n✨ 모든 테스트 완료\n');
}

// 테스트 실행
runAllTests();
