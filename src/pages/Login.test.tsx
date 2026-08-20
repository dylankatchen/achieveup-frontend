import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Login from './Login';

// Mock the AuthContext
const mockLogin = jest.fn();
const mockAuthContext = {
  user: null,
  logout: jest.fn(),
  backendAvailable: true,
  isAuthenticated: false,
  loading: false,
  login: mockLogin,
  signup: jest.fn(),
  refreshUser: jest.fn(),
  isInstructor: false,
  isStudent: false,
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock react-hot-toast (Login.tsx uses the default export)
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const LoginWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue(mockAuthContext);
    window.history.pushState({}, '', '/login');
  });

  test('renders login form correctly', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    expect(screen.getByText('AchieveUp Portal')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  test('displays all feature highlights', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    expect(screen.getByText(/AI-powered skill suggestions for your courses/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero-shot classification for quiz questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Track course progress and skill mastery/i)).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive analytics and insights/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  test('handles successful login', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // A successful login should actually take the user somewhere and tell them it worked.
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
    expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Welcome back!');
  });

  test('shows an error toast and stays on the page when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'));

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Invalid email or password');
    });

    // A failed login must not navigate away or claim success.
    expect(window.location.pathname).toBe('/login');
    expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
  });

  test('shows loading state during login', async () => {
    let resolveLogin: (value: void) => void;
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValue(loginPromise);

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Check loading state
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveLogin!();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('handles keyboard navigation', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    emailInput.focus();
    expect(emailInput).toHaveFocus();

    userEvent.tab();
    expect(passwordInput).toHaveFocus();
  });

  test('handles form submission with Enter key', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123{enter}');

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('signup link navigation', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const signupLink = screen.getByText('Create account');
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  test('clears form validation errors on input change', async () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Trigger validation error
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Type in email field
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Error should clear
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  test('handles special characters in password', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    const specialPassword = 'P@ssw0rd!#$%^&*()';
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: specialPassword } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', specialPassword);
    });
  });

  test('handles long email addresses', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    const longEmail = 'very.long.email.address.that.might.cause.issues@example.com';
    fireEvent.change(emailInput, { target: { value: longEmail } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(longEmail, 'password123');
    });
  });
});
