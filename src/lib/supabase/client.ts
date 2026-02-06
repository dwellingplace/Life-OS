import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getBridgedToken } from '@/lib/auth/bridge'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

let supabaseInstance: SupabaseClient | null = null

/** Unauthenticated Supabase client (for offline-first / public reads). */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      SUPABASE_URL || 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY || 'placeholder-key',
    )
  }
  return supabaseInstance
}

/**
 * Create a Supabase client authenticated with the current Clerk JWT.
 * Every request made through this client includes the user's Bearer token,
 * so Supabase RLS policies can verify `auth.uid()`.
 *
 * Returns null if no auth token is available.
 */
export async function getAuthenticatedSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null

  const token = await getBridgedToken()
  if (!token) return null

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
