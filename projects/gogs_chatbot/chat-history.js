#!/usr/bin/env node

/**
 * 채팅 이력 저장 시스템
 * - 사용자 대화 기록
 * - 검색 이력
 * - 통계
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = path.join(__dirname, '.history');
const SUMMARY_FILE = path.join(HISTORY_DIR, 'summary.json');

// ===== 채팅 이력 관리자 =====
export class ChatHistory {
  constructor() {
    this.ensureHistoryDir();
    this.summary = this.loadSummary();
    this.currentSession = {
      id: `session_${Date.now()}`,
      startTime: new Date().toISOString(),
      messages: [],
      totalQueries: 0,
      totalResponses: 0
    };
  }

  ensureHistoryDir() {
    if (!fs.existsSync(HISTORY_DIR)) {
      fs.mkdirSync(HISTORY_DIR, { recursive: true });
      console.log(`📁 이력 디렉토리 생성: ${HISTORY_DIR}`);
    }
  }

  loadSummary() {
    try {
      if (fs.existsSync(SUMMARY_FILE)) {
        return JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf-8'));
      }
    } catch (e) {
      console.warn('⚠️  요약 로드 실패');
    }
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      sessions: [],
      totalMessages: 0,
      totalQueries: 0,
      topQueries: [],
      topSources: []
    };
  }

  saveSummary() {
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(this.summary, null, 2));
  }

  /**
   * 메시지 기록
   */
  recordMessage(type, content, metadata = {}) {
    const message = {
      id: `msg_${this.currentSession.messages.length + 1}`,
      type: type, // 'query' | 'response'
      content: content,
      timestamp: new Date().toISOString(),
      metadata: metadata
    };

    this.currentSession.messages.push(message);

    if (type === 'query') {
      this.currentSession.totalQueries++;
    } else if (type === 'response') {
      this.currentSession.totalResponses++;
    }

    return message;
  }

  /**
   * 세션 저장
   */
  saveSession() {
    this.currentSession.endTime = new Date().toISOString();

    const sessionFile = path.join(HISTORY_DIR, `${this.currentSession.id}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(this.currentSession, null, 2));

    // 요약 업데이트
    this.summary.sessions.push({
      id: this.currentSession.id,
      startTime: this.currentSession.startTime,
      endTime: this.currentSession.endTime,
      messages: this.currentSession.messages.length,
      queries: this.currentSession.totalQueries,
      file: sessionFile
    });

    this.summary.totalMessages += this.currentSession.messages.length;
    this.summary.totalQueries += this.currentSession.totalQueries;

    // 상위 쿼리 분석
    this.analyzeTopQueries();

    this.saveSummary();

    console.log(`✅ 세션 저장: ${this.currentSession.id}`);
    console.log(`   메시지: ${this.currentSession.messages.length}`);
    console.log(`   쿼리: ${this.currentSession.totalQueries}`);
    console.log(`   응답: ${this.currentSession.totalResponses}`);
  }

  /**
   * 상위 쿼리 분석
   */
  analyzeTopQueries() {
    const queryMap = {};

    for (const session of this.summary.sessions) {
      const sessionFile = session.file;
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
        for (const msg of sessionData.messages) {
          if (msg.type === 'query') {
            const q = msg.content.substring(0, 50);
            queryMap[q] = (queryMap[q] || 0) + 1;
          }
        }
      } catch (e) {
        // 파일 읽기 실패
      }
    }

    this.summary.topQueries = Object.entries(queryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      version: this.summary.version,
      createdAt: this.summary.createdAt,
      sessions: this.summary.sessions.length,
      totalMessages: this.summary.totalMessages,
      totalQueries: this.summary.totalQueries,
      averageMessagesPerSession: (this.summary.totalMessages / Math.max(1, this.summary.sessions.length)).toFixed(2),
      topQueries: this.summary.topQueries.slice(0, 5),
      historyDir: HISTORY_DIR
    };
  }

  /**
   * 세션 목록
   */
  listSessions() {
    return this.summary.sessions.map(s => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      messages: s.messages,
      queries: s.queries
    }));
  }

  /**
   * 세션 상세 조회
   */
  getSession(sessionId) {
    try {
      const sessionFile = path.join(HISTORY_DIR, `${sessionId}.json`);
      if (fs.existsSync(sessionFile)) {
        return JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      }
    } catch (e) {
      console.warn(`⚠️  세션 로드 실패: ${sessionId}`);
    }
    return null;
  }

  /**
   * 검색
   */
  search(keyword) {
    const results = [];

    for (const session of this.summary.sessions) {
      try {
        const sessionData = this.getSession(session.id);
        if (sessionData) {
          for (const msg of sessionData.messages) {
            if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
              results.push({
                sessionId: session.id,
                message: msg,
                timestamp: msg.timestamp
              });
            }
          }
        }
      } catch (e) {
        // 계속
      }
    }

    return results.slice(0, 20);
  }

  /**
   * 내보내기
   */
  exportAsJSON() {
    return {
      summary: this.summary,
      sessions: this.summary.sessions.map(s => this.getSession(s.id))
    };
  }

  /**
   * 초기화
   */
  clear() {
    if (fs.existsSync(HISTORY_DIR)) {
      fs.rmSync(HISTORY_DIR, { recursive: true, force: true });
    }
    this.ensureHistoryDir();
    this.summary = this.loadSummary();
    console.log('✅ 채팅 이력 초기화됨');
  }
}

// ===== 사용 예제 =====
if (import.meta.url === `file://${process.argv[1]}`) {
  const history = new ChatHistory();

  if (process.argv[2] === 'stats') {
    console.log('\n📊 채팅 통계:');
    console.log(history.getStats());
  } else if (process.argv[2] === 'list') {
    console.log('\n📋 세션 목록:');
    console.log(history.listSessions());
  } else if (process.argv[2] === 'search') {
    const keyword = process.argv[3] || 'project';
    console.log(`\n🔍 검색: "${keyword}"`);
    const results = history.search(keyword);
    console.log(`${results.length}개 결과:\n`);
    results.slice(0, 5).forEach(r => {
      console.log(`- [${r.message.type}] ${r.message.content.substring(0, 50)}...`);
    });
  } else if (process.argv[2] === 'clear') {
    history.clear();
  } else {
    console.log(`
사용법:
  node chat-history.js stats        - 통계
  node chat-history.js list         - 세션 목록
  node chat-history.js search [kw]  - 검색
  node chat-history.js clear        - 이력 초기화
    `);
  }
}

export default ChatHistory;
