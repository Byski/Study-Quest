/**
 * Metrics calculation functions
 * Pure TypeScript functions for calculating study metrics
 */

export interface StudySession {
  id: string;
  duration: number; // in minutes
  subject: string;
  date: Date;
  completed: boolean;
}

export interface StudyGoal {
  id: string;
  subject: string;
  targetHours: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status: 'todo' | 'doing' | 'done';
  priority: 'high' | 'medium' | 'low';
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  estimatedHours?: number;
  actualHours?: number;
}


/**
 * Calculate total study time from sessions
 */
export function calculateTotalStudyTime(sessions: StudySession[]): number {
  return sessions
    .filter((session) => session.completed)
    .reduce((total, session) => total + session.duration, 0);
}

/**
 * Calculate study time by subject
 */
export function calculateStudyTimeBySubject(
  sessions: StudySession[]
): Record<string, number> {
  return sessions
    .filter((session) => session.completed)
    .reduce((acc, session) => {
      const subject = session.subject;
      acc[subject] = (acc[subject] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);
}

/**
 * Calculate study time for a specific date range
 */
export function calculateStudyTimeInRange(
  sessions: StudySession[],
  startDate: Date,
  endDate: Date
): number {
  return sessions
    .filter((session) => {
      const sessionDate = new Date(session.date);
      return (
        session.completed &&
        sessionDate >= startDate &&
        sessionDate <= endDate
      );
    })
    .reduce((total, session) => total + session.duration, 0);
}

/**
 * Calculate goal progress percentage
 */
export function calculateGoalProgress(
  goal: StudyGoal,
  sessions: StudySession[]
): number {
  const targetMinutes = goal.targetHours * 60;
  const relevantSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return (
      session.completed &&
      session.subject === goal.subject &&
      sessionDate >= goal.startDate &&
      sessionDate <= goal.endDate
    );
  });

  const actualMinutes = relevantSessions.reduce(
    (total, session) => total + session.duration,
    0
  );

  return Math.min((actualMinutes / targetMinutes) * 100, 100);
}

/**
 * Calculate average study session duration
 */
export function calculateAverageSessionDuration(
  sessions: StudySession[]
): number {
  const completedSessions = sessions.filter((session) => session.completed);
  if (completedSessions.length === 0) return 0;

  const totalDuration = completedSessions.reduce(
    (total, session) => total + session.duration,
    0
  );
  return totalDuration / completedSessions.length;
}

/**
 * Calculate study streak (consecutive days with study sessions)
 */
export function calculateStudyStreak(sessions: StudySession[]): number {
  const completedSessions = sessions
    .filter((session) => session.completed)
    .map((session) => {
      const date = new Date(session.date);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });

  if (completedSessions.length === 0) return 0;

  // Get unique dates and sort them
  const uniqueDates = Array.from(
    new Set(completedSessions.map((date) => date.getTime()))
  )
    .map((time) => new Date(time))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today or yesterday has a session
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hasToday = uniqueDates.some(
    (date) => date.getTime() === today.getTime()
  );
  const hasYesterday = uniqueDates.some(
    (date) => date.getTime() === yesterday.getTime()
  );

  if (!hasToday && !hasYesterday) return 0;

  // Start counting from today or yesterday
  let currentDate = hasToday ? new Date(today) : new Date(yesterday);
  let dateIndex = 0;

  while (dateIndex < uniqueDates.length) {
    const checkDate = uniqueDates[dateIndex];
    if (checkDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
      dateIndex++;
    } else if (checkDate.getTime() < currentDate.getTime()) {
      // Gap found, streak broken
      break;
    } else {
      dateIndex++;
    }
  }

  return streak;
}

/**
 * Calculate study time for today
 */
