import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import AuthPage from '@/app/auth/page';
import * as authModule from '@/lib/supabase/auth';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth module
jest.mock('@/lib/supabase/auth', () => ({
  registerWithEmail: jest.fn(),
  loginWithEmail: jest.fn(),
  getUserType: jest.fn(),
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
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should call loginWithEmail with correct credentials', async () => {
    const user = userEvent.setup();
    const mockLogin = authModule.loginWithEmail as jest.Mock;
    const mockGetUserType = authModule.getUserType as jest.Mock;
    
    mockLogin.mockResolvedValue({
      session: {
        user: { id: '123', user_metadata: { user_type: 'student' } },
      },
    });
    mockGetUserType.mockReturnValue('student');

    render(<AuthPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should redirect to student dashboard after successful login', async () => {
    const user = userEvent.setup();
    const mockLogin = authModule.loginWithEmail as jest.Mock;
    const mockGetUserType = authModule.getUserType as jest.Mock;
    
    mockLogin.mockResolvedValue({
      session: {
        user: { id: '123', user_metadata: { user_type: 'student' } },
      },
    });
    mockGetUserType.mockReturnValue('student');

    render(<AuthPage />);

    await user.type(screen.getByLabelText(/email/i), 'student@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/student');
    });
  });

  it('should redirect to admin dashboard for admin users', async () => {
    const user = userEvent.setup();
    const mockLogin = authModule.loginWithEmail as jest.Mock;
    const mockGetUserType = authModule.getUserType as jest.Mock;
    
    mockLogin.mockResolvedValue({
      session: {
        user: { id: '123', user_metadata: { user_type: 'admin' } },
      },
    });
    mockGetUserType.mockReturnValue('admin');

    render(<AuthPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/admin');
    });
  });

  it('should show error message for invalid credentials', async () => {
    const user = userEvent.setup();
    const mockLogin = authModule.loginWithEmail as jest.Mock;
    mockLogin.mockRejectedValue(new Error('Invalid login credentials'));

    render(<AuthPage />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });

  it('should show error message when login fails', async () => {
    const user = userEvent.setup();
    const mockLogin = authModule.loginWithEmail as jest.Mock;
    mockLogin.mockRejectedValue(new Error('Login failed'));

    render(<AuthPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('should toggle between login and register modes', async () => {
    const user = userEvent.setup();
    render(<AuthPage />);

    // Should show login form
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/user type/i)).not.toBeInTheDocument();

    // Click register button
    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    // Should show register form
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/user type/i)).toBeInTheDocument();

    // Click login button
    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.click(loginButton);

    // Should show login form again
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/user type/i)).not.toBeInTheDocument();
  });
});
