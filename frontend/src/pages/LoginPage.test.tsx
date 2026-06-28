import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

const loginMock = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    initializing: false,
    login: loginMock,
    logout: vi.fn(),
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('shows validation errors and does not call login when the form is empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('calls login with the entered credentials', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'demo@simpleinvoice.test');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(loginMock).toHaveBeenCalledWith(
      'demo@simpleinvoice.test',
      'Password123!',
    );
  });
});
