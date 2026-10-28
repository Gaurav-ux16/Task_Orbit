import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksApi, submissionsApi, reviewsApi } from '../../services/taskOrbitApi';

/**
 * Async Thunk: Fetch all tasks assigned to a specific developer.
 * Demonstrates Redux Toolkit createAsyncThunk, pending/fulfilled/rejected lifecycle.
 */
export const fetchAssigneeTasks = createAsyncThunk(
  'assignee/fetchTasks',
  async ({ assigneeId, status, priority } = {}, { rejectWithValue }) => {
    try {
      const params = { assignee_id: assigneeId };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      const res = await tasksApi.list(params);
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.friendlyMessage || 'Failed to fetch assignee tasks');
    }
  }
);

/**
 * Async Thunk: Fetch complete details for a single task including submissions and reviews.
 */
export const fetchTaskDetails = createAsyncThunk(
  'assignee/fetchTaskDetails',
  async (taskId, { rejectWithValue }) => {
    try {
      const [taskRes, subRes, revRes] = await Promise.all([
        tasksApi.get(taskId),
        submissionsApi.list(taskId),
        reviewsApi.getForTask(taskId),
      ]);
      return {
        task: taskRes.data.data,
        submissions: subRes.data.data || [],
        reviews: revRes.data.data || [],
      };
    } catch (err) {
      return rejectWithValue(err.friendlyMessage || 'Failed to load task details');
    }
  }
);

/**
 * Async Thunk: Advance task status from 'todo' to 'in_progress'.
 * Enforces valid state transition on backend and reflects in Redux store.
 */
export const startTask = createAsyncThunk(
  'assignee/startTask',
  async (taskId, { rejectWithValue }) => {
    try {
      await tasksApi.updateStatus(taskId, 'in_progress');
      return { taskId, status: 'in_progress' };
    } catch (err) {
      return rejectWithValue(err.friendlyMessage || 'Failed to start task');
    }
  }
);

/**
 * Async Thunk: Upload a deliverable file and submit task for review.
 * Advances task status from 'in_progress' or 'revision' to 'submitted'.
 */
export const submitDeliverable = createAsyncThunk(
  'assignee/submitDeliverable',
  async ({ taskId, formData }, { rejectWithValue }) => {
    try {
      const res = await submissionsApi.create(taskId, formData);
      return { taskId, submission: res.data.data, status: 'submitted' };
    } catch (err) {
      return rejectWithValue(err.friendlyMessage || 'Failed to submit deliverable');
    }
  }
);

const assigneeSlice = createSlice({
  name: 'assignee',
  initialState: {
    tasks: [],
    currentTaskDetails: null,
    loading: false,
    detailsLoading: false,
    actionSubmitting: false,
    error: null,
    actionError: null,
    actionSuccess: null,
  },
  reducers: {
    clearAssigneeErrors(state) {
      state.error = null;
      state.actionError = null;
    },
    clearAssigneeSuccess(state) {
      state.actionSuccess = null;
    },
    resetCurrentTaskDetails(state) {
      state.currentTaskDetails = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAssigneeTasks
    builder
      .addCase(fetchAssigneeTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssigneeTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchAssigneeTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchTaskDetails
    builder
      .addCase(fetchTaskDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentTaskDetails = action.payload;
      })
      .addCase(fetchTaskDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      });

    // startTask
    builder
      .addCase(startTask.pending, (state) => {
        state.actionSubmitting = true;
        state.actionError = null;
      })
      .addCase(startTask.fulfilled, (state, action) => {
        state.actionSubmitting = false;
        state.actionSuccess = 'Task started successfully!';
        const task = state.tasks.find((t) => t.id === action.payload.taskId);
        if (task) task.status = action.payload.status;
        if (state.currentTaskDetails?.task?.id === action.payload.taskId) {
          state.currentTaskDetails.task.status = action.payload.status;
        }
      })
      .addCase(startTask.rejected, (state, action) => {
        state.actionSubmitting = false;
        state.actionError = action.payload;
      });

    // submitDeliverable
    builder
      .addCase(submitDeliverable.pending, (state) => {
        state.actionSubmitting = true;
        state.actionError = null;
      })
      .addCase(submitDeliverable.fulfilled, (state, action) => {
        state.actionSubmitting = false;
        state.actionSuccess = 'Deliverable submitted for review!';
        const task = state.tasks.find((t) => t.id === action.payload.taskId);
        if (task) task.status = action.payload.status;
        if (state.currentTaskDetails?.task?.id === action.payload.taskId) {
          state.currentTaskDetails.task.status = action.payload.status;
          state.currentTaskDetails.submissions.unshift(action.payload.submission);
        }
      })
      .addCase(submitDeliverable.rejected, (state, action) => {
        state.actionSubmitting = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  clearAssigneeErrors,
  clearAssigneeSuccess,
  resetCurrentTaskDetails,
} = assigneeSlice.actions;

export default assigneeSlice.reducer;

// Selectors
export const selectAssigneeTasks = (state) => state.assignee.tasks;
export const selectAssigneeLoading = (state) => state.assignee.loading;
export const selectAssigneeError = (state) => state.assignee.error;
export const selectCurrentTaskDetails = (state) => state.assignee.currentTaskDetails;
export const selectDetailsLoading = (state) => state.assignee.detailsLoading;
export const selectActionSubmitting = (state) => state.assignee.actionSubmitting;
export const selectActionError = (state) => state.assignee.actionError;
export const selectActionSuccess = (state) => state.assignee.actionSuccess;
