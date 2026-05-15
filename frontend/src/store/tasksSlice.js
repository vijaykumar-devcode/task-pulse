import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { tasksApi } from '../api/client';

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (params) => {
  const { data } = await tasksApi.list(params);
  return data;
});

export const fetchTaskDetail = createAsyncThunk('tasks/fetchTaskDetail', async (id) => {
  const { data } = await tasksApi.detail(id);
  return data.task;
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    currentTask: null,
    status: 'idle',
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 1 },
  },
  reducers: {
    clearCurrentTask(state) {
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          pages: action.payload.pages,
        };
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchTaskDetail.fulfilled, (state, action) => {
        state.currentTask = action.payload;
      });
  },
});

export const { clearCurrentTask } = tasksSlice.actions;
export default tasksSlice.reducer;
