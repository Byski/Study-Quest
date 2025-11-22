// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Supabase client with proper chainable methods
const createMockChain = () => {
  const defaultPromise = Promise.resolve({ data: [], error: null })
  
  return {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => defaultPromise),
        single: jest.fn(() => defaultPromise),
      })),
      order: jest.fn(() => defaultPromise),
      single: jest.fn(() => defaultPromise),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => defaultPromise),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => defaultPromise),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => defaultPromise),
    })),
  }
}

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => createMockChain()),
  },
}))

