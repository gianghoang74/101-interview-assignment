import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f3a8a' },
    background: { default: '#f5f6f8' },
  },
  shape: { borderRadius: 8 },
  typography: {
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
});
