/**
 * Chunk 분할 및 인덱싱 모듈
 * 문서를 단위별로 분할하고 메타데이터 추가
 */

/**
 * 텍스트를 Chunk로 분할 (단순 버전)
 */
export function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  const step = size - overlap;

  for (let i = 0; i < text.length; i += step) {
    const chunk = text.slice(i, i + size);
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * 고급 Chunk 분할 (헤더 기준)
 */
export function chunkTextAdvanced(text, targetSize = 800) {
  const chunks = [];
  const lines = text.split('\n');

  let currentChunk = '';
  let currentSize = 0;

  for (const line of lines) {
    const lineSize = line.length + 1;

    // 헤더로 시작하고 현재 chunk가 비어있지 않으면 새로 시작
    if (line.match(/^#+\s/) && currentSize > 0) {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = line + '\n';
      currentSize = lineSize;
    } else if (currentSize + lineSize > targetSize && currentChunk.trim().length > 0) {
      // 크기 초과시 새 chunk 시작
      chunks.push(currentChunk.trim());
      currentChunk = line + '\n';
      currentSize = lineSize;
    } else {
      // 현재 chunk에 추가
      currentChunk += line + '\n';
      currentSize += lineSize;
    }
  }

  // 마지막 chunk 추가
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Chunk에 메타데이터 추가
 */
export function addMetadata(chunks, file) {
  return chunks.map((content, index) => ({
    repo: file.repo || 'unknown',
    filePath: file.path,
    fileName: file.name,
    version: file.version || 'unknown',
    phase: file.phase || 'unknown',
    chunkIndex: index,
    totalChunks: chunks.length,
    content: content,
    size: content.length,
    wordCount: content.split(/\s+/).length,
    timestamp: new Date().toISOString()
  }));
}

/**
 * 여러 파일에서 Chunk 생성
 */
export function createChunksFromFiles(files) {
  const allChunks = [];

  for (const file of files) {
    const chunks = chunkTextAdvanced(file.content, 800);
    const chunkedWithMeta = addMetadata(chunks, file);
    allChunks.push(...chunkedWithMeta);
  }

  return allChunks;
}

/**
 * Chunk 인덱스 구축
 */
export function buildChunkIndex(chunks) {
  const index = {
    totalChunks: chunks.length,
    chunks: chunks,
    fileIndex: {},
    versionIndex: {},
    phaseIndex: {}
  };

  // 파일별 인덱스
  for (const chunk of chunks) {
    if (!index.fileIndex[chunk.filePath]) {
      index.fileIndex[chunk.filePath] = [];
    }
    index.fileIndex[chunk.filePath].push(chunk.chunkIndex);

    // 버전별 인덱스
    if (!index.versionIndex[chunk.version]) {
      index.versionIndex[chunk.version] = [];
    }
    index.versionIndex[chunk.version].push(chunk.chunkIndex);

    // Phase별 인덱스
    if (!index.phaseIndex[chunk.phase]) {
      index.phaseIndex[chunk.phase] = [];
    }
    index.phaseIndex[chunk.phase].push(chunk.chunkIndex);
  }

  return index;
}

/**
 * Chunk 통계
 */
export function getChunkStatistics(chunks) {
  const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
  const avgSize = totalSize / chunks.length;
  const avgWords = chunks.reduce((sum, c) => sum + c.wordCount, 0) / chunks.length;

  const files = new Set(chunks.map(c => c.filePath)).size;
  const versions = new Set(chunks.map(c => c.version)).size;
  const phases = new Set(chunks.map(c => c.phase)).size;

  return {
    totalChunks: chunks.length,
    totalSize: totalSize,
    avgChunkSize: Math.round(avgSize),
    avgWords: Math.round(avgWords),
    files: files,
    versions: versions,
    phases: phases,
    sizeDistribution: {
      small: chunks.filter(c => c.size < 500).length,
      medium: chunks.filter(c => c.size >= 500 && c.size < 1000).length,
      large: chunks.filter(c => c.size >= 1000).length
    }
  };
}

/**
 * 특정 파일의 Chunk 조회
 */
export function getChunksByFile(chunks, filePath) {
  return chunks.filter(c => c.filePath === filePath);
}

/**
 * 특정 버전의 Chunk 조회
 */
export function getChunksByVersion(chunks, version) {
  return chunks.filter(c => c.version === version);
}

/**
 * 특정 Phase의 Chunk 조회
 */
export function getChunksByPhase(chunks, phase) {
  return chunks.filter(c => c.phase === phase);
}

/**
 * Chunk 포맷팅 (LLM 전달용)
 */
export function formatChunkForLLM(chunk) {
  return `[출처] ${chunk.fileName} (${chunk.version}/${chunk.phase}) - Chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks}

${chunk.content}

---`;
}

/**
 * 여러 Chunk 포맷팅
 */
export function formatChunksForLLM(chunks) {
  return chunks
    .map(chunk => formatChunkForLLM(chunk))
    .join('\n\n');
}

export default {
  chunkText,
  chunkTextAdvanced,
  addMetadata,
  createChunksFromFiles,
  buildChunkIndex,
  getChunkStatistics,
  getChunksByFile,
  getChunksByVersion,
  getChunksByPhase,
  formatChunkForLLM,
  formatChunksForLLM
};
