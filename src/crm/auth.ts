// Simple SHA-256 based auth for internal use only.
// Credentials are verified by hashing the entered password and comparing
// against the stored hash in crm_users via a Supabase edge function.
// The session is kept in sessionStorage to clear on tab close.

const SESSION_KEY = 'crm_session';

export interface CrmSession {
  username: string;
  loggedInAt: number;
}

export function getSession(): CrmSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CrmSession;
  } catch {
    return null;
  }
}

export function setSession(username: string) {
  const session: CrmSession = { username, loggedInAt: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
