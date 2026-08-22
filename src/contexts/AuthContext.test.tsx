import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { authAPI } from '../services/api';

jest.mock('../services/api', () => ({
  authAPI: {
    me: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
  },
}));

const instructorUser = {
  id: 'instructor-1',
  name: 'Jane Instructor',
  email: 'jane@example.com',
  role: 'instructor',
};

// A real consumer of useAuth(), rendered inside a real AuthProvider - this is
// the single most important untested file in the app (every route guard
// depends on it), so it's exercised through its actual public contract
// rather than reimplementing its internals as assertions.
const TestConsumer: React.FC = () => {
  const auth = useAuth();
  const [actionError, setActionError] = React.useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setActionError(null);
    try {
      await action();
    } catch (error: any) {
      setActionError(error.message);
    }
  };

  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="isAuthenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="backendAvailable">{String(auth.backendAvailable)}</div>
      <div data-testid="isInstructor">{String(auth.isInstructor)}</div>
      <div data-testid="isStudent">{String(auth.isStudent)}</div>
      <div data-testid="userName">{auth.user?.name ?? 'none'}</div>
      <div data-testid="actionError">{actionError ?? 'none'}</div>
      <button onClick={() => run(() => auth.login('jane@example.com', 'password123'))}>login</button>
      <button
        onClick={() =>
          run(() =>
            auth.signup({
              name: 'Jane Instructor',
              email: 'jane@example.com',
              password: 'password123',
              canvasApiToken: 'valid-token',
            })
          )
        }
      >
        signup
      </button>
      <button
        onClick={() =>
          run(() =>
            auth.signup({
              name: 'Jane Instructor',
              email: 'jane@example.com',
              password: 'password123',
              canvasApiToken: '',
            })
          )
        }
      >
        signup-without-token
      </button>
      <button onClick={() => auth.logout()}>logout</button>
      <button onClick={() => run(() => auth.refreshUser())}>refresh</button>
    </div>
  );
};

const renderAuth = () => render(<AuthProvider><TestConsumer /></AuthProvider>);

beforeEach(() => {
  localStorage.clear();
});

describe('checkAuthStatus (on mount)', () => {
  test('with no stored token, resolves to logged-out state without calling the API', async () => {
    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('backendAvailable')).toHaveTextContent('true');
    expect(authAPI.me).not.toHaveBeenCalled();
  });

  test('with a stored token, a successful /me call logs the user in', async () => {
    localStorage.setItem('token', 'existing-token');
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructorUser } } as any);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Jane Instructor'));
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('isInstructor')).toHaveTextContent('true');
  });

  test('also accepts a /me response with no .user wrapper (response.data is the user itself)', async () => {
    localStorage.setItem('token', 'existing-token');
    jest.mocked(authAPI.me).mockResolvedValue({ data: instructorUser } as any);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Jane Instructor'));
  });

  test('with a stored token that fails verification (generic error), clears the token and logs out, but keeps backendAvailable true', async () => {
    localStorage.setItem('token', 'stale-token');
    jest.mocked(authAPI.me).mockRejectedValue(new Error('Invalid token'));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('backendAvailable')).toHaveTextContent('true');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('with a stored token that fails due to a network error, marks the backend unavailable', async () => {
    localStorage.setItem('token', 'stale-token');
    jest.mocked(authAPI.me).mockRejectedValue({ code: 'NETWORK_ERROR', message: 'Network Error' });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('backendAvailable')).toHaveTextContent('false'));
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });
});

describe('login', () => {
  test('on success, stores the token and loads the user via /me', async () => {
    jest.mocked(authAPI.login).mockResolvedValue({ data: { token: 'new-token' } } as any);
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructorUser } } as any);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Jane Instructor'));
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(screen.getByTestId('actionError')).toHaveTextContent('none');
  });

  test("if /me fails after a successful login, falls back to the login response's own user", async () => {
    jest.mocked(authAPI.login).mockResolvedValue({
      data: { token: 'new-token', user: instructorUser },
    } as any);
    jest.mocked(authAPI.me).mockRejectedValue(new Error('me unavailable'));

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Jane Instructor'));
    expect(screen.getByTestId('actionError')).toHaveTextContent('none');
  });

  test('rejects with an error when the response has no token', async () => {
    jest.mocked(authAPI.login).mockResolvedValue({ data: {} } as any);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('login'));

    await waitFor(() =>
      expect(screen.getByTestId('actionError')).toHaveTextContent('Login failed. Please try again.')
    );
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });

  test('a rejected login call marks the backend unavailable only when it is a network error', async () => {
    jest.mocked(authAPI.login).mockRejectedValue({ code: 'NETWORK_ERROR', message: 'Network Error' });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('backendAvailable')).toHaveTextContent('false'));
  });

  test('a rejected login call for a normal (non-network) error leaves backendAvailable true', async () => {
    jest.mocked(authAPI.login).mockRejectedValue(new Error('Invalid credentials'));

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('login'));

    await waitFor(() =>
      expect(screen.getByTestId('actionError')).toHaveTextContent('Invalid credentials')
    );
    expect(screen.getByTestId('backendAvailable')).toHaveTextContent('true');
  });
});

describe('signup', () => {
  test('rejects before ever calling the API when canvasApiToken is missing', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('signup-without-token'));

    await waitFor(() =>
      expect(screen.getByTestId('actionError')).toHaveTextContent(
        'A Canvas API token is required to sign up.'
      )
    );
    expect(authAPI.signup).not.toHaveBeenCalled();
  });

  test('on success, stores the token and loads the user via /me', async () => {
    jest.mocked(authAPI.signup).mockResolvedValue({ data: { token: 'new-token' } } as any);
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructorUser } } as any);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('signup'));

    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Jane Instructor'));
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  test('rejects with an error when the response has no token', async () => {
    jest.mocked(authAPI.signup).mockResolvedValue({ data: {} } as any);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('signup'));

    await waitFor(() =>
      expect(screen.getByTestId('actionError')).toHaveTextContent('Signup failed. Please try again.')
    );
  });
});

describe('logout', () => {
  test('clears the token and the user', async () => {
    localStorage.setItem('token', 'existing-token');
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructorUser } } as any);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Jane Instructor'));

    fireEvent.click(screen.getByText('logout'));

    expect(screen.getByTestId('userName')).toHaveTextContent('none');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('refreshUser', () => {
  test('on success, updates the user from the latest /me response', async () => {
    localStorage.setItem('token', 'existing-token');
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructorUser } } as any);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Jane Instructor'));

    jest.mocked(authAPI.me).mockResolvedValue({
      data: { user: { ...instructorUser, name: 'Renamed Instructor' } },
    } as any);
    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Renamed Instructor'));
  });

  test('on failure, logs the user out rather than leaving stale data displayed', async () => {
    localStorage.setItem('token', 'existing-token');
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructorUser } } as any);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('Jane Instructor'));

    jest.mocked(authAPI.me).mockRejectedValue(new Error('me unavailable'));
    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() => expect(screen.getByTestId('userName')).toHaveTextContent('none'));
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('isInstructor / isStudent derivation', () => {
  test('a student user derives isStudent true, isInstructor false', async () => {
    localStorage.setItem('token', 'existing-token');
    jest.mocked(authAPI.me).mockResolvedValue({
      data: { user: { ...instructorUser, role: 'student' } },
    } as any);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('isStudent')).toHaveTextContent('true'));
    expect(screen.getByTestId('isInstructor')).toHaveTextContent('false');
  });
});
