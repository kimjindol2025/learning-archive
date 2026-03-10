/**
 * 개념 추출 모듈
 * 모든 소스로부터 핵심 개념 자동 추출
 */

/**
 * 핵심 개념 정의 (도메인 특화)
 */
const CORE_CONCEPTS = {
  // 메모리 관련
  memory: ['memory', 'heap', 'stack', 'allocation', 'pointer', 'address'],
  unsafe: ['unsafe', 'raw', 'unmanaged', 'bounds', 'validation'],
  // 타입 관련
  type: ['type', 'generic', 'trait', 'interface', 'protocol', 'typing'],
  // 제어 흐름
  control: ['control', 'branch', 'loop', 'conditional', 'flow', 'jump'],
  // 상호운용성
  interop: ['ffi', 'extern', 'c', 'interop', 'binding', 'wrapper'],
  // 성능
  performance: ['perf', 'optim', 'fast', 'efficient', 'speed', 'benchmark'],
  // 테스트/검증
  testing: ['test', 'verify', 'validate', 'spec', 'coverage', 'assert'],
  // 리팩토링
  refactoring: ['refactor', 'clean', 'improve', 'simplify', 'reorganize'],
  // 아키텍처
  architecture: ['architecture', 'design', 'structure', 'pattern', 'layer', 'module'],
  // 동시성
  concurrency: ['concurrent', 'async', 'await', 'parallel', 'thread', 'task'],
  // 상태
  state: ['state', 'stateful', 'mutable', 'immutable', 'persistence']
};

/**
 * 텍스트로부터 핵심 개념 추출
 */
export function extractConceptsFromText(text) {
  if (!text) return [];

  const lower = text.toLowerCase();
  const found = new Set();

  for (const [concept, keywords] of Object.entries(CORE_CONCEPTS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        found.add(concept);
        break;
      }
    }
  }

  return Array.from(found);
}

/**
 * Commit 메시지로부터 개념 추출
 */
export function extractConceptsFromCommit(commit) {
  const concepts = extractConceptsFromText(commit.message);
  const metadata = {
    source: 'commit',
    hash: commit.hash,
    timestamp: commit.timestamp,
    author: commit.author,
    keywords: extractKeywords(commit.message)
  };

  return {
    concepts,
    metadata,
    frequency: concepts.length
  };
}

/**
 * Diff로부터 개념 추출
 */
export function extractConceptsFromDiff(diff, diffContent) {
  const concepts = new Set();
  const fileNames = diff.map(f => f.path).join(' ');
  const conceptsFromFiles = extractConceptsFromText(fileNames);
  conceptsFromFiles.forEach(c => concepts.add(c));

  if (diffContent) {
    const conceptsFromContent = extractConceptsFromText(diffContent);
    conceptsFromContent.forEach(c => concepts.add(c));
  }

  return {
    concepts: Array.from(concepts),
    filesChanged: diff.length,
    source: 'diff'
  };
}

/**
 * 파일 경로로부터 개념 추출
 */
export function extractConceptsFromFilePath(filePath) {
  const parts = filePath.split('/').join(' ').toLowerCase();
  return extractConceptsFromText(parts);
}

/**
 * 모든 소스로부터 통합 개념 추출
 */
export function extractAllConcepts(commits, diffs, intents) {
  const conceptMap = new Map();

  // Commit으로부터 추출
  for (const commit of commits) {
    const { concepts } = extractConceptsFromCommit(commit);
    for (const concept of concepts) {
      const entry = conceptMap.get(concept) || {
        concept,
        sources: new Set(),
        frequency: 0,
        firstAppeared: commit.timestamp,
        lastAppeared: commit.timestamp,
        impactScore: 0
      };

      entry.sources.add('commit');
      entry.frequency++;
      entry.lastAppeared = commit.timestamp;
      conceptMap.set(concept, entry);
    }
  }

  // Design Intent로부터 추출
  for (const intent of intents) {
    const concepts = extractConceptsFromText(intent.intent);
    for (const concept of concepts) {
      const entry = conceptMap.get(concept) || {
        concept,
        sources: new Set(),
        frequency: 0,
        firstAppeared: intent.commit.timestamp,
        lastAppeared: intent.commit.timestamp,
        impactScore: 0
      };

      entry.sources.add('intent');
      entry.frequency++;
      entry.lastAppeared = intent.commit.timestamp;
      entry.impactScore += intent.impactLevel || 0.5;
      conceptMap.set(concept, entry);
    }
  }

  // 파일 경로로부터 추출
  const allFilePaths = diffs.flat().map(f => f.path);
  const filePathConcepts = new Set();
  for (const path of allFilePaths) {
    const concepts = extractConceptsFromFilePath(path);
    concepts.forEach(c => filePathConcepts.add(c));
  }

  for (const concept of filePathConcepts) {
    const entry = conceptMap.get(concept) || {
      concept,
      sources: new Set(),
      frequency: 0,
      firstAppeared: new Date(),
      lastAppeared: new Date(),
      impactScore: 0
    };

    entry.sources.add('filepath');
    entry.frequency++;
    conceptMap.set(concept, entry);
  }

  // Sources를 배열로 변환
  const result = [];
  for (const [concept, data] of conceptMap) {
    result.push({
      ...data,
      sources: Array.from(data.sources),
      weight: calculateConceptWeight(data)
    });
  }

  return result.sort((a, b) => b.weight - a.weight);
}

/**
 * 개념 가중치 계산
 */
function calculateConceptWeight(entry) {
  const frequencyScore = Math.min(1.0, entry.frequency / 10);
  const impactScore = Math.min(1.0, entry.impactScore / 5);
  const sourceCount = entry.sources.size;

  return (frequencyScore * 0.4 + impactScore * 0.4 + (sourceCount / 3) * 0.2);
}

/**
 * 키워드 추출
 */
function extractKeywords(text) {
  if (!text) return [];

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s_]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const frequency = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * 개념 간 관계 강도 계산
 */
export function calculateConceptRelationStrength(concept1, concept2, source) {
  const strengthMap = {
    'same_commit': 0.8,
    'same_file': 0.7,
    'consecutive_commits': 0.6,
    'dependency': 0.75,
    'expansion': 0.65,
    'default': 0.4
  };

  return strengthMap[source] || strengthMap['default'];
}

/**
 * 개념 시간선 생성
 */
export function generateConceptTimeline(concepts) {
  const timeline = {};

  for (const concept of concepts) {
    timeline[concept.concept] = {
      concept: concept.concept,
      introduced: concept.firstAppeared,
      lastSeen: concept.lastAppeared,
      lifespan: concept.lastAppeared - concept.firstAppeared,
      frequency: concept.frequency,
      sources: concept.sources
    };
  }

  return timeline;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatConceptList(concepts) {
  const lines = [];

  lines.push('📚 추출된 개념');
  lines.push(`   총 개념: ${concepts.length}개`);

  const topConcepts = concepts.slice(0, 10);
  lines.push('   상위 10개:');

  for (const concept of topConcepts) {
    lines.push(`     - ${concept.concept} (weight: ${concept.weight.toFixed(3)})`);
  }

  return lines.join('\n');
}

export default {
  extractConceptsFromText,
  extractConceptsFromCommit,
  extractConceptsFromDiff,
  extractConceptsFromFilePath,
  extractAllConcepts,
  calculateConceptRelationStrength,
  generateConceptTimeline,
  formatConceptList,
  CORE_CONCEPTS
};
