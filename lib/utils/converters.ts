/**
 * Utility functions to convert between database types and metrics types
 */

import type { Database } from '../types/database.types';
import type { StudySession, StudyGoal } from '../metrics';

type DbStudySession = Database['public']['Tables']['study_sessions']['Row'];
type DbStudyGoal = Database['public']['Tables']['study_goals']['Row'];

/**
 * Convert database study session to metrics StudySession
 */
export function dbSessionToMetricsSession(
  dbSession: DbStudySession
): StudySession {
  return {
    id: dbSession.id,
    duration: dbSession.duration,
    subject: dbSession.subject,
    date: new Date(dbSession.date),
    completed: dbSession.completed,
  };
}

/**
 * Convert database study goal to metrics StudyGoal
 */
export function dbGoalToMetricsGoal(dbGoal: DbStudyGoal): StudyGoal {
  return {
    id: dbGoal.id,
    subject: dbGoal.subject,
    targetHours: Number(dbGoal.target_hours),
    period: dbGoal.period,
    startDate: new Date(dbGoal.start_date),
    endDate: new Date(dbGoal.end_date),
  };
}

/**
 * Convert array of database sessions to metrics sessions
 */
export function dbSessionsToMetricsSessions(
  dbSessions: DbStudySession[]
): StudySession[] {
  return dbSessions.map(dbSessionToMetricsSession);
}

/**
 * Convert array of database goals to metrics goals
 */
export function dbGoalsToMetricsGoals(dbGoals: DbStudyGoal[]): StudyGoal[] {
  return dbGoals.map(dbGoalToMetricsGoal);
}

