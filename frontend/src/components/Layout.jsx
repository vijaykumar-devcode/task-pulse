import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, NavLink, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';

const navLinkStyle = ({ isActive }) => ({
  color: isActive ? '#0f766e' : '#486581',
  textDecoration: 'none',
  fontWeight: 700,
});

const Layout = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f4f1ea 0%, #edf6f5 100%)' }}>
      <AppBar position="sticky" elevation={0} sx={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(16,42,67,0.08)' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography component={RouterLink} to="/" variant="h6" sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 900 }}>
              Task Pulse
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <NavLink to="/" style={navLinkStyle}>Dashboard</NavLink>
              {user?.role === 'admin' && <NavLink to="/users" style={navLinkStyle}>Users</NavLink>}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {user?.email} {user?.role ? `(${user.role})` : ''}
            </Typography>
            <Button variant="outlined" color="primary" onClick={() => dispatch(logout())}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default Layout;
