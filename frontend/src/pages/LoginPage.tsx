import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

interface FromState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { user, login, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (!initializing && user) {
    const to = (location.state as FromState | null)?.from?.pathname ?? '/';
    return <Navigate to={to} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate('/', { replace: true });
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ width: 400, maxWidth: '100%' }} elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            SimpleInvoice
          </Typography>
          <form onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email"
                type="email"
                fullWidth
                autoFocus
                {...register('email')}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                {...register('password')}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
