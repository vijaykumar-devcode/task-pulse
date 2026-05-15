import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api/client';

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

const initialState = {
  token: storedToken || null,
  user: storedUser ? JSON.parse(storedUser) : null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk('auth/login', async (payload) => {
  const { data } = await authApi.login(payload);
  return data;
});

export const register = createAsyncThunk('auth/register', async (payload) => {
  const { data } = await authApi.register(payload);
  return data;
});

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const { data } = await authApi.me();
  return data.user;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    restoreSession(state) {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      state.token = token;
      state.user = user ? JSON.parse(user) : null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      });
  },
});

export const { logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
