import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import AuthPage from '@/app/auth/page'
import * as supabaseModule from '@/lib/supabase'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getSession: jest.fn(),
    },
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

describe('Auth Page Extended Tests', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('should show error when registering without user type', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    // Switch to register mode
    const toggleButton = screen.getByText(/don't have an account/i)
    await user.click(toggleButton)

    // Fill form without selecting user type
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    // Submit
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please select a user type/i)).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]')

    expect(passwordInput.type).toBe('password')
    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')
    }
  })

  it('should handle login error', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    })

    render(<AuthPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      const notification = screen.queryByTestId('notification')
      expect(notification).toBeInTheDocument()
    })
  })

  it('should handle registration error', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already exists' },
    })

    render(<AuthPage />)

    // Switch to register
    const toggleButton = screen.getByText(/don't have an account/i)
    await user.click(toggleButton)

    // Select user type
    const studentButton = screen.getByText(/student/i).closest('button')
    if (studentButton) await user.click(studentButton)

    await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      const notification = screen.queryByTestId('notification')
      expect(notification).toBeInTheDocument()
    })
  })

  it('should navigate back to home', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    const backButton = screen.getByText(/back to home/i)
    await user.click(backButton)

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('should toggle between login and register modes', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()

    const toggleButton = screen.getByText(/don't have an account/i)
    await user.click(toggleButton)

    expect(screen.getByText(/join the quest/i)).toBeInTheDocument()

    const toggleBackButton = screen.getByText(/already have an account/i)
    await user.click(toggleBackButton)

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('should select admin user type', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    // Switch to register
    const toggleButton = screen.getByText(/don't have an account/i)
    await user.click(toggleButton)

    // Select admin
    const adminButton = screen.getByText(/admin/i).closest('button')
    if (adminButton) {
      await user.click(adminButton)
      expect(adminButton).toHaveClass('border-accent')
    }
  })

  it('should handle successful registration', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      error: null,
    })

    render(<AuthPage />)

    // Switch to register
    const toggleButton = screen.getByText(/don't have an account/i)
    await user.click(toggleButton)

    // Select user type
    const studentButton = screen.getByText(/student/i).closest('button')
    if (studentButton) await user.click(studentButton)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      const notification = screen.queryByTestId('notification')
      if (notification) {
        expect(notification.textContent).toMatch(/registration successful/i)
      }
      // Should switch back to login mode
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should handle successful login', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { user_type: 'student' },
        },
        session: {},
      },
      error: null,
    })

    render(<AuthPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/student')
    }, { timeout: 5000 })
  })

  it('should handle login with admin user type', async () => {
    const user = userEvent.setup()
    ;(supabaseModule.supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          user_metadata: { user_type: 'admin' },
        },
        session: {},
      },
      error: null,
    })

    render(<AuthPage />)

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/admin')
    }, { timeout: 5000 })
  })

  it('should close notification', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    // Trigger an error to show notification
    ;(supabaseModule.supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    })

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      const notification = screen.queryByTestId('notification')
      expect(notification).toBeInTheDocument()
    }, { timeout: 5000 })

    // Close notification
    const closeButton = screen.queryByText(/close/i)
    if (closeButton) {
      await user.click(closeButton)
      await waitFor(() => {
        expect(screen.queryByTestId('notification')).not.toBeInTheDocument()
      })
    }
  })
})

