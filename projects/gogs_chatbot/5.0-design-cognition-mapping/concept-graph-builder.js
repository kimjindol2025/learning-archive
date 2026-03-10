/**
 * 개념 그래프 구축 모듈
 * 개념 네트워크 생성
 */

import conceptExtractor from './concept-extractor.js';

/**
 * 개념 그래프 구축
 */
export function buildConceptGraph(commits, diffs, intents) {
  const graph = {
    nodes: [],
    edges: [],
    nodeMap: new Map()
  };

  // 개념 추출
  const concepts = conceptExtractor.extractAllConcepts(commits, diffs, intents);

  // 노드 생성
  for (const concept of concepts) {
    const node = {
      id: concept.concept,
      label: concept.concept,
      weight: concept.weight,
      frequency: concept.frequency,
      impactScore: concept.impactScore,
      sources: concept.sources,
      introduced: concept.firstAppeared,
      lastSeen: concept.lastAppeared
    };

    graph.nodes.push(node);
    graph.nodeMap.set(concept.concept, node);
  }

  // 엣지 생성 (연결 규칙 적용)
  graph.edges = createEdges(commits, diffs, intents, graph.nodeMap);

  return graph;
}

/**
 * 엣지 생성
 */
function createEdges(commits, diffs, intents, nodeMap) {
  const edges = [];
  const edgeSet = new Set(); // 중복 제거

  // 규칙 1: 같은 commit에서 함께 등장
  for (const commit of commits) {
    const concepts = conceptExtractor.extractConceptsFromCommit(commit).concepts;

    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const from = concepts[i];
        const to = concepts[j];

        if (nodeMap.has(from) && nodeMap.has(to)) {
          const edgeKey = [from, to].sort().join('→');

          if (!edgeSet.has(edgeKey)) {
            edges.push({
              from,
              to,
              strength: 0.8,
              type: 'co-occurrence',
              source: 'commit',
              count: 1
            });
            edgeSet.add(edgeKey);
          }
        }
      }
    }
  }

  // 규칙 2: 같은 파일에서 함께 정의
  const fileConceptMap = new Map();
  for (const diff of diffs.flat()) {
    const concepts = conceptExtractor.extractConceptsFromFilePath(diff.path);
    fileConceptMap.set(diff.path, concepts);
  }

  for (const [path, fileConcepts] of fileConceptMap) {
    for (let i = 0; i < fileConcepts.length; i++) {
      for (let j = i + 1; j < fileConcepts.length; j++) {
        const from = fileConcepts[i];
        const to = fileConcepts[j];

        if (nodeMap.has(from) && nodeMap.has(to)) {
          const edgeKey = [from, to].sort().join('→');

          if (!edgeSet.has(edgeKey)) {
            edges.push({
              from,
              to,
              strength: 0.7,
              type: 'co-location',
              source: 'file',
              path
            });
            edgeSet.add(edgeKey);
          }
        }
      }
    }
  }

  // 규칙 3: 설계 의도에서 연결
  for (const intent of intents) {
    const concepts = conceptExtractor.extractConceptsFromText(intent.intent);

    // 선행과 후행 개념 연결
    for (let i = 0; i < concepts.length - 1; i++) {
      const from = concepts[i];
      const to = concepts[i + 1];

      if (nodeMap.has(from) && nodeMap.has(to)) {
        const edgeKey = [from, to].sort().join('→');

        if (!edgeSet.has(edgeKey)) {
          edges.push({
            from,
            to,
            strength: conceptExtractor.calculateConceptRelationStrength(
              from, to, 'expansion'
            ),
            type: 'sequence',
            source: 'intent'
          });
          edgeSet.add(edgeKey);
        }
      }
    }
  }

  return edges;
}

/**
 * 그래프 밀도 계산
 */
export function calculateGraphDensity(graph) {
  const n = graph.nodes.length;
  const e = graph.edges.length;
  const maxEdges = (n * (n - 1)) / 2;

  return maxEdges > 0 ? e / maxEdges : 0;
}

/**
 * 연결 요소 식별
 */
export function identifyConnectedComponents(graph) {
  const visited = new Set();
  const components = [];

  function dfs(nodeId, component) {
    visited.add(nodeId);
    component.push(nodeId);

    for (const edge of graph.edges) {
      if (edge.from === nodeId && !visited.has(edge.to)) {
        dfs(edge.to, component);
      } else if (edge.to === nodeId && !visited.has(edge.from)) {
        dfs(edge.from, component);
      }
    }
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      const component = [];
      dfs(node.id, component);
      components.push(component);
    }
  }

  return components;
}

/**
 * 핵심 개념 식별 (가장 연결 많은)
 */
export function identifyCoreConcepts(graph) {
  const degree = {};

  for (const node of graph.nodes) {
    degree[node.id] = 0;
  }

  for (const edge of graph.edges) {
    degree[edge.from]++;
    degree[edge.to]++;
  }

  return Object.entries(degree)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([concept, d]) => ({
      concept,
      degree: d
    }));
}

/**
 * 그래프 통계
 */
export function getGraphStatistics(graph) {
  const stats = {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    density: calculateGraphDensity(graph),
    components: identifyConnectedComponents(graph).length,
    coreConcepts: identifyCoreConcepts(graph),
    avgNodeWeight: 0,
    maxNodeWeight: 0,
    minNodeWeight: Infinity
  };

  let totalWeight = 0;
  for (const node of graph.nodes) {
    totalWeight += node.weight;
    stats.maxNodeWeight = Math.max(stats.maxNodeWeight, node.weight);
    stats.minNodeWeight = Math.min(stats.minNodeWeight, node.weight);
  }

  stats.avgNodeWeight = graph.nodes.length > 0 ? totalWeight / graph.nodes.length : 0;

  return stats;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatConceptGraph(graph) {
  const lines = [];
  const stats = getGraphStatistics(graph);

  lines.push('🔗 개념 그래프');
  lines.push(`   노드: ${stats.nodeCount}개`);
  lines.push(`   엣지: ${stats.edgeCount}개`);
  lines.push(`   밀도: ${stats.density.toFixed(3)}`);
  lines.push(`   연결 요소: ${stats.components}개`);

  return lines.join('\n');
}

export default {
  buildConceptGraph,
  calculateGraphDensity,
  identifyConnectedComponents,
  identifyCoreConcepts,
  getGraphStatistics,
  formatConceptGraph
};
