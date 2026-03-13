import { db } from "@/utils/db/db";
import { notificationsTable, InsertNotification } from "@/utils/db/schema";

type NotificationType = InsertNotification["type"];

/**
 * Creates a notification for a user.
 * Fire-and-forget safe — errors are logged but never thrown.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  referenceId?: string,
): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      reference_id: referenceId ?? null,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
