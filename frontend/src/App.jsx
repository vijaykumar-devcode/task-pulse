import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, MenuItem, Stack, TextField, Typography, Paper } from '@mui/material';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { fetchMe, login, register, restoreSession } from './store/authSlice';
import { clearCurrentTask, fetchTasks, fetchTaskDetail } from './store/tasksSlice';
import { fetchUsers } from './store/usersSlice';
import { tasksApi, usersApi } from './api/client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { autoConnect: false });

const AuthPage = ({ mode }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.includes('@') || form.password.length < 6) {
      setError('Use a valid email and a password with at least 6 characters.');
      return;
    }

    try {
      const action = mode === 'login' ? login(form) : register(form);
      await dispatch(action).unwrap();
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Authentication failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, background: 'radial-gradient(circle at top, rgba(15,118,110,0.18), transparent 40%), linear-gradient(180deg, #f4f1ea 0%, #edf6f5 100%)' }}>
      <Card sx={{ width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(16,42,67,0.12)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>Task Pulse</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {mode === 'login' ? 'Sign in to manage your tasks and team.' : 'Create an account to start managing work.'}
          </Typography>
          <Stack component="form" spacing={2} onSubmit={submit}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} fullWidth />
            <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} fullWidth />
            <Button type="submit" variant="contained" size="large" disabled={authState.status === 'loading'}>
              {mode === 'login' ? 'Login' : 'Register'}
            </Button>
            <Button component={RouterLink} to={mode === 'login' ? '/register' : '/login'}>
              {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { items, status, pagination } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({ status: '', priority: '', sortBy: 'createdAt', sortOrder: 'desc', search: '' });
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    socket.connect();
    socket.on('task:created', () => dispatch(fetchTasks(filters)));
    socket.on('task:updated', () => dispatch(fetchTasks(filters)));
    socket.on('task:deleted', () => dispatch(fetchTasks(filters)));

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.disconnect();
    };
  }, [dispatch, filters]);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, rgba(15,118,110,0.96), rgba(180,83,9,0.88))', color: 'white' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}>
          <Box>
            <Typography variant="h4">Task Dashboard</Typography>
            <Typography sx={{ opacity: 0.9 }}>Filter, sort, assign, and keep documents attached to every task.</Typography>
          </Box>
          <Button variant="contained" color="secondary" onClick={() => navigate('/tasks/new')}>
            New Task
          </Button>
        </Stack>
      </Paper>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField label="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} fullWidth /></Grid>
            <Grid item xs={6} md={2}><TextField select label="Status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} fullWidth><MenuItem value="">All</MenuItem><MenuItem value="todo">Todo</MenuItem><MenuItem value="in_progress">In progress</MenuItem><MenuItem value="done">Done</MenuItem></TextField></Grid>
            <Grid item xs={6} md={2}><TextField select label="Priority" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })} fullWidth><MenuItem value="">All</MenuItem><MenuItem value="low">Low</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="high">High</MenuItem></TextField></Grid>
            <Grid item xs={6} md={2}><TextField select label="Sort By" value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })} fullWidth><MenuItem value="createdAt">Created</MenuItem><MenuItem value="dueDate">Due date</MenuItem><MenuItem value="priority">Priority</MenuItem></TextField></Grid>
            <Grid item xs={6} md={2}><TextField select label="Order" value={filters.sortOrder} onChange={(event) => setFilters({ ...filters, sortOrder: event.target.value })} fullWidth><MenuItem value="desc">Descending</MenuItem><MenuItem value="asc">Ascending</MenuItem></TextField></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {status === 'loading' && <Grid item xs={12}><Alert severity="info">Loading tasks...</Alert></Grid>}
        {items.map((task) => (
          <Grid item xs={12} md={6} key={task.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography variant="h6">{task.title}</Typography>
                    <Chip label={task.status} color={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'default'} />
                  </Stack>
                  <Typography color="text.secondary">{task.description || 'No description provided.'}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={`Priority: ${task.priority}`} />
                    <Chip size="small" label={`Docs: ${task.documents.length}`} />
                    <Chip size="small" label={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'} />
                  </Stack>
                  <Divider />
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => navigate(`/tasks/${task.id}`)}>View</Button>
                    {(user?.role === 'admin' || task.createdBy?.id === user?.id) && <Button variant="contained" onClick={() => navigate(`/tasks/${task.id}/edit`)}>Edit</Button>}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography color="text.secondary">
        Page {pagination.page} of {pagination.pages}
      </Typography>
    </Stack>
  );
};

const TaskFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [task, setTask] = useState({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: '', assignedToInput: '', documents: [] });
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (user?.role === 'admin') {
      usersApi.list({ limit: 50 }).then((response) => setUsers(response.data.items));
    }
  }, [user]);

  useEffect(() => {
    if (!id) {
      return;
    }

    tasksApi.detail(id).then((response) => {
      const current = response.data.task;
      setTask({
        title: current.title || '',
        description: current.description || '',
        status: current.status || 'todo',
        priority: current.priority || 'medium',
        dueDate: current.dueDate ? new Date(current.dueDate).toISOString().slice(0, 10) : '',
        assignedTo: current.assignedTo?.id || '',
        assignedToInput: current.assignedTo?.email || '',
        documents: [],
      });
      setExistingDocuments(current.documents || []);
    });
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    if (!task.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (task.documents.length > 3) {
      setError('Attach up to 3 PDF documents.');
      return;
    }

    const assignedToValue = task.assignedToInput.trim();
    let assignedTo = task.assignedTo;

    if (assignedToValue) {
      const matchedUser = users.find((item) => item.id === assignedToValue || item.email.toLowerCase() === assignedToValue.toLowerCase());
      if (!matchedUser) {
        setError('Enter a valid user email for Assign to.');
        return;
      }
      assignedTo = matchedUser.id;
    } else {
      assignedTo = '';
    }

    const formData = new FormData();
    Object.entries({ ...task, assignedTo }).forEach(([key, value]) => {
      if (key === 'documents') {
        value.forEach((file) => formData.append('documents', file));
        return;
      }
      if (key === 'assignedToInput') {
        return;
      }
      if (value !== '') {
        formData.append(key, value);
      }
    });

    if (isEditMode) {
      await tasksApi.update(id, formData);
      setMessage('Task updated successfully.');
    } else {
      await tasksApi.create(formData);
      setMessage('Task created successfully.');
    }
    navigate('/');
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3 }}>{isEditMode ? 'Edit Task' : 'Create Task'}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <Stack component="form" spacing={2} onSubmit={submit}>
          <TextField label="Title" value={task.title} onChange={(event) => setTask({ ...task, title: event.target.value })} fullWidth />
          <TextField label="Description" value={task.description} multiline minRows={4} onChange={(event) => setTask({ ...task, description: event.target.value })} fullWidth />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField select label="Status" value={task.status} onChange={(event) => setTask({ ...task, status: event.target.value })} fullWidth><MenuItem value="todo">Todo</MenuItem><MenuItem value="in_progress">In progress</MenuItem><MenuItem value="done">Done</MenuItem></TextField></Grid>
            <Grid item xs={12} md={4}><TextField select label="Priority" value={task.priority} onChange={(event) => setTask({ ...task, priority: event.target.value })} fullWidth><MenuItem value="low">Low</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="high">High</MenuItem></TextField></Grid>
            <Grid item xs={12} md={4}><TextField label="Due date" type="date" value={task.dueDate} onChange={(event) => setTask({ ...task, dueDate: event.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
          <TextField
            label="Assign to"
            value={task.assignedToInput}
            onChange={(event) => setTask({ ...task, assignedToInput: event.target.value })}
            fullWidth
            placeholder="Type a user email"
            helperText="Type the assignee's email or leave blank to keep it unassigned."
          />
          <Button variant="outlined" component="label">
            Attach PDF documents
            <input hidden type="file" accept="application/pdf" multiple onChange={(event) => setTask({ ...task, documents: Array.from(event.target.files || []) })} />
          </Button>
          <Typography variant="body2" color="text.secondary">Attached files: {task.documents.length}</Typography>
          {existingDocuments.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Current documents</Typography>
              {existingDocuments.map((document) => (
                <Paper key={document.id} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{document.originalName}</Typography>
                  <Button size="small" color="error" onClick={async () => {
                    await tasksApi.removeDocument(id, document.id);
                    const refreshed = await tasksApi.detail(id);
                    setExistingDocuments(refreshed.data.task.documents);
                  }}>Remove</Button>
                </Paper>
              ))}
            </Stack>
          )}
          <Button type="submit" variant="contained">{isEditMode ? 'Update Task' : 'Create Task'}</Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const TaskDetailPage = () => {
  const { currentTask } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: taskId } = useParams();

  useEffect(() => {
    dispatch(clearCurrentTask());
    dispatch(fetchTaskDetail(taskId));
  }, [dispatch, taskId]);

  const removeTask = async () => {
    await tasksApi.remove(taskId);
    navigate('/');
  };

  if (!currentTask) {
    return <Alert severity="info">Loading task...</Alert>;
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h4">{currentTask.title}</Typography>
          <Typography color="text.secondary">{currentTask.description}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={currentTask.status} />
            <Chip label={currentTask.priority} />
            <Chip label={currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : 'No due date'} />
          </Stack>
          <Divider />
          <Typography variant="h6">Documents</Typography>
          <Stack spacing={1}>
            {currentTask.documents.map((document) => (
              <Paper key={document.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                <Box>
                  <Typography fontWeight={700}>{document.originalName}</Typography>
                  <Typography variant="body2" color="text.secondary">PDF, {(document.size / 1024).toFixed(1)} KB</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button component="a" href={tasksApi.documentUrl(currentTask.id, document.id)} target="_blank" rel="noreferrer">View</Button>
                  <Button component="a" href={tasksApi.documentUrl(currentTask.id, document.id, true)} target="_blank" rel="noreferrer">Download</Button>
                  {(user?.role === 'admin' || currentTask.createdBy?.id === user?.id) && (
                    <Button color="error" onClick={async () => {
                      await tasksApi.removeDocument(currentTask.id, document.id);
                      dispatch(fetchTaskDetail(taskId));
                    }}>
                      Delete
                    </Button>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
          {(user?.role === 'admin' || currentTask.createdBy?.id === user?.id) && (
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => navigate(`/tasks/${currentTask.id}/edit`)}>Edit Task</Button>
              <Button color="error" variant="outlined" onClick={removeTask}>Delete Task</Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const UsersPage = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.users);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers({ limit: 50 }));
  }, [dispatch]);

  const createUser = async (event) => {
    event.preventDefault();
    if (editingId) {
      await usersApi.update(editingId, form);
    } else {
      await usersApi.create(form);
    }
    dispatch(fetchUsers({ limit: 50 }));
    setForm({ email: '', password: '', role: 'user' });
    setEditingId(null);
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>{editingId ? 'Edit User' : 'Create User'}</Typography>
          <Stack component="form" spacing={2} onSubmit={createUser}>
            <TextField label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <TextField select label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            <Button type="submit" variant="contained">{editingId ? 'Update User' : 'Create User'}</Button>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Users</Typography>
          <Stack spacing={1}>
            {items.map((item) => (
              <Paper key={item.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography>{item.email}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={item.role} />
                  <Button size="small" onClick={() => {
                    setEditingId(item.id);
                    setForm({ email: item.email, password: '', role: item.role });
                  }}>Edit</Button>
                  <Button size="small" color="error" onClick={async () => {
                    await usersApi.remove(item.id);
                    dispatch(fetchUsers({ limit: 50 }));
                  }}>Delete</Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

const NotFoundPage = () => <Alert severity="info">Page not found.</Alert>;

const App = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch, token]);

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks/new" element={<TaskFormPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="tasks/:id/edit" element={<TaskFormPage />} />
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
