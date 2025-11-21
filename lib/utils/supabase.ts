import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// You can use environment variables or hardcode them here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hfcsndlyggoxxwmktueu.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmY3NuZGx5Z2dveHh3bWt0dWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjY5MzEsImV4cCI6MjA3OTI0MjkzMX0.KheMHMrXn0HXZnGPyPoV34QeSi4EOBqVnMnmDSuPO-A'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your configuration.')
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.warn('Warning: Supabase URL format may be incorrect:', supabaseUrl)
}

// Create Supabase client with proper configuration for Next.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  global: {
    headers: {
      'x-client-info': 'study-planner-app'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Test connection on client side
if (typeof window !== 'undefined') {
  // Verify connection
  supabase.auth.getSession().catch((error) => {
    console.error('Supabase connection error:', error)
    console.error('Please check:')
    console.error('1. Your Supabase project is active')
    console.error('2. URL is correct:', supabaseUrl)
    console.error('3. Anon key is valid')
  })
}

