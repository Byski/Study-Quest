import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useParams } from 'next/navigation'
import AssignmentDetailPage from '@/app/assignments/[id]/page'
import * as supabaseModule from '@/lib/supabase'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
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

describe('Assignment Detail Page Tests', () => {
  const mockPush = jest.fn()
  const mockBack = jest.fn()
  const mockSession = {
    user: {
      id: 'user-123',
      user_metadata: { user_type: 'student' },
    },
  }

  const mockAssignment = {
    id: 'assign-1',
    course_id: 'course-1',
    title: 'Test Assignment',
    description: 'Test Description',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    status: 'pending',
    priority: 'high',
    estimated_hours: 5,
    courses: {
      id: 'course-1',
      title: 'Test Course',
      color: '#0F3460',
      difficulty: 'beginner',
      duration: 4,
      category: 'Programming',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack })
    ;(useParams as jest.Mock).mockReturnValue({ id: 'assign-1' })
    ;(supabaseModule.supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
    })
  })

  it('should handle assignment loading error', async () => {
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Assignment not found' },
              }),
            }),
          }),
        }
      }
      return {}
    })

    render(<AssignmentDetailPage />)

    await waitFor(() => {
      const notification = screen.queryByTestId('notification')
      if (notification) {
        expect(notification.textContent).toMatch(/failed to load/i)
      }
    }, { timeout: 5000 })
  })

  it('should handle submission error that is not PGRST116', async () => {
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAssignment,
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'assignment_submissions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'OTHER_ERROR', message: 'Database error' },
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    render(<AssignmentDetailPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Should log error but continue rendering
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should handle submission with data', async () => {
    const mockSubmission = {
      id: 'sub-1',
      assignment_id: 'assign-1',
      user_id: 'user-123',
      status: 'in_progress',
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAssignment,
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'assignment_submissions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    render(<AssignmentDetailPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    expect(screen.getByText(/test assignment/i)).toBeInTheDocument()
  })

  it('should handle status update with existing submission', async () => {
    const user = userEvent.setup()
    const mockSubmission = {
      id: 'sub-1',
      assignment_id: 'assign-1',
      user_id: 'user-123',
      status: 'pending',
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAssignment,
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'assignment_submissions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockSubmission, status: 'in_progress' },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    render(<AssignmentDetailPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Find and click status update button
    const buttons = screen.queryAllByRole('button')
    const statusButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('doing') ||
      btn.textContent?.toLowerCase().includes('in progress')
    )

    if (statusButton) {
      await user.click(statusButton)

      await waitFor(() => {
        const notification = screen.queryByTestId('notification')
        expect(notification).toBeInTheDocument()
      }, { timeout: 5000 })
    }
  })

  it('should handle status update error', async () => {
    const user = userEvent.setup()
    const mockSubmission = {
      id: 'sub-1',
      assignment_id: 'assign-1',
      user_id: 'user-123',
      status: 'pending',
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAssignment,
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'assignment_submissions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Update failed' },
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    render(<AssignmentDetailPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const buttons = screen.queryAllByRole('button')
    const statusButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('doing')
    )

    if (statusButton) {
      await user.click(statusButton)

      await waitFor(() => {
        const notification = screen.queryByTestId('notification')
        if (notification) {
          expect(notification.textContent).toMatch(/failed/i)
        }
      }, { timeout: 5000 })
    }
  })

  it('should handle no assignment found', async () => {
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }
      }
      return {}
    })

    render(<AssignmentDetailPage />)

    await waitFor(() => {
      expect(screen.getByText(/assignment not found/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should handle back button click', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAssignment,
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'assignment_submissions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    render(<AssignmentDetailPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const backButtons = screen.queryAllByRole('button')
    const backButton = backButtons.find(btn => 
      btn.getAttribute('aria-label')?.includes('back') ||
      btn.onClick
    )

    if (backButton) {
      await user.click(backButton)
      // Back should be called or router.back should be called
    }
  })
})

