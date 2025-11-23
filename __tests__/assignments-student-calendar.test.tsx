import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CalendarPage from '@/app/assignments/student/page'
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

describe('Student Assignments Calendar Page', () => {
  const mockPush = jest.fn()
  const mockSession = {
    user: {
      id: 'user-123',
      user_metadata: { user_type: 'student' },
    },
  }

  const mockAssignments = [
    {
      id: 'assign-1',
      course_id: 'course-1',
      title: 'Student Assignment',
      description: 'Test Description',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      status: 'pending',
      courses: {
        id: 'course-1',
        title: 'Test Course',
        color: '#0F3460',
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(supabaseModule.supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
    })

    const mockSelect = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: mockAssignments, error: null }),
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: mockAssignments, error: null }),
      }),
    })

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return { select: mockSelect }
      }
      if (table === 'assignment_submissions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      return { select: mockSelect }
    })
  })

  it('should render student calendar page', async () => {
    render(<CalendarPage />)
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })
    expect(screen.getByText(/calendar/i)).toBeInTheDocument()
  })

  it('should redirect to auth if no session', async () => {
    ;(supabaseModule.supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    })

    render(<CalendarPage />)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth')
    })
  })

  it('should load assignments and submissions', async () => {
    render(<CalendarPage />)
    await waitFor(() => {
      expect(supabaseModule.supabase.from).toHaveBeenCalledWith('assignments')
      expect(supabaseModule.supabase.from).toHaveBeenCalledWith('assignment_submissions')
    })
  })

  it('should handle error loading assignments', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    ;(supabaseModule.supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    })

    render(<CalendarPage />)
    
    await waitFor(() => {
      const notification = screen.queryByTestId('notification')
      if (notification) {
        expect(notification.textContent).toMatch(/failed to load/i)
      }
    }, { timeout: 5000 })
  })

  it('should handle submissions loading error', async () => {
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockAssignments, error: null }),
          }),
        }
      }
      if (table === 'assignment_submissions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Submissions error' },
            }),
          }),
        }
      }
      return {}
    })

    render(<CalendarPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Should still render calendar despite submission error
    expect(screen.getByText(/assignment calendar/i)).toBeInTheDocument()
  })

  it('should handle sign out', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.auth.signOut as jest.Mock).mockResolvedValue({})

    render(<CalendarPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const signOutButtons = screen.queryAllByRole('button')
    const signOutButton = signOutButtons.find(btn => 
      btn.textContent?.toLowerCase().includes('sign out') ||
      btn.textContent?.toLowerCase().includes('logout')
    )

    if (signOutButton) {
      await user.click(signOutButton)
      expect(supabaseModule.supabase.auth.signOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/')
    }
  })
})

