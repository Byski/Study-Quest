'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, LogOut, Sword, Shield, Zap, BookMarked, CheckCircle, Search, Calendar } from 'lucide-react'
import Notification from '@/components/Notification'

interface Course {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  category: string
  created_at: string
}

interface Enrollment {
  course_id: string
  enrolled_at: string
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    checkUser()
    loadCourses()
    loadEnrollments()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error: any) {
      console.error('Error loading courses:', error.message)
      setCourses(getSampleCourses())
    } finally {
      setLoading(false)
    }
  }

  const loadEnrollments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', session.user.id)

      if (error) throw error
      if (data) {
        setEnrollments(new Set(data.map(e => e.course_id)))
      }
    } catch (error: any) {
      console.error('Error loading enrollments:', error.message)
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: session.user.id,
          course_id: courseId,
          enrolled_at: new Date().toISOString()
        })

      if (error) throw error

      setEnrollments(prev => new Set(prev).add(courseId))
      setNotification({ message: 'Successfully enrolled in course!', type: 'success' })
    } catch (error: any) {
      console.error('Error enrolling:', error.message)
      setNotification({ message: 'Failed to enroll. Please try again.', type: 'error' })
    }
  }

  const handleUnenroll = async (courseId: string) => {
    try {
      const { data: { session } = {} } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('user_id', session.user.id)
        .eq('course_id', courseId)

      if (error) throw error

      setEnrollments(prev => {
        const newSet = new Set(prev)
        newSet.delete(courseId)
        return newSet
      })
      setNotification({ message: 'Successfully unenrolled from course', type: 'success' })
    } catch (error: any) {
      console.error('Error unenrolling:', error.message)
      setNotification({ message: 'Failed to unenroll. Please try again.', type: 'error' })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Zap className="w-5 h-5 text-green-500" />
      case 'intermediate':
        return <Sword className="w-5 h-5 text-yellow-500" />
      case 'advanced':
        return <Shield className="w-5 h-5 text-red-500" />
      default:
        return <BookOpen className="w-5 h-5 text-light/70" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced':
        return 'bg-accent/20 text-accent border-accent/30'
      default:
        return 'bg-dark-navy/30 text-light/90 border-light/30'
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = filterDifficulty === 'all' || course.difficulty === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  const getSampleCourses = (): Course[] => {
    return [
      {
        id: '1',
        title: 'The Python Dungeon',
        description: 'Master the basics of Python programming in this beginner-friendly quest. Learn variables, loops, and functions.',
        difficulty: 'beginner',
        duration: 4,
        category: 'Programming',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'JavaScript Quest',
        description: 'Embark on a journey to learn JavaScript. Build interactive web applications and master modern ES6+ features.',
        difficulty: 'intermediate',
        duration: 6,
        category: 'Web Development',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Data Structures & Algorithms Challenge',
        description: 'Face the ultimate challenge! Master complex data structures and algorithms to become a coding champion.',
        difficulty: 'advanced',
        duration: 8,
        category: 'Computer Science',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        title: 'React Mastery Quest',
        description: 'Learn React from scratch and build modern, interactive user interfaces. Perfect for web developers.',
        difficulty: 'intermediate',
        duration: 5,
        category: 'Web Development',
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        title: 'SQL Fundamentals',
        description: 'Learn to query databases like a pro. Master SQL and unlock the power of data manipulation.',
        difficulty: 'beginner',
        duration: 3,
        category: 'Database',
        created_at: new Date().toISOString()
      },
      {
        id: '6',
        title: 'Machine Learning Expedition',
        description: 'Dive deep into the world of AI and machine learning. Build models that can predict and learn.',
        difficulty: 'advanced',
        duration: 10,
        category: 'Data Science',
        created_at: new Date().toISOString()
      }
    ]
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
      <header className="bg-dark-navy/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sword className="w-8 h-8 text-primary-500" />
              <h1 className="text-2xl font-bold text-light">Browse Quests</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/student')}
                className="px-4 py-2 text-light/80 hover:text-light transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/assignments/student')}
                className="flex items-center gap-2 px-4 py-2 text-primary-500 hover:text-primary-600 transition-colors font-medium"
              >
                <Calendar className="w-5 h-5" />
                <span>Calendar</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-light/80 hover:text-light transition-colors"
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
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="bg-dark-navy/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light/60" />
                <input
                  type="text"
                  placeholder="Search quests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-dark-navy/50 text-light placeholder-light/50"
                />
              </div>
              
              {/* Difficulty Filter */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-3 border border-light/30 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-dark-navy/50 text-light"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-light/80">Loading quests...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-dark-navy/80 backdrop-blur-sm rounded-xl shadow-lg">
            <BookOpen className="w-16 h-16 text-light/60 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-light/90 mb-2">No quests found</h3>
            <p className="text-light/70">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = enrollments.has(course.id)
              return (
                <div
                  key={course.id}
                  className="bg-dark-navy/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-primary-200"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getDifficultyIcon(course.difficulty)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                      </div>
                      {isEnrolled && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-light mb-2">{course.title}</h3>
                    
                    {/* Description */}
                    <p className="text-light/80 text-sm mb-4 line-clamp-3">{course.description}</p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-light/70 mb-4">
                      <span className="flex items-center gap-1">
                        <BookMarked className="w-4 h-4" />
                        {course.category}
                      </span>
                      <span>{course.duration} weeks</span>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => isEnrolled ? handleUnenroll(course.id) : handleEnroll(course.id)}
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                        isEnrolled
                          ? 'bg-dark-navy/30 text-light/90 hover:bg-gray-200'
                          : 'bg-gradient-to-r from-primary-500 to-accent text-white hover:shadow-lg transform hover:scale-[1.02]'
                      }`}
                    >
                      {isEnrolled ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Enrolled
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Sword className="w-5 h-5" />
                          Enroll in Quest
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

