import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersTable = pgTable('users_table', {
  id: text('id').primaryKey(), // Supabase auth UUID
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  display_name: varchar('display_name', { length: 100 }).notNull(),
  bio: varchar('bio', { length: 2000 }),
  avatar_url: text('avatar_url'),
  banner_url: text('banner_url'),
  role: text('role', { enum: ['creator', 'subscriber', 'admin'] })
    .notNull()
    .default('subscriber'),
  wallet_address: text('wallet_address'), // Solana wallet for payouts
  is_verified: boolean('is_verified').notNull().default(false),
  is_suspended: boolean('is_suspended').notNull().default(false),
  suspended_at: timestamp('suspended_at', { withTimezone: true }),
  suspension_reason: text('suspension_reason'),
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
  subscription_price_usdc: integer('subscription_price_usdc').notNull(), // cents (basic tier)
  premium_price_usdc: integer('premium_price_usdc'), // cents, null = not offered
  vip_price_usdc: integer('vip_price_usdc'), // cents, null = not offered
  total_subscribers: integer('total_subscribers').notNull().default(0),
  total_earnings_usdc: integer('total_earnings_usdc').notNull().default(0), // cents
  payout_wallet: text('payout_wallet'),
  categories: text('categories')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  is_featured: boolean('is_featured').notNull().default(false),
  verification_status: text('verification_status', {
    enum: ['unverified', 'pending', 'verified', 'rejected'],
  }).notNull().default('unverified'),
  verification_submitted_at: timestamp('verification_submitted_at', { withTimezone: true }),
  verification_document_url: text('verification_document_url'),
  verification_selfie_url: text('verification_selfie_url'),
  verification_notes: text('verification_notes'),
  date_of_birth: text('date_of_birth'),
  legal_name: text('legal_name'),
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
  views_count: integer('views_count').notNull().default(0),
  ppv_price_usdc: integer('ppv_price_usdc'), // cents — null = not PPV, number = one-time unlock price
  is_hidden: boolean('is_hidden').notNull().default(false),
  scheduled_at: timestamp('scheduled_at', { withTimezone: true }), // null = published immediately
  is_published: boolean('is_published').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  creatorIdIdx: index('posts_creator_id_idx').on(table.creator_id),
  isPublishedIdx: index('posts_is_published_idx').on(table.is_published),
}));

export type InsertPost = typeof postsTable.$inferInsert;
export type SelectPost = typeof postsTable.$inferSelect;

// ─── PPV Purchases ──────────────────────────────────────────────────────────
// One-time pay-per-view unlock records. A user purchases access to a single post.

export const ppvPurchasesTable = pgTable('ppv_purchases', {
  id: serial('id').primaryKey(),
  post_id: integer('post_id')
    .references(() => postsTable.id, { onDelete: 'set null' }),
  buyer_id: text('buyer_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  amount_usdc: integer('amount_usdc').notNull(), // cents
  payment_tx: text('payment_tx').notNull().unique(), // Solana transaction signature
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  buyerIdIdx: index('ppv_purchases_buyer_id_idx').on(table.buyer_id),
  postIdIdx: index('ppv_purchases_post_id_idx').on(table.post_id),
}));

