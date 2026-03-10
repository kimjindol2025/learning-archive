/**
 * 구조 복잡도 경고 시스템
 * 위험한 설계 상태 자동 감지
 */

/**
 * Centrality 급상승 감지
 */
export function detectCentralitySpike(roleCurrent, rolePrevious, threshold = 0.4) {
  const warnings = [];

  for (const concept in roleCurrent) {
    const current = roleCurrent[concept];
    const previous = rolePrevious[concept];

    if (!previous) continue;

    const degreeDiff = current.degree - previous.degree;
    const betweennessDiff = current.betweenness - previous.betweenness;
    const pageRankDiff = current.pageRank - previous.pageRank;

    if (degreeDiff > threshold) {
      warnings.push({
        type: 'CENTRALITY_SPIKE',
        concept,
        metric: 'degree',
        previous: previous.degree,
        current: current.degree,
        change: degreeDiff,
        severity: calculateSeverity(degreeDiff, 0.6),
        message: `"${concept}" Degree Centrality 급상승: ${previous.degree.toFixed(2)} → ${current.degree.toFixed(2)}`
      });
    }

    if (betweennessDiff > threshold) {
      warnings.push({
        type: 'CENTRALITY_SPIKE',
        concept,
        metric: 'betweenness',
        previous: previous.betweenness,
        current: current.betweenness,
        change: betweennessDiff,
        severity: calculateSeverity(betweennessDiff, 0.5),
        message: `"${concept}" Betweenness 급상승: ${previous.betweenness.toFixed(2)} → ${current.betweenness.toFixed(2)}`
      });
    }

    if (pageRankDiff > threshold * 0.5) {
      warnings.push({
        type: 'CENTRALITY_SPIKE',
        concept,
        metric: 'pageRank',
        previous: previous.pageRank,
        current: current.pageRank,
        change: pageRankDiff,
        severity: calculateSeverity(pageRankDiff, 0.02),
        message: `"${concept}" PageRank 급상승: 네트워크 영향력 증가`
      });
    }
  }

  return warnings;
}

/**
 * 의존성 과집중 감지
 */
export function detectDependencyCongestion(dependencyGraph, threshold = 3) {
  const warnings = [];
  const inDegree = {};

  // In-degree 계산
  for (const from in dependencyGraph) {
    for (const to of dependencyGraph[from]) {
      inDegree[to] = (inDegree[to] || 0) + 1;
    }
  }

  // 과집중된 노드 식별
  for (const node in inDegree) {
    if (inDegree[node] > threshold) {
      const totalNodes = Object.keys(dependencyGraph).length;
      const congestionRatio = inDegree[node] / totalNodes;

      warnings.push({
        type: 'DEPENDENCY_CONGESTION',
        node,
        inDegree: inDegree[node],
        threshold,
        congestionRatio,
        severity: calculateSeverity(congestionRatio, 0.5),
        message: `"${node}"에 과도한 의존성 집중: ${inDegree[node]}개 모듈이 의존`
      });
    }
  }

  return warnings;
}

/**
 * 테스트 증가율 감소 감지
 */
export function detectTestGrowthSlowdown(commitHistory, testHistory, windowSize = 5) {
  const warnings = [];

  if (commitHistory.length < windowSize * 2) return warnings;

  // 최근 2개 윈도우의 테스트 증가율 비교
  const recent = testHistory.slice(-windowSize);
  const previous = testHistory.slice(-windowSize * 2, -windowSize);

  const recentGrowth = calculateGrowthRate(recent);
  const previousGrowth = calculateGrowthRate(previous);

  if (previousGrowth > 0 && recentGrowth < previousGrowth * 0.5) {
    warnings.push({
      type: 'TEST_SLOWDOWN',
      metric: 'test_growth_rate',
      previousGrowth,
      recentGrowth,
      slowdownRate: 1 - (recentGrowth / previousGrowth),
      severity: calculateSeverity(1 - (recentGrowth / previousGrowth), 0.5),
      message: `테스트 증가율 급감: ${(previousGrowth * 100).toFixed(1)}% → ${(recentGrowth * 100).toFixed(1)}%`
    });
  }

  return warnings;
}

/**
 * 노드 고립 감지
 */
export function detectIsolatedNodes(conceptGraph, roleClassification) {
  const warnings = [];

  for (const node of conceptGraph.nodes) {
    // 연결된 간선 개수
    const connectedEdges = conceptGraph.edges.filter(
      e => e.from === node || e.to === node
    ).length;

    // 역할이 boundary 이상 낮고, 연결이 1개 이하
    const role = roleClassification[node];
    if ((role === 'boundary' || role === 'peripheral') && connectedEdges <= 1) {
      warnings.push({
        type: 'ISOLATED_NODE',
        node,
        role,
        connectionCount: connectedEdges,
        severity: 'LOW',
        message: `"${node}"이 고립되어 있습니다: 연결 ${connectedEdges}개`
      });
    }
  }

  return warnings;
}

/**
 * 코드-테스트-문서 불균형 감지
 */
