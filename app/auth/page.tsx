'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, User, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Notification from '@/components/Notification'

type UserType = 'student' | 'admin' | null
type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [userType, setUserType] = useState<UserType>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'register' && !userType) {
      setError('Please select a user type')
      setLoading(false)
      return
    }

    try {
      if (mode === 'register') {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_type: userType,
            },
          },
        })

        if (signUpError) throw signUpError

        if (data.user) {
          setNotification({
            message: 'Registration successful! Please check your email to verify your account.',
            type: 'success'
          })
          setMode('login')
          setEmail('')
          setPassword('')
          setUserType(null)
        }
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.user) {
          // Redirect based on user type
          const userType = data.user.user_metadata?.user_type || 'student'
          router.push(`/dashboard/${userType}`)
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred'
      setError(errorMessage)
      setNotification({
        message: errorMessage,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-navy to-primary-900 flex items-center justify-center p-4">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <BookOpen className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-4xl font-bold text-light mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join the Quest'}
          </h1>
          <p className="text-light/80">
            {mode === 'login' 
              ? 'Sign in to continue your journey' 
              : 'Create your account to get started'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-dark-navy/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-primary-500/20">
          {/* User Type Selection (Register only) */}
          {mode === 'register' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-light mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'student'
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-light/20 hover:border-light/30'
                  }`}
                >
                  <User className={`w-8 h-8 mx-auto mb-2 ${
                    userType === 'student' ? 'text-primary-500' : 'text-light/60'
                  }`} />
                  <span className={`font-medium ${
                    userType === 'student' ? 'text-primary-500' : 'text-light/80'
                  }`}>
                    Student
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'admin'
                      ? 'border-accent bg-accent/20'
                      : 'border-light/20 hover:border-light/30'
                  }`}
                >
                  <Shield className={`w-8 h-8 mx-auto mb-2 ${
                    userType === 'admin' ? 'text-accent' : 'text-light/60'
                  }`} />
                  <span className={`font-medium ${
                    userType === 'admin' ? 'text-accent' : 'text-light/80'
                  }`}>
                    Admin
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light/60" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-dark-navy/50 text-light placeholder-light/50"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-light mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light/60" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-dark-navy/50 text-light placeholder-light/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light/60 hover:text-light/80"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-accent/20 border border-accent/50 rounded-xl text-accent text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
                setUserType(null)
              }}
              className="text-sm text-primary-500 hover:text-primary-400 font-medium"
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-light/70 hover:text-light/90"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
