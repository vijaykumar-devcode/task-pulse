import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { usersApi } from '../api/client';

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (params) => {
  const { data } = await usersApi.list(params);
  return data;
});

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 1 },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          pages: action.payload.pages,
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default usersSlice.reducer;
