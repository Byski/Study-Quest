'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  BookOpen, 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Target, 
  FileText,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react'
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
  points?: number
  estimated_hours?: number
  actual_hours?: number
  priority?: string
  created_at?: string
  updated_at?: string
  courses?: Course
}

interface AssignmentSubmission {
  id: string
  assignment_id: string
  user_id: string
  status: string
  submitted_at?: string
  estimated_hours?: number
  actual_hours?: number
  priority?: string
  created_at?: string
  updated_at?: string
}

export default function AssignmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<string>('student')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    loadAssignment()
  }, [assignmentId])

  const loadAssignment = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      
      // Set user type from session
      const userTypeFromMeta = session.user.user_metadata?.user_type || 'student'
      setUserType(userTypeFromMeta)

      // Load assignment with course details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          courses (*)
        `)
        .eq('id', assignmentId)
        .single()

      if (assignmentError) throw assignmentError
      setAssignment(assignmentData as Assignment)

      // Load submission if user is a student
      if (userTypeFromMeta === 'student') {
        const { data: submissionData, error: submissionError } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('user_id', session.user.id)
          .single()

        if (submissionError && submissionError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" which is fine if no submission exists
          console.error('Error loading submission:', submissionError)
        } else if (submissionData) {
          setSubmission(submissionData as AssignmentSubmission)
        }
      }
    } catch (error: any) {
      console.error('Error loading assignment:', error)
      setNotification({ message: `Failed to load assignment: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Map user-friendly status to database status
  const mapStatusToDb = (status: string): string => {
    const statusMap: Record<string, string> = {
      'todo': 'pending',
      'doing': 'in_progress',
      'done': 'completed'
    }
    return statusMap[status] || status
  }

  // Map database status to user-friendly status
  const mapStatusFromDb = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'todo',
      'in_progress': 'doing',
      'completed': 'done'
    }
    return statusMap[status] || status
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!assignment) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setNotification({ message: 'You must be logged in to update assignments', type: 'error' })
        return
      }

      const dbStatus = mapStatusToDb(newStatus)

      if (submission) {
        // Update existing submission
        const { data, error } = await supabase
          .from('assignment_submissions')
          .update({
            status: dbStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', submission.id)
          .select()
          .single()

        if (error) throw error
        setSubmission(data as AssignmentSubmission)
      } else {
        // Create new submission
        const { data, error } = await supabase
          .from('assignment_submissions')
          .insert({
            assignment_id: assignment.id,
            user_id: session.user.id,
            status: dbStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        setSubmission(data as AssignmentSubmission)
      }

      setNotification({ message: 'Assignment status updated successfully!', type: 'success' })
    } catch (error: any) {
      console.error('Error updating assignment status:', error)
      setNotification({ message: `Failed to update status: ${error.message}`, type: 'error' })
    }
  }

  const formatDueDate = (dueDate: string): { text: string; isOverdue: boolean; days: number; isToday?: boolean; isSoon?: boolean } => {
    if (!dueDate) {
      return { text: 'No due date', isOverdue: false, days: 0 }
    }
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })

    if (diffDays < 0) {
      return { text: `Overdue: ${formattedDate}`, isOverdue: true, days: diffDays }
    } else if (diffDays === 0) {
      return { text: `Due today: ${formattedDate}`, isOverdue: false, days: 0, isToday: true }
    } else if (diffDays === 1) {
      return { text: `Due tomorrow: ${formattedDate}`, isOverdue: false, days: 1, isSoon: true }
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days: ${formattedDate}`, isOverdue: false, days: diffDays, isSoon: true }
    } else {
      return { text: `Due: ${formattedDate}`, isOverdue: false, days: diffDays }
    }
  }

  const getStatusColor = (status: string) => {
    const displayStatus = mapStatusFromDb(status)
    if (displayStatus === 'done') return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (displayStatus === 'doing') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    if (priority === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30'
    if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-green-500/20 text-green-400 border-green-500/30'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark via-dark-navy to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-light/80">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark via-dark-navy to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-light mb-2">Assignment Not Found</h2>
          <p className="text-light/70 mb-6">The assignment you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const course = assignment.courses as Course
  const dueDateInfo = formatDueDate(assignment.due_date)
  const dbStatus = submission?.status || assignment.status || 'pending'
  const displayStatus = mapStatusFromDb(dbStatus)
  const priority = submission?.priority || assignment.priority || 'medium'
  const estimatedHours = submission?.estimated_hours || assignment.estimated_hours
  const actualHours = submission?.actual_hours || assignment.actual_hours

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-light" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-500" />
              </div>
              <h1 className="text-2xl font-bold text-light">Assignment Details</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Title and Status */}
          <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-light mb-3">{assignment.title}</h2>
                {course && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-primary-400 font-medium">{course.title}</span>
                    {course.code && (
                      <span className="px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded">
                        {course.code}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {userType === 'student' && (
                <select
                  value={displayStatus}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full border outline-none cursor-pointer transition-colors ${getStatusColor(dbStatus)}`}
                >
                  <option value="todo">Todo</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
              )}
              {userType === 'admin' && (
                <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(dbStatus)}`}>
                  {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                </span>
              )}
            </div>

            {/* Description */}
            {assignment.description && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-light mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-400" />
                  Description
                </h3>
                <p className="text-light/80 leading-relaxed whitespace-pre-wrap">
                  {assignment.description}
                </p>
              </div>
            )}
          </div>

          {/* Key Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Due Date */}
            <div className={`bg-dark-navy/60 backdrop-blur-sm border-2 rounded-2xl p-6 ${
              dueDateInfo.isOverdue 
                ? 'border-red-500/50' 
                : dueDateInfo.isToday 
                ? 'border-yellow-500/50'
                : dueDateInfo.isSoon
                ? 'border-orange-500/50'
                : 'border-primary-500/20'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  dueDateInfo.isOverdue 
                    ? 'bg-red-500/20' 
                    : dueDateInfo.isToday 
                    ? 'bg-yellow-500/20'
                    : dueDateInfo.isSoon
                    ? 'bg-orange-500/20'
                    : 'bg-primary-500/20'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    dueDateInfo.isOverdue 
                      ? 'text-red-400' 
                      : dueDateInfo.isToday 
                      ? 'text-yellow-400'
                      : dueDateInfo.isSoon
                      ? 'text-orange-400'
                      : 'text-primary-400'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-light">Due Date</h3>
              </div>
              <p className={`text-lg font-medium ${
                dueDateInfo.isOverdue 
                  ? 'text-red-400' 
                  : dueDateInfo.isToday 
                  ? 'text-yellow-400'
                  : dueDateInfo.isSoon
                  ? 'text-orange-400'
                  : 'text-light'
              }`}>
                {dueDateInfo.text}
              </p>
            </div>

            {/* Points */}
            {assignment.points && (
              <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-light">Points</h3>
                </div>
                <p className="text-2xl font-bold text-accent">{assignment.points}</p>
              </div>
            )}

            {/* Priority */}
            <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-light">Priority</h3>
              </div>
              <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getPriorityColor(priority)}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
            </div>

            {/* Estimated Hours */}
            {estimatedHours && (
              <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-light">Estimated Hours</h3>
                </div>
                <p className="text-2xl font-bold text-blue-400">{estimatedHours}h</p>
                {actualHours && (
                  <div className="mt-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-light/60" />
                    <span className="text-sm text-light/70">Actual: {actualHours}h</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Course Information */}
          {course && (
            <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-light mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-400" />
                Course Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-light/70">Category:</span>
                  <span className="ml-2 text-light font-medium">{course.category || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-sm text-light/70">Difficulty:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    course.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                    course.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-light/70">Duration:</span>
                  <span className="ml-2 text-light font-medium">{course.duration} weeks</span>
                </div>
                {course.description && (
                  <div>
                    <span className="text-sm text-light/70">Course Description:</span>
                    <p className="mt-1 text-light/80">{course.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-light mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-light/70">Created:</span>
                <span className="ml-2 text-light">
                  {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
              {assignment.updated_at && (
                <div>
                  <span className="text-light/70">Last Updated:</span>
                  <span className="ml-2 text-light">
                    {new Date(assignment.updated_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {submission?.submitted_at && (
                <div>
                  <span className="text-light/70">Submitted:</span>
                  <span className="ml-2 text-light">
                    {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

