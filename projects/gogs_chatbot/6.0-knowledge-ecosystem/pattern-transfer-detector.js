/**
 * 패턴 전이 감지 모듈
 * 저장소 간 설계 패턴의 전이와 진화 추적
 */

/**
 * 전이 경로 패턴 식별
 */
export function identifyTransferPathPatterns(transfers) {
  const patterns = {
    linearChain: [],      // A → B → C 형태
    fanOut: [],           // A → B,C,D 형태
    fanIn: [],            // A,B,C → D 형태
    cycle: [],            // A → B → A 형태
    diamond: []           // A → B,C → D 형태
  };

  // 각 저장소의 in/out degree 계산
  const inDegree = {};
  const outDegree = {};
  const edges = {};

  for (const transfer of transfers) {
    // degree 계산
    outDegree[transfer.from] = (outDegree[transfer.from] || 0) + 1;
    inDegree[transfer.to] = (inDegree[transfer.to] || 0) + 1;

    // edge 저장
    const key = `${transfer.from}→${transfer.to}`;
    if (!edges[key]) edges[key] = [];
    edges[key].push(transfer);
  }

  // 패턴 분류
  for (const [repo, out] of Object.entries(outDegree)) {
    const inp = inDegree[repo] || 0;

    if (out === 1 && inp === 1) {
      // 선형 체인
      patterns.linearChain.push(repo);
    } else if (out > 1 && inp <= 1) {
      // Fan-out: 여러 곳으로 분산
      patterns.fanOut.push({
        source: repo,
        targets: Object.keys(edges)
          .filter(k => k.startsWith(`${repo}→`))
          .map(k => k.split('→')[1])
      });
    } else if (inp > 1 && out <= 1) {
      // Fan-in: 여러 곳에서 수집
      patterns.fanIn.push({
        target: repo,
        sources: Object.keys(edges)
          .filter(k => k.endsWith(`→${repo}`))
          .map(k => k.split('→')[0])
      });
    }
  }

  // 순환 감지
  const cycles = detectCycles(edges);
  patterns.cycle = cycles;

  // Diamond 패턴: A → B,C → D
  for (const transfer1 of transfers) {
    for (const transfer2 of transfers) {
      if (transfer1.to === transfer2.from &&
          transfer1.from !== transfer2.to &&
          transfer1.from !== transfer2.from) {
        for (const transfer3 of transfers) {
          if ((transfer3.from === transfer1.to || transfer3.from === transfer2.from) &&
              transfer3.to === transfer2.to) {
            patterns.diamond.push({
              a: transfer1.from,
              b: transfer1.to,
              c: transfer2.from,
              d: transfer2.to
            });
          }
        }
      }
    }
  }

  return patterns;
}

/**
 * 순환 감지 (DFS)
 */
