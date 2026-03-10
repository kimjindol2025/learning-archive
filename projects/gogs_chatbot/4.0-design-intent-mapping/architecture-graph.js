/**
 * 아키텍처 변화 지도 생성 모듈
 * 설계 진화 트리/그래프 구축
 */

/**
 * 의도 시퀀스로부터 아키텍처 그래프 구축
 */
export function buildArchitectureGraph(intentSequence) {
  const graph = {
    nodes: [],
    edges: [],
    timeline: [],
    clusters: [],
    conceptMap: {}
  };

  let prevIntents = [];

  for (const intent of intentSequence) {
    const node = createArchitectureNode(intent);
    graph.nodes.push(node);

    // 시간축 추가
    graph.timeline.push({
      timestamp: intent.commit.timestamp,
      commit: intent.commit.hash,
      intent: intent.intent,
      category: intent.category
    });

    // 이전 의도와의 관계 설정
    if (prevIntents.length > 0) {
      for (const prevIntent of prevIntents) {
        const edge = inferEdgeRelationship(prevIntent, intent);
        if (edge) {
          graph.edges.push(edge);
        }
      }
    }

    prevIntents = [intent];
  }

  // 개념 맵 생성
  graph.conceptMap = buildConceptMap(intentSequence);

  // 클러스터 식별
  graph.clusters = identifyArchitectureClusters(graph);

  return graph;
}

/**
 * 아키텍처 노드 생성
 */
function createArchitectureNode(intent) {
  return {
    id: intent.commit.hash,
    label: intent.intent,
    category: intent.category,
    depth: calculateNodeDepth(intent),
    impactLevel: intent.impactLevel,
    timestamp: intent.commit.timestamp,
    commit: intent.commit.hash,
    properties: {
      testCoverage: intent.diffSummary?.fileTypes?.['test'] ? true : false,
      specChanged: intent.diffSummary?.fileTypes?.['md'] ? true : false,
      apiEvolution: intent.category === 'API',
      performanceInvolved: intent.category === 'Performance'
    }
  };
}

/**
 * 노드 깊이 계산 (shallow/medium/deep)
 */
function calculateNodeDepth(intent) {
  const impact = intent.impactLevel || 0;
  if (impact > 0.66) return 'Deep';
  if (impact > 0.33) return 'Medium';
  return 'Shallow';
}

/**
 * 의도 간 관계 추론
 */
function inferEdgeRelationship(prevIntent, currIntent) {
  const relationship = {
    from: prevIntent.commit.hash,
    to: currIntent.commit.hash,
    type: 'related',
    strength: 0.5,
    reason: ''
  };

  // 같은 카테고리 → 강한 관계
  if (prevIntent.category === currIntent.category) {
    relationship.type = 'continuation';
    relationship.strength = 0.9;
    relationship.reason = `${prevIntent.category} 카테고리 내 진행`;
    return relationship;
  }

  // 다른 카테고리 → 의존성 분석
  if (canDependOn(prevIntent.category, currIntent.category)) {
    relationship.type = 'dependency';
    relationship.strength = 0.7;
    relationship.reason = `${prevIntent.category} → ${currIntent.category} 의존`;
    return relationship;
  }

  // 기타 관계
  if (shareCommonConcept(prevIntent, currIntent)) {
    relationship.type = 'related';
    relationship.strength = 0.6;
    relationship.reason = '공통 개념 포함';
    return relationship;
  }

  return null;
}

/**
 * 카테고리 간 의존성 확인
 */
function canDependOn(fromCategory, toCategory) {
  const dependencies = {
    'Verification': ['Architecture', 'API', 'Performance'],
    'Architecture': ['Performance', 'API'],
    'Refactoring': ['Verification', 'Quality'],
    'Performance': ['Architecture', 'Refactoring'],
    'API': ['Architecture', 'Performance'],
    'Quality': ['Verification', 'Refactoring']
  };

  return (dependencies[fromCategory] || []).includes(toCategory);
}

/**
 * 공통 개념 확인
 */
function shareCommonConcept(intent1, intent2) {
  const concepts1 = extractConcepts(intent1.intent);
  const concepts2 = extractConcepts(intent2.intent);

  for (const c1 of concepts1) {
    if (concepts2.includes(c1)) {
      return true;
    }
  }

  return false;
}

/**
 * 의도 텍스트로부터 개념 추출
 */
function extractConcepts(intentText) {
  const conceptPatterns = [
    /타입|type|safety/i,
    /메모리|memory|allocation/i,
    /제어|control|flow/i,
    /인터페이스|interface|api/i,
    /성능|performance|optimize/i,
    /안정성|stability|robust/i,
    /상호운용|interop|ffi/i,
    /테스트|test|verify/i
  ];

  const found = [];
  for (const pattern of conceptPatterns) {
    if (pattern.test(intentText)) {
      found.push(pattern.source.split('|')[0]);
    }
  }

  return found;
}

/**
 * 개념 맵 구축
 */
