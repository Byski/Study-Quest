'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmail, loginWithEmail } from '@/lib/supabaseClient';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'admin'>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const { user } = await loginWithEmail(email, password);
        const userTypeFromMeta = user?.user_metadata?.user_type || 'student';
        router.push(`/dashboard/${userTypeFromMeta}`);
      } else {
        // Register flow
        if (!userType) {
          setError('Please select a user type');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, userType);
        router.push(`/dashboard/${userType}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">
          {isLogin ? 'Login' : 'Register'}
        </h1>

        {/* Toggle buttons */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
              isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
              !isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* User type selection for register */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                User Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="student"
                    checked={userType === 'student'}
                    onChange={(e) => setUserType(e.target.value as 'student' | 'admin')}
                    className="mr-2"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Student</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="admin"
                    checked={userType === 'admin'}
                    onChange={(e) => setUserType(e.target.value as 'student' | 'admin')}
                    className="mr-2"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Admin</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