export function detectImbalance(changes) {
  const warnings = [];

  const codeLines = changes.code || 0;
  const testLines = changes.test || 0;
  const docLines = changes.doc || 0;

  const total = codeLines + testLines + docLines;
  if (total === 0) return warnings;

  const codeRatio = codeLines / total;
  const testRatio = testLines / total;
  const docRatio = docLines / total;

  // 코드 > 80%, 테스트 < 10%
  if (codeRatio > 0.8 && testRatio < 0.1) {
    warnings.push({
      type: 'IMBALANCE_LOW_TEST',
      codeRatio,
      testRatio,
      docRatio,
      severity: 'HIGH',
      message: `코드 확장에 비해 테스트 부족: 코드 ${(codeRatio * 100).toFixed(0)}% vs 테스트 ${(testRatio * 100).toFixed(0)}%`
    });
  }

  // 문서 < 5%
  if (docRatio < 0.05 && total > 100) {
    warnings.push({
      type: 'IMBALANCE_LOW_DOC',
      codeRatio,
      testRatio,
      docRatio,
      severity: 'MEDIUM',
      message: `문서화 부족: 문서 ${(docRatio * 100).toFixed(0)}%`
    });
  }

  return warnings;
}

/**
 * 급격한 구조 변화 감지
 */
export function detectStructuralShift(graphHistoryTimeline, threshold = 0.3) {
  const warnings = [];

  if (graphHistoryTimeline.length < 2) return warnings;

  for (let i = 1; i < graphHistoryTimeline.length; i++) {
    const prev = graphHistoryTimeline[i - 1];
    const curr = graphHistoryTimeline[i];

    // 노드 수 변화
    const nodeChange = Math.abs(curr.nodeCount - prev.nodeCount) / prev.nodeCount;
    if (nodeChange > threshold) {
      warnings.push({
        type: 'STRUCTURAL_SHIFT_NODES',
        phase: i,
        previousCount: prev.nodeCount,
        currentCount: curr.nodeCount,
        changeRate: nodeChange,
        severity: calculateSeverity(nodeChange, 0.5),
        message: `노드 수 급변: ${prev.nodeCount} → ${curr.nodeCount}`
      });
    }

    // 엣지 수 변화
    const edgeChange = Math.abs(curr.edgeCount - prev.edgeCount) / Math.max(1, prev.edgeCount);
    if (edgeChange > threshold) {
      warnings.push({
        type: 'STRUCTURAL_SHIFT_EDGES',
        phase: i,
        previousCount: prev.edgeCount,
        currentCount: curr.edgeCount,
        changeRate: edgeChange,
        severity: calculateSeverity(edgeChange, 0.5),
        message: `관계 구조 급변: ${prev.edgeCount} → ${curr.edgeCount}`
      });
    }

    // 밀도 변화
    const prevDensity = prev.edgeCount / (prev.nodeCount * (prev.nodeCount - 1));
    const currDensity = curr.edgeCount / (curr.nodeCount * (curr.nodeCount - 1));
    const densityChange = Math.abs(currDensity - prevDensity);

    if (densityChange > threshold * 0.2) {
      warnings.push({
        type: 'STRUCTURAL_SHIFT_DENSITY',
        phase: i,
        previousDensity: prevDensity,
        currentDensity: currDensity,
        changeRate: densityChange,
        severity: calculateSeverity(densityChange, 0.1),
        message: `네트워크 밀도 급변: ${(prevDensity * 100).toFixed(1)}% → ${(currDensity * 100).toFixed(1)}%`
      });
    }
  }

  return warnings;
}

/**
 * 순환 의존성 감지
 */
export function detectCircularDependencies(dependencyGraph) {
  const warnings = [];
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = dependencyGraph[node] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart).concat(neighbor);
          cycles.push(cycle);
        }
      }
    }

    recursionStack.delete(node);
  }

  for (const node in dependencyGraph) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  for (const cycle of cycles) {
    warnings.push({
      type: 'CIRCULAR_DEPENDENCY',
      cycle,
      length: cycle.length,
      severity: 'HIGH',
      message: `순환 의존성 발견: ${cycle.slice(0, -1).join(' → ')} → ${cycle[0]}`
    });
  }

  return warnings;
}

/**
 * 심각도 계산
 */
function calculateSeverity(value, threshold) {
  if (value > threshold * 2) return 'CRITICAL';
  if (value > threshold * 1.5) return 'HIGH';
  if (value > threshold) return 'MEDIUM';
  return 'LOW';
}

/**
 * 성장률 계산
 */
function calculateGrowthRate(values) {
  if (values.length < 2) return 0;
  let totalGrowth = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) {
      totalGrowth += (values[i] - values[i - 1]) / values[i - 1];
    }
  }
  return totalGrowth / (values.length - 1);
}

/**
 * 포맷팅 (테스트용)
 */
export function formatWarnings(allWarnings) {
  const lines = [];

  lines.push('⚠️  설계 구조 경고');

  const bySeverity = {};
  for (const warning of allWarnings) {
    if (!bySeverity[warning.severity]) {
      bySeverity[warning.severity] = [];
    }
    bySeverity[warning.severity].push(warning);
  }

  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  for (const severity of severityOrder) {
    if (bySeverity[severity]) {
      lines.push(`\n   ${severity} (${bySeverity[severity].length})`);
      for (const w of bySeverity[severity]) {
        lines.push(`     - ${w.message}`);
      }
    }
  }

  return lines.join('\n');
}

export default {
  detectCentralitySpike,
  detectDependencyCongestion,
  detectTestGrowthSlowdown,
  detectIsolatedNodes,
  detectImbalance,
  detectStructuralShift,
  detectCircularDependencies,
  formatWarnings
};
