import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectsApi } from '../../services/taskOrbitApi';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await projectsApi.list(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.friendlyMessage || 'Failed to load projects');
  }
});

export const createProject = createAsyncThunk('projects/create', async (data, { rejectWithValue }) => {
  try {
    const res = await projectsApi.create(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.friendlyMessage || 'Failed to create project');
  }
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: {
    clearProjectsError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProjects.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.data || [];
        s.total = a.payload.meta?.total || 0;
      })
      .addCase(fetchProjects.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createProject.fulfilled, (s, a) => { s.items.unshift(a.payload); });
  },
});

export const { clearProjectsError } = projectsSlice.actions;
export default projectsSlice.reducer;

export const selectProjects = (s) => s.projects.items;
export const selectProjectsLoading = (s) => s.projects.loading;
