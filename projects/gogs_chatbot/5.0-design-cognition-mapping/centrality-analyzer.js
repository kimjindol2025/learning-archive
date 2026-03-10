/**
 * 중심성 분석 모듈
 * 그래프 중심성 계산 및 구조 분석
 */

/**
 * Degree Centrality 계산
 */
export function calculateDegreeCentrality(graph) {
  const centrality = {};

  for (const node of graph.nodes) {
    centrality[node.id] = 0;
  }

  for (const edge of graph.edges) {
    centrality[edge.from]++;
    centrality[edge.to]++;
  }

  // 정규화
  const maxDegree = Math.max(...Object.values(centrality), 1);
  const normalized = {};
  for (const [node, degree] of Object.entries(centrality)) {
    normalized[node] = degree / maxDegree;
  }

  return normalized;
}

/**
 * Betweenness Centrality 계산 (간단한 버전)
 */
export function calculateBetweennessCentrality(graph) {
  const centrality = {};

  for (const node of graph.nodes) {
    centrality[node.id] = 0;
  }

  // 모든 노드 쌍 사이의 최단 경로 찾기
  for (const source of graph.nodes) {
    const distances = dijkstra(graph, source.id);

    for (const target of graph.nodes) {
      if (source.id === target.id) continue;

      // 경로상의 노드들에 가중치 추가
      const path = findShortestPath(graph, source.id, target.id);
      for (let i = 1; i < path.length - 1; i++) {
        centrality[path[i]] += 1;
      }
    }
  }

  // 정규화
  const maxBetweenness = Math.max(...Object.values(centrality), 1);
  const normalized = {};
  for (const [node, bc] of Object.entries(centrality)) {
    normalized[node] = bc / maxBetweenness;
  }

  return normalized;
}

/**
 * Dijkstra 알고리즘
 */
function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();

  for (const node of graph.nodes) {
    distances[node.id] = Infinity;
  }
  distances[start] = 0;

  for (let i = 0; i < graph.nodes.length; i++) {
    let minNode = null;
    let minDist = Infinity;

    for (const node of graph.nodes) {
      if (!visited.has(node.id) && distances[node.id] < minDist) {
        minNode = node.id;
        minDist = distances[node.id];
      }
    }

    if (minNode === null) break;
    visited.add(minNode);

    for (const edge of graph.edges) {
      if (edge.from === minNode && !visited.has(edge.to)) {
        const newDist = distances[minNode] + (1 / edge.strength);
        if (newDist < distances[edge.to]) {
          distances[edge.to] = newDist;
        }
      } else if (edge.to === minNode && !visited.has(edge.from)) {
        const newDist = distances[minNode] + (1 / edge.strength);
        if (newDist < distances[edge.from]) {
          distances[edge.from] = newDist;
        }
      }
    }
  }

  return distances;
}

/**
 * 최단 경로 찾기
 */
function findShortestPath(graph, start, end) {
  if (start === end) return [start];

  const queue = [[start]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    for (const edge of graph.edges) {
      let neighbor = null;
      if (edge.from === current) neighbor = edge.to;
      if (edge.to === current) neighbor = edge.from;

      if (neighbor && !visited.has(neighbor)) {
        const newPath = [...path, neighbor];
        if (neighbor === end) return newPath;

        visited.add(neighbor);
        queue.push(newPath);
      }
    }
  }

  return [start, end]; // 경로 없으면 직접 연결
}

/**
 * PageRank 알고리즘
 */
export function calculatePageRank(graph, iterations = 10) {
  const pagerank = {};
  const d = 0.85; // Damping factor

  // 초기화
  for (const node of graph.nodes) {
    pagerank[node.id] = 1 / graph.nodes.length;
  }

  // 반복 계산
  for (let iter = 0; iter < iterations; iter++) {
    const newPagerank = {};

    for (const node of graph.nodes) {
      let rank = (1 - d) / graph.nodes.length;

      // 이 노드로 들어오는 엣지 찾기
      for (const edge of graph.edges) {
        if (edge.to === node.id) {
          // 엣지 가중치 고려
          const fromNode = graph.nodes.find(n => n.id === edge.from);
          const outDegree = graph.edges.filter(e => e.from === edge.from).length;

          if (outDegree > 0) {
            rank += (d * pagerank[edge.from] / outDegree) * edge.strength;
          }
        }
      }

      newPagerank[node.id] = rank;
    }

    pagerank = newPagerank;
  }

  return pagerank;
}

/**
 * 구조적 역할 분류
 */
export function classifyConceptRoles(graph, degreeCentrality, pagerank) {
  const roles = {};

  for (const node of graph.nodes) {
    const degree = degreeCentrality[node.id] || 0;
    const rank = pagerank[node.id] || 0;

    let role = 'peripheral';

    if (rank > 0.06 && degree > 0.6) {
      role = 'core';
    } else if (rank > 0.03 && degree > 0.3) {
      role = 'hub';
    } else if (rank > 0.01) {
      role = 'expansion';
    } else if (graph.edges.some(e => e.from === node.id || e.to === node.id)) {
      role = 'boundary';
    }

    roles[node.id] = {
      concept: node.id,
      role,
      degreeScore: degree,
      rankScore: rank
    };
  }

  return roles;
}

/**
 * 구조 계층 생성
 */
export function generateArchitectureLayers(graph, roles) {
  const layers = {
    core: [],
    expansion: [],
    boundary: []
  };

  for (const [concept, roleInfo] of Object.entries(roles)) {
    if (roleInfo.role === 'core') {
      layers.core.push(concept);
    } else if (roleInfo.role === 'hub' || roleInfo.role === 'expansion') {
      layers.expansion.push(concept);
    } else if (roleInfo.role === 'boundary') {
      layers.boundary.push(concept);
    }
  }

  return layers;
}

/**
 * 중심성 지표 계산
 */
export function calculateCentralityMetrics(graph, roles) {
  const metrics = {
    coreCount: 0,
    expansionCount: 0,
    boundaryCount: 0,
    coreStability: 0,
    expansionGrowth: 0,
    boundaryPermeability: 0
  };

  for (const role of Object.values(roles)) {
    if (role.role === 'core') metrics.coreCount++;
    else if (role.role === 'expansion') metrics.expansionCount++;
    else if (role.role === 'boundary') metrics.boundaryCount++;
  }

  const totalConcepts = graph.nodes.length;
  if (totalConcepts > 0) {
    metrics.coreStability = metrics.coreCount / totalConcepts;
    metrics.expansionGrowth = metrics.expansionCount / totalConcepts;
    metrics.boundaryPermeability = metrics.boundaryCount / totalConcepts;
  }

  return metrics;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatCentralityAnalysis(roles, metrics) {
  const lines = [];

  lines.push('🎯 중심성 분석');
  lines.push(`   핵심 개념: ${metrics.coreCount}개 (${(metrics.coreStability * 100).toFixed(1)}%)`);
  lines.push(`   확장 개념: ${metrics.expansionCount}개 (${(metrics.expansionGrowth * 100).toFixed(1)}%)`);
  lines.push(`   경계 개념: ${metrics.boundaryCount}개 (${(metrics.boundaryPermeability * 100).toFixed(1)}%)`);

  return lines.join('\n');
}

export default {
  calculateDegreeCentrality,
  calculateBetweennessCentrality,
  calculatePageRank,
  classifyConceptRoles,
  generateArchitectureLayers,
  calculateCentralityMetrics,
  formatCentralityAnalysis
};
