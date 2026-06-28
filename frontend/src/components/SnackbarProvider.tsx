import { Alert, Snackbar } from '@mui/material';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface SnackbarContextValue {
  notify: (message: string, severity?: Severity) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined,
);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const notify = useCallback(
    (message: string, severity: Severity = 'success') => {
      setState({ open: true, message, severity });
    },
    [],
  );

  const handleClose = useCallback(
    () => setState((prev) => ({ ...prev, open: false })),
    [],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={state.severity} variant="filled" onClose={handleClose}>
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return ctx;
}
