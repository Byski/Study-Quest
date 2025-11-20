/**
 * Supabase query helpers for study sessions and goals
 */

import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';

type StudySession = Database['public']['Tables']['study_sessions']['Row'];
type StudySessionInsert = Database['public']['Tables']['study_sessions']['Insert'];
type StudySessionUpdate = Database['public']['Tables']['study_sessions']['Update'];

type StudyGoal = Database['public']['Tables']['study_goals']['Row'];
type StudyGoalInsert = Database['public']['Tables']['study_goals']['Insert'];
type StudyGoalUpdate = Database['public']['Tables']['study_goals']['Update'];

/**
 * Get all study sessions for the current user
 */
export async function getStudySessions(userId: string): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get study sessions for a date range
 */
export async function getStudySessionsInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new study session
 */
export async function createStudySession(
  session: StudySessionInsert
): Promise<StudySession> {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a study session
 */
export async function updateStudySession(
  id: string,
  updates: StudySessionUpdate
): Promise<StudySession> {
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a study session
 */
export async function deleteStudySession(id: string): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get all study goals for the current user
 */
export async function getStudyGoals(userId: string): Promise<StudyGoal[]> {
  const { data, error } = await supabase
    .from('study_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new study goal
 */
export async function createStudyGoal(
  goal: StudyGoalInsert
): Promise<StudyGoal> {
  const { data, error } = await supabase
    .from('study_goals')
    .insert(goal)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a study goal
 */
export async function updateStudyGoal(
  id: string,
  updates: StudyGoalUpdate
): Promise<StudyGoal> {
  const { data, error } = await supabase
    .from('study_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a study goal
 */
export async function deleteStudyGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('study_goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

