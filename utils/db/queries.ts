import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import {
  creatorProfilesTable,
  postsTable,
  subscriptionsTable,
  usersTable,
  type InsertPost,
  type InsertSubscription,
  type SelectCreatorProfile,
  type SelectPost,
  type SelectSubscription,
  type SelectUser,
} from './schema';

// ─── User Queries ────────────────────────────────────────────────────────────

export async function getUserByUsername(
  username: string,
): Promise<SelectUser | undefined> {
  const results = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  return results[0];
}

export async function getUserById(
  userId: string,
): Promise<SelectUser | undefined> {
  const results = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return results[0];
}

// ─── Creator Profile Queries ─────────────────────────────────────────────────

export async function getCreatorProfile(
  userId: string,
): Promise<SelectCreatorProfile | undefined> {
  const results = await db
    .select()
    .from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.user_id, userId))
    .limit(1);

  return results[0];
}

// ─── Post Queries ────────────────────────────────────────────────────────────

type PostTier = 'free' | 'basic' | 'premium' | 'vip';

const TIER_HIERARCHY: Record<string, PostTier[]> = {
  free: ['free'],
  basic: ['free', 'basic'],
  premium: ['free', 'basic', 'premium'],
  vip: ['free', 'basic', 'premium', 'vip'],
};

export async function getPostsByCreator(
  creatorId: string,
  subscriberTier?: string,
): Promise<SelectPost[]> {
  const allowedTiers: ('free' | 'basic' | 'premium' | 'vip')[] = subscriberTier
    ? TIER_HIERARCHY[subscriberTier] ?? ['free']
    : ['free'];

  return db
    .select()
    .from(postsTable)
    .where(
      and(
        eq(postsTable.creator_id, creatorId),
        inArray(postsTable.tier, allowedTiers),
      ),
    )
    .orderBy(desc(postsTable.created_at));
}

export async function getCreatorFeed(
  creatorId: string,
  page: number = 1,
  limit: number = 20,
): Promise<SelectPost[]> {
  const offset = (page - 1) * limit;

  return db
    .select()
    .from(postsTable)
    .where(eq(postsTable.creator_id, creatorId))
    .orderBy(desc(postsTable.created_at))
    .limit(limit)
    .offset(offset);
}

export async function createPost(
  data: InsertPost,
): Promise<SelectPost> {
  const results = await db
    .insert(postsTable)
    .values(data)
    .returning();

  return results[0];
}

// ─── Subscription Queries ────────────────────────────────────────────────────

export async function getSubscription(
  subscriberId: string,
  creatorId: string,
): Promise<SelectSubscription | undefined> {
  const results = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.subscriber_id, subscriberId),
        eq(subscriptionsTable.creator_id, creatorId),
        eq(subscriptionsTable.status, 'active'),
      ),
    )
    .limit(1);

  return results[0];
}

export async function createSubscription(
  data: InsertSubscription,
): Promise<SelectSubscription> {
  const results = await db
    .insert(subscriptionsTable)
    .values(data)
    .returning();

  return results[0];
}
