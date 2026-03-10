/**
 * 의존성 맵 생성 모듈
 * 모듈 간 구조적 관계 자동 추출
 */

/**
 * 파일 경로로부터 모듈 추출
 */
export function extractModulesFromPaths(filePaths) {
  const modules = {};

  for (const path of filePaths) {
    const parts = path.split('/');
    const moduleName = parts.length > 1 ? parts[0] : 'root';
    const fileType = getFileType(path);

    if (!modules[moduleName]) {
      modules[moduleName] = {
        name: moduleName,
        files: [],
        fileTypes: {},
        complexity: 0
      };
    }

    modules[moduleName].files.push(path);
    modules[moduleName].fileTypes[fileType] = (modules[moduleName].fileTypes[fileType] || 0) + 1;
    modules[moduleName].complexity += calculateFileComplexity(path, fileType);
  }

  return modules;
}

/**
 * 파일 타입 결정
 */
function getFileType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const typeMap = {
    'rs': 'source',
    'ts': 'source',
    'js': 'source',
    'py': 'source',
    'go': 'source',
    'cpp': 'source',
    'c': 'source',
    'h': 'header',
    'md': 'spec',
    'txt': 'doc',
    'test': 'test',
    'spec': 'spec',
    'json': 'config',
    'toml': 'config',
    'yaml': 'config',
    'yml': 'config'
  };

  return typeMap[ext] || 'other';
}

/**
 * 파일 복잡도 계산
 */
function calculateFileComplexity(filePath, fileType) {
  // 파일명 길이와 타입으로부터 복잡도 추정
  const pathScore = Math.min(1.0, filePath.length / 50);
  const typeScore = {
    'source': 0.8,
    'header': 0.6,
    'spec': 0.4,
    'test': 0.5,
    'config': 0.2,
    'doc': 0.1,
    'other': 0.3
  };

  return (pathScore * 0.5 + (typeScore[fileType] || 0.3) * 0.5);
}

/**
 * 의도 시퀀스로부터 모듈 진화 추적
 */
export function trackModuleEvolution(intentSequence) {
  const moduleTimeline = {};

  for (const intent of intentSequence) {
    const modules = extractModulesFromPaths(
      intent.diffSummary?.fileTypes ? Object.keys(intent.diffSummary.fileTypes) : []
    );

    for (const [moduleName, moduleInfo] of Object.entries(modules)) {
      if (!moduleTimeline[moduleName]) {
        moduleTimeline[moduleName] = {
          name: moduleName,
          firstModified: intent.commit.timestamp,
          lastModified: intent.commit.timestamp,
          modifications: 0,
          impactHistory: []
        };
      }

      moduleTimeline[moduleName].lastModified = intent.commit.timestamp;
      moduleTimeline[moduleName].modifications++;
      moduleTimeline[moduleName].impactHistory.push({
        timestamp: intent.commit.timestamp,
        impact: intent.impactLevel,
        category: intent.category
      });
    }
  }

  return moduleTimeline;
}

/**
 * 모듈 간 의존성 추론
 */
export function inferModuleDependencies(modules, intentSequence) {
  const dependencies = {};
  const dependencyPatterns = buildDependencyPatterns();

  // 모듈 초기화
  for (const moduleName of Object.keys(modules)) {
    dependencies[moduleName] = {
      module: moduleName,
      dependsOn: [],
      requiredBy: [],
      relationships: []
    };
  }

  // 의도 시퀀스에서 의존성 추론
  let prevModule = null;

  for (const intent of intentSequence) {
    const currentModule = identifyPrimaryModule(intent);

    if (prevModule && prevModule !== currentModule) {
      // 순차적 의존성
      const depType = inferDependencyType(prevModule, currentModule, intent.category);
      if (depType) {
        addDependency(dependencies, prevModule, currentModule, depType);
      }
    }

    // 의도 기반 의존성
    const inferred = inferFromIntentCategory(currentModule, intent.category);
    for (const [depModule, depType] of Object.entries(inferred)) {
      if (dependencies[depModule]) {
        addDependency(dependencies, currentModule, depModule, depType);
      }
    }

    prevModule = currentModule;
  }

  return dependencies;
}

/**
 * 의도의 주요 모듈 식별
 */
function identifyPrimaryModule(intent) {
  const message = intent.commit.message.toLowerCase();
  const fileTypes = intent.diffSummary?.fileTypes || {};
  const keywords = intent.diffSummary?.keywords || [];

  // 파일 타입 기반 모듈 결정
  if (fileTypes['test']) return 'test';
  if (fileTypes['spec']) return 'spec';
  if (fileTypes['unsafe'] || keywords.includes('unsafe')) return 'unsafe';
  if (keywords.includes('ffi')) return 'ffi';
  if (message.includes('memory')) return 'memory';
  if (message.includes('type')) return 'type';

  return 'main';
}

