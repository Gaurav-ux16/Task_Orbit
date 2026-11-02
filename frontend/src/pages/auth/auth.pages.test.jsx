import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders, signedInState, signedOutState } from '../../test/utils';

vi.mock('../../services/taskOrbitApi', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    changePassword: vi.fn(),
  },
  usersApi: { create: vi.fn() },
}));

import { authApi } from '../../services/taskOrbitApi';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ProtectedRoute, PublicOnlyRoute } from '../../components/ProtectedRoute';

const Page = ({ name }) => <div>{name} page</div>;

function Routed({ initial }) {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/manager/projects" element={<ProtectedRoute roles={['project_manager']}><Page name="Manager" /></ProtectedRoute>} />
      <Route path="/assignee/tasks" element={<ProtectedRoute roles={['assignee']}><Page name="Assignee" /></ProtectedRoute>} />
      <Route path="/client/requests" element={<ProtectedRoute roles={['client']}><Page name="Client" /></ProtectedRoute>} />
      <Route path="/forbidden" element={<Page name="Forbidden" />} />
      <Route path="*" element={<Page name={`Fallback ${initial}`} />} />
    </Routes>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('LoginPage (page + control tests)', () => {
  const setup = () => renderWithProviders(<Routed initial="x" />, { state: signedOutState(), route: '/login' });

  test('renders labelled e-mail / password fields and a submit button', () => {
    setup();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
  });

  test('empty submit shows inline errors and never calls the API', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findAllByRole('alert')).toHaveLength(2);
    expect(authApi.login).not.toHaveBeenCalled();
  });

  test('malformed e-mail is rejected client-side', async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/^password/i), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/valid e-mail/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  test('successful login stores the user and redirects to the role home page', async () => {
    authApi.login.mockResolvedValue({
      data: { data: { user: { id: 'manager-001', role: 'project_manager', display_name: 'Bob' }, csrfToken: 'tok' } },
    });
    const { store } = setup();
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'bob@taskorbit.io');
    await userEvent.type(screen.getByLabelText(/^password/i), 'TaskOrbit@2026!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Manager page')).toBeInTheDocument();
    expect(authApi.login).toHaveBeenCalledWith({ email: 'bob@taskorbit.io', password: 'TaskOrbit@2026!', remember: false });
    expect(store.getState().auth.user.role).toBe('project_manager');
    expect(store.getState().auth.csrfToken).toBe('tok');
  });

  test('returns to the originally requested page only when the new role may open it (regression)', async () => {
    authApi.login.mockResolvedValue({ data: { data: { user: { id: 'a', role: 'assignee', display_name: 'A' }, csrfToken: 't' } } });
    // visitor was bounced from a MANAGER page, then signs in as an assignee
    renderWithProviders(<Routed initial="x" />, { state: signedOutState(), route: '/manager/projects' });
    await userEvent.type(await screen.findByLabelText(/e-mail/i), 'carol@taskorbit.io');
    await userEvent.type(screen.getByLabelText(/^password/i), 'x');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Assignee page')).toBeInTheDocument();
    expect(screen.queryByText('Forbidden page')).not.toBeInTheDocument();
  });

  test('"keep me signed in" is sent as remember=true', async () => {
    authApi.login.mockResolvedValue({ data: { data: { user: { id: 'a', role: 'assignee', display_name: 'A' }, csrfToken: 't' } } });
    setup();
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'carol@taskorbit.io');
    await userEvent.type(screen.getByLabelText(/^password/i), 'x');
    await userEvent.click(screen.getByLabelText(/keep me signed in/i));
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await screen.findByText('Assignee page');
    expect(authApi.login).toHaveBeenCalledWith(expect.objectContaining({ remember: true }));
  });

  test('server rejection shows the generic error and keeps the user on the page', async () => {
    authApi.login.mockRejectedValue({ friendlyMessage: 'Invalid e-mail or password', response: { status: 401 } });
    setup();
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'bob@taskorbit.io');
    await userEvent.type(screen.getByLabelText(/^password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Invalid e-mail or password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('an expired session is explained on the login screen', () => {
    renderWithProviders(<Routed initial="x" />, {
      state: { auth: { ...signedOutState().auth, sessionExpired: true } },
      route: '/login',
    });
    expect(screen.getByText(/session expired/i)).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  const setup = () => renderWithProviders(<Routed initial="x" />, { state: signedOutState(), route: '/register' });

  test('weak password and mismatch are blocked before any request', async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'weak');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/password needs/i)).toBeInTheDocument();
    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  test('injection payload in the name field is blocked', async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/full name/i), "<script>alert(1)</script>");
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!Passphrase');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!Passphrase');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/name must be/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  test('valid registration signs the client in', async () => {
    authApi.register.mockResolvedValue({ data: { data: { user: { id: 'c9', role: 'client', display_name: 'Jane' }, csrfToken: 't' } } });
    setup();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!Passphrase');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!Passphrase');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Client page')).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalledWith({ display_name: 'Jane Doe', email: 'jane@example.com', password: 'Str0ng!Passphrase' });
  });
});

describe('ProtectedRoute / PublicOnlyRoute (route guards)', () => {
  test('signed-out visitor is redirected to /login', async () => {
    renderWithProviders(<Routed initial="x" />, { state: signedOutState(), route: '/manager/projects' });
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('wrong role is sent to /forbidden', async () => {
    renderWithProviders(<Routed initial="x" />, { state: signedInState('assignee'), route: '/manager/projects' });
    expect(await screen.findByText('Forbidden page')).toBeInTheDocument();
  });

  test('correct role sees the page', () => {
    renderWithProviders(<Routed initial="x" />, { state: signedInState('project_manager'), route: '/manager/projects' });
    expect(screen.getByText('Manager page')).toBeInTheDocument();
  });

  test('every role is blocked from every other role\'s area', async () => {
    const areas = { project_manager: '/manager/projects', assignee: '/assignee/tasks', client: '/client/requests' };
    for (const [role] of Object.entries(areas)) {
      for (const [other, path] of Object.entries(areas)) {
        if (other === role) continue;
        const { unmount } = renderWithProviders(<Routed initial="x" />, { state: signedInState(role), route: path });
        expect(await screen.findByText('Forbidden page')).toBeInTheDocument();
        unmount();
      }
    }
  });

  test('shows a loading indicator while the session is being restored', () => {
    renderWithProviders(<Routed initial="x" />, {
      state: { auth: { user: null, csrfToken: null, status: 'loading', error: null, sessionExpired: false } },
      route: '/manager/projects',
    });
    expect(screen.getByRole('status', { name: /loading session/i })).toBeInTheDocument();
  });

  test('signed-in users are bounced away from /login', async () => {
    renderWithProviders(<Routed initial="x" />, { state: signedInState('client'), route: '/login' });
    await waitFor(() => expect(screen.getByText('Client page')).toBeInTheDocument());
  });
});
