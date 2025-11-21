'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, LogOut, User, Shield, Sword, ArrowRight, CheckCircle, Plus, Edit, Trash2, Users, BookMarked, TrendingUp, X, FileText, Calendar } from 'lucide-react'
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
  created_at?: string
}

interface Enrollment {
  course_id: string
  enrolled_at: string
  progress: number
  courses: Course
}

interface Stats {
  totalCourses: number
  totalEnrollments: number
  totalStudents: number
}

interface Assignment {
  id: string
  course_id: string
  title: string
  description: string
  due_date: string
  status?: string
  points?: number
  created_at?: string
  courses?: Course
}

export default function DashboardPage({ params }: { params: { userType: string } }) {
  const router = useRouter()
  const userType = params.userType
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  
  // Admin states
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats>({ totalCourses: 0, totalEnrollments: 0, totalStudents: 0 })
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: 4,
    category: '',
    code: '',
    color: '#0F3460'
  })
  
  // Assignment states
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    course_id: '',
    description: '',
    due_date: '',
    due_time: ''
  })

  useEffect(() => {
    checkUser()
    if (userType === 'student') {
      loadEnrolledCourses()
      loadCourses() // Load courses for assignment dropdown
      loadAssignments()
    } else if (userType === 'admin') {
      loadCourses()
      loadStats()
      loadAssignments()
    }
  }, [userType])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }
    
    // Check if user type matches
    const userTypeFromMeta = session.user.user_metadata?.user_type || 'student'
    if (userTypeFromMeta !== userType) {
      router.push(`/dashboard/${userTypeFromMeta}`)
    }
  }

  const loadEnrolledCourses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          enrolled_at,
          progress,
          courses (*)
        `)
        .eq('user_id', session.user.id)
        .order('enrolled_at', { ascending: false })

      if (error) throw error
      setEnrolledCourses((data as any) || [])
    } catch (error: any) {
      console.error('Error loading enrolled courses:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      setCourses(data || [])
      setDbError(null)
    } catch (error: any) {
      console.error('Error loading courses:', error)
      const errorMsg = error.message || 'Unknown error'
      setDbError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const [coursesRes, enrollmentsRes, studentsRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('user_id', { count: 'exact' }).then(res => {
          if (res.data) {
            const uniqueUsers = new Set(res.data.map(e => e.user_id))
            return { count: uniqueUsers.size }
          }
          return { count: 0 }
        })
      ])

      setStats({
        totalCourses: coursesRes.count || 0,
        totalEnrollments: enrollmentsRes.count || 0,
        totalStudents: studentsRes.count || 0
      })
    } catch (error: any) {
      console.error('Error loading stats:', error.message)
    }
  }

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          courses (*)
        `)
        .order('due_date', { ascending: true })

      if (error) throw error
      setAssignments((data as any) || [])
    } catch (error: any) {
      console.error('Error loading assignments:', error.message)
      setAssignments([])
    }
  }

  const handleCreateCourse = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setNotification({ message: 'You must be logged in to create courses', type: 'error' })
        return
      }

      // Build insert object with all required fields
      const insertData: any = {
        title: courseForm.title.trim(),
        description: courseForm.description?.trim() || null,
        difficulty: courseForm.difficulty,
        duration: courseForm.duration,
        category: courseForm.category?.trim() || null,
        code: courseForm.code?.trim() || null,
        color: courseForm.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Inserting course data:', insertData)

      const { data, error } = await supabase
        .from('courses')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('Course created successfully:', data)

      setCourses([data, ...courses])
      setShowCourseModal(false)
      setCourseForm({ title: '', description: '', difficulty: 'beginner', duration: 4, category: '', code: '', color: '#0F3460' })
      loadStats()
      setNotification({ message: 'Course created successfully!', type: 'success' })
    } catch (error: any) {
      console.error('Error creating course:', error)
      const errorMessage = error.message || 'Unknown error occurred'
      setNotification({ message: `Failed to create course: ${errorMessage}`, type: 'error' })
    }
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setNotification({ message: 'You must be logged in to update courses', type: 'error' })
        return
      }

      // Build update object with all fields
      const updateData: any = {
        title: courseForm.title.trim(),
        description: courseForm.description?.trim() || null,
        difficulty: courseForm.difficulty,
        duration: courseForm.duration,
        category: courseForm.category?.trim() || null,
        code: courseForm.code?.trim() || null,
        color: courseForm.color,
        updated_at: new Date().toISOString()
      }

      console.log('Updating course data:', updateData)

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', editingCourse.id)
        .select()
        .single()

      if (error) {
        console.error('Supabase update error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('Course updated successfully:', data)

      if (error) throw error

      setCourses(courses.map(c => c.id === editingCourse.id ? data : c))
      setShowCourseModal(false)
      setEditingCourse(null)
      setCourseForm({ title: '', description: '', difficulty: 'beginner', duration: 4, category: '', code: '', color: '#0F3460' })
      setNotification({ message: 'Course updated successfully!', type: 'success' })
    } catch (error: any) {
      console.error('Error updating course:', error)
      setNotification({ message: 'Failed to update course: ' + (error.message || 'Unknown error'), type: 'error' })
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all enrollments.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.filter(c => c.id !== courseId))
      loadStats()
      setNotification({ message: 'Course deleted successfully!', type: 'success' })
    } catch (error: any) {
      console.error('Error deleting course:', error.message)
      setNotification({ message: 'Failed to delete course: ' + error.message, type: 'error' })
    }
  }

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title,
      description: course.description,
      difficulty: course.difficulty as 'beginner' | 'intermediate' | 'advanced',
      duration: course.duration,
      category: course.category,
      code: course.code || '',
      color: course.color || '#0F3460'
    })
    setShowCourseModal(true)
  }

  const openCreateModal = () => {
    setEditingCourse(null)
    setCourseForm({ title: '', description: '', difficulty: 'beginner', duration: 4, category: '', code: '', color: '#0F3460' })
    setShowCourseModal(true)
  }

  const openCreateAssignmentModal = () => {
    setAssignmentForm({ title: '', course_id: '', description: '', due_date: '', due_time: '' })
    setShowAssignmentModal(true)
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
      month: 'short', 
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

  const handleCreateAssignment = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setNotification({ message: 'You must be logged in to create assignments', type: 'error' })
        return
      }

      if (!assignmentForm.title.trim()) {
        setNotification({ message: 'Assignment title is required', type: 'error' })
        return
      }

      if (!assignmentForm.course_id) {
        setNotification({ message: 'Please select a course', type: 'error' })
        return
      }

      if (!assignmentForm.due_date) {
        setNotification({ message: 'Due date is required', type: 'error' })
        return
      }

      // Combine date and time into a single timestamp
      let dueDateTime: string
      if (assignmentForm.due_time) {
        dueDateTime = `${assignmentForm.due_date}T${assignmentForm.due_time}:00`
      } else {
        dueDateTime = `${assignmentForm.due_date}T23:59:59`
      }

      const insertData: any = {
        course_id: assignmentForm.course_id,
        title: assignmentForm.title.trim(),
        description: assignmentForm.description?.trim() || null,
        due_date: dueDateTime,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Inserting assignment data:', insertData)

      const { data, error } = await supabase
        .from('assignments')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        throw error
      }

      console.log('Assignment created successfully:', data)

      setShowAssignmentModal(false)
      setAssignmentForm({ title: '', course_id: '', description: '', due_date: '', due_time: '' })
      loadAssignments() // Reload assignments after creation
      setNotification({ message: 'Assignment created successfully!', type: 'success' })
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      const errorMessage = error.message || 'Unknown error occurred'
      setNotification({ message: `Failed to create assignment: ${errorMessage}`, type: 'error' })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading && enrolledCourses.length === 0 && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark via-dark-navy to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-light/80">Loading...</p>
        </div>
      </div>
    )
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
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-500" />
              </div>
              <h1 className="text-2xl font-bold text-light">Study Planner</h1>
            </div>
            <div className="flex items-center gap-2">
              {userType === 'student' && (
                <>
                  <button
                    onClick={() => router.push('/courses')}
                    className="flex items-center gap-2 px-4 py-2 text-light/90 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all font-medium"
                  >
                    <Sword className="w-5 h-5" />
                    <span>Browse Quests</span>
                  </button>
                  <button
                    onClick={() => router.push('/assignments/student')}
                    className="flex items-center gap-2 px-4 py-2 text-light/90 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all font-medium"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Calendar</span>
                  </button>
                </>
              )}
              {userType === 'admin' && (
                <>
                  <button
                    onClick={() => router.push('/courses')}
                    className="flex items-center gap-2 px-4 py-2 text-light/90 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all font-medium"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>View Courses</span>
                  </button>
                  <button
                    onClick={() => router.push('/assignments')}
                    className="flex items-center gap-2 px-4 py-2 text-light/90 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all font-medium"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Assignments</span>
                  </button>
                </>
              )}
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
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            {userType === 'admin' ? (
              <div className="w-24 h-24 bg-gradient-to-br from-accent/30 to-accent/10 rounded-full flex items-center justify-center border-2 border-accent/30 shadow-lg">
                <Shield className="w-12 h-12 text-accent" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500/30 to-primary-500/10 rounded-full flex items-center justify-center border-2 border-primary-500/30 shadow-lg">
                <User className="w-12 h-12 text-primary-400" />
              </div>
            )}
          </div>
          <h2 className="text-4xl font-bold text-light mb-3">
            Welcome, {userType === 'admin' ? 'Administrator' : 'Student'}!
          </h2>
          <p className="text-lg text-light/80 max-w-2xl mx-auto">
            {userType === 'admin' 
              ? 'Manage your study platform and help students succeed'
              : 'Start planning your studies and achieve your goals'}
          </p>
        </div>

        <div className="space-y-8">
          {/* Dashboard Content */}
          {userType === 'student' ? (
            <div className="space-y-8">
              {/* Create Course CTA - First Priority */}
              <div className="relative bg-gradient-to-r from-primary-500 via-primary-600 to-accent rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent/20"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-3">Create Your Own Quest</h3>
                    <p className="text-white/90 text-lg">Start by creating a course to organize your assignments and track your progress</p>
                  </div>
                  <button
                    onClick={openCreateModal}
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/20 hover:border-white/50 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Create Course
                  </button>
                </div>
              </div>

              {/* Create Assignment CTA */}
              <div className="relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-3">Create Assignment</h3>
                    <p className="text-white/90 text-lg">Add a new assignment to track your tasks and deadlines</p>
                  </div>
                  <button
                    onClick={openCreateAssignmentModal}
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/20 hover:border-white/50 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    Create Assignment
                  </button>
                </div>
              </div>

              {/* Browse Courses CTA */}
              <div className="relative bg-gradient-to-r from-accent via-accent/90 to-primary-500 rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary-500/20"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-3">Ready for a New Quest?</h3>
                    <p className="text-white/90 text-lg">Browse available courses and start your learning journey</p>
                  </div>
                  <button
                    onClick={() => router.push('/courses')}
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/20 hover:border-white/50 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Browse Quests
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => router.push('/assignments/student')}
                  className="group p-6 bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/30 rounded-2xl hover:border-primary-500 hover:bg-primary-500/10 transition-all text-left shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-primary-500/20 rounded-xl group-hover:bg-primary-500/30 transition-colors">
                      <FileText className="w-6 h-6 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-light">My Assignments</h3>
                  </div>
                  <p className="text-light/70 text-sm ml-14">View and manage your assignments</p>
                </button>
                <button
                  onClick={() => router.push('/courses')}
                  className="group p-6 bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/30 rounded-2xl hover:border-primary-500 hover:bg-primary-500/10 transition-all text-left shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-accent/20 rounded-xl group-hover:bg-accent/30 transition-colors">
                      <Sword className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-light">Browse Quests</h3>
                  </div>
                  <p className="text-light/70 text-sm ml-14">Discover new courses to enroll in</p>
                </button>
              </div>

              {/* Enrolled Courses */}
              <div>
                <h3 className="text-2xl font-bold text-light mb-6 flex items-center gap-3">
                  <Sword className="w-6 h-6 text-primary-500" />
                  My Quests
                </h3>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    <p className="mt-4 text-light/80">Loading your quests...</p>
                  </div>
                ) : enrolledCourses.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-primary-500/30 rounded-2xl bg-dark-navy/40 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sword className="w-10 h-10 text-primary-500/60" />
                    </div>
                    <h4 className="text-xl font-semibold text-light mb-2">No Quests Yet</h4>
                    <p className="text-light/70 mb-6 max-w-md mx-auto">Start your journey by enrolling in a quest!</p>
                    <button
                      onClick={() => router.push('/courses')}
                      className="px-8 py-3 bg-gradient-to-r from-primary-500 to-accent text-white font-semibold rounded-xl hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Browse Quests
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrolledCourses.map((enrollment) => {
                      const course = enrollment.courses as Course
                      const progress = enrollment.progress || 0
                      return (
                        <div
                          key={enrollment.course_id}
                          className="group bg-dark-navy/60 backdrop-blur-sm border-2 border-primary-500/20 rounded-2xl p-6 hover:border-primary-500/50 hover:shadow-xl transition-all transform hover:scale-[1.02]"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-bold text-light">{course.title}</h4>
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                              </div>
                              <p className="text-light/70 text-sm mb-4 line-clamp-2">{course.description}</p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-light/70">
                                Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                              </span>
                              <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full font-semibold text-xs">
                                {progress}% Complete
                              </span>
                            </div>
                            <div className="w-full bg-dark-navy/80 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary-500 to-accent transition-all duration-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Assignments Section */}
              <div>
                <h3 className="text-2xl font-bold text-light mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary-500" />
                  My Assignments
                </h3>
                {assignments.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-primary-500/30 rounded-2xl bg-dark-navy/40 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-primary-500/60" />
                    </div>
                    <h4 className="text-xl font-semibold text-light mb-2">No Assignments Yet</h4>
                    <p className="text-light/70 mb-6 max-w-md mx-auto">Create your first assignment to get started!</p>
                    <button
                      onClick={openCreateAssignmentModal}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Create Assignment
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignments.map((assignment) => {
                      const course = assignment.courses as Course
                      const dueDateInfo = formatDueDate(assignment.due_date)
                      return (
                        <div
                          key={assignment.id}
                          className={`group bg-dark-navy/60 backdrop-blur-sm border-2 rounded-2xl p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] ${
                            dueDateInfo.isOverdue 
                              ? 'border-red-500/50 hover:border-red-500' 
                              : dueDateInfo.isToday 
                              ? 'border-yellow-500/50 hover:border-yellow-500'
                              : dueDateInfo.isSoon
                              ? 'border-orange-500/50 hover:border-orange-500'
                              : 'border-primary-500/20 hover:border-primary-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-bold text-light">{assignment.title}</h4>
                                {assignment.status === 'completed' && (
                                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                )}
                              </div>
                              {course && (
                                <p className="text-primary-400 text-sm mb-2 font-medium">{course.title}</p>
                              )}
                              {assignment.description && (
                                <p className="text-light/70 text-sm mb-4 line-clamp-2">{assignment.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className={`mt-4 p-3 rounded-xl ${
                            dueDateInfo.isOverdue 
                              ? 'bg-red-500/20 border border-red-500/30' 
                              : dueDateInfo.isToday 
                              ? 'bg-yellow-500/20 border border-yellow-500/30'
                              : dueDateInfo.isSoon
                              ? 'bg-orange-500/20 border border-orange-500/30'
                              : 'bg-primary-500/20 border border-primary-500/30'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Calendar className={`w-4 h-4 ${
                                dueDateInfo.isOverdue 
                                  ? 'text-red-400' 
                                  : dueDateInfo.isToday 
                                  ? 'text-yellow-400'
                                  : dueDateInfo.isSoon
                                  ? 'text-orange-400'
                                  : 'text-primary-400'
                              }`} />
                              <span className={`text-sm font-semibold ${
                                dueDateInfo.isOverdue 
                                  ? 'text-red-400' 
                                  : dueDateInfo.isToday 
                                  ? 'text-yellow-400'
                                  : dueDateInfo.isSoon
                                  ? 'text-orange-400'
                                  : 'text-primary-400'
                              }`}>
                                {dueDateInfo.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-xl border border-primary-400/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm mb-2 font-medium">Total Courses</p>
                      <p className="text-4xl font-bold">{stats.totalCourses}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl">
                      <BookMarked className="w-8 h-8 text-white/90" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-accent to-accent-dark rounded-2xl p-6 text-white shadow-xl border border-accent-light/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm mb-2 font-medium">Total Enrollments</p>
                      <p className="text-4xl font-bold">{stats.totalEnrollments}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl">
                      <Users className="w-8 h-8 text-white/90" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl border border-green-400/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm mb-2 font-medium">Total Students</p>
                      <p className="text-4xl font-bold">{stats.totalStudents}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl">
                      <TrendingUp className="w-8 h-8 text-white/90" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-light">Course Management</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openCreateAssignmentModal}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent to-accent-dark text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      <FileText className="w-5 h-5" />
                      Create Assignment
                    </button>
                    <button
                      onClick={openCreateModal}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Create Course
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    <p className="mt-4 text-light/80">Loading courses...</p>
                  </div>
                ) : dbError && dbError.includes('does not exist') ? (
                  <div className="bg-accent/10 border-2 border-accent/30 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent/20 rounded-xl">
                        <Shield className="w-8 h-8 text-accent flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-light mb-3">Database Setup Required</h4>
                        <p className="text-light/80 mb-4">
                          The courses table hasn't been set up yet. Follow these steps:
                        </p>
                        <ol className="list-decimal list-inside text-light/70 space-y-2 mb-6 ml-2">
                          <li>Go to your Supabase dashboard</li>
                          <li>Open <strong className="text-light">SQL Editor</strong></li>
                          <li>Copy the SQL from <code className="bg-dark-navy/60 px-2 py-1 rounded text-primary-400">lib/database/database-setup-fixed.sql</code></li>
                          <li>Paste and run it</li>
                          <li>Refresh this page</li>
                        </ol>
                        <p className="text-sm text-light/70">
                          See <code className="bg-dark-navy/60 px-2 py-1 rounded text-primary-400">lib/database/database-setup-fixed.sql</code> for detailed instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-primary-500/30 rounded-2xl bg-dark-navy/40 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-10 h-10 text-primary-500/60" />
                    </div>
                    <h4 className="text-xl font-semibold text-light mb-2">No Courses Yet</h4>
                    <p className="text-light/70 mb-6">Create your first course to get started!</p>
                    <button
                      onClick={openCreateModal}
                      className="px-8 py-3 bg-gradient-to-r from-primary-500 to-accent text-white font-semibold rounded-xl hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Create Course
                    </button>
                  </div>
                ) : (
                  <div className="bg-dark-navy/80 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-dark-navy/40">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-light/70 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-light/70 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-light/70 uppercase tracking-wider">Difficulty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-light/70 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-light/70 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-dark-navy/60 divide-y divide-light/10">
                          {courses.map((course) => (
                            <tr key={course.id} className="hover:bg-primary-500/10 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-light">{course.title}</div>
                                <div className="text-sm text-light/70 line-clamp-1">{course.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                  {course.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                                  course.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  course.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                  'bg-accent/20 text-accent border-accent/30'
                                }`}>
                                  {course.difficulty}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-light/70">
                                {course.duration} weeks
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openEditModal(course)}
                                    className="text-primary-400 hover:text-primary-300 p-2 hover:bg-primary-500/20 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="text-accent hover:text-accent-light p-2 hover:bg-accent/20 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignments Management */}
              <div>
                <h3 className="text-2xl font-bold text-light mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary-500" />
                  Assignments
                </h3>
                {assignments.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-primary-500/30 rounded-2xl bg-dark-navy/40 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-primary-500/60" />
                    </div>
                    <h4 className="text-xl font-semibold text-light mb-2">No Assignments Yet</h4>
                    <p className="text-light/70 mb-6">Create your first assignment to get started!</p>
                    <button
                      onClick={openCreateAssignmentModal}
                      className="px-8 py-3 bg-gradient-to-r from-accent to-accent-dark text-white font-semibold rounded-xl hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Create Assignment
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignments.map((assignment) => {
                      const course = assignment.courses as Course
                      const dueDateInfo = formatDueDate(assignment.due_date)
                      return (
                        <div
                          key={assignment.id}
                          className={`group bg-dark-navy/60 backdrop-blur-sm border-2 rounded-2xl p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] ${
                            dueDateInfo.isOverdue 
                              ? 'border-red-500/50 hover:border-red-500' 
                              : dueDateInfo.isToday 
                              ? 'border-yellow-500/50 hover:border-yellow-500'
                              : dueDateInfo.isSoon
                              ? 'border-orange-500/50 hover:border-orange-500'
                              : 'border-primary-500/20 hover:border-primary-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-bold text-light">{assignment.title}</h4>
                                {assignment.status === 'completed' && (
                                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                )}
                              </div>
                              {course && (
                                <p className="text-primary-400 text-sm mb-2 font-medium">{course.title}</p>
                              )}
                              {assignment.description && (
                                <p className="text-light/70 text-sm mb-4 line-clamp-2">{assignment.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className={`mt-4 p-3 rounded-xl ${
                            dueDateInfo.isOverdue 
                              ? 'bg-red-500/20 border border-red-500/30' 
                              : dueDateInfo.isToday 
                              ? 'bg-yellow-500/20 border border-yellow-500/30'
                              : dueDateInfo.isSoon
                              ? 'bg-orange-500/20 border border-orange-500/30'
                              : 'bg-primary-500/20 border border-primary-500/30'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Calendar className={`w-4 h-4 ${
                                dueDateInfo.isOverdue 
                                  ? 'text-red-400' 
                                  : dueDateInfo.isToday 
                                  ? 'text-yellow-400'
                                  : dueDateInfo.isSoon
                                  ? 'text-orange-400'
                                  : 'text-primary-400'
                              }`} />
                              <span className={`text-sm font-semibold ${
                                dueDateInfo.isOverdue 
                                  ? 'text-red-400' 
                                  : dueDateInfo.isToday 
                                  ? 'text-yellow-400'
                                  : dueDateInfo.isSoon
                                  ? 'text-orange-400'
                                  : 'text-primary-400'
                              }`}>
                                {dueDateInfo.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Course Modal */}
        {showCourseModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-navy/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-500/20">
              <div className="p-6 border-b border-primary-500/20 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-light">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </h3>
                <button
                  onClick={() => {
                    setShowCourseModal(false)
                    setEditingCourse(null)
                    setCourseForm({ title: '', description: '', difficulty: 'beginner', duration: 4, category: '', code: '', color: '#0F3460' })
                  }}
                  className="text-light/60 hover:text-light/80"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-light/90 mb-2">Course Title</label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                    placeholder="e.g., The Python Dungeon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-light/90 mb-2">Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                    placeholder="Describe the course content and learning objectives..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light/90 mb-2">Difficulty</label>
                    <select
                      value={courseForm.difficulty}
                      onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value as any })}
                      className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light/90 mb-2">Duration (weeks)</label>
                    <input
                      type="number"
                      min="1"
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-light/90 mb-2">Category</label>
                  <input
                    type="text"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                    placeholder="e.g., Programming, Web Development, Data Science"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light/90 mb-2">Course Code (Optional)</label>
                    <input
                      type="text"
                      value={courseForm.code}
                      onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                      className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                      placeholder="e.g., CS101, MATH201"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light/90 mb-2">Color (Optional)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={courseForm.color}
                        onChange={(e) => setCourseForm({ ...courseForm, color: e.target.value })}
                        className="w-16 h-10 border border-light/30 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={courseForm.color}
                        onChange={(e) => setCourseForm({ ...courseForm, color: e.target.value })}
                        className="flex-1 px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                        placeholder="#0F3460"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-light/20 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCourseModal(false)
                    setEditingCourse(null)
                    setCourseForm({ title: '', description: '', difficulty: 'beginner', duration: 4, category: '', code: '', color: '#0F3460' })
                  }}
                  className="px-6 py-2 border border-light/30 text-light/90 font-semibold rounded-xl hover:bg-dark-navy/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                  disabled={!courseForm.title.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-navy/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-500/20">
              <div className="p-6 border-b border-primary-500/20 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-light">
                  Create New Assignment
                </h3>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false)
                    setAssignmentForm({ title: '', course_id: '', description: '', due_date: '', due_time: '' })
                  }}
                  className="text-light/60 hover:text-light/80"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-light/90 mb-2">Assignment Title *</label>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                    placeholder="e.g., Complete Python Project"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-light/90 mb-2">Course *</label>
                  <select
                    value={assignmentForm.course_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, course_id: e.target.value })}
                    className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-light/90 mb-2">Description</label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                    placeholder="Describe the assignment requirements and objectives..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light/90 mb-2">Due Date *</label>
                    <input
                      type="date"
                      value={assignmentForm.due_date}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                      className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light/90 mb-2">Due Time</label>
                    <input
                      type="time"
                      value={assignmentForm.due_time}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, due_time: e.target.value })}
                      className="w-full px-4 py-2 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-light bg-dark-navy/80"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-light/20 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAssignmentModal(false)
                    setAssignmentForm({ title: '', course_id: '', description: '', due_date: '', due_time: '' })
                  }}
                  className="px-6 py-2 border border-light/30 text-light/90 font-semibold rounded-xl hover:bg-dark-navy/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssignment}
                  disabled={!assignmentForm.title.trim() || !assignmentForm.course_id || !assignmentForm.due_date}
                  className="px-6 py-2 bg-gradient-to-r from-accent to-accent-dark text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Assignment
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}
