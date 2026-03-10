import express from 'express';
import { config } from 'dotenv';
import gogsApi from './gogs-api.js';
import search from './search.js';
import llm from './llm.js';
import validator from './validator.js';

config();

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_REPO_OWNER = process.env.DEFAULT_REPO_OWNER;
const DEFAULT_REPO_NAME = process.env.DEFAULT_REPO_NAME;

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 저장소 파일 캐시 (간단한 구현)
let fileCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 파일 캐시 업데이트
 */
async function updateFileCache() {
  try {
    const now = Date.now();

    if (!fileCache || now - cacheTime > CACHE_DURATION) {
      console.log('📂 캐시 업데이트 중...');
      fileCache = await gogsApi.collectMarkdownFiles(
        DEFAULT_REPO_OWNER,
        DEFAULT_REPO_NAME
      );
      cacheTime = now;
      console.log(`✅ ${fileCache.length}개 파일 캐시됨`);
    }

    return fileCache;
  } catch (error) {
    console.error('Cache update failed:', error);
    return fileCache || [];
  }
}

/**
 * POST /chat - 채팅 요청 처리
 */
app.post('/chat', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '쿼리가 필요합니다.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`\n📝 Query: ${query}`);

    // 1. 캐시에서 파일 가져오기
    const files = await updateFileCache();

    // 2. 검색
    const searchResults = search.searchInFiles(files, query);
    console.log(`🔍 ${searchResults.length}개 파일에서 매치됨`);

    // 3. 검색 결과 순위 지정
    const rankedResults = search.rankResults(searchResults);

    // 4. 콘텍스트 추출
    const context = search.extractContext(rankedResults, 3);
    console.log(`📚 ${context.length}개 콘텍스트 항목 선택됨`);

    // 5. Claude API를 통한 응답 생성
    let response = '';
    try {
      response = await llm.generateAnswer(query, context);
      console.log(`✅ 응답 생성 완료`);
    } catch (llmError) {
      console.error('LLM error:', llmError);
      response =
        '죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다. 나중에 다시 시도해주세요.';
    }

    // 6. 검증
    const responseValidation = validator.validateResponse(response);
    const searchValidation = validator.validateSearchResults(searchResults);
    const consistency = validator.validateConsistency(query, response, context);

    // 응답 구성
    res.json({
      status: 'success',
      query: query,
      answer: response,
      searchResults: {
        total: searchResults.length,
        ranked: rankedResults.slice(0, 5).map(r => ({
          file: r.file,
          fileName: r.fileName,
          matchCount: r.matchCount,
          score: r.score
        }))
      },
      context: context.slice(0, 3),
      validation: {
        response: responseValidation,
        search: searchValidation,
        consistency: consistency
      },
      metadata: {
        responseTime: `${Date.now() - cacheTime}ms`,
        timestamp: new Date().toISOString(),
        cacheSize: fileCache.length
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /search - 검색 API
 */
app.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: '검색 쿼리가 필요합니다.',
        timestamp: new Date().toISOString()
      });
    }

    const files = await updateFileCache();
    const searchResults = search.searchInFiles(files, q);
    const rankedResults = search.rankResults(searchResults);

    res.json({
      status: 'success',
      query: q,
      results: rankedResults.slice(0, limit),
      total: searchResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /cache - 캐시 상태 확인
 */
app.get('/cache', async (req, res) => {
  try {
    const files = await updateFileCache();

    res.json({
      status: 'success',
      cache: {
        fileCount: files.length,
        files: files.map(f => ({
          path: f.path,
          name: f.name,
          size: f.size
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /info - 저장소 정보
 */
app.get('/info', async (req, res) => {
  try {
    const repoInfo = await gogsApi.getRepositoryInfo(
      DEFAULT_REPO_OWNER,
      DEFAULT_REPO_NAME
    );

    res.json({
      status: 'success',
      repository: repoInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET / - 헬스 체크
 */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.1',
    endpoints: {
      chat: 'POST /chat',
      search: 'GET /search',
      cache: 'GET /cache',
      info: 'GET /info'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 에러 핸들러
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * 서버 시작
 */
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Gogs Chatbot 1.1 시작됨`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📚 저장소: ${DEFAULT_REPO_OWNER}/${DEFAULT_REPO_NAME}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 종료되었습니다.');
    process.exit(0);
  });
});

export default app;
