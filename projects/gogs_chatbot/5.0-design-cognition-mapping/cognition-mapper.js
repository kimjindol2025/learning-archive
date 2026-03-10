/**
 * 설계 사고 지도 생성 모듈
 * 개념 네트워크를 사고 지도로 변환
 */

/**
 * 설계 사고 지도 생성
 */
export function generateCognitionMap(graph, roles, layers) {
  const map = {
    structure: {
      type: 'Design Cognition Map',
      coreLayer: layers.core,
      expansionLayer: layers.expansion,
      boundaryLayer: layers.boundary
    },
    nodes: [],
    edges: [],
    roles: roles,
    conceptDensity: calculateConceptDensity(graph)
  };

  // 노드를 역할에 따라 분류
  for (const node of graph.nodes) {
    const role = roles[node.id];

    map.nodes.push({
      id: node.id,
      label: node.id,
      role: role.role,
      weight: node.weight,
      frequency: node.frequency,
      layer: role.role === 'core' ? 'core' : role.role === 'boundary' ? 'boundary' : 'expansion',
      x: calculateNodePosition(node, role, layers).x,
      y: calculateNodePosition(node, role, layers).y
    });
  }

  // 엣지를 역할 관계로 분류
  for (const edge of graph.edges) {
    const fromRole = roles[edge.from]?.role || 'unknown';
    const toRole = roles[edge.to]?.role || 'unknown';

    map.edges.push({
      from: edge.from,
      to: edge.to,
      strength: edge.strength,
      type: edge.type,
      relationship: inferRelationship(fromRole, toRole)
    });
  }

  return map;
}

/**
 * 노드 위치 계산 (2D 배치)
 */
function calculateNodePosition(node, role, layers) {
  // 계층별로 다른 y 좌표 할당
  const layerPositions = {
    'core': 100,
    'expansion': 200,
    'boundary': 300
  };

  const y = layerPositions[role.role] || 200;

  // 같은 계층 내에서 x 좌표 분산
  const sameLayerNodes = layers[role.role] || [];
  const indexInLayer = sameLayerNodes.indexOf(node.id);
  const spacing = Math.max(50, 500 / (sameLayerNodes.length + 1));
  const x = (indexInLayer + 1) * spacing;

  return { x, y };
}

/**
 * 개념 밀도 계산
 */
function calculateConceptDensity(graph) {
  const concepts = graph.nodes.length;
  const connections = graph.edges.length;

  return {
    conceptCount: concepts,
    connectionCount: connections,
    avgConnectionsPerConcept: concepts > 0 ? connections / concepts : 0,
    complexity: Math.log(Math.max(2, concepts * connections))
  };
}

/**
 * 관계 유형 추론
 */
function inferRelationship(fromRole, toRole) {
  if (fromRole === 'core' && toRole === 'core') return 'core-core';
  if (fromRole === 'core' && toRole === 'expansion') return 'core-expansion';
  if (fromRole === 'core' && toRole === 'boundary') return 'core-boundary';
  if (fromRole === 'expansion' && toRole === 'core') return 'expansion-core';
  if (fromRole === 'expansion' && toRole === 'expansion') return 'expansion-expansion';
  if (fromRole === 'boundary' && toRole === 'core') return 'boundary-core';

  return 'other';
}

/**
 * 사고 지도의 핵심 통찰
 */
export function generateCognitionInsights(map) {
  const insights = {
    structuralCore: map.structure.coreLayer,
    expansionZone: map.structure.expansionLayer,
    boundaryConditions: map.structure.boundaryLayer,
    keyRelationships: []
  };

  // 핵심 관계 추출
  for (const edge of map.edges) {
    if (edge.relationship === 'core-expansion' || edge.relationship === 'core-boundary') {
      insights.keyRelationships.push({
        from: edge.from,
        to: edge.to,
        type: edge.relationship,
        strength: edge.strength
      });
    }
  }

  // 상위 5개 관계
  insights.topRelationships = insights.keyRelationships
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  return insights;
}

/**
 * 사고 지도 요약
 */
export function summarizeCognitionMap(map) {
  const summary = {
    totalConcepts: map.nodes.length,
    coreConceptCount: map.structure.coreLayer.length,
    expansionConceptCount: map.structure.expansionLayer.length,
    boundaryConceptCount: map.structure.boundaryLayer.length,
    totalConnections: map.edges.length,
    avgConnectionStrength: 0,
    mapComplexity: map.conceptDensity.complexity,
    structuralStability: 0
  };

  // 평균 연결 강도
  if (map.edges.length > 0) {
    const totalStrength = map.edges.reduce((sum, e) => sum + e.strength, 0);
    summary.avgConnectionStrength = totalStrength / map.edges.length;
  }

  // 구조적 안정성: 핵심 개념의 비율
  if (summary.totalConcepts > 0) {
    summary.structuralStability = summary.coreConceptCount / summary.totalConcepts;
  }

  return summary;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatCognitionMap(map, summary) {
  const lines = [];

  lines.push('🧠 설계 사고 지도');
  lines.push(`   총 개념: ${summary.totalConcepts}개`);
  lines.push(`   핵심 개념: ${summary.coreConceptCount}개`);
  lines.push(`   확장 개념: ${summary.expansionConceptCount}개`);
  lines.push(`   경계 개념: ${summary.boundaryConceptCount}개`);
  lines.push(`   연결: ${summary.totalConnections}개`);
  lines.push(`   구조 안정성: ${(summary.structuralStability * 100).toFixed(1)}%`);

  return lines.join('\n');
}

export default {
  generateCognitionMap,
  generateCognitionInsights,
  summarizeCognitionMap,
  formatCognitionMap
};
