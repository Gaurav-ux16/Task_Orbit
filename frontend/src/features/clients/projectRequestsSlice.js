import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectRequestsApi } from '../../services/taskOrbitApi';

export const fetchProjectRequests = createAsyncThunk('projectRequests/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await projectRequestsApi.list(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.friendlyMessage || 'Failed to load project requests');
  }
});

export const createProjectRequest = createAsyncThunk('projectRequests/create', async (data, { rejectWithValue }) => {
  try {
    const res = await projectRequestsApi.create(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.friendlyMessage || 'Failed to submit project request');
  }
});

export const updateProjectRequest = createAsyncThunk('projectRequests/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await projectRequestsApi.update(id, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.friendlyMessage || 'Failed to update request');
  }
});

const projectRequestsSlice = createSlice({
  name: 'projectRequests',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectRequests.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProjectRequests.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.data || [];
        s.total = a.payload.meta?.total || 0;
      })
      .addCase(fetchProjectRequests.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createProjectRequest.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(updateProjectRequest.fulfilled, (s, a) => {
        const idx = s.items.findIndex((r) => r.id === a.payload.id);
        if (idx >= 0) s.items[idx] = a.payload;
      });
  },
});

export const { clearError } = projectRequestsSlice.actions;
export default projectRequestsSlice.reducer;

export const selectProjectRequests = (s) => s.projectRequests.items;
export const selectProjectRequestsLoading = (s) => s.projectRequests.loading;
