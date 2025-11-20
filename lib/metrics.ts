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

