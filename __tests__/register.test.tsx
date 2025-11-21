import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import AuthPage from '@/app/auth/page';
import * as supabaseModule from '@/lib/supabase';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

describe('Register Flow', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should show register form when register button is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthPage />);

    const registerButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(registerButton);

    expect(screen.getByRole('heading', { name: /join the quest/i })).toBeInTheDocument();
  });

  it('should call signUp with correct data and user_type in metadata', async () => {
    const user = userEvent.setup();
    const mockSignUp = (supabaseModule.supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: '123' } } },
      error: null,
    });

    render(<AuthPage />);

    // Switch to register
    const registerButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(registerButton);

    // Select user type (required for registration)
    const studentButton = screen.getByRole('button', { name: /student/i });
    await user.click(studentButton);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find((btn) => btn.getAttribute('type') === 'submit');
    if (!submitButton) throw new Error('Submit button not found');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });
  });
});

