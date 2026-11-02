import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { makeStore } from '../app/store';

export const USER = (role = 'project_manager', extra = {}) => ({
  id: `${role}-1`,
  display_name: 'Test Person',
  email: 'test@example.com',
  role,
  ...extra,
});

export function signedInState(role = 'project_manager') {
  return {
    auth: { user: USER(role), csrfToken: 'csrf-token-123', status: 'ready', error: null, sessionExpired: false },
  };
}

export function signedOutState() {
  return { auth: { user: null, csrfToken: null, status: 'ready', error: null, sessionExpired: false } };
}

/** Renders with a real Redux store (optionally pre-loaded) and an in-memory router. */
export function renderWithProviders(ui, { state, route = '/' } = {}) {
  const store = makeStore(state);
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>
  );
  return { store, ...utils };
}
