'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, FileText, BookOpen, LogOut } from 'lucide-react'
import Notification from '@/components/Notification'

interface Course {
  id: string
  title: string
  description: string
  difficulty: string
  duration: number
  category: string
  code?: string
  color?: string
}

interface Assignment {
  id: string
  course_id: string
  title: string
  description: string
  due_date: string
  status?: string
  courses?: Course
}

interface AssignmentSubmission {
  id: string
  assignment_id: string
  user_id: string
  status: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, AssignmentSubmission>>({})
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [userType, setUserType] = useState<string>('student')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (userType) {
      loadAssignments()
    }
  }, [userType])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }
    
    const userTypeFromMeta = session.user.user_metadata?.user_type || 'student'
    setUserType(userTypeFromMeta)
  }

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          courses (*)
        `)
        .order('due_date', { ascending: true })

      if (error) throw error
      setAssignments((data as any) || [])

      // Load assignment submissions for students
      if (userType === 'student') {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('user_id', session.user.id)

        if (submissionsError) {
          console.error('Error loading submissions:', submissionsError.message)
        } else {
          const submissionsMap: Record<string, AssignmentSubmission> = {}
          submissionsData?.forEach((submission: any) => {
            submissionsMap[submission.assignment_id] = submission
          })
          setAssignmentSubmissions(submissionsMap)
        }
      }
    } catch (error: any) {
      console.error('Error loading assignments:', error.message)
      setNotification({ message: `Failed to load assignments: ${error.message}`, type: 'error' })
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentsForDate = (date: Date): Assignment[] => {
    const dateStr = date.toISOString().split('T')[0]
    return assignments.filter(assignment => {
      if (!assignment.due_date) return false
      const assignmentDate = new Date(assignment.due_date).toISOString().split('T')[0]
      return assignmentDate === dateStr
    })
  }

  const isDateToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isDateOverdue = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  const getDateStatus = (date: Date): 'overdue' | 'today' | 'upcoming' | 'normal' => {
    if (isDateOverdue(date)) return 'overdue'
    if (isDateToday(date)) return 'today'
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) return 'upcoming'
    return 'normal'
  }

  const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const getLastDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  const getDaysInMonth = (date: Date): Date[] => {
    const days: Date[] = []
    const firstDay = getFirstDayOfMonth(date)
    const lastDay = getLastDayOfMonth(date)
    
    // Get the first day of the week for the first day of the month
    const startDay = firstDay.getDay()
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(firstDay)
      prevDate.setDate(prevDate.getDate() - (startDay - i))
      days.push(prevDate)
    }
    
    // Add all days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i))
    }
    
    // Fill remaining cells to complete the week
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(lastDay)
      nextDate.setDate(nextDate.getDate() + i)
      days.push(nextDate)
    }
    
    return days
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark via-dark-navy to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-light/80">Loading calendar...</p>
        </div>
      </div>
    )
  }

  const days = getDaysInMonth(currentDate)
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-navy to-primary-900">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <header className="bg-dark-navy/90 backdrop-blur-md shadow-lg border-b border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/dashboard/${userType}`)}
                className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-light" />
              </button>
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-primary-500" />
              </div>
              <h1 className="text-2xl font-bold text-light">Assignment Calendar</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/${userType}`)}
                className="flex items-center gap-2 px-4 py-2 text-light/90 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all font-medium"
              >
                <BookOpen className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-light/70 hover:text-light hover:bg-dark-navy rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Controls */}
        <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-light" />
              </button>
              <h2 className="text-2xl font-bold text-light">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-light" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              Today
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50"></div>
              <span className="text-sm text-light/70">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50"></div>
              <span className="text-sm text-light/70">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/30 border border-orange-500/50"></div>
              <span className="text-sm text-light/70">Upcoming (7 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary-500/30 border border-primary-500/50"></div>
              <span className="text-sm text-light/70">Normal</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-primary-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayAssignments = getAssignmentsForDate(day)
              const status = getDateStatus(day)
              const isCurrentMonthDay = isCurrentMonth(day)
              const isToday = isDateToday(day)

              const getDayStyles = () => {
                if (!isCurrentMonthDay) {
                  return 'bg-dark-navy/40 text-light/30'
                }
                switch (status) {
                  case 'overdue':
                    return 'bg-red-500/10 border-red-500/30 text-light hover:bg-red-500/20'
                  case 'today':
                    return 'bg-yellow-500/20 border-yellow-500/50 text-light ring-2 ring-yellow-500/50'
                  case 'upcoming':
                    return 'bg-orange-500/10 border-orange-500/30 text-light hover:bg-orange-500/20'
                  default:
                    return 'bg-dark-navy/40 border-primary-500/20 text-light hover:bg-primary-500/10'
                }
              }

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-2 rounded-xl p-2 transition-all ${getDayStyles()}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${isCurrentMonthDay ? 'text-light' : 'text-light/30'}`}>
                      {day.getDate()}
                    </span>
                    {dayAssignments.length > 0 && (
                      <span className="text-xs bg-primary-500/30 text-primary-400 px-2 py-0.5 rounded-full font-semibold">
                        {dayAssignments.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayAssignments.slice(0, 3).map((assignment) => {
                      const course = assignment.courses as Course
                      const submission = assignmentSubmissions[assignment.id]
                      const isCompleted = submission?.status === 'completed'
                      
                      return (
                        <button
                          key={assignment.id}
                          onClick={() => router.push(`/assignments/${assignment.id}`)}
                          className={`w-full text-left text-xs p-1.5 rounded transition-all hover:opacity-80 ${
                            isCompleted
                              ? 'bg-green-500/30 text-green-300 border border-green-500/50 line-through'
                              : status === 'overdue'
                              ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                              : status === 'today'
                              ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50'
                              : 'bg-primary-500/30 text-primary-200 border border-primary-500/50'
                          }`}
                          title={assignment.title}
                        >
                          <div className="truncate font-medium">{assignment.title}</div>
                          {course && (
                            <div className="truncate text-[10px] opacity-80">{course.title}</div>
                          )}
                        </button>
                      )
                    })}
                    {dayAssignments.length > 3 && (
                      <div className="text-xs text-light/60 text-center pt-1">
                        +{dayAssignments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-red-400" />
              <span className="text-sm font-semibold text-light">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {assignments.filter(a => {
                if (!a.due_date) return false
                return isDateOverdue(new Date(a.due_date))
              }).length}
            </div>
          </div>
          <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-semibold text-light">Due Today</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {assignments.filter(a => {
                if (!a.due_date) return false
                return isDateToday(new Date(a.due_date))
              }).length}
            </div>
          </div>
          <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-semibold text-light">This Week</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {assignments.filter(a => {
                if (!a.due_date) return false
                const date = new Date(a.due_date)
                const today = new Date()
                const diffTime = date.getTime() - today.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return diffDays > 0 && diffDays <= 7
              }).length}
            </div>
          </div>
          <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary-400" />
              <span className="text-sm font-semibold text-light">Total</span>
            </div>
            <div className="text-2xl font-bold text-primary-400">
              {assignments.length}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

