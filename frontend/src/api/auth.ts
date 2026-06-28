import { api } from './client';
import { clearToken, setToken } from './token';
import type { AuthUser } from './types';

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
    '/auth/login',
    { email, password },
  );
  setToken(data.accessToken);
  return data.user;
}

/** Logout is client-side: the stateless JWT is simply discarded. */
export function logout(): void {
  clearToken();
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}
