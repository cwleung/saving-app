import { useState } from 'react';

const HASH_KEY = 'saving-app-pw-hash';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const hasPassword = Boolean(localStorage.getItem(HASH_KEY));

  async function setup(password: string): Promise<void> {
    const hash = await sha256(password);
    localStorage.setItem(HASH_KEY, hash);
    setAuthenticated(true);
  }

  async function login(password: string): Promise<boolean> {
    const stored = localStorage.getItem(HASH_KEY);
    if (!stored) return false;
    const hash = await sha256(password);
    if (hash === stored) {
      setAuthenticated(true);
      return true;
    }
    return false;
  }

  function logout() {
    setAuthenticated(false);
  }

  return { authenticated, hasPassword, setup, login, logout };
}
