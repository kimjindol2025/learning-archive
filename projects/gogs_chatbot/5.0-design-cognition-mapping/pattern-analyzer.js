/**
 * 사고 확장 패턴 분석 모듈
 * 설계 사고의 진화 추적
 */

/**
 * 단계별 사고 지도 생성
 */
export function generatePhaseEvolutionMaps(commits, phases) {
  const phaseMaps = {};

  // 각 Phase별 커밋 그룹화
  for (const commit of commits) {
    const phaseMatch = commit.message.match(/phase\s+(\d+)/i);
    if (phaseMatch) {
      const phase = `Phase ${phaseMatch[1]}`;

      if (!phaseMaps[phase]) {
        phaseMaps[phase] = {
          phase,
          commits: [],
          concepts: new Set(),
          timestamp: commit.timestamp
        };
      }

      phaseMaps[phase].commits.push(commit);
    }
  }

  // 각 Phase의 개념 추출
  for (const [phase, data] of Object.entries(phaseMaps)) {
    for (const commit of data.commits) {
      const lower = commit.message.toLowerCase();

      // 개념 키워드 추출
      if (lower.includes('type')) data.concepts.add('Type System');
      if (lower.includes('memory')) data.concepts.add('Memory Layout');
      if (lower.includes('ffi') || lower.includes('extern')) data.concepts.add('FFI Boundary');
      if (lower.includes('control')) data.concepts.add('Control Flow');
      if (lower.includes('unsafe')) data.concepts.add('Unsafe Pointer');
      if (lower.includes('test')) data.concepts.add('Testing');
      if (lower.includes('perf')) data.concepts.add('Performance');
    }

    // Set을 배열로 변환
    phaseMaps[phase].concepts = Array.from(data.concepts);
  }

  return phaseMaps;
}

/**
 * 사고 이동 분석
 */
export function analyzeCognitionShift(phaseMaps) {
  const phases = Object.keys(phaseMaps).sort();
  const shifts = [];

  for (let i = 1; i < phases.length; i++) {
    const prevPhase = phaseMaps[phases[i - 1]];
    const currPhase = phaseMaps[phases[i]];

    const shiftAnalysis = {
      from: phases[i - 1],
      to: phases[i],
      introduced: currPhase.concepts.filter(c => !prevPhase.concepts.includes(c)),
      removed: prevPhase.concepts.filter(c => !currPhase.concepts.includes(c)),
      maintained: currPhase.concepts.filter(c => prevPhase.concepts.includes(c))
    };

    shifts.push(shiftAnalysis);
  }

  return shifts;
}

/**
 * 개념 확산 분석
 */
export function analyzeConceptDiffusion(commits, intents) {
  const diffusion = new Map();

  // 개념별 시간순 추적
  for (const intent of intents) {
    // 의도에서 개념 추출
    const concepts = extractConceptsFromIntent(intent);

    for (const concept of concepts) {
      if (!diffusion.has(concept)) {
        diffusion.set(concept, {
          concept,
          firstIntroduced: intent.commit.timestamp,
          appearances: [],
          adoptionRate: 0,
          influenceScore: 0
        });
      }

      const data = diffusion.get(concept);
      data.appearances.push({
        timestamp: intent.commit.timestamp,
        impact: intent.impactLevel,
        category: intent.category
      });

      data.influenceScore += intent.impactLevel;
    }
  }

  // 확산 속도 계산
  for (const [concept, data] of diffusion) {
    if (data.appearances.length > 1) {
      const timespan = data.appearances[data.appearances.length - 1].timestamp -
                       data.firstIntroduced;
      const adoptionRate = Math.min(1.0, data.appearances.length / 10);

      diffusion.set(concept, {
        ...data,
        adoptionRate,
        lifespan: timespan,
        stability: calculateStability(data.appearances)
      });
    }
  }

  return Object.fromEntries(diffusion);
}

/**
 * 의도에서 개념 추출
 */