export function calculateTodayStudyTime(sessions: StudySession[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return calculateStudyTimeInRange(sessions, today, tomorrow);
}

/**
 * Calculate study time for this week
 */
export function calculateThisWeekStudyTime(sessions: StudySession[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return calculateStudyTimeInRange(sessions, startOfWeek, endOfWeek);
}

/**
 * Calculate study time for this month
 */
export function calculateThisMonthStudyTime(sessions: StudySession[]): number {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return calculateStudyTimeInRange(sessions, startOfMonth, endOfMonth);
}

/**
 * Get the most studied subject
 */
export function getMostStudiedSubject(
  sessions: StudySession[]
): { subject: string; minutes: number } | null {
  const timeBySubject = calculateStudyTimeBySubject(sessions);
  const subjects = Object.entries(timeBySubject);

  if (subjects.length === 0) return null;

  const [subject, minutes] = subjects.reduce((max, current) =>
    current[1] > max[1] ? current : max
  );

  return { subject, minutes };
}

/**
 * Calculate completion rate (percentage of completed sessions)
 */
export function calculateCompletionRate(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  const completedCount = sessions.filter((s) => s.completed).length;
  return (completedCount / sessions.length) * 100;
}

/**
 * Calculate assignment completion rate based on submissions
 */
export function calculateAssignmentCompletionRate(
  assignments: Assignment[],
  submissions: AssignmentSubmission[]
): number {
  if (assignments.length === 0) return 0;

  const completedSubmissions = submissions.filter(
    (sub) => sub.status === 'submitted' || sub.status === 'graded'
  );
  const uniqueCompletedAssignments = new Set(
    completedSubmissions.map((sub) => sub.assignmentId)
  );

  return (uniqueCompletedAssignments.size / assignments.length) * 100;
}

/**
 * Calculate planning accuracy (how close estimated hours are to actual hours)
 */
export function calculatePlanningAccuracy(
  submissions: AssignmentSubmission[]
): number {
  const submissionsWithBoth = submissions.filter(
    (sub) =>
      sub.estimatedHours !== undefined &&
      sub.actualHours !== undefined &&
      sub.estimatedHours > 0
  );

  if (submissionsWithBoth.length === 0) return 0;

  const totalAccuracy = submissionsWithBoth.reduce((sum, sub) => {
    const estimated = sub.estimatedHours!;
    const actual = sub.actualHours!;
    // Calculate accuracy as percentage: 100% - (difference percentage)
    const difference = Math.abs(estimated - actual);
    const accuracy = Math.max(0, 100 - (difference / estimated) * 100);
    return sum + accuracy;
  }, 0);

  return totalAccuracy / submissionsWithBoth.length;
}

/**
 * Calculate priority distribution of assignments
 */
export function calculatePriorityDistribution(assignments: Assignment[]): {
  high: number;
  medium: number;
  low: number;
} {
  const distribution = {
    high: 0,
    medium: 0,
    low: 0,
  };

  assignments.forEach((assignment) => {
    distribution[assignment.priority]++;
  });

  return distribution;
}

/**
 * Calculate weekly progress for assignments
 */
export function calculateWeeklyProgress(
  assignments: Assignment[],
  submissions: AssignmentSubmission[]
): Array<{ weekStart: string; completed: number; total: number }> {
  // Group assignments by week
  const weekMap = new Map<string, { assignments: Assignment[]; completed: Set<string> }>();

  assignments.forEach((assignment) => {
    if (!assignment.dueDate) return;

    const date = new Date(assignment.dueDate);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        assignments: [],
        completed: new Set(),
      });
    }

    weekMap.get(weekKey)!.assignments.push(assignment);
  });

  // Mark completed assignments
  submissions.forEach((submission) => {
    if (submission.status === 'submitted' || submission.status === 'graded') {
      const assignment = assignments.find((a) => a.id === submission.assignmentId);
      if (assignment && assignment.dueDate) {
        const date = new Date(assignment.dueDate);
        const weekStart = getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];
        const weekData = weekMap.get(weekKey);
        if (weekData) {
          weekData.completed.add(submission.assignmentId);
        }
      }
    }
  });

  // Convert to array format
  return Array.from(weekMap.entries())
    .map(([weekStart, data]) => ({
      weekStart,
      completed: data.completed.size,
      total: data.assignments.length,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Calculate progress per course
 */
export function calculateCourseProgress(
  assignments: Assignment[],
  submissions: AssignmentSubmission[]
): Array<{ courseId: string; completion: number }> {
  const courseMap = new Map<string, { total: number; completed: Set<string> }>();

  // Count total assignments per course
  assignments.forEach((assignment) => {
    if (!courseMap.has(assignment.courseId)) {
      courseMap.set(assignment.courseId, {
        total: 0,
        completed: new Set(),
      });
    }
    courseMap.get(assignment.courseId)!.total++;
  });

  // Mark completed assignments
  submissions.forEach((submission) => {
    if (submission.status === 'submitted' || submission.status === 'graded') {
      const assignment = assignments.find((a) => a.id === submission.assignmentId);
      if (assignment) {
        const courseData = courseMap.get(assignment.courseId);
        if (courseData) {
          courseData.completed.add(submission.assignmentId);
        }
      }
    }
  });

  // Calculate completion percentage
  return Array.from(courseMap.entries()).map(([courseId, data]) => {
    const completion =
      data.total === 0 ? 0 : (data.completed.size / data.total) * 100;
    return { courseId, completion };
  });
}

/**
 * Get week start (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get metrics interpretation with level, message, and recommendations
 */
export function getMetricsInterpretation(metrics: AssignmentMetrics): {
  level: 'excellent' | 'good' | 'fair' | 'needs-improvement';
  message: string;
  recommendations: string[];
} {
  const { completionRate, planningAccuracy, priorityDistribution, weeklyProgress } = metrics;

  let level: 'excellent' | 'good' | 'fair' | 'needs-improvement';
  let message: string;
  const recommendations: string[] = [];

  // Determine level based on completion rate and planning accuracy
  const avgScore = (completionRate + planningAccuracy) / 2;

  if (avgScore >= 85) {
    level = 'excellent';
    message = 'You\'re doing great! Keep up the excellent work.';
  } else if (avgScore >= 70) {
    level = 'good';
    message = 'You\'re on track! There\'s room for improvement.';
  } else if (avgScore >= 50) {
    level = 'fair';
    message = 'You\'re making progress, but could benefit from better planning.';
  } else {
    level = 'needs-improvement';
    message = 'Consider adjusting your study habits and planning strategies.';
  }

  // Generate recommendations based on metrics
  if (completionRate < 70) {
    recommendations.push('Focus on completing assignments on time to improve your completion rate.');
  }

  if (planningAccuracy < 70) {
    recommendations.push('Work on better time estimation. Track actual vs estimated hours to improve accuracy.');
  }

  const highPriorityCount = priorityDistribution.high;
  const totalAssignments = priorityDistribution.high + priorityDistribution.medium + priorityDistribution.low;
  if (highPriorityCount > totalAssignments * 0.4 && totalAssignments > 0) {
    recommendations.push('You have many high-priority assignments. Consider breaking them into smaller tasks.');
  }

  // Check for weeks with low completion
  const recentWeeks = weeklyProgress.slice(-4);
  const lowCompletionWeeks = recentWeeks.filter(
    (week) => week.total > 0 && week.completed / week.total < 0.5
  );
  if (lowCompletionWeeks.length > 0) {
    recommendations.push('Some recent weeks had low completion rates. Review your weekly planning strategy.');
  }

  // Check for courses with low progress
  const lowProgressCourses = metrics.courseProgress.filter((cp) => cp.completion < 50);
  if (lowProgressCourses.length > 0) {
    recommendations.push(`Focus on improving progress in ${lowProgressCourses.length} course(s) with low completion.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue maintaining your current study habits!');
  }

  return { level, message, recommendations };
}

