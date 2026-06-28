import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