export type InsertPpvPurchase = typeof ppvPurchasesTable.$inferInsert;
export type SelectPpvPurchase = typeof ppvPurchasesTable.$inferSelect;

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
  payment_tx: text('payment_tx').notNull().unique(), // Solana transaction signature
  auto_renew: boolean('auto_renew').notNull().default(true),
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
}, (table) => ({
  subscriberIdIdx: index('subscriptions_subscriber_id_idx').on(table.subscriber_id),
  creatorIdIdx: index('subscriptions_creator_id_idx').on(table.creator_id),
  statusIdx: index('subscriptions_status_idx').on(table.status),
}));

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
  is_broadcast: boolean('is_broadcast').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  senderIdIdx: index('messages_sender_id_idx').on(table.sender_id),
  receiverIdIdx: index('messages_receiver_id_idx').on(table.receiver_id),
}));

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
  payment_tx: text('payment_tx').notNull().unique(), // Solana tx signature
  message: text('message'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  creatorIdIdx: index('tips_creator_id_idx').on(table.creator_id),
  paymentTxIdx: index('tips_payment_tx_idx').on(table.payment_tx),
}));

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
  payment_tx: text('payment_tx').unique(), // null while pending, set when processed
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] })
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
      'ppv_charge',
      'ppv_received',
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
}, (table) => ({
  userIdIdx: index('wallet_transactions_user_id_idx').on(table.user_id),
  walletIdIdx: index('wallet_transactions_wallet_id_idx').on(table.wallet_id),
}));

export type InsertWalletTransaction = typeof walletTransactionsTable.$inferInsert;
export type SelectWalletTransaction = typeof walletTransactionsTable.$inferSelect;

// ─── Affiliates ─────────────────────────────────────────────────────────────
// Creator-to-creator referral program: creators refer other creators to join.
// When a referred creator earns revenue, the referrer earns 1% commission.
// (Platform fee is 5%, so max affiliate commission is 1%.)

export const affiliatesTable = pgTable('affiliates', {
  id: serial('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  referral_code: text('referral_code').notNull().unique(),
  commission_rate: integer('commission_rate').notNull().default(1), // percentage (1 = 1%)
  total_referrals: integer('total_referrals').notNull().default(0),
  total_earnings_usdc: integer('total_earnings_usdc').notNull().default(0), // cents
  pending_earnings_usdc: integer('pending_earnings_usdc').notNull().default(0), // cents
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertAffiliate = typeof affiliatesTable.$inferInsert;
export type SelectAffiliate = typeof affiliatesTable.$inferSelect;

// ─── Referrals ──────────────────────────────────────────────────────────────
// Tracks which user referred which other user.

export const referralsTable = pgTable('referrals', {
  id: serial('id').primaryKey(),
  referrer_id: text('referrer_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  referred_user_id: text('referred_user_id')
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  referral_code: text('referral_code').notNull(),
  status: text('status', { enum: ['pending', 'active', 'expired'] })
    .notNull()
    .default('pending'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  converted_at: timestamp('converted_at', { withTimezone: true }),
});

export type InsertReferral = typeof referralsTable.$inferInsert;
export type SelectReferral = typeof referralsTable.$inferSelect;

// ─── Affiliate Commissions ──────────────────────────────────────────────────
// Ledger of commission earnings from referred users' payments.

export const affiliateCommissionsTable = pgTable('affiliate_commissions', {
  id: serial('id').primaryKey(),
  affiliate_id: integer('affiliate_id')
    .notNull()
    .references(() => affiliatesTable.id, { onDelete: 'cascade' }),
  referral_id: integer('referral_id')
    .notNull()
    .references(() => referralsTable.id, { onDelete: 'cascade' }),
  source_type: text('source_type', { enum: ['subscription', 'tip'] }).notNull(),
  source_amount_usdc: integer('source_amount_usdc').notNull(), // cents — original payment
  commission_amount_usdc: integer('commission_amount_usdc').notNull(), // cents — earned commission
  status: text('status', { enum: ['pending', 'paid', 'cancelled'] })
    .notNull()
    .default('pending'),
  paid_at: timestamp('paid_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertAffiliateCommission = typeof affiliateCommissionsTable.$inferInsert;
export type SelectAffiliateCommission = typeof affiliateCommissionsTable.$inferSelect;

// ─── Notifications ─────────────────────────────────────────────────────────

export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'new_subscriber',
      'new_tip',
      'new_message',
      'subscription_expiring',
      'subscription_renewed',
      'subscription_expired',
      'payout_completed',
      'ppv_purchase',
    ],
  }).notNull(),
  title: text('title').notNull(),
  body: text('body'),
  is_read: boolean('is_read').notNull().default(false),
  reference_id: text('reference_id'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.user_id),
  isReadIdx: index('notifications_is_read_idx').on(table.is_read),
}));

export type InsertNotification = typeof notificationsTable.$inferInsert;
export type SelectNotification = typeof notificationsTable.$inferSelect;

// ─── Analytics Events ─────────────────────────────────────────────────────────
// Lightweight event tracking for clicks, views, and engagement metrics.

export const analyticsEventsTable = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  event_type: text('event_type', {
    enum: [
      'page_view',
      'profile_view',
      'post_view',
      'post_click',
      'subscribe_click',
      'tip_click',
      'ppv_click',
      'share_click',
      'message_click',
      'signup_click',
      'login_click',
      'wallet_connect_click',
    ],
  }).notNull(),
  user_id: text('user_id').references(() => usersTable.id, { onDelete: 'set null' }), // nullable — anonymous visitors
  target_id: text('target_id'), // post id, creator id, page path, etc.
  metadata: text('metadata'), // optional JSON string for extra context
  ip_hash: text('ip_hash'), // hashed IP for unique visitor counting (not raw IP)
  user_agent: text('user_agent'),
  referrer: text('referrer'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  eventTypeIdx: index('analytics_events_event_type_idx').on(table.event_type),
  createdAtIdx: index('analytics_events_created_at_idx').on(table.created_at),
  targetIdIdx: index('analytics_events_target_id_idx').on(table.target_id),
}));

