export interface Message {
  readonly id: string;
  readonly senderId: string;
  readonly text: string;
  readonly timestamp: string;
  readonly mediaUrl?: string;
  readonly tipAmount?: number;
}

export interface Conversation {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly userAvatar: string;
  readonly lastMessage: string;
  readonly lastMessageTime: string;
  readonly unreadCount: number;
  readonly messages: readonly Message[];
}

export const CURRENT_USER = "me";
