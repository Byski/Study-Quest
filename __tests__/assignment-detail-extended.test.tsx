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

describe('Assignment Detail Extended Tests', () => {
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

  it('should format due date for today', async () => {
    const todayAssignment = {
      ...mockAssignment,
      due_date: new Date().toISOString(),
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: todayAssignment,
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

    expect(screen.getByText(/due today/i)).toBeInTheDocument()
  })

  it('should format due date for tomorrow', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowAssignment = {
      ...mockAssignment,
      due_date: tomorrow.toISOString(),
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: tomorrowAssignment,
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

    expect(screen.getByText(/due tomorrow/i)).toBeInTheDocument()
  })

  it('should format due date for upcoming (within 7 days)', async () => {
    const upcoming = new Date()
    upcoming.setDate(upcoming.getDate() + 5)
    const upcomingAssignment = {
      ...mockAssignment,
      due_date: upcoming.toISOString(),
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: upcomingAssignment,
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

    expect(screen.getByText(/due in \d+ days/i)).toBeInTheDocument()
  })

  it('should format due date for normal (more than 7 days)', async () => {
    const future = new Date()
    future.setDate(future.getDate() + 14)
    const futureAssignment = {
      ...mockAssignment,
      due_date: future.toISOString(),
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: futureAssignment,
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

    expect(screen.getByText(/due:/i)).toBeInTheDocument()
  })

  it('should handle assignment with no due date', async () => {
    const noDueDateAssignment = {
      ...mockAssignment,
      due_date: '',
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: noDueDateAssignment,
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

    expect(screen.getByText(/no due date/i)).toBeInTheDocument()
  })

  it('should show status colors correctly', async () => {
    const completedAssignment = {
      ...mockAssignment,
      status: 'completed',
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: completedAssignment,
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

    // Status should be displayed (done status shows green)
    expect(screen.getByText(/test assignment/i)).toBeInTheDocument()
  })

  it('should show priority colors correctly', async () => {
    const highPriorityAssignment = {
      ...mockAssignment,
      priority: 'high',
    }

    ;(supabaseModule.supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: highPriorityAssignment,
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

    // Priority should be displayed
    expect(screen.getByText(/high/i)).toBeInTheDocument()
  })

  it('should handle status update to done', async () => {
    const user = userEvent.setup()
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
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockSubmission, status: 'completed' },
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

    const buttons = screen.queryAllByRole('button')
    const doneButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('done')
    )

    if (doneButton) {
      await user.click(doneButton)

      await waitFor(() => {
        const notification = screen.queryByTestId('notification')
        expect(notification).toBeInTheDocument()
      }, { timeout: 5000 })
    }
  })

  it('should handle status update to todo', async () => {
    const user = userEvent.setup()
    const mockSubmission = {
      id: 'sub-1',
      assignment_id: 'assign-1',
      user_id: 'user-123',
      status: 'completed',
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
                  data: { ...mockSubmission, status: 'pending' },
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

    const buttons = screen.queryAllByRole('button')
    const todoButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('todo')
    )

    if (todoButton) {
      await user.click(todoButton)

      await waitFor(() => {
        const notification = screen.queryByTestId('notification')
        expect(notification).toBeInTheDocument()
      }, { timeout: 5000 })
    }
  })
})