function detectCycles(edges) {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const outEdges = Object.keys(edges)
      .filter(k => k.startsWith(`${node}→`))
      .map(k => k.split('→')[1]);

    for (const neighbor of outEdges) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(neighbor));
        }
      }
    }

    recursionStack.delete(node);
  }

  const nodes = new Set();
  for (const key of Object.keys(edges)) {
    const [from, to] = key.split('→');
    nodes.add(from);
    nodes.add(to);
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

/**
 * 개념 전이 궤적 추적
 */
export function traceConceptTrajectories(transfers, aggregated) {
  const trajectories = {};

  for (const transfer of transfers) {
    const concept = transfer.concept;
    if (!trajectories[concept]) {
      trajectories[concept] = {
        concept,
        path: [],
        timeline: [],
        totalHops: 0,
        adoptionRate: 0
      };
    }

    trajectories[concept].path.push({
      from: transfer.from,
      to: transfer.to,
      direction: transfer.direction
    });

    trajectories[concept].timeline.push({
      timestamp: transfer.targetTime,
      repo: transfer.to,
      lag: transfer.transferLag
    });

    trajectories[concept].totalHops++;
  }

  // 채택률 계산
  for (const concept in trajectories) {
    const origins = aggregated.conceptOrigins[concept] || [];
    const uniqueRepos = new Set(origins.map(o => o.repo)).size;
    trajectories[concept].adoptionRate = Math.min(1.0, uniqueRepos / 10); // 10개 저장소 기준
  }

  return trajectories;
}

/**
 * 설계 패턴 전이 분류
 */
export function classifyPatternTransfers(transfers, trajectories) {
  const classifications = {
    conservative: [],      // 변화 최소, 핵심만 확산
    progressive: [],       // 단계적 진화, 점진적 확산
    revolutionary: [],     // 급격한 변화, 빠른 확산
    stagnant: []          // 정체, 확산 없음
  };

  for (const transfer of transfers) {
    const trajectory = trajectories[transfer.concept];
    if (!trajectory) continue;

    const lagDays = transfer.transferLag / (1000 * 60 * 60 * 24);
    const adoptionSpeed = trajectory.adoptionRate / Math.max(1, trajectory.totalHops);

    if (adoptionSpeed < 0.1) {
      classifications.stagnant.push(transfer);
    } else if (lagDays > 90 && adoptionSpeed < 0.3) {
      classifications.conservative.push(transfer);
    } else if (lagDays < 30 && adoptionSpeed > 0.5) {
      classifications.revolutionary.push(transfer);
    } else {
      classifications.progressive.push(transfer);
    }
  }

  return classifications;
}

/**
 * 영향력 확산 분석
 */
export function analyzeInfluenceDiffusion(aggregated, transfers, concepts) {
  const diffusion = {};

  for (const concept in concepts) {
    const conceptTransfers = transfers.filter(t => t.concept === concept);
    if (conceptTransfers.length === 0) continue;

    const origins = aggregated.conceptOrigins[concept] || [];
    const firstAppearance = origins.length > 0 ?
      Math.min(...origins.map(o => new Date(o.timestamp).getTime())) : Date.now();

    const spread = conceptTransfers.map(t => ({
      repo: t.to,
      time: new Date(t.targetTime).getTime(),
      delay: new Date(t.targetTime).getTime() - firstAppearance
    })).sort((a, b) => a.time - b.time);

    // 확산 속도: 각 단계별 delay 계산
    let totalDelay = 0;
    const speeds = [];
    for (let i = 1; i < spread.length; i++) {
      const speed = spread[i].delay - spread[i - 1].delay;
      speeds.push(speed);
      totalDelay += speed;
    }

    const avgSpeed = speeds.length > 0 ? totalDelay / speeds.length : 0;
    const acceleration = speeds.length > 1 ?
      (speeds[speeds.length - 1] - speeds[0]) / speeds.length : 0;

    diffusion[concept] = {
      concept,
      spread,
      avgSpeed,
      acceleration,
      isAccelerating: acceleration > 0,
      reachCount: spread.length,
      totalTimespan: spread.length > 0 ?
        spread[spread.length - 1].delay : 0
    };
  }

  return diffusion;
}

/**
 * 저장소 영향 프로필
 */
export function buildRepositoryInfluenceProfile(transfers, aggregated) {
  const profiles = {};

  // 모든 저장소의 기본 프로필 초기화
  for (const repo in aggregated.repositories) {
    profiles[repo] = {
      repo,
      influencedRepos: new Set(),
      influencedByRepos: new Set(),
      conceptsIntroduced: [],
      conceptsAdopted: [],
      timeToInfluence: [] // 영향을 미치는데 걸린 시간들
    };
  }

  // Transfer 데이터로 프로필 채우기
  for (const transfer of transfers) {
    profiles[transfer.from].influencedRepos.add(transfer.to);
    profiles[transfer.to].influencedByRepos.add(transfer.from);

    profiles[transfer.from].conceptsIntroduced.push(transfer.concept);
    profiles[transfer.to].conceptsAdopted.push(transfer.concept);

    const lagDays = transfer.transferLag / (1000 * 60 * 60 * 24);
    profiles[transfer.from].timeToInfluence.push(lagDays);
  }

  // Set을 배열로 변환하고 통계 계산
  for (const repo in profiles) {
    const profile = profiles[repo];

    profile.influenceReach = profile.influencedRepos.size;
    profile.influenceSource = profile.influencedByRepos.size;
    profile.uniqueConceptsIntroduced = new Set(profile.conceptsIntroduced).size;
    profile.uniqueConceptsAdopted = new Set(profile.conceptsAdopted).size;

    const avgTime = profile.timeToInfluence.length > 0 ?
      profile.timeToInfluence.reduce((a, b) => a + b, 0) / profile.timeToInfluence.length : 0;
    profile.avgTimeToInfluence = avgTime;

    // 영향력 지수: reach × unique concepts / (avg time + 1)
    profile.influenceIndex = (profile.influenceReach * profile.uniqueConceptsIntroduced) /
      Math.max(1, profile.avgTimeToInfluence);

    delete profile.influencedRepos;
    delete profile.influencedByRepos;
    delete profile.timeToInfluence;
  }

  return profiles;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatPatternAnalysis(patterns, trajectories, diffusion) {
  const lines = [];

  lines.push('🔄 패턴 전이 분석');
  lines.push(`   선형 체인: ${patterns.linearChain.length}개`);
  lines.push(`   Fan-Out: ${patterns.fanOut.length}개`);
  lines.push(`   Fan-In: ${patterns.fanIn.length}개`);
  lines.push(`   순환: ${patterns.cycle.length}개`);
  lines.push(`   Diamond: ${patterns.diamond.length}개`);
  lines.push('');
  lines.push('📈 개념 궤적');
  lines.push(`   추적 중인 개념: ${Object.keys(trajectories).length}개`);

  return lines.join('\n');
}

export default {
  identifyTransferPathPatterns,
  traceConceptTrajectories,
  classifyPatternTransfers,
  analyzeInfluenceDiffusion,
  buildRepositoryInfluenceProfile,
  formatPatternAnalysis
};
