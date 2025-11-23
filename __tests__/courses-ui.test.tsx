import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CoursesPage from '@/app/courses/page'
import * as supabaseModule from '@/lib/supabase'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}))

jest.mock('@/components/Notification', () => {
  return function MockNotification({ message, type, onClose }: any) {
    return (
      <div data-testid="notification" data-type={type}>
        {message}
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
})

describe('Courses Page UI Tests', () => {
  const mockPush = jest.fn()
  const mockSession = {
    user: {
      id: 'user-123',
      user_metadata: { user_type: 'student' },
    },
  }

  const mockCourses = [
    {
      id: 'course-1',
      title: 'Python Fundamentals',
      description: 'Learn Python basics',
      difficulty: 'beginner',
      duration: 4,
      category: 'Programming',
      created_at: new Date().toISOString(),
    },
    {
      id: 'course-2',
      title: 'Advanced React',
      description: 'Master React',
      difficulty: 'advanced',
      duration: 6,
      category: 'Web Development',
      created_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(supabaseModule.supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
    })

    const mockSelect = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: mockCourses, error: null }),
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    })

    const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null })

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'courses') {
        return { select: mockSelect }
      }
      if (table === 'enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
          insert: mockInsert,
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      return { select: mockSelect }
    })
  })

  it('should show empty courses state', async () => {
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'courses') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      if (table === 'enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      return {}
    })

    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    expect(screen.getByText(/no quests found/i)).toBeInTheDocument()
  })

  it('should show enrolled course with checkmark', async () => {
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'courses') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockCourses, error: null }),
          }),
        }
      }
      if (table === 'enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ course_id: 'course-1' }],
              error: null,
            }),
          }),
        }
      }
      return {}
    })

    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Should show enrolled status
    expect(screen.getByText(/enrolled/i)).toBeInTheDocument()
  })

  it('should navigate to dashboard', async () => {
    const user = userEvent.setup()
    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i })
    await user.click(dashboardButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/student')
  })

  it('should navigate to calendar', async () => {
    const user = userEvent.setup()
    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const calendarButton = screen.getByRole('button', { name: /calendar/i })
    await user.click(calendarButton)

    expect(mockPush).toHaveBeenCalledWith('/assignments/student')
  })

  it('should handle sign out', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.auth.signOut as jest.Mock).mockResolvedValue({})

    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    await user.click(signOutButton)

    expect(supabaseModule.supabase.auth.signOut).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

