#!/usr/bin/env node

/**
 * Gogs 지식엔진 - 웹 채팅 서버
 * 저장소 콘텐츠 기반 검색 및 대화
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== 설정 =====
const PORT = process.env.PORT || 8080;
const REPO_ROOT = __dirname;

// ===== Gogs 저장소 문서 로드 =====
class GogsKnowledgeBase {
  constructor() {
    this.documents = [];
    this.loadDocuments();
  }

  loadDocuments() {
    console.log('📚 Gogs 저장소 문서 로딩...');

    // README 파일들
    const readmeFiles = [
      { path: 'README.md', label: 'Main README' },
      { path: '1.1-minimal-rag/README.md', label: '1.1 Minimal RAG' },
      { path: '1.2-chunk-search/README.md', label: '1.2 Chunk Search' },
      { path: '1.3-metadata-filter/README.md', label: '1.3 Metadata Filter' },
      { path: '1.4-bm25-ranking/README.md', label: '1.4 BM25 Ranking' },
      { path: '2.0-semantic-search/README.md', label: '2.0 Semantic Search' },
      { path: 'gogs-chatbot/README.md', label: '8.0 Production' },
      { path: 'gogs-chatbot/DEPLOYMENT_SUMMARY.md', label: 'Deployment Guide' }
    ];

    let docId = 0;
    for (const file of readmeFiles) {
      try {
        const fullPath = path.join(REPO_ROOT, file.path);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content) {
            this.documents.push({
              id: `doc_${++docId}`,
              source: file.label,
              path: file.path,
              content: content,
              keywords: this.extractKeywords(content)
            });
          }
        }
      } catch (e) {
        console.warn(`⚠️  파일 읽기 실패: ${file.path}`);
      }
    }

    console.log(`✅ ${this.documents.length}개 문서 로드됨`);
  }

  // 키워드 추출
  extractKeywords(text) {
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);
    return [...new Set(words)].slice(0, 50);
  }

  // 쿼리 기반 검색
  search(query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const scored = this.documents.map(doc => {
      let score = 0;
      for (const word of queryWords) {
        if (doc.keywords.includes(word)) score += 2;
        if (doc.content.toLowerCase().includes(word)) score += 1;
      }
      return { ...doc, score };
    }).filter(d => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return scored;
  }

  // 문서에서 관련 내용 추출
  extractRelevantContent(doc, query, maxLength = 300) {
    const lines = doc.content.split('\n');
    const queryWords = query.toLowerCase().split(/\s+/);

    // 쿼리 단어를 포함한 라인 찾기
    let relevantLines = [];
    for (const line of lines) {
      if (queryWords.some(w => line.toLowerCase().includes(w)) && line.trim()) {
        relevantLines.push(line);
      }
    }

    // 없으면 처음 줄들 사용
    if (relevantLines.length === 0) {
      relevantLines = lines.filter(l => l.trim()).slice(0, 5);
    }

    return relevantLines.join('\n').substring(0, maxLength);
  }
}

// ===== 채팅 응답 생성 =====
class ChatResponseGenerator {
  constructor(kb) {
    this.kb = kb;
    this.conversationHistory = [];
  }

  // 응답 생성
  generateResponse(query) {
    // 검색
    const results = this.kb.search(query);

    if (results.length === 0) {
      return {
        reply: '죄송합니다. 질문과 관련된 정보를 찾을 수 없습니다. 다른 질문을 시도해보세요.',
        sources: []
      };
    }

    // 관련 내용 추출
    const mainResult = results[0];
    const content = this.kb.extractRelevantContent(mainResult, query);

    // 응답 구성
    const response = this.buildResponse(query, content, mainResult, results);

    // 대화 이력 저장
    this.conversationHistory.push({
      query,
      response,
      timestamp: new Date()
    });

    return response;
  }

  buildResponse(query, content, doc, allResults = []) {
    const queryLower = query.toLowerCase();
    let reply = '';

    // 질문 유형 감지 및 응답 생성
    if (queryLower.includes('뭐야') || queryLower.includes('뭐지') || queryLower.includes('이란')) {
      reply = `📚 **${doc.source}** 관련 정보:\n\n`;
    } else if (queryLower.includes('어떤') || queryLower.includes('기능')) {
      reply = `✨ 주요 기능:\n\n`;
    } else if (queryLower.includes('최신') || queryLower.includes('최근')) {
      reply = `🆕 최신 정보:\n\n`;
    } else if (queryLower.includes('목표') || queryLower.includes('목적')) {
      reply = `🎯 목표:\n\n`;
    } else {
      reply = `🔍 검색 결과:\n\n`;
    }

    // 콘텐츠 포함
    reply += content;

    if (content.length > 250) {
      reply += '\n\n*(클릭하여 자세히 보기)*';
    }

    return {
      reply: reply,
      sources: allResults.map(r => r.source)
    };
  }
}

// ===== HTTP 서버 =====
class ChatServer {
  constructor(port = 3000) {
    this.port = port;
    this.kb = new GogsKnowledgeBase();
    this.responseGen = new ChatResponseGenerator(this.kb);
  }

  start() {
    const server = http.createServer((req, res) => {
      // CORS 헤더
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // 라우팅
      if (req.url === '/' && req.method === 'GET') {
        this.serveHTML(res);
      } else if (req.url === '/api/chat' && req.method === 'POST') {
        this.handleChat(req, res);
      } else if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          documents: this.kb.documents.length
        }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(this.port, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 채팅 서버 시작됨`);
      console.log('='.repeat(50));
      console.log(`🌐 URL: http://localhost:${this.port}`);
      console.log(`📚 문서: ${this.kb.documents.length}개`);
      console.log(`✅ 준비 완료!\n`);
    });

    return server;
  }

  serveHTML(res) {
    const htmlPath = path.join(__dirname, 'chat-ui.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  handleChat(req, res) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);

        if (!message || message.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        // 응답 생성
        const response = this.responseGen.generateResponse(message);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('❌ 오류:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  }
}

// ===== 서버 실행 =====
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ChatServer(PORT);
  server.start();
}

export { ChatServer, GogsKnowledgeBase, ChatResponseGenerator };