function extractConceptsFromIntent(intent) {
  const concepts = [];
  const conceptKeywords = {
    'Type System': /type|generic|trait|interface/i,
    'Memory Layout': /memory|heap|stack|allocation/i,
    'FFI Boundary': /ffi|extern|interop|binding/i,
    'Control Flow': /control|branch|loop|conditional/i,
    'Unsafe Pointer': /unsafe|raw|unmanaged/i,
    'Performance': /perf|optim|fast|efficient/i,
    'Testing': /test|verify|spec|coverage/i
  };

  for (const [concept, pattern] of Object.entries(conceptKeywords)) {
    if (pattern.test(intent.intent)) {
      concepts.push(concept);
    }
  }

  return concepts;
}

/**
 * 안정성 계산
 */
function calculateStability(appearances) {
  if (appearances.length < 2) return 1.0;

  // 최근 변화량으로 안정성 계산
  const recent = appearances.slice(-5);
  const older = appearances.slice(0, Math.max(1, appearances.length - 5));

  const recentAvgImpact = recent.reduce((sum, a) => sum + a.impact, 0) / recent.length;
  const olderAvgImpact = older.reduce((sum, a) => sum + a.impact, 0) / older.length;

  // 변화가 적을수록 안정성이 높음
  const change = Math.abs(recentAvgImpact - olderAvgImpact);
  return Math.max(0, 1.0 - change);
}

/**
 * 구조 진화 추적
 */
export function trackStructuralEvolution(graphs) {
  const evolution = {
    timeline: [],
    growth: []
  };

  let prevNodeCount = 0;
  let prevEdgeCount = 0;

  for (const graph of graphs) {
    const nodeCount = graph.nodes.length;
    const edgeCount = graph.edges.length;

    evolution.timeline.push({
      nodeCount,
      edgeCount,
      density: edgeCount > 0 ? edgeCount / (nodeCount * (nodeCount - 1) / 2) : 0,
      growth: {
        nodeIncrease: nodeCount - prevNodeCount,
        edgeIncrease: edgeCount - prevEdgeCount
      }
    });

    prevNodeCount = nodeCount;
    prevEdgeCount = edgeCount;
  }

  // 성장 추세
  for (let i = 1; i < evolution.timeline.length; i++) {
    const growth = evolution.timeline[i].growth.nodeIncrease +
                   evolution.timeline[i].growth.edgeIncrease;
    evolution.growth.push(growth);
  }

  return evolution;
}

/**
 * 설계 패턴 자동 감지
 */
export function detectDesignPatterns(cognitionMap, intents) {
  const patterns = {
    coreStabilization: false,
    peripheralExpansion: false,
    conceptMerge: false,
    conceptDivergence: false,
    cyclicDependency: false
  };

  // 핵심 개념 안정성 (최근 변화 없음)
  const coreChanges = intents.filter(i =>
    cognitionMap.structure.coreLayer.some(c => i.intent.includes(c))
  );
  if (coreChanges.length === 0) {
    patterns.coreStabilization = true;
  }

  // 주변 개념 확장
  const boundaryChanges = intents.filter(i =>
    cognitionMap.structure.boundaryLayer.some(c => i.intent.includes(c))
  );
  if (boundaryChanges.length > intents.length * 0.3) {
    patterns.peripheralExpansion = true;
  }

  // 순환 의존성 감지
  for (const edge of cognitionMap.edges) {
    for (const edge2 of cognitionMap.edges) {
      if (edge.from === edge2.to && edge.to === edge2.from) {
        patterns.cyclicDependency = true;
        break;
      }
    }
  }

  return patterns;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatPatternAnalysis(shifts, patterns) {
  const lines = [];

  lines.push('📊 사고 확장 패턴');
  lines.push(`   단계 이동: ${shifts.length}회`);

  if (patterns.coreStabilization) {
    lines.push('   ✓ 핵심 개념 안정화');
  }
  if (patterns.peripheralExpansion) {
    lines.push('   ✓ 주변 개념 확장');
  }
  if (patterns.cyclicDependency) {
    lines.push('   ⚠ 순환 의존성');
  }

  return lines.join('\n');
}

export default {
  generatePhaseEvolutionMaps,
  analyzeCognitionShift,
  analyzeConceptDiffusion,
  trackStructuralEvolution,
  detectDesignPatterns,
  formatPatternAnalysis
};
