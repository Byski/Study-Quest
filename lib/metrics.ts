// Metrics tracking and calculation utilities

export interface StudyMetrics {
  totalAssignments: number
  completedAssignments: number
  inProgressAssignments: number
  overdueAssignments: number
  completionRate: number
  averageAccuracy: number
  totalEstimatedHours: number
  totalActualHours: number
  timeDifference: number
  accuracyPercentage: number
  priorityDistribution: {
    high: number
    medium: number
    low: number
  }
  weeklyProgress: {
    week: string
    completed: number
    estimatedHours: number
    actualHours: number
  }[]
  courseProgress: {
    courseId: string
    courseTitle: string
    assignmentsCompleted: number
    assignmentsTotal: number
    progressPercentage: number
  }[]
}

export interface AssignmentWithSubmission {
  id: string
  title: string
  due_date: string | null
  status: string
  estimated_hours?: number | null
  actual_hours?: number | null
  priority?: 'high' | 'medium' | 'low' | null
  course_id: string
  courses?: {
    id: string
    title: string
  }
}

export function calculateMetrics(
  assignments: AssignmentWithSubmission[],
  submissions: Record<string, any>
): StudyMetrics {
  const totalAssignments = assignments.length
  let completedAssignments = 0
  let inProgressAssignments = 0
  let overdueAssignments = 0
  let totalEstimatedHours = 0
  let totalActualHours = 0
  let accuracySum = 0
  let accuracyCount = 0
  const priorityDistribution = { high: 0, medium: 0, low: 0 }
  const weeklyData: Record<string, { completed: number; estimatedHours: number; actualHours: number }> = {}
  const courseProgress: Record<string, { completed: number; total: number; title: string }> = {}

  assignments.forEach((assignment) => {
    const submission = submissions[assignment.id]
    // Use submission status if available, otherwise use assignment status
    const status = submission?.status || assignment.status || 'pending'
    
    // Count by status
    if (status === 'completed' || status === 'submitted') {
      completedAssignments++
    } else if (status === 'in_progress') {
      inProgressAssignments++
    } else if (status === 'overdue') {
      overdueAssignments++
    }

    // Track priority
    const priority = submission?.priority || 'medium'
    priorityDistribution[priority as keyof typeof priorityDistribution]++

    // Calculate hours and accuracy
    const estimated = submission?.estimated_hours || 0
    const actual = submission?.actual_hours || 0
    
    if (estimated > 0 && actual > 0 && (status === 'completed' || status === 'submitted')) {
      totalEstimatedHours += estimated
      totalActualHours += actual
      const accuracy = Math.abs(actual - estimated)
      accuracySum += accuracy
      accuracyCount++
    }

    // Weekly progress tracking
    if (assignment.due_date) {
      const date = new Date(assignment.due_date)
      const weekKey = getWeekKey(date)
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { completed: 0, estimatedHours: 0, actualHours: 0 }
      }
      if (status === 'completed' || status === 'submitted') {
        weeklyData[weekKey].completed++
        weeklyData[weekKey].estimatedHours += estimated || 0
        weeklyData[weekKey].actualHours += actual || 0
      }
    }

    // Course progress tracking
    const courseId = assignment.course_id
    const courseTitle = assignment.courses?.title || 'Unknown Course'
    if (!courseProgress[courseId]) {
      courseProgress[courseId] = { completed: 0, total: 0, title: courseTitle }
    }
    courseProgress[courseId].total++
    if (status === 'completed' || status === 'submitted') {
      courseProgress[courseId].completed++
    }
  })

  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0
  const averageAccuracy = accuracyCount > 0 ? accuracySum / accuracyCount : 0
  const timeDifference = totalActualHours - totalEstimatedHours
  const accuracyPercentage = totalEstimatedHours > 0 
    ? ((totalEstimatedHours / totalActualHours) * 100) 
    : 100

  const weeklyProgress = Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week,
      completed: data.completed,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
    }))

  const courseProgressArray = Object.entries(courseProgress).map(([courseId, data]) => ({
    courseId,
    courseTitle: data.title,
    assignmentsCompleted: data.completed,
    assignmentsTotal: data.total,
    progressPercentage: data.total > 0 ? (data.completed / data.total) * 100 : 0,
  }))

  return {
    totalAssignments,
    completedAssignments,
    inProgressAssignments,
    overdueAssignments,
    completionRate,
    averageAccuracy,
    totalEstimatedHours,
    totalActualHours,
    timeDifference,
    accuracyPercentage,
    priorityDistribution,
    weeklyProgress,
    courseProgress: courseProgressArray,
  }
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const week = Math.ceil(day / 7)
  return `${year}-W${month}-${week}`
}

export function getMetricsInterpretation(metrics: StudyMetrics): {
  level: 'excellent' | 'good' | 'fair' | 'needs-improvement'
  message: string
  recommendations: string[]
} {
  const recommendations: string[] = []
  let level: 'excellent' | 'good' | 'fair' | 'needs-improvement' = 'good'
  let message = ''

  // Completion rate analysis
  if (metrics.completionRate >= 90) {
    message += 'Excellent completion rate! '
    level = 'excellent'
  } else if (metrics.completionRate >= 70) {
    message += 'Good progress on assignments. '
  } else if (metrics.completionRate >= 50) {
    message += 'You\'re making progress, but there\'s room for improvement. '
    level = 'fair'
    recommendations.push('Focus on completing pending assignments to improve your completion rate')
  } else {
    message += 'Completion rate needs attention. '
    level = 'needs-improvement'
    recommendations.push('Prioritize completing overdue and pending assignments')
  }

  // Planning accuracy analysis
  if (metrics.averageAccuracy <= 1) {
    message += 'Your time estimates are very accurate! '
    if (level === 'good') level = 'excellent'
  } else if (metrics.averageAccuracy <= 2) {
    message += 'Your planning accuracy is good. '
  } else {
    message += 'Consider improving your time estimation skills. '
    if (level === 'excellent') level = 'good'
    else if (level === 'good') level = 'fair'
    recommendations.push('Review completed assignments to better estimate time for similar tasks')
  }

  // Overdue assignments
  if (metrics.overdueAssignments > 0) {
    message += `You have ${metrics.overdueAssignments} overdue assignment(s). `
    if (level === 'excellent') level = 'good'
    else if (level === 'good') level = 'fair'
    recommendations.push('Address overdue assignments immediately')
  }

  // Priority distribution
  const highPriorityCount = metrics.priorityDistribution.high
  if (highPriorityCount > metrics.totalAssignments * 0.5) {
    recommendations.push('Consider if all high-priority items truly need immediate attention')
  }

  // Time management
  if (metrics.timeDifference > 0 && metrics.totalActualHours > 0) {
    const overagePercentage = (metrics.timeDifference / metrics.totalEstimatedHours) * 100
    if (overagePercentage > 20) {
      recommendations.push('You\'re consistently underestimating time. Add buffer time to your estimates')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep up the great work!')
  }

  return { level, message, recommendations }
}
