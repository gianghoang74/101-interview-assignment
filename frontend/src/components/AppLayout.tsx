import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            SimpleInvoice
          </Typography>
          <Button color="inherit" component={RouterLink} to="/invoices/new">
            New invoice
          </Button>
          {user && (
            <Typography
              variant="body2"
              sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }}
            >
              {user.fullname}
            </Typography>
          )}
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
