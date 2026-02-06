import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import type { Attachment } from '@/lib/db/schema'
import { getSupabase } from '@/lib/supabase/client'

// ============================================================
// Life OS — Offline Photo Queue
// Stores photos in IndexedDB when offline and uploads them
// to Supabase storage when back online.
// ============================================================

const STORAGE_BUCKET = 'attachments'

/**
 * Convert a Blob to a base64 data URI for local storage.
 */
async function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert a base64 data URI back to a Blob for uploading.
 */
function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(',')
  const mimeMatch = header.match(/data:([^;]+);/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/**
 * Queue a photo for upload when back online.
 *
 * Stores the photo blob as a base64 data URI in the attachment's
 * `localUri` field in IndexedDB. The attachment is marked with
 * `uploadStatus: 'pending'` so it can be picked up later.
 */
export async function queuePhotoForUpload(
  attachment: Attachment,
  photoBlob: Blob
): Promise<void> {
  const dataUri = await blobToDataUri(photoBlob)

  await db.attachments.put({
    ...attachment,
    id: attachment.id || uuid(),
    localUri: dataUri,
    uploadStatus: 'pending',
    createdAt: attachment.createdAt || new Date().toISOString(),
  })
}

/**
 * Process all pending uploads in the queue.
 *
 * Iterates through all attachments with `uploadStatus: 'pending'`,
 * attempts to upload each to Supabase storage, and updates the
 * status to 'uploaded' or 'failed' accordingly.
 */
export async function processPhotoQueue(): Promise<{
  uploaded: number
  failed: number
}> {
  const pending = await db.attachments
    .where('uploadStatus')
    .equals('pending')
    .toArray()

  let uploaded = 0
  let failed = 0

  const supabase = getSupabase()

  for (const attachment of pending) {
    if (!attachment.localUri) {
      // No local data to upload -- mark as failed
      await db.attachments.update(attachment.id, { uploadStatus: 'failed' })
      failed++
      continue
    }

    try {
      const blob = dataUriToBlob(attachment.localUri)

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(attachment.storageKey, blob, {
          contentType: attachment.fileType,
          upsert: true,
        })

      if (error) {
        throw error
      }

      // Upload succeeded -- clear the local blob data and mark as uploaded
      await db.attachments.update(attachment.id, {
        uploadStatus: 'uploaded',
        localUri: undefined,
      })
      uploaded++
    } catch (err) {
      console.error(
        `[PhotoQueue] Failed to upload attachment ${attachment.id}:`,
        err
      )
      await db.attachments.update(attachment.id, { uploadStatus: 'failed' })
      failed++
    }
  }

  return { uploaded, failed }
}

/**
 * Get the count of attachments waiting to be uploaded.
 */
export async function getPendingUploadCount(): Promise<number> {
  return db.attachments.where('uploadStatus').equals('pending').count()
}

/**
 * Start the automatic photo queue processor.
 *
 * Listens for the browser's `online` event and processes the queue
 * whenever connectivity is restored. Also processes immediately if
 * already online and there are pending uploads.
 *
 * Returns a cleanup function that removes the event listener.
 * Safe to import server-side -- guards all browser APIs.
 */
export function startPhotoQueueProcessor(): () => void {
  // Guard against server-side execution
  if (typeof window === 'undefined') {
    return () => {}
  }

  const onOnline = async () => {
    try {
      const count = await getPendingUploadCount()
      if (count > 0) {
        console.info(`[PhotoQueue] Online detected. Processing ${count} pending upload(s)...`)
        const result = await processPhotoQueue()
        console.info(
          `[PhotoQueue] Done. Uploaded: ${result.uploaded}, Failed: ${result.failed}`
        )
      }
    } catch (err) {
      console.error('[PhotoQueue] Error processing queue on reconnect:', err)
    }
  }

  window.addEventListener('online', onOnline)

  // Process immediately if we are already online and there might be pending items
  if (navigator.onLine) {
    onOnline()
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline)
  }
}
