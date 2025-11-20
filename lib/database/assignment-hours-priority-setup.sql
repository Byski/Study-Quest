-- Assignment Hours & Priority Setup Script
-- Run this after calendar-events-setup.sql

-- Add estimated_hours and actual_hours to assignments table
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

-- Add estimated_hours, actual_hours, and priority to assignment_submissions table
ALTER TABLE assignment_submissions
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assignments_priority ON assignments(priority);
CREATE INDEX IF NOT EXISTS idx_submissions_priority ON assignment_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON assignment_submissions(status);

