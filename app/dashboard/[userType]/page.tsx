'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logout, getUserType } from '@/lib/supabase/auth';

export default function DashboardPage({
  params,
}: {
  params: { userType: string };
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSession();
        if (!session) {
          router.push('/auth');
          return;
        }

        const userTypeFromMeta = getUserType(session) || 'student';
        
        // Redirect if userType doesn't match
        if (userTypeFromMeta !== params.userType) {
          router.push(`/dashboard/${userTypeFromMeta}`);
          return;
        }

        setUser(session.user);
      } catch (error) {
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [params.userType, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  const isStudent = params.userType === 'student';
  const isAdmin = params.userType === 'admin';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header with logout */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            {isStudent ? 'Student Dashboard' : 'Admin Dashboard'}
          </h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {isStudent && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
                Enrolled Courses
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Your enrolled courses will appear here.
              </p>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
                Course Management
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Course management features will appear here.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Courses</p>
                <p className="text-2xl font-semibold text-black dark:text-zinc-50">0</p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Students</p>
                <p className="text-2xl font-semibold text-black dark:text-zinc-50">0</p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Assignments</p>
                <p className="text-2xl font-semibold text-black dark:text-zinc-50">0</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
