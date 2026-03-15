export interface Message {
  readonly id: string;
  readonly numericId: number;
  readonly senderId: string;
  readonly text: string;
  readonly timestamp: string;
  readonly rawTimestamp?: string;
  readonly mediaUrl?: string;
  readonly tipAmount?: number;
  readonly isRead: boolean;
  readonly isFailed: boolean;
  readonly isOptimistic: boolean;
  readonly isBroadcast?: boolean;
}

export interface Conversation {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly userUsername?: string;
  readonly userAvatar: string;
  readonly lastMessage: string;
  readonly lastMessageTime: string;
  readonly unreadCount: number;
  readonly messages: readonly Message[];
  readonly lastMessageIsBroadcast?: boolean;
}

export interface ApiConversation {
  readonly id: number;
  readonly sender_id: string;
  readonly receiver_id: string;
  readonly body: string;
  readonly media_url: string | null;
  readonly is_read: boolean;
  readonly is_broadcast: boolean;
  readonly created_at: string;
  readonly partner_id: string;
  readonly partner_username: string;
  readonly partner_display_name: string;
  readonly partner_avatar_url: string | null;
  readonly unread_count?: number;
}

export interface ApiMessage {
  readonly id: number;
  readonly sender_id: string;
  readonly receiver_id: string;
  readonly body: string;
  readonly media_url: string | null;
  readonly is_paid: boolean;
  readonly price_usdc: number | null;
  readonly is_read: boolean;
  readonly is_broadcast: boolean;
  readonly created_at: string;
}

export interface UserSearchResult {
  readonly id: string;
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
}
