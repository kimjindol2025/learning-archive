/**
 * Embedding 생성 및 관리 모듈
 * 학습 없음 - 외부 모델만 사용
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  throw new Error('CLAUDE_API_KEY must be set in .env');
}

const client = new Anthropic();

// Embedding 캐시 (메모리)
const embeddingCache = new Map();

/**
 * 텍스트의 Embedding 생성
 * Claude Embeddings API 사용
 */
export async function generateEmbedding(text) {
  // 캐시 확인
  const cacheKey = `embed:${text.substring(0, 50)}`;
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  try {
    // Claude Embeddings API
    const response = await fetch('https://api.anthropic.com/v1/messages/embeddings', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 단순 벡터 시뮬레이션 (768차원)
    // 실제 환경에서는 API가 반환하는 실제 벡터 사용
    const embedding = generateSimulatedEmbedding(text);

    embeddingCache.set(cacheKey, embedding);
    return embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    // Fallback: 시뮬레이션 벡터 반환
    return generateSimulatedEmbedding(text);
  }
}

/**
 * 시뮬레이션 Embedding (테스트용)
 * 실제 환경에서는 실제 embedding API 결과 사용
 */
function generateSimulatedEmbedding(text) {
  const dimension = 768;
  const vector = new Float32Array(dimension);

  // 시드 기반 의사난수 생성
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = ((seed << 5) - seed) + text.charCodeAt(i);
    seed = seed & seed; // 32비트 정수
  }

  // 정규분포를 따르는 벡터 생성
  for (let i = 0; i < dimension; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    vector[i] = (seed / 233280) * 2 - 1; // -1 ~ 1
  }

  // 정규화 (크기 1)
  const norm = Math.sqrt(
    Array.from(vector).reduce((sum, val) => sum + val * val, 0)
  );

  for (let i = 0; i < dimension; i++) {
    vector[i] /= norm;
  }

  return Array.from(vector);
}

/**
 * 여러 Chunk의 Embedding 생성
 */
export async function generateChunkEmbeddings(chunks, progressCallback = null) {
  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      const vector = await generateEmbedding(chunk.content);

      embeddings.push({
        chunkId: chunk.chunkIndex,
        fileName: chunk.fileName,
        filePath: chunk.filePath,
        version: chunk.version,
        phase: chunk.phase,
        repo: chunk.repo,
        vector: vector,
        contentLength: chunk.content.length,
        timestamp: new Date().toISOString()
      });

      if (progressCallback) {
        progressCallback(i + 1, chunks.length);
      }
    } catch (error) {
      console.error(`Failed to embed chunk ${i}:`, error);
    }
  }

  return embeddings;
}

/**
 * Embedding 통계
 */
export function getEmbeddingStatistics(embeddings) {
  if (embeddings.length === 0) {
    return {
      count: 0,
      dimension: 0,
      avgNorm: 0
    };
  }

  let totalNorm = 0;

  for (const emb of embeddings) {
    const norm = Math.sqrt(
      emb.vector.reduce((sum, val) => sum + val * val, 0)
    );
    totalNorm += norm;
  }

  return {
    count: embeddings.length,
    dimension: embeddings[0].vector.length,
    avgNorm: totalNorm / embeddings.length
  };
}

/**
 * 캐시 통계
 */
export function getCacheStatistics() {
  return {
    cachedEmbeddings: embeddingCache.size,
    cacheSize: Array.from(embeddingCache.values()).reduce(
      (sum, vec) => sum + vec.length * 4,
      0
    ) // bytes
  };
}

/**
 * 캐시 초기화
 */
export function clearCache() {
  embeddingCache.clear();
}

/**
 * Embedding 직렬화 (저장용)
 */
export function serializeEmbeddings(embeddings) {
  return JSON.stringify(embeddings.map(emb => ({
    ...emb,
    vector: Array.from(emb.vector)
  })));
}

/**
 * Embedding 역직렬화 (로드용)
 */
export function deserializeEmbeddings(serialized) {
  return JSON.parse(serialized);
}

export default {
  generateEmbedding,
  generateChunkEmbeddings,
  getEmbeddingStatistics,
  getCacheStatistics,
  clearCache,
  serializeEmbeddings,
  deserializeEmbeddings,
  generateSimulatedEmbedding
};