export type InsertAnalyticsEvent = typeof analyticsEventsTable.$inferInsert;
export type SelectAnalyticsEvent = typeof analyticsEventsTable.$inferSelect;

// ─── Contact Messages ─────────────────────────────────────────────────────────

export const contactMessagesTable = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject'),
  message: text('message').notNull(),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertContactMessage = typeof contactMessagesTable.$inferInsert;
export type SelectContactMessage = typeof contactMessagesTable.$inferSelect;

// ─── Likes ──────────────────────────────────────────────────────────────────

export const likesTable = pgTable('likes', {
  id: serial('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  post_id: integer('post_id')
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  uniqueLike: unique().on(table.user_id, table.post_id),
  userIdIdx: index('likes_user_id_idx').on(table.user_id),
  postIdIdx: index('likes_post_id_idx').on(table.post_id),
}));

export type InsertLike = typeof likesTable.$inferInsert;
export type SelectLike = typeof likesTable.$inferSelect;

// ─── Comments ───────────────────────────────────────────────────────────────

export const commentsTable = pgTable('comments', {
  id: serial('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  post_id: integer('post_id')
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  postIdIdx: index('comments_post_id_idx').on(table.post_id),
}));

export type InsertComment = typeof commentsTable.$inferInsert;
export type SelectComment = typeof commentsTable.$inferSelect;

// ─── Bookmarks ──────────────────────────────────────────────────────────────

export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  post_id: integer('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueBookmark: unique().on(table.user_id, table.post_id),
  userIdIdx: index('bookmarks_user_id_idx').on(table.user_id),
}));

export type InsertBookmark = typeof bookmarksTable.$inferInsert;
export type SelectBookmark = typeof bookmarksTable.$inferSelect;

// ─── Follows ────────────────────────────────────────────────────────────────

export const followsTable = pgTable('follows', {
  id: serial('id').primaryKey(),
  follower_id: text('follower_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  following_id: text('following_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueFollow: unique().on(table.follower_id, table.following_id),
  followerIdx: index('follows_follower_id_idx').on(table.follower_id),
  followingIdx: index('follows_following_id_idx').on(table.following_id),
}));

export type InsertFollow = typeof followsTable.$inferInsert;
export type SelectFollow = typeof followsTable.$inferSelect;

// ─── Content Reports ────────────────────────────────────────────────────────

