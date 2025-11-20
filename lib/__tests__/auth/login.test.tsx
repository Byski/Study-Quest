import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import AuthPage from '@/app/auth/page';
import { loginWithEmail } from '@/lib/supabaseClient';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabaseClient', () => ({
  registerWithEmail: jest.fn(),
  loginWithEmail: jest.fn(),
}));

describe('Login Flow', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should show login form by default', () => {
    render(<AuthPage />);
    
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should redirect to student dashboard for student user', async () => {
    (loginWithEmail as jest.Mock).mockResolvedValue({
      user: {
        user_metadata: { user_type: 'student' },
      },
    });

    render(<AuthPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^login$/i });

    await userEvent.type(emailInput, 'student@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(loginWithEmail).toHaveBeenCalledWith('student@example.com', 'password123');
      expect(mockPush).toHaveBeenCalledWith('/dashboard/student');
    });
  });

  it('should redirect to admin dashboard for admin user', async () => {
    (loginWithEmail as jest.Mock).mockResolvedValue({
      user: {
        user_metadata: { user_type: 'admin' },
      },
    });

    render(<AuthPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^login$/i });

    await userEvent.type(emailInput, 'admin@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/admin');
    });
  });

  it('should default to student if user_type is missing', async () => {
    (loginWithEmail as jest.Mock).mockResolvedValue({
      user: {
        user_metadata: {},
      },
    });

    render(<AuthPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^login$/i });

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/student');
    });
  });

  it('should show error message for invalid credentials', async () => {
    const error = new Error('Invalid login credentials');
    (loginWithEmail as jest.Mock).mockRejectedValue(error);

    render(<AuthPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^login$/i });

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });
  });

  it('should show generic error message for unknown errors', async () => {
    const error = new Error('Network error');
    (loginWithEmail as jest.Mock).mockRejectedValue(error);

    render(<AuthPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^login$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should toggle between login and register', async () => {
    render(<AuthPage />);

    expect(screen.getAllByText('Login').length).toBeGreaterThan(0);
    expect(screen.queryByText(/user type/i)).not.toBeInTheDocument();

    const registerButtons = screen.getAllByText('Register');
    const toggleButton = registerButtons.find(btn => btn.getAttribute('type') === 'button');
    if (toggleButton) {
      await userEvent.click(toggleButton);
    }

    expect(screen.getAllByText('Register').length).toBeGreaterThan(0);
    expect(screen.getByText(/user type/i)).toBeInTheDocument();
  });
});

