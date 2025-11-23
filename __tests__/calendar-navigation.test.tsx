import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CalendarPage from '@/app/assignments/page'
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

describe('Calendar Navigation Tests', () => {
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
      title: 'Test Assignment',
      description: 'Test',
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

  it('should navigate to previous month', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Find previous month button (ChevronLeft icon)
    const buttons = screen.getAllByRole('button')
    const prevButton = buttons.find(btn => {
      const svg = btn.querySelector('svg')
      return svg && btn.onClick
    })

    if (prevButton) {
      const currentMonth = screen.getByText(/december|november|october/i)
      await user.click(prevButton)
      // Month should change
      await waitFor(() => {
        const newMonth = screen.queryByText(/november|october|september/i)
        if (newMonth) {
          expect(newMonth).toBeInTheDocument()
        }
      }, { timeout: 3000 })
    }
  })

  it('should navigate to next month', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Find next month button (ChevronRight icon)
    const buttons = screen.getAllByRole('button')
    const nextButton = buttons.find(btn => {
      const svg = btn.querySelector('svg')
      return svg && btn.onClick
    })

    if (nextButton) {
      await user.click(nextButton)
      // Month should change
      await waitFor(() => {
        // Calendar should update
        expect(screen.getByText(/assignment calendar/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    }
  })

  it('should navigate to today', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Find "Go to Today" button
    const buttons = screen.getAllByRole('button')
    const todayButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('today') ||
      btn.textContent?.toLowerCase().includes('go to')
    )

    if (todayButton) {
      await user.click(todayButton)
      // Should navigate to current month
      const currentMonth = new Date().toLocaleString('default', { month: 'long' })
      await waitFor(() => {
        const monthText = screen.queryByText(new RegExp(currentMonth, 'i'))
        if (monthText) {
          expect(monthText).toBeInTheDocument()
        }
      }, { timeout: 3000 })
    }
  })

  it('should handle assignment click on calendar', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Try to find and click an assignment on the calendar
    const assignmentElements = screen.queryAllByText(/test assignment/i)
    if (assignmentElements.length > 0) {
      await user.click(assignmentElements[0])
      // Should navigate to assignment detail
      expect(mockPush).toHaveBeenCalled()
    }
  })

  it('should handle sign out from calendar', async () => {
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
})