export const contentReportsTable = pgTable('content_reports', {
  id: serial('id').primaryKey(),
  reporter_id: text('reporter_id').references(() => usersTable.id, { onDelete: 'set null' }),
  post_id: integer('post_id').references(() => postsTable.id, { onDelete: 'cascade' }),
  reported_user_id: text('reported_user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
  reason: text('reason', { enum: ['spam', 'illegal', 'underage', 'harassment', 'copyright', 'other'] }).notNull(),
  description: text('description'),
  status: text('status', { enum: ['pending', 'reviewed', 'action_taken', 'dismissed'] }).notNull().default('pending'),
  admin_notes: text('admin_notes'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
}, (table) => ({
  statusIdx: index('content_reports_status_idx').on(table.status),
}));

export type InsertContentReport = typeof contentReportsTable.$inferInsert;
export type SelectContentReport = typeof contentReportsTable.$inferSelect;

// ─── DMCA Requests ──────────────────────────────────────────────────────────

export const dmcaRequestsTable = pgTable('dmca_requests', {
  id: serial('id').primaryKey(),
  complainant_name: text('complainant_name').notNull(),
  complainant_email: text('complainant_email').notNull(),
  copyrighted_work: text('copyrighted_work').notNull(),
  infringing_urls: text('infringing_urls').notNull(),
  good_faith: boolean('good_faith').notNull(),
  accuracy_statement: boolean('accuracy_statement').notNull(),
  signature: text('signature').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'counter_filed'] }).notNull().default('pending'),
  admin_notes: text('admin_notes'),
  post_id: integer('post_id').references(() => postsTable.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
}, (table) => ({
  statusIdx: index('dmca_requests_status_idx').on(table.status),
  createdAtIdx: index('dmca_requests_created_at_idx').on(table.created_at),
}));

export type InsertDmcaRequest = typeof dmcaRequestsTable.$inferInsert;
export type SelectDmcaRequest = typeof dmcaRequestsTable.$inferSelect;

// ─── 2257 Compliance Records ────────────────────────────────────────────────
// Required by 18 U.S.C. § 2257 — age verification records for all creators.
// Auto-created when an admin approves a creator's KYC verification.

export const complianceRecordsTable = pgTable('compliance_records', {
  id: serial('id').primaryKey(),
  creator_id: text('creator_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  legal_name: text('legal_name').notNull(),
  date_of_birth: text('date_of_birth').notNull(),
  document_type: text('document_type', {
    enum: ['passport', 'drivers_license', 'national_id', 'other'],
  }).notNull().default('other'),
  document_url: text('document_url').notNull(),
  selfie_url: text('selfie_url').notNull(),
  verified_at: timestamp('verified_at', { withTimezone: true }).notNull(),
  verified_by: text('verified_by').references(() => usersTable.id), // admin who approved
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  creatorIdIdx: index('compliance_records_creator_id_idx').on(table.creator_id),
  isActiveIdx: index('compliance_records_is_active_idx').on(table.is_active),
}));

export type InsertComplianceRecord = typeof complianceRecordsTable.$inferInsert;
export type SelectComplianceRecord = typeof complianceRecordsTable.$inferSelect;

// ─── Promotions ─────────────────────────────────────────────────────────────
// Creator promo codes: discount subscriptions or offer free trials.

export const promotionsTable = pgTable('promotions', {
  id: serial('id').primaryKey(),
  creator_id: text('creator_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  type: text('type', { enum: ['discount', 'free_trial'] }).notNull(),
  discount_percent: integer('discount_percent'), // 10-90%, null for free trials
  trial_days: integer('trial_days'), // 1-30, null for discounts
  max_uses: integer('max_uses'), // null = unlimited
  current_uses: integer('current_uses').notNull().default(0),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  creatorCodeUnique: unique().on(table.creator_id, table.code),
}));

export type InsertPromotion = typeof promotionsTable.$inferInsert;
export type SelectPromotion = typeof promotionsTable.$inferSelect;
