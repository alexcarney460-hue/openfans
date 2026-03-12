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

const CURRENT_USER_ID = "me";

export const conversations: readonly Conversation[] = [
  {
    id: "conv-1",
    userId: "user-1",
    userName: "Aria Velasquez",
    userAvatar: "https://api.dicebear.com/9.x/notionists/svg?seed=aria&backgroundColor=8b5cf6",
    lastMessage: "Thank you for the tip! Means a lot",
    lastMessageTime: "2 min ago",
    unreadCount: 3,
    messages: [
      {
        id: "m1-1",
        senderId: CURRENT_USER_ID,
        text: "Hey Aria, loved your latest photo set",
        timestamp: "10:02 AM",
      },
      {
        id: "m1-2",
        senderId: "user-1",
        text: "Thank you so much! Took me forever to get the lighting right",
        timestamp: "10:04 AM",
      },
      {
        id: "m1-3",
        senderId: CURRENT_USER_ID,
        text: "It really shows. The color grading is next level",
        timestamp: "10:05 AM",
      },
      {
        id: "m1-4",
        senderId: CURRENT_USER_ID,
        text: "Here's a little something for your effort",
        timestamp: "10:06 AM",
        tipAmount: 10.0,
      },
      {
        id: "m1-5",
        senderId: "user-1",
        text: "Oh wow, you really didn't have to!",
        timestamp: "10:07 AM",
      },
      {
        id: "m1-6",
        senderId: "user-1",
        text: "Thank you for the tip! Means a lot",
        timestamp: "10:08 AM",
      },
      {
        id: "m1-7",
        senderId: "user-1",
        text: "I have some behind-the-scenes content coming this week too",
        timestamp: "10:09 AM",
      },
    ],
  },
  {
    id: "conv-2",
    userId: "user-2",
    userName: "Jordan Blake",
    userAvatar: "https://api.dicebear.com/9.x/notionists/svg?seed=jordan&backgroundColor=ec4899",
    lastMessage: "Just uploaded a new exclusive clip",
    lastMessageTime: "1 hr ago",
    unreadCount: 1,
    messages: [
      {
        id: "m2-1",
        senderId: "user-2",
        text: "Hey! Thanks for subscribing",
        timestamp: "Yesterday",
      },
      {
        id: "m2-2",
        senderId: CURRENT_USER_ID,
        text: "Of course, your content is always top tier",
        timestamp: "Yesterday",
      },
      {
        id: "m2-3",
        senderId: "user-2",
        text: "That means a lot. Working on something special right now",
        timestamp: "Yesterday",
      },
      {
        id: "m2-4",
        senderId: CURRENT_USER_ID,
        text: "Can't wait to see it",
        timestamp: "Yesterday",
      },
      {
        id: "m2-5",
        senderId: "user-2",
        text: "Here's a sneak peek",
        timestamp: "3 hrs ago",
        mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
      },
      {
        id: "m2-6",
        senderId: CURRENT_USER_ID,
        text: "This looks incredible",
        timestamp: "2 hrs ago",
        tipAmount: 5.0,
      },
      {
        id: "m2-7",
        senderId: "user-2",
        text: "Just uploaded a new exclusive clip",
        timestamp: "1 hr ago",
      },
    ],
  },
  {
    id: "conv-3",
    userId: "user-3",
    userName: "Mika Tanaka",
    userAvatar: "https://api.dicebear.com/9.x/notionists/svg?seed=mika&backgroundColor=6366f1",
    lastMessage: "Sounds good, talk soon!",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    messages: [
      {
        id: "m3-1",
        senderId: CURRENT_USER_ID,
        text: "Hey Mika, do you do custom content requests?",
        timestamp: "Mon",
      },
      {
        id: "m3-2",
        senderId: "user-3",
        text: "Hey! Yes I do, depends on what you're looking for",
        timestamp: "Mon",
      },
      {
        id: "m3-3",
        senderId: CURRENT_USER_ID,
        text: "Something similar to that sunset series you did last month",
        timestamp: "Mon",
      },
      {
        id: "m3-4",
        senderId: "user-3",
        text: "Oh nice, I can definitely do something like that. Usually 25 USDC for custom sets",
        timestamp: "Tue",
      },
      {
        id: "m3-5",
        senderId: CURRENT_USER_ID,
        text: "That works for me. Let me know when you can start",
        timestamp: "Tue",
      },
      {
        id: "m3-6",
        senderId: "user-3",
        text: "Sounds good, talk soon!",
        timestamp: "Yesterday",
      },
    ],
  },
  {
    id: "conv-4",
    userId: "user-4",
    userName: "Dex Monroe",
    userAvatar: "https://api.dicebear.com/9.x/notionists/svg?seed=dex&backgroundColor=f43f5e",
    lastMessage: "New drop this Friday, stay tuned",
    lastMessageTime: "3 days ago",
    unreadCount: 0,
    messages: [
      {
        id: "m4-1",
        senderId: "user-4",
        text: "Welcome to the club! Check out pinned posts for the best content",
        timestamp: "Last week",
      },
      {
        id: "m4-2",
        senderId: CURRENT_USER_ID,
        text: "Thanks! Already went through everything, great stuff",
        timestamp: "Last week",
      },
      {
        id: "m4-3",
        senderId: CURRENT_USER_ID,
        text: "Quick tip for supporting the work",
        timestamp: "Last week",
        tipAmount: 15.0,
      },
      {
        id: "m4-4",
        senderId: "user-4",
        text: "Appreciate the support! You just got access to the VIP tier",
        timestamp: "5 days ago",
      },
      {
        id: "m4-5",
        senderId: CURRENT_USER_ID,
        text: "Awesome, looking forward to more content",
        timestamp: "4 days ago",
      },
      {
        id: "m4-6",
        senderId: "user-4",
        text: "New drop this Friday, stay tuned",
        timestamp: "3 days ago",
      },
    ],
  },
];

export const CURRENT_USER = CURRENT_USER_ID;
