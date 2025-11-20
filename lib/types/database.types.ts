/**
 * Database types for Supabase
 * These types should match your Supabase database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          duration: number; // in minutes
          subject: string;
          date: string; // ISO date string
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          duration: number;
          subject: string;
          date: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          duration?: number;
          subject?: string;
          date?: string;
          completed?: boolean;
          updated_at?: string;
        };
      };
      study_goals: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          target_hours: number;
          period: 'daily' | 'weekly' | 'monthly';
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          target_hours: number;
          period: 'daily' | 'weekly' | 'monthly';
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          target_hours?: number;
          period?: 'daily' | 'weekly' | 'monthly';
          start_date?: string;
          end_date?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          user_type: 'student' | 'teacher' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          user_type: 'student' | 'teacher' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          user_type?: 'student' | 'teacher' | 'admin';
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_type: 'student' | 'teacher' | 'admin';
      goal_period: 'daily' | 'weekly' | 'monthly';
    };
  };
}

