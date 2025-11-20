'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession } from '@/lib/supabase/auth';
import { getCourseById, updateCourse, deleteCourse } from '@/lib/supabase/queries';
import type { Database } from '@/lib/types/database.types';

type Course = Database['public']['Tables']['courses']['Row'];

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        const session = await getSession();
        if (!session) {
          router.push('/auth');
          return;
        }

        const courseData = await getCourseById(courseId);
        if (!courseData) {
          setError('Course not found');
          return;
        }

        setCourse(courseData);
        setName(courseData.name);
        setCode(courseData.code || '');
        setColor(courseData.color || '#3b82f6');
      } catch (err: any) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      loadCourse();
    }
  }, [courseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setNameError(null);

    // Validation
    if (!name.trim()) {
      setNameError('Course name is required');
      return;
    }

    setSaving(true);

    try {
      const session = await getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      await updateCourse(courseId, {
        name: name.trim(),
        code: code.trim() || null,
        color: color.trim() || null,
      });

      setSuccessMessage('Course updated successfully!');
      
      // Reload course data
      const updatedCourse = await getCourseById(courseId);
      if (updatedCourse) {
        setCourse(updatedCourse);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <p className="text-red-600 dark:text-red-400">Course not found</p>
            <button
              onClick={() => router.push('/courses')}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Edit Course
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Update course information
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-700 dark:bg-green-900 dark:text-green-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-black dark:text-zinc-50 mb-2"
            >
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              className={`w-full rounded-md border px-3 py-2 text-black shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-50 ${
                nameError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
              placeholder="e.g., Introduction to Computer Science"
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {nameError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-black dark:text-zinc-50 mb-2"
            >
              Course Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              placeholder="e.g., CS101"
            />
          </div>

          <div>
            <label
              htmlFor="color"
              className="block text-sm font-medium text-black dark:text-zinc-50 mb-2"
            >
              Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-12 w-24 cursor-pointer rounded-md border border-zinc-300 shadow-sm dark:border-zinc-700"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/courses')}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Delete Section */}
        <div className="mt-6 rounded-lg border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-zinc-900">
          <h2 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Once you delete a course, there is no going back. Please be certain.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete Course
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Are you sure you want to delete this course? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    setDeleting(true);
                    setError(null);

                    try {
                      await deleteCourse(courseId);
                      setSuccessMessage('Course deleted successfully!');
                      setTimeout(() => {
                        router.push('/courses');
                      }, 1500);
                    } catch (err: any) {
                      setError(err.message || 'Failed to delete course');
                      setDeleting(false);
                      setShowDeleteConfirm(false);
                    }
                  }}
                  disabled={deleting}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Course'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setError(null);
                  }}
                  disabled={deleting}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

