'use client'

import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs'

export interface UseAuthReturn {
  isAuthenticated: boolean
  isLoading: boolean
  userId: string | null
  fullName: string | null
  imageUrl: string | null
  email: string | null
  logout: () => Promise<void>
}

/**
 * Thin wrapper around Clerk's hooks that provides
 * a simple auth interface for the rest of the app.
 */
export function useAuth(): UseAuthReturn {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth()
  const { user } = useUser()

  return {
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded,
    userId: user?.id ?? null,
    fullName: user?.fullName ?? null,
    imageUrl: user?.imageUrl ?? null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    logout: async () => {
      await signOut()
    },
  }
}

export default useAuth
