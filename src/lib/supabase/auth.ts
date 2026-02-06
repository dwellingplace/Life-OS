import { getSupabase, isSupabaseConfigured } from './client'
import { db } from '@/lib/db'
import type { Session, User, AuthError } from '@supabase/supabase-js'

// ── Types ──

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
}

// ── Local persistence helpers ──

/**
 * Persist the authenticated user ID into the local IndexedDB appSettings row
 * so the sync layer and other offline-first code can reference it without
 * needing a live Supabase connection.
 */
async function persistAuthLocally(userId: string | null): Promise<void> {
  try {
    const existing = await db.appSettings.get('user-settings')
    if (existing) {
      await db.appSettings.update('user-settings', {
        ...existing,
        // Store userId alongside existing settings — the field is added
        // dynamically and does not break the typed schema at runtime.
        ...(({ userId } as unknown) as Record<string, unknown>),
        updatedAt: new Date().toISOString(),
      })
    }
  } catch {
    // Silently fail — local DB may not be initialised yet during first load
  }
}

// ── Auth functions ──

/**
 * Sign in with email + password.
 * Returns the authenticated user on success, or an AuthError on failure.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: {
        name: 'AuthConfigError',
        message: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        status: 0,
      } as AuthError,
    }
  }

  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  })

  if (data?.user) {
    await persistAuthLocally(data.user.id)
  }

  return { user: data?.user ?? null, error }
}

/**
 * Sign up with email + password.
 * Supabase will send a confirmation email by default depending on project settings.
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: {
        name: 'AuthConfigError',
        message: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        status: 0,
      } as AuthError,
    }
  }

  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
  })

  if (data?.user) {
    await persistAuthLocally(data.user.id)
  }

  return { user: data?.user ?? null, error }
}

/**
 * Sign in with Google OAuth.
 * This triggers a redirect to Google's consent screen; the user will be
 * redirected back to the app after granting access.  Call
 * `onAuthStateChange` on mount to capture the session that arrives via the
 * redirect URL.
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  if (!isSupabaseConfigured()) {
    return {
      error: {
        name: 'AuthConfigError',
        message: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        status: 0,
      } as AuthError,
    }
  }

  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
    },
  })

  return { error }
}

/**
 * Sign out the current user and clear local auth state.
 */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    await getSupabase().auth.signOut()
  }
  await persistAuthLocally(null)
}

/**
 * Retrieve the current Supabase session (if any).
 * Returns null when Supabase is not configured.
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const { data } = await getSupabase().auth.getSession()
  return data.session
}

/**
 * Retrieve the current authenticated user from Supabase.
 * This makes a network request to verify the access token; prefer
 * `getCurrentSession()` when you just need the cached JWT payload.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const { data } = await getSupabase().auth.getUser()
  return data.user
}

/**
 * Subscribe to auth state changes (sign-in, sign-out, token refresh, etc.).
 * The callback receives the Supabase auth event name and the current session.
 *
 * Also syncs the user ID to local IndexedDB whenever the session changes so
 * the offline sync layer always has access to the owner identity.
 *
 * Returns an object with an `unsubscribe` function to tear down the listener.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): { unsubscribe: () => void } {
  if (!isSupabaseConfigured()) {
    // No-op subscription when Supabase is not wired up
    return { unsubscribe: () => {} }
  }

  const { data } = getSupabase().auth.onAuthStateChange((event, session) => {
    // Persist the user ID locally on every state change
    const userId = session?.user?.id ?? null
    void persistAuthLocally(userId)

    callback(event, session)
  })

  return { unsubscribe: () => data.subscription.unsubscribe() }
}
