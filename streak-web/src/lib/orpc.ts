import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const API_RPC_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/rpc';

export const TOKEN_KEY = 'taskstreak_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// Instantiate RPCLink with dynamic Authorization header
const rpcLink = new RPCLink({
  url: API_RPC_URL,
  headers: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export const orpc = createORPCClient(rpcLink);
