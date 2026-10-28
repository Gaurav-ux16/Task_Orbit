import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksApi } from '../../services/taskOrbitApi';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await tasksApi.list(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.friendlyMessage || 'Failed to load tasks');
  }
});

export const createTask = createAsyncThunk('tasks/create', async (data, { rejectWithValue }) => {
  try {
    const res = await tasksApi.create(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.friendlyMessage || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await tasksApi.update(id, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.friendlyMessage || 'Failed to update task');
  }
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearTasksError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchTasks.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.data || [];
        s.total = a.payload.meta?.total || 0;
      })
      .addCase(fetchTasks.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createTask.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(updateTask.fulfilled, (s, a) => {
        const idx = s.items.findIndex((t) => t.id === a.payload.id);
        if (idx >= 0) s.items[idx] = a.payload;
      });
  },
});

export const { clearTasksError } = tasksSlice.actions;
export default tasksSlice.reducer;

export const selectTasks = (s) => s.tasks.items;
export const selectTasksLoading = (s) => s.tasks.loading;
export const selectTasksError = (s) => s.tasks.error;
