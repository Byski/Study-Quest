'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCoursePage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [nameError, setNameError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);

    // Validation
    if (!name.trim()) {
      setNameError('Course name is required');
      return;
    }

    // TODO: Implement course creation (SCRUM-10 functionality commit)
    console.log('Form submitted:', { name, code, color });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Create New Course
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Add a new course to organize your assignments
          </p>
        </div>

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
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Optional course code or identifier
            </p>
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
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Choose a color to visually identify this course
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Course
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

