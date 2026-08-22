import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from './Settings';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, canvasAPI } from '../services/api';
import toast from 'react-hot-toast';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../services/api', () => ({
  authAPI: {
    updateProfile: jest.fn(),
    validateCanvasToken: jest.fn(),
    changePassword: jest.fn(),
  },
  canvasAPI: {
    testConnection: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const withoutToken = {
  id: 'u1',
  name: 'Jane Instructor',
  email: 'jane@example.com',
  role: 'instructor' as const,
  canvasTokenType: 'instructor' as const,
  hasCanvasToken: false,
};

const withToken = { ...withoutToken, hasCanvasToken: true };

const mockAuth = (user: typeof withoutToken, refreshUser = jest.fn()) => {
  jest.mocked(useAuth).mockReturnValue({
    user,
    loading: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    refreshUser,
    isAuthenticated: true,
    backendAvailable: true,
    isInstructor: true,
    isStudent: false,
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('profile section', () => {
  test('starts read-only, showing the current user', () => {
    mockAuth(withoutToken);
    render(<Settings />);

    expect(screen.getByText('Jane Instructor')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.queryByLabelText('Full Name *')).not.toBeInTheDocument();
  });

  test('Edit reveals a form pre-filled with the current values', () => {
    mockAuth(withoutToken);
    render(<Settings />);

    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);

    expect(screen.getByLabelText('Full Name *')).toHaveValue('Jane Instructor');
    expect(screen.getByLabelText('Email Address *')).toHaveValue('jane@example.com');
  });

  test('saving calls updateProfile and refreshUser, shows a success toast, and exits edit mode', async () => {
    const refreshUser = jest.fn().mockResolvedValue(undefined);
    mockAuth(withoutToken, refreshUser);
    jest.mocked(authAPI.updateProfile).mockResolvedValue({ data: { user: withoutToken } } as any);
    render(<Settings />);

    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    fireEvent.change(screen.getByLabelText('Full Name *'), { target: { value: 'Jane Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    // Wait for the LAST step in the chain (the success toast) rather than
    // the first (the API call) - updateProfile/refreshUser/toast all happen
    // across sequential awaits, so asserting on an early step and then
    // immediately checking a later one synchronously is a race.
    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Profile updated successfully!');
    });
    expect(authAPI.updateProfile).toHaveBeenCalledWith({
      name: 'Jane Renamed',
      email: 'jane@example.com',
    });
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Full Name *')).not.toBeInTheDocument();
  });

  test('rejects an empty name/email without calling the API', async () => {
    mockAuth(withoutToken);
    render(<Settings />);

    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    fireEvent.change(screen.getByLabelText('Full Name *'), { target: { value: '' } });
    // Bypass the <input required> browser-level block (RTL's fireEvent.click
    // on the submit button respects it) to exercise the component's own
    // "!profile.name || !profile.email" guard directly.
    fireEvent.submit(screen.getByLabelText('Full Name *').closest('form')!);

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Please fill in all required fields');
    });
    expect(authAPI.updateProfile).not.toHaveBeenCalled();
  });
});

describe('Canvas API token section - no token set', () => {
  test('shows the "no token set" state with an instructor-only, non-editable token type', () => {
    mockAuth(withoutToken);
    render(<Settings />);

    expect(screen.getByText('No token set')).toBeInTheDocument();
    expect(screen.getByText('Instructor Token (Required)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /test connection/i })).not.toBeInTheDocument();
  });

  test('a valid token is validated, then saved and refreshed', async () => {
    const refreshUser = jest.fn().mockResolvedValue(undefined);
    mockAuth(withoutToken, refreshUser);
    jest.mocked(authAPI.validateCanvasToken).mockResolvedValue({ data: { valid: true } } as any);
    jest.mocked(authAPI.updateProfile).mockResolvedValue({ data: { user: withToken } } as any);
    render(<Settings />);

    fireEvent.change(screen.getByPlaceholderText(/paste your canvas api token/i), {
      target: { value: 'valid-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: /set token/i }));

    await waitFor(() => {
      expect(authAPI.validateCanvasToken).toHaveBeenCalledWith({
        canvasApiToken: 'valid-token',
        canvasTokenType: 'instructor',
      });
    });
    await waitFor(() => {
      expect(authAPI.updateProfile).toHaveBeenCalledWith({
        name: 'Jane Instructor',
        email: 'jane@example.com',
        canvasApiToken: 'valid-token',
        canvasTokenType: 'instructor',
      });
    });
    expect(refreshUser).toHaveBeenCalledTimes(1);
  });

  test('validate-then-update sequencing: an invalid token is never saved', async () => {
    mockAuth(withoutToken);
    jest.mocked(authAPI.validateCanvasToken).mockResolvedValue({
      data: { valid: false, message: 'Token rejected by Canvas' },
    } as any);
    render(<Settings />);

    fireEvent.change(screen.getByPlaceholderText(/paste your canvas api token/i), {
      target: { value: 'bad-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: /set token/i }));

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Token rejected by Canvas');
    });
    expect(authAPI.updateProfile).not.toHaveBeenCalled();
  });
});

// The Profile card also has its own "Edit" button, so any query for "Edit"
// needs to be scoped to the Canvas API Token card specifically.
const tokenCard = () => within(screen.getByText('Canvas API Token').closest('div.bg-ucf-white')!);

describe('Canvas API token section - token already set', () => {
  test('shows the masked token with Edit/Clear actions and a Test Connection button', () => {
    mockAuth(withToken);
    render(<Settings />);

    expect(screen.getByText('Token is set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^edit$/i })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  test('Test Connection reports a successful connection', async () => {
    mockAuth(withToken);
    jest.mocked(canvasAPI.testConnection).mockResolvedValue({
      data: { connected: true },
    } as any);
    render(<Settings />);

    fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => expect(screen.getByText('Connected to Canvas')).toBeInTheDocument());
    expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Canvas connection successful!');
  });

  test('Test Connection reports a failed connection', async () => {
    mockAuth(withToken);
    jest.mocked(canvasAPI.testConnection).mockResolvedValue({
      data: { connected: false, message: 'Token expired' },
    } as any);
    render(<Settings />);

    fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => expect(screen.getByText('Connection Failed')).toBeInTheDocument());
    expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Token expired');
  });

  test('Clear is gated behind window.confirm - cancelling leaves the token untouched', () => {
    mockAuth(withToken);
    window.confirm = jest.fn().mockReturnValue(false);
    render(<Settings />);

    fireEvent.click(tokenCard().getByRole('button', { name: /clear/i }));

    expect(authAPI.updateProfile).not.toHaveBeenCalled();
  });

  test('Clear, once confirmed, clears the token and refreshes the user', async () => {
    const refreshUser = jest.fn().mockResolvedValue(undefined);
    mockAuth(withToken, refreshUser);
    window.confirm = jest.fn().mockReturnValue(true);
    jest.mocked(authAPI.updateProfile).mockResolvedValue({ data: { user: withoutToken } } as any);
    render(<Settings />);

    fireEvent.click(tokenCard().getByRole('button', { name: /clear/i }));

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Canvas API Token cleared!');
    });
    expect(authAPI.updateProfile).toHaveBeenCalledWith({
      name: 'Jane Instructor',
      email: 'jane@example.com',
      canvasApiToken: '',
    });
    expect(refreshUser).toHaveBeenCalledTimes(1);
  });

  test('Edit reveals the token input again', () => {
    mockAuth(withToken);
    render(<Settings />);

    fireEvent.click(tokenCard().getByRole('button', { name: /^edit$/i }));

    expect(screen.getByPlaceholderText(/paste your canvas api token/i)).toBeInTheDocument();
  });
});

describe('password change', () => {
  const fillPasswordForm = (current: string, next: string, confirm: string) => {
    fireEvent.change(screen.getByLabelText('Current Password *'), { target: { value: current } });
    fireEvent.change(screen.getByLabelText('New Password *'), { target: { value: next } });
    fireEvent.change(screen.getByLabelText('Confirm New Password *'), { target: { value: confirm } });
  };

  test('a valid change calls changePassword and clears the fields', async () => {
    mockAuth(withoutToken);
    jest.mocked(authAPI.changePassword).mockResolvedValue({ data: undefined } as any);
    render(<Settings />);

    fillPasswordForm('oldpass', 'NewPass123', 'NewPass123');
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Password changed successfully!');
    });
    expect(authAPI.changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldpass',
      newPassword: 'NewPass123',
    });
    expect(screen.getByLabelText('New Password *')).toHaveValue('');
  });

  test('a mismatched confirmation is rejected without calling the API', async () => {
    mockAuth(withoutToken);
    render(<Settings />);

    fillPasswordForm('oldpass', 'NewPass123', 'Different123');
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('New passwords do not match');
    });
    expect(authAPI.changePassword).not.toHaveBeenCalled();
  });

  test('a weak new password (but matching confirmation) is rejected with the complexity message', async () => {
    mockAuth(withoutToken);
    render(<Settings />);

    fillPasswordForm('oldpass', 'weak', 'weak');
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Password must be at least 8 characters');
    });
    expect(authAPI.changePassword).not.toHaveBeenCalled();
  });

  test('mismatch is checked before complexity: a weak AND mismatched pair shows the mismatch error, not the complexity one', async () => {
    mockAuth(withoutToken);
    render(<Settings />);

    fillPasswordForm('oldpass', 'weak', 'notweak');
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('New passwords do not match');
    });
    expect(jest.mocked(toast.error)).not.toHaveBeenCalledWith('Password must be at least 8 characters');
  });
});
