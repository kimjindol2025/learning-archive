/**
 * 개념 전이 분석 모듈
 * 크로스 repo 개념 이동 추적
 */

/**
 * 개념 전이 탐지
 */
export function detectConceptTransfers(aggregated, conceptSharing) {
  const transfers = [];

  for (const [concept, sharing] of Object.entries(conceptSharing)) {
    if (sharing.repoCount < 2) continue; // 최소 2개 repo에서 나타나야 함

    const sorted = sharing.repos.sort((a, b) => {
      const timeA = aggregated.conceptOrigins[concept]
        .find(o => o.repo === a)?.timestamp || new Date(0);
      const timeB = aggregated.conceptOrigins[concept]
        .find(o => o.repo === b)?.timestamp || new Date(0);

      return new Date(timeA) - new Date(timeB);
    });

    // 시간순 전이 경로
    for (let i = 1; i < sorted.length; i++) {
      const sourceRepo = sorted[i - 1];
      const targetRepo = sorted[i];

      const sourceTime = aggregated.conceptOrigins[concept]
        .find(o => o.repo === sourceRepo)?.timestamp;
      const targetTime = aggregated.conceptOrigins[concept]
        .find(o => o.repo === targetRepo)?.timestamp;

      transfers.push({
        concept,
        from: sourceRepo,
        to: targetRepo,
        sourceTime,
        targetTime,
        transferLag: new Date(targetTime) - new Date(sourceTime),
        direction: calculateTransferDirection(sourceRepo, targetRepo)
      });
    }
  }

  return transfers;
}

/**
 * 전이 방향 판단
 */
function calculateTransferDirection(from, to) {
  // 저장소 타입 기반 방향 결정
  const experimentalKeywords = ['test', 'experiment', 'trial'];
  const coreKeywords = ['core', 'main', 'lang'];
  const appKeywords = ['app', 'impl', 'application'];

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  if (experimentalKeywords.some(k => fromLower.includes(k)) &&
      coreKeywords.some(k => toLower.includes(k))) {
    return 'experiment_to_core';
  }
  if (coreKeywords.some(k => fromLower.includes(k)) &&
      appKeywords.some(k => toLower.includes(k))) {
    return 'core_to_application';
  }

  return 'lateral';
}

/**
 * 전이 속도 분석
 */
export function analyzeTransferVelocity(transfers) {
  const velocities = {};

  for (const transfer of transfers) {
    const key = `${transfer.from}_to_${transfer.to}`;

    if (!velocities[key]) {
      velocities[key] = {
        source: transfer.from,
        target: transfer.to,
        transfers: [],
        avgLag: 0,
        fastTransfers: 0,
        slowTransfers: 0
      };
    }

    const lagDays = transfer.transferLag / (1000 * 60 * 60 * 24);
    velocities[key].transfers.push(lagDays);

    if (lagDays < 30) velocities[key].fastTransfers++;
    else velocities[key].slowTransfers++;
  }

  // 평균 계산
  for (const key in velocities) {
    const data = velocities[key];
    const total = data.transfers.reduce((a, b) => a + b, 0);
    data.avgLag = data.transfers.length > 0 ? total / data.transfers.length : 0;
  }

  return velocities;
}

/**
 * 개념 전이 네트워크 구축
 */
export function buildTransferNetwork(transfers) {
  const network = {
    nodes: new Set(),
    edges: [],
    transferCount: {}
  };

  for (const transfer of transfers) {
    network.nodes.add(transfer.from);
    network.nodes.add(transfer.to);

    const edgeKey = `${transfer.from}→${transfer.to}`;
    if (!network.transferCount[edgeKey]) {
      network.transferCount[edgeKey] = 0;
    }
    network.transferCount[edgeKey]++;

    network.edges.push({
      from: transfer.from,
      to: transfer.to,
      concept: transfer.concept,
      direction: transfer.direction
    });
  }

  return {
    nodeCount: network.nodes.size,
    nodes: Array.from(network.nodes),
    edgeCount: network.edges.length,
    edges: network.edges,
    densityMatrix: calculateTransferDensity(Array.from(network.nodes), network.edges)
  };
}

/**
 * 전이 밀도 매트릭스
 */
function calculateTransferDensity(repos, edges) {
  const matrix = {};

  for (const repo of repos) {
    matrix[repo] = {};
    for (const target of repos) {
      matrix[repo][target] = 0;
    }
  }

  for (const edge of edges) {
    matrix[edge.from][edge.to]++;
  }

  return matrix;
}

/**
 * 영향력 있는 전이 식별
 */
export function identifyInfluentialTransfers(transfers, aggregated) {
  const influential = [];

  for (const transfer of transfers) {
    // 영향력 점수: 개념의 중요도 × 전이 속도
    const conceptOrigins = aggregated.conceptOrigins[transfer.concept] || [];
    const importance = Math.min(1.0, conceptOrigins.length / 10);
    const speed = Math.max(0.1, 1.0 - (transfer.transferLag / (1000 * 60 * 60 * 24 * 90))); // 90일 기준
    const impactScore = importance * speed;

    if (impactScore > 0.3) {
      influential.push({
        ...transfer,
        impactScore,
        importance,
        speed
      });
    }
  }

  return influential.sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * 포맷팅 (테스트용)
 */
export function formatTransferAnalysis(transfers, influential, network) {
  const lines = [];

  lines.push('🔄 개념 전이 분석');
  lines.push(`   총 전이: ${transfers.length}개`);
  lines.push(`   영향력 있는 전이: ${influential.length}개`);
  lines.push(`   저장소 노드: ${network.nodeCount}개`);
  lines.push(`   전이 경로: ${network.edgeCount}개`);

  return lines.join('\n');
}

export default {
  detectConceptTransfers,
  analyzeTransferVelocity,
  buildTransferNetwork,
  identifyInfluentialTransfers,
  formatTransferAnalysis
};
