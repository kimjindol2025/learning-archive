import { config } from 'dotenv';
import gogsApi from '../gogs-api.js';

config();

const TEST_OWNER = process.env.DEFAULT_REPO_OWNER;
const TEST_REPO = process.env.DEFAULT_REPO_NAME;

console.log('\n🧪 Gogs API 테스트 시작\n');

/**
 * 테스트 1: 저장소 정보 조회
 */
async function testRepositoryInfo() {
  try {
    console.log('📝 테스트 1: 저장소 정보 조회');
    const info = await gogsApi.getRepositoryInfo(TEST_OWNER, TEST_REPO);

    console.log('✅ 성공');
    console.log(`   이름: ${info.name}`);
    console.log(`   설명: ${info.description}`);
    console.log(`   URL: ${info.url}`);
  } catch (error) {
    console.log(`❌ 실패: ${error.message}`);
  }
}

/**
 * 테스트 2: 파일 목록 조회
 */
async function testListFiles() {
  try {
    console.log('\n📝 테스트 2: 파일 목록 조회');
    const files = await gogsApi.listFiles(TEST_OWNER, TEST_REPO, '');

    console.log('✅ 성공');
    console.log(`   파일/폴더 수: ${files.length}`);

    files.slice(0, 3).forEach(file => {
      console.log(`   - ${file.name} (${file.type})`);
    });

    if (files.length > 3) {
      console.log(`   ... 외 ${files.length - 3}개`);
    }
  } catch (error) {
    console.log(`❌ 실패: ${error.message}`);
  }
}

/**
 * 테스트 3: 파일 콘텐츠 조회
 */
async function testFileContent() {
  try {
    console.log('\n📝 테스트 3: 파일 콘텐츠 조회');

    // README.md 조회 시도
    try {
      const content = await gogsApi.getFileContent(
        TEST_OWNER,
        TEST_REPO,
        'README.md'
      );

      console.log('✅ 성공 (README.md)');
      console.log(`   길이: ${content.length} 바이트`);
      console.log(`   미리보기: ${content.substring(0, 100)}...`);
    } catch (e) {
      console.log('ℹ️  README.md 없음, 다른 파일 시도');

      // 첫 번째 파일 조회
      const files = await gogsApi.listFiles(TEST_OWNER, TEST_REPO, '');
      const firstFile = files.find(f => f.type === 'file');

      if (firstFile) {
        const content = await gogsApi.getFileContent(
          TEST_OWNER,
          TEST_REPO,
          firstFile.path
        );

        console.log(`✅ 성공 (${firstFile.name})`);
        console.log(`   길이: ${content.length} 바이트`);
        console.log(
          `   미리보기: ${content.substring(0, 100)}...`
        );
      }
    }
  } catch (error) {
    console.log(`❌ 실패: ${error.message}`);
  }
}

/**
 * 테스트 4: 파일 검색
 */
async function testSearchFiles() {
  try {
    console.log('\n📝 테스트 4: 파일 검색 (패턴: *.md)');
    const results = await gogsApi.searchFiles(
      TEST_OWNER,
      TEST_REPO,
      '.*\\.md$'
    );

    console.log('✅ 성공');
    console.log(`   찾은 파일: ${results.length}개`);

    results.slice(0, 3).forEach(file => {
      console.log(`   - ${file.name}`);
    });
  } catch (error) {
    console.log(`❌ 실패: ${error.message}`);
  }
}

/**
 * 테스트 5: 마크다운 파일 수집
 */
async function testCollectMarkdownFiles() {
  try {
    console.log('\n📝 테스트 5: 마크다운 파일 수집');
    const files = await gogsApi.collectMarkdownFiles(TEST_OWNER, TEST_REPO);

    console.log('✅ 성공');
    console.log(`   수집된 파일: ${files.length}개`);

    if (files.length > 0) {
      console.log('   파일 목록:');
      files.slice(0, 3).forEach(file => {
        console.log(`   - ${file.path} (${file.size} 바이트)`);
      });

      if (files.length > 3) {
        console.log(`   ... 외 ${files.length - 3}개`);
      }
    }
  } catch (error) {
    console.log(`❌ 실패: ${error.message}`);
  }
}

/**
 * 모든 테스트 실행
 */
async function runAllTests() {
  console.log(`🎯 대상: ${TEST_OWNER}/${TEST_REPO}\n`);

  await testRepositoryInfo();
  await testListFiles();
  await testFileContent();
  await testSearchFiles();
  await testCollectMarkdownFiles();

  console.log('\n✨ 모든 테스트 완료\n');
}

// 테스트 실행
runAllTests().catch(error => {
  console.error('테스트 실행 실패:', error);
  process.exit(1);
});
