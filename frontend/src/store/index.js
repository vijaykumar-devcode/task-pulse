import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import tasksReducer from './tasksSlice';
import usersReducer from './usersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    users: usersReducer,
  },
});
