export interface NodejsPerformanceMetrics {
  eventLoop: {
    score: number
    status: "good" | "warning" | "critical"
    blockingOperations: Array<{
      file: string
      line?: number
      issue: string
      severity: "high" | "medium" | "low" | "info"
    }>
    recommendations: string[]
  }
  concurrency: {
    score: number
    status: "good" | "warning" | "critical"
    unboundedOperations: Array<{
      file: string
      issue: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  memoryLeaks: {
    score: number
    status: "good" | "warning" | "critical"
    potentialLeaks: Array<{
      file: string
      issue: string
      severity: "high" | "medium" | "low" | "info"
    }>
    recommendations: string[]
  }
  dbQueryEfficiency: {
    score: number
    status: "good" | "warning" | "critical"
    inefficientQueries: Array<{
      pattern: string
      count: number
      issue: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  caching: {
    score: number
    status: "good" | "warning" | "critical"
    currentCaching: Array<{
      endpoint: string
      cached: boolean
      ttl: string
    }>
    missingCaching: Array<{
      endpoint: string
      frequency: string
      impact: string
    }>
    recommendations: string[]
  }
  timeouts: {
    score: number
    status: "good" | "warning" | "critical"
    missingTimeouts: Array<{
      file: string
      line?: number
      issue: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  coldStart: {
    score: number
    status: "good" | "warning" | "critical"
    issues: Array<{
      issue: string
      impact: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  logging: {
    score: number
    status: "good" | "warning" | "critical"
    issues: Array<{
      issue: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  horizontalScalability: {
    score: number
    status: "good" | "warning" | "critical"
    issues: Array<{
      issue: string
      impact: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  overallScore: number
}

export interface OptimizationMetrics {
  database: {
    totalTables: number
    tablesWithRLS: number
    tablesWithoutRLS: string[]
    indexCoverage: number
    potentialIndexes: string[]
  }
  performance: {
    avgResponseTime: number
    slowQueries: number
    cacheHitRate: number
    memoryUsage: number
  }
  security: {
    rlsCompliance: number
    vulnerabilities: Array<{ type: string; severity: string; description: string }>
    functionSecurityIssues?: number
    passwordProtectionEnabled?: boolean
  }
  nodejsPerformance?: NodejsPerformanceMetrics
  recommendations: Array<{
    category: string
    priority: "high" | "medium" | "low"
    title: string
    description: string
    impact: string
    action: string
  }>
}
