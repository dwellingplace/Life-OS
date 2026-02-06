/**
 * Auth Bridge — Connects Clerk's React-level auth to the sync engine
 * and other non-React code that needs user identity and Supabase tokens.
 *
 * React components update the bridge via `setAuthBridge()`.
 * The sync engine and Supabase client read from it via getters.
 */

let currentUserId: string | null = null
let tokenGetter: (() => Promise<string | null>) | null = null

/**
 * Called from the React layer (AuthBridgeSync) whenever Clerk's
 * auth state changes. Provides the userId and a function to fetch
 * a fresh Supabase JWT from Clerk.
 */
export function setAuthBridge(
  userId: string | null,
  getToken: (() => Promise<string | null>) | null,
) {
  currentUserId = userId
  tokenGetter = getToken
}

/** Get the current user's Clerk ID (or null if not signed in). */
export function getBridgedUserId(): string | null {
  return currentUserId
}

/**
 * Get a fresh Supabase-compatible JWT from Clerk.
 * Returns null if the user isn't signed in or the bridge isn't set up.
 */
export async function getBridgedToken(): Promise<string | null> {
  if (!tokenGetter) return null
  return tokenGetter()
}
