-- Study Quest Database Schema
-- Courses, Assignments, Enrollments, Submissions, and Calendar Events

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE assignment_status AS ENUM ('todo', 'doing', 'done');
CREATE TYPE assignment_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE submission_status AS ENUM ('not_started', 'in_progress', 'submitted', 'graded');

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT,
  color TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table (many-to-many: courses <-> students)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status assignment_status NOT NULL DEFAULT 'todo',
  priority assignment_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment Submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status submission_status NOT NULL DEFAULT 'not_started',
  estimated_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  related_assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_at >= start_at)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_owner_id ON public.courses(owner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON public.calendar_events(start_at);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.assignment_submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Courses policies: owner or enrolled students can read; only owner can modify
CREATE POLICY "Courses: owner or enrolled students can view"
  ON public.courses FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT course_id FROM public.enrollments WHERE student_id = auth.uid())
  );

CREATE POLICY "Courses: only owner can insert"
  ON public.courses FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Courses: only owner can update"
  ON public.courses FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Courses: only owner can delete"
  ON public.courses FOR DELETE
  USING (owner_id = auth.uid());

-- Enrollments policies
CREATE POLICY "Enrollments: can view own enrollments"
  ON public.enrollments FOR SELECT
  USING (student_id = auth.uid() OR course_id IN (SELECT id FROM public.courses WHERE owner_id = auth.uid()));

CREATE POLICY "Enrollments: course owner can manage"
  ON public.enrollments FOR ALL
  USING (course_id IN (SELECT id FROM public.courses WHERE owner_id = auth.uid()));

-- Assignments policies: similar to courses
CREATE POLICY "Assignments: can view if enrolled in course"
  ON public.assignments FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM public.courses 
      WHERE owner_id = auth.uid() OR 
      id IN (SELECT course_id FROM public.enrollments WHERE student_id = auth.uid())
    )
  );

CREATE POLICY "Assignments: course owner can manage"
  ON public.assignments FOR ALL
  USING (course_id IN (SELECT id FROM public.courses WHERE owner_id = auth.uid()));

-- Assignment Submissions policies
CREATE POLICY "Submissions: students can view own submissions"
  ON public.assignment_submissions FOR SELECT
  USING (
    student_id = auth.uid() OR
    assignment_id IN (
      SELECT id FROM public.assignments 
      WHERE course_id IN (SELECT id FROM public.courses WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Submissions: students can manage own submissions"
  ON public.assignment_submissions FOR ALL
  USING (student_id = auth.uid());

-- Calendar Events policies
CREATE POLICY "Calendar Events: users can manage own events"
  ON public.calendar_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Calendar Events: users can insert own events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Calendar Events: users can update own events"
  ON public.calendar_events FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Calendar Events: users can delete own events"
  ON public.calendar_events FOR DELETE
  USING (user_id = auth.uid());

