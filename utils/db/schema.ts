import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersTable = pgTable('users_table', {
  id: text('id').primaryKey(), // Supabase auth UUID
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  display_name: text('display_name').notNull(),
  bio: text('bio'),
  avatar_url: text('avatar_url'),
  banner_url: text('banner_url'),
  role: text('role', { enum: ['creator', 'subscriber', 'admin'] })
    .notNull()
    .default('subscriber'),
  wallet_address: text('wallet_address'), // Solana wallet for payouts
  is_verified: boolean('is_verified').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

// ─── Creator Profiles ────────────────────────────────────────────────────────

export const creatorProfilesTable = pgTable('creator_profiles', {
  id: serial('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  subscription_price_usdc: integer('subscription_price_usdc').notNull(), // cents
  total_subscribers: integer('total_subscribers').notNull().default(0),
  total_earnings_usdc: integer('total_earnings_usdc').notNull().default(0), // cents
  payout_wallet: text('payout_wallet'),
  categories: text('categories')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  is_featured: boolean('is_featured').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertCreatorProfile = typeof creatorProfilesTable.$inferInsert;
export type SelectCreatorProfile = typeof creatorProfilesTable.$inferSelect;

// ─── Posts ───────────────────────────────────────────────────────────────────

export const postsTable = pgTable('posts', {
  id: serial('id').primaryKey(),
  creator_id: text('creator_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  title: text('title'),
  body: text('body'),
  media_urls: text('media_urls')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  media_type: text('media_type', {
    enum: ['image', 'video', 'text', 'mixed'],
  }).notNull(),
  is_free: boolean('is_free').notNull().default(false),
  tier: text('tier', { enum: ['free', 'basic', 'premium', 'vip'] })
    .notNull()
    .default('basic'),
  likes_count: integer('likes_count').notNull().default(0),
  comments_count: integer('comments_count').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertPost = typeof postsTable.$inferInsert;
export type SelectPost = typeof postsTable.$inferSelect;

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptionsTable = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  subscriber_id: text('subscriber_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  creator_id: text('creator_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  tier: text('tier', { enum: ['basic', 'premium', 'vip'] })
    .notNull()
    .default('basic'),
  price_usdc: integer('price_usdc').notNull(), // cents
  payment_tx: text('payment_tx'), // Solana transaction signature
  status: text('status', { enum: ['active', 'expired', 'cancelled'] })
    .notNull()
    .default('active'),
  started_at: timestamp('started_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
export type SelectSubscription = typeof subscriptionsTable.$inferSelect;

// ─── Messages ────────────────────────────────────────────────────────────────

export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  sender_id: text('sender_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  receiver_id: text('receiver_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  media_url: text('media_url'),
  is_paid: boolean('is_paid').notNull().default(false),
  price_usdc: integer('price_usdc'), // cents, nullable
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertMessage = typeof messagesTable.$inferInsert;
export type SelectMessage = typeof messagesTable.$inferSelect;

// ─── Tips ────────────────────────────────────────────────────────────────────

export const tipsTable = pgTable('tips', {
  id: serial('id').primaryKey(),
  tipper_id: text('tipper_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  creator_id: text('creator_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  post_id: integer('post_id').references(() => postsTable.id, {
    onDelete: 'set null',
  }),
  amount_usdc: integer('amount_usdc').notNull(), // cents
  payment_tx: text('payment_tx').notNull(), // Solana tx signature
  message: text('message'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertTip = typeof tipsTable.$inferInsert;
export type SelectTip = typeof tipsTable.$inferSelect;

// ─── Payouts ─────────────────────────────────────────────────────────────────

export const payoutsTable = pgTable('payouts', {
  id: serial('id').primaryKey(),
  creator_id: text('creator_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  amount_usdc: integer('amount_usdc').notNull(), // cents
  wallet_address: text('wallet_address').notNull(),
  payment_tx: text('payment_tx').notNull(),
  status: text('status', { enum: ['pending', 'completed', 'failed'] })
    .notNull()
    .default('pending'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertPayout = typeof payoutsTable.$inferInsert;
export type SelectPayout = typeof payoutsTable.$inferSelect;

// ─── Platform Wallets ───────────────────────────────────────────────────────
// On-platform USDC balance for each user. Users deposit crypto here; the
// platform deducts monthly subscription fees automatically. A minimum
// balance is required to keep subscriptions active.

export const walletsTable = pgTable('wallets', {
  id: serial('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  balance_usdc: integer('balance_usdc').notNull().default(0), // cents
  minimum_balance_usdc: integer('minimum_balance_usdc').notNull().default(0), // cents — set per active subscriptions
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertWallet = typeof walletsTable.$inferInsert;
export type SelectWallet = typeof walletsTable.$inferSelect;

// ─── Wallet Transactions ────────────────────────────────────────────────────
// Ledger of all wallet balance changes: deposits, subscription charges,
// tips sent/received, withdrawals, refunds.

export const walletTransactionsTable = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  wallet_id: integer('wallet_id')
    .notNull()
    .references(() => walletsTable.id, { onDelete: 'cascade' }),
  user_id: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'deposit',
      'withdrawal',
      'subscription_charge',
      'subscription_received',
      'tip_sent',
      'tip_received',
      'refund',
      'platform_fee',
    ],
  }).notNull(),
  amount_usdc: integer('amount_usdc').notNull(), // cents — positive for credits, negative for debits
  balance_after: integer('balance_after').notNull(), // cents — running balance after this txn
  description: text('description'),
  reference_id: text('reference_id'), // Solana tx sig, subscription id, etc.
  related_user_id: text('related_user_id').references(() => usersTable.id), // other party
  status: text('status', { enum: ['pending', 'completed', 'failed'] })
    .notNull()
    .default('completed'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertWalletTransaction = typeof walletTransactionsTable.$inferInsert;
export type SelectWalletTransaction = typeof walletTransactionsTable.$inferSelect;
