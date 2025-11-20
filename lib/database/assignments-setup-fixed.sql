-- Assignments Setup Script
-- Run this after database-setup-fixed.sql

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  points INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  grade INTEGER CHECK (grade >= 0 AND grade <= 100),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON assignment_submissions(user_id);

-- Enable Row Level Security
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
-- Anyone can view assignments
CREATE POLICY "Anyone can view assignments"
  ON assignments FOR SELECT
  USING (true);

-- Only admins can insert assignments
CREATE POLICY "Only admins can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Only admins can update assignments
CREATE POLICY "Only admins can update assignments"
  ON assignments FOR UPDATE
  USING (is_admin(auth.uid()));

-- Only admins can delete assignments
CREATE POLICY "Only admins can delete assignments"
  ON assignments FOR DELETE
  USING (is_admin(auth.uid()));

-- RLS Policies for assignment_submissions
-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON assignment_submissions FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Users can create their own submissions
CREATE POLICY "Users can create their own submissions"
  ON assignment_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own submissions
CREATE POLICY "Users can update their own submissions"
  ON assignment_submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own submissions
CREATE POLICY "Users can delete their own submissions"
  ON assignment_submissions FOR DELETE
  USING (auth.uid() = user_id);