function buildConceptMap(intentSequence) {
  const conceptMap = {};

  for (const intent of intentSequence) {
    const concepts = extractConcepts(intent.intent);

    for (const concept of concepts) {
      if (!conceptMap[concept]) {
        conceptMap[concept] = {
          name: concept,
          firstIntroduced: intent.commit.timestamp,
          occurrences: 0,
          relatedCategories: new Set(),
          timeline: []
        };
      }

      conceptMap[concept].occurrences++;
      conceptMap[concept].relatedCategories.add(intent.category);
      conceptMap[concept].timeline.push({
        timestamp: intent.commit.timestamp,
        intent: intent.intent
      });
    }
  }

  // Set을 배열로 변환
  for (const concept in conceptMap) {
    conceptMap[concept].relatedCategories = Array.from(
      conceptMap[concept].relatedCategories
    );
  }

  return conceptMap;
}

/**
 * 아키텍처 클러스터 식별
 */
function identifyArchitectureClusters(graph) {
  const clusters = [];
  const visited = new Set();

  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue;

    const cluster = {
      id: `cluster-${clusters.length}`,
      nodes: [node.id],
      category: node.category,
      startTime: node.timestamp,
      endTime: node.timestamp,
      theme: inferClusterTheme(node)
    };

    // 연관된 노드 찾기
    for (const edge of graph.edges) {
      if (edge.from === node.id && !visited.has(edge.to)) {
        const targetNode = graph.nodes.find(n => n.id === edge.to);
        if (targetNode && edge.type === 'continuation') {
          cluster.nodes.push(edge.to);
          cluster.endTime = targetNode.timestamp;
          visited.add(edge.to);
        }
      }
    }

    visited.add(node.id);
    clusters.push(cluster);
  }

  return clusters;
}

/**
 * 클러스터 테마 추론
 */
function inferClusterTheme(node) {
  const categoryThemes = {
    'Verification': '검증 강화 단계',
    'Architecture': '아키텍처 진화 단계',
    'Performance': '성능 최적화 단계',
    'API': 'API 확장 단계',
    'Refactoring': '코드 품질 개선 단계',
    'Quality': '품질 보증 단계',
    'Other': '일반 개발 단계'
  };

  return categoryThemes[node.category] || '개발 진행';
}

/**
 * 진화 경로 추출
 */
export function extractEvolutionPath(graph) {
  const path = [];
  let current = graph.nodes[0];

  const visited = new Set();
  visited.add(current.id);
  path.push({
    node: current,
    stage: 1
  });

  for (let i = 1; i < graph.nodes.length; i++) {
    const next = graph.nodes[i];
    if (visited.has(next.id)) continue;

    const edge = graph.edges.find(e => e.from === current.id && e.to === next.id);

    path.push({
      node: next,
      stage: i + 1,
      edgeType: edge?.type,
      edgeStrength: edge?.strength
    });

    visited.add(next.id);
    current = next;
  }

  return path;
}

/**
 * 아키텍처 변화 보고서 생성
 */
export function generateArchitectureReport(graph) {
  const report = {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    clusters: graph.clusters.length,
    keyArchitectureConcepts: Object.keys(graph.conceptMap),
    evolutionStages: [],
    criticality: {}
  };

  // 진화 단계별 정보
  for (const cluster of graph.clusters) {
    report.evolutionStages.push({
      stage: cluster.id,
      theme: cluster.theme,
      nodeCount: cluster.nodes.length,
      duration: cluster.endTime - cluster.startTime,
      category: cluster.category
    });
  }

  // 중요도 계산
  for (const node of graph.nodes) {
    const incomingEdges = graph.edges.filter(e => e.to === node.id).length;
    const outgoingEdges = graph.edges.filter(e => e.from === node.id).length;
    const centrality = incomingEdges + outgoingEdges;

    report.criticality[node.id] = {
      node: node.label,
      centrality: centrality,
      importance: calculateImportance(node, centrality)
    };
  }

  return report;
}

/**
 * 노드 중요도 계산
 */
function calculateImportance(node, centrality) {
  const impactScore = node.impactLevel * 0.5;
  const centralityScore = Math.min(1.0, centrality / 10) * 0.5;

  return impactScore + centralityScore;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatArchitectureGraph(graph) {
  const lines = [];

  lines.push('🏗️  아키텍처 변화 지도');
  lines.push(`   총 노드: ${graph.nodes.length}개`);
  lines.push(`   총 엣지: ${graph.edges.length}개`);
  lines.push(`   클러스터: ${graph.clusters.length}개`);
  lines.push(`   핵심 개념: ${Object.keys(graph.conceptMap).length}개`);

  if (graph.clusters.length > 0) {
    lines.push('   클러스터 목록:');
    for (const cluster of graph.clusters) {
      lines.push(`     - ${cluster.theme} (${cluster.nodes.length}노드)`);
    }
  }

  return lines.join('\n');
}

export default {
  buildArchitectureGraph,
  extractEvolutionPath,
  generateArchitectureReport,
  formatArchitectureGraph
};
