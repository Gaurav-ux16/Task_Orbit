import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/taskOrbitApi';

const messageOf = (err, fallback) => err?.friendlyMessage || err?.response?.data?.error || fallback;

/** Restores the session from the HttpOnly cookie on page load. */
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  try {
    const res = await authApi.me();
    return res.data.data;
  } catch (err) {
    if (err.response?.status === 401) return null; // simply not signed in
    return rejectWithValue(messageOf(err, 'Unable to reach the server'));
  }
});

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authApi.login(credentials);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(messageOf(err, 'Sign-in failed'));
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const res = await authApi.register(payload);
    return res.data.data;
  } catch (err) {
    const details = err.response?.data?.details;
    return rejectWithValue(details?.length ? details.map((d) => d.message).join('. ') : messageOf(err, 'Registration failed'));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch {
    /* the local state is cleared regardless */
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    csrfToken: null,
    status: 'idle', // idle | loading | ready
    error: null,
    sessionExpired: false,
  },
  reducers: {
    /** Dispatched by the HTTP layer when any API call answers 401. */
    sessionExpired(state) {
      if (state.user) state.sessionExpired = true;
      state.user = null;
      state.csrfToken = null;
    },
    clearAuthError(state) {
      state.error = null;
      state.sessionExpired = false;
    },
  },
  extraReducers: (builder) => {
    const signedIn = (state, action) => {
      state.user = action.payload.user;
      state.csrfToken = action.payload.csrfToken;
      state.status = 'ready';
      state.error = null;
      state.sessionExpired = false;
    };
    builder
      .addCase(bootstrapSession.pending, (s) => { s.status = 'loading'; })
      .addCase(bootstrapSession.fulfilled, (s, a) => {
        s.status = 'ready';
        s.user = a.payload?.user ?? null;
        s.csrfToken = a.payload?.csrfToken ?? null;
      })
      .addCase(bootstrapSession.rejected, (s, a) => { s.status = 'ready'; s.error = a.payload; })
      .addCase(login.pending, (s) => { s.error = null; })
      .addCase(login.fulfilled, signedIn)
      .addCase(login.rejected, (s, a) => { s.error = a.payload; })
      .addCase(register.pending, (s) => { s.error = null; })
      .addCase(register.fulfilled, signedIn)
      .addCase(register.rejected, (s, a) => { s.error = a.payload; })
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
        s.csrfToken = null;
        s.sessionExpired = false;
      });
  },
});

export const { sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCsrfToken = (state) => state.auth.csrfToken;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectSessionExpired = (state) => state.auth.sessionExpired;
