/**
 * Supabase authentication helpers
 * Browser client with session persistence
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Browser client with localStorage persistence
export const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type UserType = 'student' | 'admin';

export interface RegisterData {
  email: string;
  password: string;
  userType: UserType;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Register a new user with email and user type
 */
export async function registerWithEmail({
  email,
  password,
  userType,
}: RegisterData) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: userType,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Login with email and password
 */
export async function loginWithEmail({ email, password }: LoginData) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Logout current user
 */
export async function logout() {
  const { error } = await supabaseAuth.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabaseAuth.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Get user type from session
 */
export function getUserType(session: any): UserType | null {
  return session?.user?.user_metadata?.user_type || null;
}

