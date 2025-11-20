import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import AuthPage from '@/app/auth/page';
import { registerWithEmail } from '@/lib/supabaseClient';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabaseClient', () => ({
  registerWithEmail: jest.fn(),
  loginWithEmail: jest.fn(),
}));

describe('Register Flow', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should show register form when register button is clicked', async () => {
    render(<AuthPage />);
    
    const registerToggleButton = screen.getAllByText('Register').find(
      (btn) => btn.getAttribute('type') === 'button'
    );
    if (registerToggleButton) {
      await userEvent.click(registerToggleButton);
    }

    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText(/user type/i)).toBeInTheDocument();
  });

  it('should require user type selection', async () => {
    render(<AuthPage />);
    
    const registerToggleButton = screen.getAllByText('Register').find(
      (btn) => btn.getAttribute('type') === 'button'
    );
    if (registerToggleButton) {
      await userEvent.click(registerToggleButton);
    }

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please select a user type/i)).toBeInTheDocument();
    });
  });

  it('should call registerWithEmail with user_type in metadata', async () => {
    (registerWithEmail as jest.Mock).mockResolvedValue({});

    render(<AuthPage />);
    
    const registerToggleButton = screen.getAllByText('Register').find(
      (btn) => btn.getAttribute('type') === 'button'
    );
    if (registerToggleButton) {
      await userEvent.click(registerToggleButton);
    }

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const adminRadio = screen.getByLabelText(/admin/i);
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await userEvent.type(emailInput, 'admin@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(adminRadio);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(registerWithEmail).toHaveBeenCalledWith(
        'admin@example.com',
        'password123',
        'admin'
      );
    });
  });

  it('should redirect to dashboard after successful registration', async () => {
    (registerWithEmail as jest.Mock).mockResolvedValue({});

    render(<AuthPage />);
    
    const registerToggleButton = screen.getAllByText('Register').find(
      (btn) => btn.getAttribute('type') === 'button'
    );
    if (registerToggleButton) {
      await userEvent.click(registerToggleButton);
    }

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const studentRadio = screen.getByLabelText(/student/i);
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await userEvent.type(emailInput, 'student@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(studentRadio);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/student');
    });
  });

  it('should show error message for duplicate email', async () => {
    const error = new Error('User already registered');
    (registerWithEmail as jest.Mock).mockRejectedValue(error);

    render(<AuthPage />);
    
    const registerToggleButton = screen.getAllByText('Register').find(
      (btn) => btn.getAttribute('type') === 'button'
    );
    if (registerToggleButton) {
      await userEvent.click(registerToggleButton);
    }

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const studentRadio = screen.getByLabelText(/student/i);
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(studentRadio);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/user already registered/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid data', async () => {
    const error = new Error('Invalid email format');
    (registerWithEmail as jest.Mock).mockRejectedValue(error);

    render(<AuthPage />);
    
    const registerToggleButton = screen.getAllByText('Register').find(
      (btn) => btn.getAttribute('type') === 'button'
    );
    if (registerToggleButton) {
      await userEvent.click(registerToggleButton);
    }

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const studentRadio = screen.getByLabelText(/student/i);
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'pass');
    await userEvent.click(studentRadio);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });
});

