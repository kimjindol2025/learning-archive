#!/usr/bin/env node

/**
 * Gogs 지식엔진 - 통합 웹 애플리케이션
 * - 웹 UI
 * - 검색 API
 * - 채팅 엔진
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import url from 'url';
import ContentCache from './content-cache.js';
import ChatHistory from './chat-history.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8888');
const REPO_ROOT = path.join(__dirname, '..');
const cache = new ContentCache();
const history = new ChatHistory();

// ===== 지식 베이스 로드 =====
class GogsKB {
  constructor() {
    this.docs = [];
    this.load();
  }

  load() {
    console.log('📚 Gogs 문서 로딩...');

    const files = [
      { path: 'README.md', name: '프로젝트' },
      { path: '1.1-minimal-rag/README.md', name: '1.1 Minimal RAG' },
      { path: '1.2-chunk-search/README.md', name: '1.2 Chunk Search' },
      { path: '1.3-metadata-filter/README.md', name: '1.3 Metadata Filter' },
      { path: '1.4-bm25-ranking/README.md', name: '1.4 BM25 Ranking' },
      { path: '2.0-semantic-search/README.md', name: '2.0 Semantic Search' }
    ];

    let count = 0;
    for (const f of files) {
      try {
        const fullPath = path.join(REPO_ROOT, f.path);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content) {
            this.docs.push({
              id: count++,
              name: f.name,
              path: f.path,
              content: content,
              lines: content.split('\n')
            });
          }
        }
      } catch (e) {
        // 파일 없음
      }
    }

    console.log(`✅ ${count}개 문서 로드됨\n`);
  }

  search(query) {
    const q = query.toLowerCase();
    let results = [];

    for (const doc of this.docs) {
      let score = 0;
      const content = doc.content.toLowerCase();

      // 제목 매칭
      if (doc.name.toLowerCase().includes(q)) score += 10;

      // 내용 검색
      for (const word of q.split(/\s+/)) {
        if (doc.name.toLowerCase().includes(word)) score += 5;
        const count = (content.match(new RegExp(word, 'g')) || []).length;
        score += count;
      }

      if (score > 0) {
        results.push({ ...doc, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  extractContent(doc, query) {
    const q = query.toLowerCase();
    let best = [];

    for (const line of doc.lines) {
      const l = line.toLowerCase();
      if (q.split(/\s+/).some(w => l.includes(w)) && line.trim().length > 10) {
        best.push(line);
      }
    }

    if (best.length === 0) {
      best = doc.lines.filter(l => l.trim().length > 20).slice(0, 3);
    }

    return best.slice(0, 5).join('\n').substring(0, 500);
  }
}

// ===== 채팅 응답 생성 =====
class ChatEngine {
  constructor(kb) {
    this.kb = kb;
    this.history = [];
  }

  chat(query) {
    // 쿼리 기록
    history.recordMessage('query', query, { timestamp: new Date().toISOString() });

    const results = this.kb.search(query);

    let reply, sources;
    if (results.length === 0) {
      reply = '❓ 죄송합니다. 관련된 정보를 찾을 수 없습니다.';
      sources = [];
    } else {
      const main = results[0];
      const content = this.kb.extractContent(main, query);

      let prefix = '';
      const q = query.toLowerCase();
      if (q.includes('뭐')) prefix = '📚 ';
      else if (q.includes('기능')) prefix = '✨ ';
      else if (q.includes('최신')) prefix = '🆕 ';
      else prefix = '🔍 ';

      reply = prefix + main.name + '\n\n' + content;
      sources = results.map(r => r.name);
    }

    // 응답 기록
    history.recordMessage('response', reply, { sources: sources });

    return { reply, sources };
  }
}

// ===== HTTP 서버 =====
class WebApp {
  constructor(port) {
    this.port = port;
    this.kb = new GogsKB();
    this.chat = new ChatEngine(this.kb);
  }

  start() {
    // 초기 콘텐츠 수집
    console.log('\n📥 콘텐츠 캐싱 중...');
    cache.collectAndCache(REPO_ROOT);

    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;

      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // 라우팅
      if (pathname === '/' && req.method === 'GET') {
        this.serveUI(res);
      } else if (pathname === '/api/chat' && req.method === 'POST') {
        this.handleChat(req, res);
      } else if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          docs: this.kb.docs.length,
          cached: cache.metadata.documents.length,
          time: new Date().toISOString()
        }));
      } else if (pathname === '/api/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          cache: cache.getStats(),
          history: history.getStats()
        }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(this.port, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 Gogs 지식엔진 웹 애플리케이션 시작!');
      console.log('='.repeat(60));
      console.log(`🌐 URL: http://localhost:${this.port}`);
      console.log(`📚 문서: ${this.kb.docs.length}개`);
      console.log(`💾 캐시: ${cache.metadata.documents.length}개`);
      console.log(`✅ 준비 완료! 브라우저에서 접속하세요.\n`);
    });

    // 종료 시 이력 저장
    process.on('SIGINT', () => {
      console.log('\n💾 채팅 이력 저장 중...');
      history.saveSession();
      console.log('✅ 모든 데이터 저장됨');
      process.exit(0);
    });

    return server;
  }

  serveUI(res) {
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gogs 지식엔진</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            width: 100%;
            max-width: 900px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            height: 90vh;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 16px 16px 0 0;
        }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .chat-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .message {
            display: flex;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
        }
        .message.user { justify-content: flex-end; }
        .message-content {
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 12px;
            line-height: 1.5;
            word-wrap: break-word;
        }
        .user .message-content { background: #667eea; color: white; }
        .bot .message-content { background: #f1f5f9; color: #1e293b; }
        .input-area { border-top: 1px solid #e2e8f0; padding: 15px 20px; }
        .input-form { display: flex; gap: 10px; }
        input { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
        button { padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; }
        button:hover { background: #5568d3; }
        .welcome { text-align: center; padding: 40px 20px; color: #64748b; }
        .sample-q { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 20px; }
        .q-btn { padding: 10px 15px; background: #e0e7ff; color: #4f46e5; border: 1px solid #c7d2fe; border-radius: 8px; cursor: pointer; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Gogs 지식엔진</h1>
            <p>저장소 콘텐츠 기반 AI 검색</p>
        </div>
        <div class="chat-area" id="chat">
            <div class="welcome">
                <h2>안녕하세요! 👋</h2>
                <p>Gogs 저장소에 대해 물어보세요</p>
                <div class="sample-q">
                    <button class="q-btn" onclick="ask('이 프로젝트가 뭐야?')">프로젝트 소개</button>
                    <button class="q-btn" onclick="ask('BM25 랭킹이 뭐지?')">BM25 랭킹</button>
                    <button class="q-btn" onclick="ask('어떤 기능이 있어?')">주요 기능</button>
                </div>
            </div>
        </div>
        <div class="input-area">
            <form class="input-form" onsubmit="send(event)">
                <input type="text" id="msg" placeholder="메시지..." autocomplete="off">
                <button type="submit">전송</button>
            </form>
        </div>
    </div>
    <script>
        const chat = document.getElementById('chat');
        const msg = document.getElementById('msg');

        function add(text, isUser = false, sources = []) {
            const div = document.createElement('div');
            div.className = \`message \${isUser ? 'user' : 'bot'}\`;
            const c = document.createElement('div');
            c.className = 'message-content';
            let html = text;
            if (sources.length && !isUser) {
                html += '<br><small style="opacity:0.7">📚 ' + sources.join(', ') + '</small>';
            }
            c.innerHTML = html;
            div.appendChild(c);
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }

        async function send(e) {
            e.preventDefault();
            const text = msg.value.trim();
            if (!text) return;

            chat.querySelector('.welcome')?.remove();
            add(text, true);
            msg.value = '';

            try {
                const r = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });
                const d = await r.json();
                add(d.reply, false, d.sources || []);
            } catch (e) {
                add('❌ 오류: ' + e.message);
            }
        }

        function ask(q) {
            msg.value = q;
            msg.parentElement.onsubmit({ preventDefault: () => {} });
        }

        msg.focus();
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  handleChat(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        if (!message) throw new Error('No message');

        const response = this.chat.chat(message);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(response));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }
}

// ===== 시작 =====
const app = new WebApp(PORT);
app.start();
