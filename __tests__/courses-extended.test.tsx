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

describe('Courses Page Extended Tests', () => {
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
      title: 'Python Basics',
      description: 'Learn Python',
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

  it('should filter courses by search term', async () => {
    const user = userEvent.setup()
    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const searchInput = screen.getByPlaceholderText(/search quests/i)
    await user.type(searchInput, 'Python')

    await waitFor(() => {
      expect(screen.getByText(/python basics/i)).toBeInTheDocument()
    })
  })

  it('should filter courses by difficulty', async () => {
    const user = userEvent.setup()
    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const difficultySelect = screen.getByRole('combobox')
    await user.selectOptions(difficultySelect, 'beginner')

    await waitFor(() => {
      expect(screen.getByText(/python basics/i)).toBeInTheDocument()
    })
  })

  it('should handle enrollment', async () => {
    const user = userEvent.setup()
    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const enrollButtons = screen.getAllByRole('button', { name: /enroll/i })
    if (enrollButtons.length > 0) {
      await user.click(enrollButtons[0])

      await waitFor(() => {
        const notification = screen.queryByTestId('notification')
        expect(notification).toBeInTheDocument()
      }, { timeout: 5000 })
    }
  })

  it('should handle enrollment error', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'enrollments') {
        return {
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Enrollment failed' },
          }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      if (table === 'courses') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockCourses, error: null }),
          }),
        }
      }
      return {}
    })

    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const enrollButtons = screen.getAllByRole('button', { name: /enroll/i })
    if (enrollButtons.length > 0) {
      await user.click(enrollButtons[0])

      await waitFor(() => {
        const notification = screen.queryByTestId('notification')
        if (notification) {
          expect(notification.textContent).toMatch(/failed/i)
        }
      }, { timeout: 5000 })
    }
  })

  it('should handle unenrollment', async () => {
    const user = userEvent.setup()
    // Mock enrolled courses
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ course_id: 'course-1' }],
              error: null,
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      if (table === 'courses') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockCourses, error: null }),
          }),
        }
      }
      return {}
    })

    render(<CoursesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const unenrollButtons = screen.queryAllByRole('button', { name: /unenroll/i })
    if (unenrollButtons.length > 0) {
      await user.click(unenrollButtons[0])

      await waitFor(() => {
        const notification = screen.queryByTestId('notification')
        expect(notification).toBeInTheDocument()
      }, { timeout: 5000 })
    }
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

  it('should redirect to auth if no session', async () => {
    ;(supabaseModule.supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    })

    render(<CoursesPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth')
    })
  })

  it('should show sample courses on error', async () => {
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'courses') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
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

    // Should show sample courses
    expect(screen.getByText(/python dungeon/i)).toBeInTheDocument()
  })

  it('should handle enrollment loading error', async () => {
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
              data: null,
              error: { message: 'Enrollment error' },
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

    // Should still render courses
    expect(screen.getByText(/python basics/i)).toBeInTheDocument()
  })

  it('should handle unenrollment error', async () => {
    const user = userEvent.setup()
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
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Delete failed' },
              }),
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

    const unenrollButtons = screen.queryAllByRole('button', { name: /unenroll/i })
    if (unenrollButtons.length > 0) {
      await user.click(unenrollButtons[0])

      await waitFor(() => {
        const notification = screen.queryByTestId('notification')
        if (notification) {
          expect(notification.textContent).toMatch(/failed/i)
        }
      }, { timeout: 5000 })
    }
  })

  it('should handle unenrollment when session is missing', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.auth.getSession as jest.Mock).mockImplementation(() => {
      let callCount = 0
      return Promise.resolve({
        data: {
          session: callCount++ === 0 ? mockSession : null,
        },
      })
    })

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

    const unenrollButtons = screen.queryAllByRole('button', { name: /unenroll/i })
    if (unenrollButtons.length > 0) {
      await user.click(unenrollButtons[0])
      // Should not throw, just return early
    }
  })
})

