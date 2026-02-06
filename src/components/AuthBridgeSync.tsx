'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { setAuthBridge } from '@/lib/auth/bridge'

/**
 * Invisible component that keeps the auth bridge in sync with Clerk.
 * Mount once inside ClerkProvider (e.g. in layout.tsx).
 */
export default function AuthBridgeSync() {
  const { userId, getToken } = useAuth()

  useEffect(() => {
    if (userId) {
      setAuthBridge(userId, () => getToken({ template: 'supabase' }))
    } else {
      setAuthBridge(null, null)
    }

    return () => {
      setAuthBridge(null, null)
    }
  }, [userId, getToken])

  return null
}
