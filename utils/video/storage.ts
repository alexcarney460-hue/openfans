import { createClient } from "@/utils/supabase/server";

const BUCKET = "videos";

/**
 * Upload a video file to Supabase Storage.
 *
 * @param file - The File object to upload
 * @param userId - The authenticated user's ID
 * @returns The storage path and public URL
 */
export async function uploadVideoToStorage(
  file: File,
  userId: string,
): Promise<{ path: string; url: string }> {
  const supabase = createClient();

  const rawExtension = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const extension = rawExtension.replace(/[^a-z0-9]/g, "") || "mp4";
  const uuid = crypto.randomUUID();
  const path = `${userId}/${uuid}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload video to storage: ${error.message}`);
  }

  const url = getVideoPublicUrl(path);
  return { path, url };
}

/**
 * Delete a video file from Supabase Storage.
 *
 * @param path - The storage path (e.g. "userId/uuid.mp4")
 */
export async function deleteVideoFromStorage(path: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throw new Error(`Failed to delete video from storage: ${error.message}`);
  }
}

/**
 * Get the public URL for a video stored in Supabase Storage.
 *
 * @param path - The storage path (e.g. "userId/uuid.mp4")
 * @returns The public URL string
 */
export function getVideoPublicUrl(path: string): string {
  const supabase = createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
