'use client'

import { StudyMetrics, getMetricsInterpretation } from '@/lib/metrics'
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertCircle, BarChart3, Award, Lightbulb } from 'lucide-react'

interface MetricsDashboardProps {
  metrics: StudyMetrics
}

export default function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  const interpretation = getMetricsInterpretation(metrics)

  const levelColors = {
    excellent: 'from-green-500 to-green-600',
    good: 'from-primary-500 to-primary-600',
    fair: 'from-yellow-500 to-yellow-600',
    'needs-improvement': 'from-accent to-accent-dark',
  }

  const levelIcons = {
    excellent: <Award className="w-6 h-6" />,
    good: <Target className="w-6 h-6" />,
    fair: <AlertCircle className="w-6 h-6" />,
    'needs-improvement': <Lightbulb className="w-6 h-6" />,
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Card */}
      <div className={`bg-gradient-to-br ${levelColors[interpretation.level]} rounded-2xl p-6 text-white shadow-xl`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {levelIcons[interpretation.level]}
              <h3 className="text-xl font-bold">Performance Overview</h3>
            </div>
            <p className="text-white/90 text-sm mb-3">{interpretation.message}</p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-white/80">Completion Rate:</span>
                <span className="ml-2 font-bold text-lg">{metrics.completionRate.toFixed(1)}%</span>
              </div>
              {metrics.averageAccuracy > 0 && (
                <div>
                  <span className="text-white/80">Avg. Accuracy:</span>
                  <span className="ml-2 font-bold text-lg">{metrics.averageAccuracy.toFixed(1)}h</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <h4 className="text-sm font-semibold mb-2">Recommendations:</h4>
          <ul className="space-y-1">
            {interpretation.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-white/90 flex items-start gap-2">
                <span className="text-white/60">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-navy/60 backdrop-blur-sm rounded-xl p-4 border border-primary-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-light/70">Total Assignments</span>
            <Target className="w-5 h-5 text-primary-400" />
          </div>
          <div className="text-2xl font-bold text-light">{metrics.totalAssignments}</div>
          <div className="text-xs text-light/60 mt-1">
            {metrics.completedAssignments} completed
          </div>
        </div>

        <div className="bg-dark-navy/60 backdrop-blur-sm rounded-xl p-4 border border-primary-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-light/70">Completion Rate</span>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-light">{metrics.completionRate.toFixed(1)}%</div>
          <div className="text-xs text-light/60 mt-1">
            {metrics.completedAssignments} of {metrics.totalAssignments}
          </div>
        </div>

        <div className="bg-dark-navy/60 backdrop-blur-sm rounded-xl p-4 border border-primary-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-light/70">Planning Accuracy</span>
            <Clock className="w-5 h-5 text-primary-400" />
          </div>
          <div className="text-2xl font-bold text-light">
            {metrics.averageAccuracy > 0 ? `${metrics.averageAccuracy.toFixed(1)}h` : 'N/A'}
          </div>
          <div className="text-xs text-light/60 mt-1">
            Avg. time difference
          </div>
        </div>

        <div className="bg-dark-navy/60 backdrop-blur-sm rounded-xl p-4 border border-primary-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-light/70">Time Efficiency</span>
            {metrics.timeDifference >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-accent" />
            )}
          </div>
          <div className="text-2xl font-bold text-light">
            {metrics.totalEstimatedHours > 0 ? `${metrics.accuracyPercentage.toFixed(0)}%` : 'N/A'}
          </div>
          <div className="text-xs text-light/60 mt-1">
            {metrics.timeDifference >= 0 ? 'Under estimate' : 'Over estimate'}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-dark-navy/60 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-bold text-light mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Assignment Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-light/80">Completed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-dark-navy/80 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${metrics.totalAssignments > 0 ? (metrics.completedAssignments / metrics.totalAssignments) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-light font-semibold w-12 text-right">{metrics.completedAssignments}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <span className="text-light/80">In Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-dark-navy/80 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${metrics.totalAssignments > 0 ? (metrics.inProgressAssignments / metrics.totalAssignments) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-light font-semibold w-12 text-right">{metrics.inProgressAssignments}</span>
              </div>
            </div>
            {metrics.overdueAssignments > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent"></div>
                  <span className="text-light/80">Overdue</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-dark-navy/80 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all"
                      style={{ width: `${metrics.totalAssignments > 0 ? (metrics.overdueAssignments / metrics.totalAssignments) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-light font-semibold w-12 text-right">{metrics.overdueAssignments}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-dark-navy/60 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-bold text-light mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-400" />
            Priority Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span className="text-light/80">High Priority</span>
              </div>
              <span className="text-light font-semibold">{metrics.priorityDistribution.high}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-light/80">Medium Priority</span>
              </div>
              <span className="text-light font-semibold">{metrics.priorityDistribution.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-light/80">Low Priority</span>
              </div>
              <span className="text-light font-semibold">{metrics.priorityDistribution.low}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Tracking */}
      {metrics.totalEstimatedHours > 0 && (
        <div className="bg-dark-navy/60 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-bold text-light mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Time Tracking Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-light/70 mb-1">Total Estimated</div>
              <div className="text-2xl font-bold text-light">{metrics.totalEstimatedHours.toFixed(1)} hrs</div>
            </div>
            <div>
              <div className="text-sm text-light/70 mb-1">Total Actual</div>
              <div className="text-2xl font-bold text-light">{metrics.totalActualHours.toFixed(1)} hrs</div>
            </div>
            <div>
              <div className="text-sm text-light/70 mb-1">Difference</div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                metrics.timeDifference >= 0 ? 'text-green-400' : 'text-accent'
              }`}>
                {metrics.timeDifference >= 0 ? '+' : ''}{metrics.timeDifference.toFixed(1)} hrs
                {metrics.timeDifference >= 0 ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
          {metrics.timeDifference !== 0 && (
            <div className="mt-4 pt-4 border-t border-light/10">
              <p className="text-sm text-light/70">
                {metrics.timeDifference > 0 
                  ? `You completed assignments ${metrics.timeDifference.toFixed(1)} hours faster than estimated. Great planning!`
                  : `You spent ${Math.abs(metrics.timeDifference).toFixed(1)} hours more than estimated. Consider adding buffer time to future estimates.`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Course Progress */}
      {metrics.courseProgress.length > 0 && (
        <div className="bg-dark-navy/60 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-bold text-light mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Course Progress
          </h3>
          <div className="space-y-4">
            {metrics.courseProgress.map((course) => (
              <div key={course.courseId}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-light/90 font-medium">{course.courseTitle}</span>
                  <span className="text-light/70 text-sm">
                    {course.assignmentsCompleted} / {course.assignmentsTotal}
                  </span>
                </div>
                <div className="w-full h-2 bg-dark-navy/80 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-accent transition-all"
                    style={{ width: `${course.progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-light/60 mt-1">
                  {course.progressPercentage.toFixed(0)}% complete
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

