/**
 * Custom hook for fetching and calculating study metrics
 * This combines Supabase queries with metrics calculations
 */

import { useEffect, useState } from 'react';
import { getStudySessions, getStudyGoals } from '../supabase/queries';
import {
  calculateTotalStudyTime,
  calculateTodayStudyTime,
  calculateThisWeekStudyTime,
  calculateThisMonthStudyTime,
  calculateStudyTimeBySubject,
  getMostStudiedSubject,
  calculateCompletionRate,
  calculateAverageSessionDuration,
  calculateStudyStreak,
  calculateGoalProgress,
} from '../metrics';
import {
  dbSessionsToMetricsSessions,
  dbGoalsToMetricsGoals,
} from '../utils/converters';
import type { StudySession, StudyGoal } from '../metrics';

interface StudyMetrics {
  totalStudyTime: number;
  todayStudyTime: number;
  weekStudyTime: number;
  monthStudyTime: number;
  timeBySubject: Record<string, number>;
  mostStudiedSubject: { subject: string; minutes: number } | null;
  completionRate: number;
  averageSessionDuration: number;
  studyStreak: number;
  goals: Array<{
    goal: StudyGoal;
    progress: number;
  }>;
}

export function useStudyMetrics(userId: string | null) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        const [dbSessions, dbGoals] = await Promise.all([
          getStudySessions(userId),
          getStudyGoals(userId),
        ]);

        setSessions(dbSessionsToMetricsSessions(dbSessions));
        setGoals(dbGoalsToMetricsGoals(dbGoals));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  const metrics: StudyMetrics = {
    totalStudyTime: calculateTotalStudyTime(sessions),
    todayStudyTime: calculateTodayStudyTime(sessions),
    weekStudyTime: calculateThisWeekStudyTime(sessions),
    monthStudyTime: calculateThisMonthStudyTime(sessions),
    timeBySubject: calculateStudyTimeBySubject(sessions),
    mostStudiedSubject: getMostStudiedSubject(sessions),
    completionRate: calculateCompletionRate(sessions),
    averageSessionDuration: calculateAverageSessionDuration(sessions),
    studyStreak: calculateStudyStreak(sessions),
    goals: goals.map((goal) => ({
      goal,
      progress: calculateGoalProgress(goal, sessions),
    })),
  };

  return {
    sessions,
    goals,
    metrics,
    loading,
    error,
    refetch: async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const [dbSessions, dbGoals] = await Promise.all([
          getStudySessions(userId),
          getStudyGoals(userId),
        ]);
        setSessions(dbSessionsToMetricsSessions(dbSessions));
        setGoals(dbGoalsToMetricsGoals(dbGoals));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to refetch data'));
      } finally {
        setLoading(false);
      }
    },
  };
}