/**
 * 의존성 타입 추론
 */
function inferDependencyType(fromModule, toModule, category) {
  const patterns = {
    'Verification': 'tests',
    'Architecture': 'provides_interface',
    'Performance': 'optimizes',
    'API': 'extends',
    'Refactoring': 'refines',
    'Quality': 'validates'
  };

  return patterns[category] || 'related';
}

/**
 * 의도 카테고리로부터 의존성 추론
 */
function inferFromIntentCategory(module, category) {
  const categoryDeps = {
    'Verification': { 'main': 'tested_by', 'spec': 'validates' },
    'Architecture': { 'memory': 'uses', 'type': 'uses' },
    'Performance': { 'memory': 'optimizes', 'unsafe': 'uses' },
    'API': { 'type': 'uses', 'memory': 'manages' },
    'Refactoring': { 'main': 'refines' },
    'Quality': { 'test': 'validated_by', 'spec': 'conforms_to' }
  };

  return categoryDeps[category] || {};
}

/**
 * 의존성 추가
 */
function addDependency(dependencies, fromModule, toModule, depType) {
  if (!dependencies[fromModule]) return;
  if (!dependencies[toModule]) return;

  const dep = {
    target: toModule,
    type: depType,
    strength: 0.7
  };

  // 중복 확인
  const exists = dependencies[fromModule].dependsOn.find(d => d.target === toModule);
  if (!exists) {
    dependencies[fromModule].dependsOn.push(dep);
    dependencies[toModule].requiredBy.push({
      ...dep,
      target: fromModule
    });
  }
}

/**
 * 의존성 패턴 구축
 */
function buildDependencyPatterns() {
  return {
    coreModules: ['type', 'memory', 'unsafe'],
    layerDependencies: {
      'unsafe': ['memory'],
      'memory': ['type'],
      'ffi': ['unsafe', 'memory'],
      'api': ['type', 'memory'],
      'test': ['main']
    }
  };
}

/**
 * 의존성 순환 검사
 */
export function detectCycles(dependencies) {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  function hasCycle(module, path) {
    visited.add(module);
    recursionStack.add(module);
    path.push(module);

    const deps = dependencies[module]?.dependsOn || [];
    for (const dep of deps) {
      if (!visited.has(dep.target)) {
        if (hasCycle(dep.target, [...path])) {
          return true;
        }
      } else if (recursionStack.has(dep.target)) {
        // 순환 발견
        const cycleStart = path.indexOf(dep.target);
        cycles.push(path.slice(cycleStart).concat(dep.target));
      }
    }

    recursionStack.delete(module);
    return false;
  }

  for (const module of Object.keys(dependencies)) {
    if (!visited.has(module)) {
      hasCycle(module, []);
    }
  }

  return cycles;
}

/**
 * 의존성 복잡도 메트릭
 */
export function calculateDependencyMetrics(dependencies) {
  const metrics = {
    totalModules: Object.keys(dependencies).length,
    totalDependencies: 0,
    averageDependencies: 0,
    maxDependencies: 0,
    modulesWithNoDeps: 0,
    modulesWithCircularDeps: 0,
    dependencyDensity: 0
  };

  let totalDeps = 0;
  let maxDeps = 0;
  let noDeps = 0;

  for (const [module, deps] of Object.entries(dependencies)) {
    const depCount = deps.dependsOn.length;
    totalDeps += depCount;
    maxDeps = Math.max(maxDeps, depCount);

    if (depCount === 0) noDeps++;
  }

  metrics.totalDependencies = totalDeps;
  metrics.averageDependencies = metrics.totalModules > 0 ? totalDeps / metrics.totalModules : 0;
  metrics.maxDependencies = maxDeps;
  metrics.modulesWithNoDeps = noDeps;
  metrics.dependencyDensity = metrics.totalModules > 1
    ? totalDeps / (metrics.totalModules * (metrics.totalModules - 1))
    : 0;

  return metrics;
}

/**
 * 포맷팅 (테스트용)
 */
export function formatDependencyMap(dependencies) {
  const lines = [];

  lines.push('🔗 의존성 맵');

  for (const [module, deps] of Object.entries(dependencies)) {
    if (deps.dependsOn.length > 0) {
      lines.push(`   ${module}:`);
      for (const dep of deps.dependsOn) {
        lines.push(`     → ${dep.target} (${dep.type})`);
      }
    }
  }

  return lines.join('\n');
}

export default {
  extractModulesFromPaths,
  trackModuleEvolution,
  inferModuleDependencies,
  detectCycles,
  calculateDependencyMetrics,
  formatDependencyMap
};
