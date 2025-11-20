'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/auth';
import { getCourses } from '@/lib/supabase/queries';
import type { Database } from '@/lib/types/database.types';

type Course = Database['public']['Tables']['courses']['Row'];

export default function CoursesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadCourses() {
      try {
        const session = await getSession();
        if (!session) {
          router.push('/auth');
          return;
        }

        const userCourses = await getCourses(session.user.id);
        setCourses(userCourses);
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
              My Courses
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage and organize your courses
            </p>
          </div>
          <Link
            href="/courses/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Create Course
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg
                className="h-8 w-8 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-black dark:text-zinc-50">
              No courses yet
            </h3>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Get started by creating your first course
            </p>
            <Link
              href="/courses/new"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Create Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}/edit`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
                      {course.name}
                    </h3>
                    {course.code && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {course.code}
                      </p>
                    )}
                  </div>
                  {course.color && (
                    <div
                      className="ml-2 h-5 w-5 rounded-full border-2 border-zinc-200 dark:border-zinc-700"
                      style={{ backgroundColor: course.color }}
                    />
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Created {new Date(course.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

