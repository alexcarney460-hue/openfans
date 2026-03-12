export interface Creator {
  readonly username: string;
  readonly displayName: string;
  readonly bio: string;
  readonly avatarUrl: string;
  readonly bannerUrl: string;
  readonly isVerified: boolean;
  readonly categories: readonly string[];
  readonly subscriptionPrice: number;
  readonly stats: {
    readonly posts: number;
    readonly subscribers: number;
    readonly likes: number;
  };
  readonly posts: readonly Post[];
}

export interface Post {
  readonly id: string;
  readonly creatorUsername: string;
  readonly creatorDisplayName: string;
  readonly creatorAvatarUrl: string;
  readonly text: string;
  readonly mediaUrl: string | null;
  readonly mediaType: "image" | "video" | null;
  readonly isPremium: boolean;
  readonly createdAt: string;
  readonly stats: {
    readonly likes: number;
    readonly comments: number;
  };
  readonly comments: readonly Comment[];
}

export interface Comment {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly avatarUrl: string;
  readonly text: string;
  readonly createdAt: string;
}

const CREATORS: Record<string, Creator> = {
  alexfitness: {
    username: "alexfitness",
    displayName: "Alex Rivera",
    bio: "NASM Certified Personal Trainer. 12 years of experience transforming physiques. Exclusive workout programs, meal plans, and daily coaching content. Results guaranteed.",
    avatarUrl: "/mock/avatars/alex.jpg",
    bannerUrl: "/mock/banners/alex-banner.jpg",
    isVerified: true,
    categories: ["Fitness", "Nutrition", "Lifestyle"],
    subscriptionPrice: 14.99,
    stats: {
      posts: 342,
      subscribers: 8_420,
      likes: 127_800,
    },
    posts: [
      {
        id: "af-001",
        creatorUsername: "alexfitness",
        creatorDisplayName: "Alex Rivera",
        creatorAvatarUrl: "/mock/avatars/alex.jpg",
        text: "Full upper body workout for hypertrophy. This 45-minute session targets chest, back, and shoulders with progressive overload principles. Save this one.",
        mediaUrl: "/mock/posts/workout-1.jpg",
        mediaType: "image",
        isPremium: false,
        createdAt: "2026-03-11T14:30:00Z",
        stats: { likes: 892, comments: 47 },
        comments: [
          {
            id: "c1",
            username: "gymrat99",
            displayName: "Mike D",
            avatarUrl: "/mock/avatars/default.jpg",
            text: "This destroyed my shoulders in the best way. Thank you.",
            createdAt: "2026-03-11T15:12:00Z",
          },
          {
            id: "c2",
            username: "fitjourney",
            displayName: "Sarah K",
            avatarUrl: "/mock/avatars/default.jpg",
            text: "Been following your programs for 3 months. Down 22 lbs.",
            createdAt: "2026-03-11T16:45:00Z",
          },
        ],
      },
      {
        id: "af-002",
        creatorUsername: "alexfitness",
        creatorDisplayName: "Alex Rivera",
        creatorAvatarUrl: "/mock/avatars/alex.jpg",
        text: "My complete cutting meal plan with macros breakdown. Every meal, every snack, every supplement. This is the exact protocol I use with my elite clients.",
        mediaUrl: "/mock/posts/mealplan.jpg",
        mediaType: "image",
        isPremium: true,
        createdAt: "2026-03-10T09:00:00Z",
        stats: { likes: 1_340, comments: 89 },
        comments: [],
      },
      {
        id: "af-003",
        creatorUsername: "alexfitness",
        creatorDisplayName: "Alex Rivera",
        creatorAvatarUrl: "/mock/avatars/alex.jpg",
        text: "Quick tip: if you are not tracking your rest periods, you are leaving gains on the table. 60-90 seconds for hypertrophy, 3-5 minutes for strength. Non-negotiable.",
        mediaUrl: null,
        mediaType: null,
        isPremium: false,
        createdAt: "2026-03-09T18:00:00Z",
        stats: { likes: 456, comments: 23 },
        comments: [],
      },
      {
        id: "af-004",
        creatorUsername: "alexfitness",
        creatorDisplayName: "Alex Rivera",
        creatorAvatarUrl: "/mock/avatars/alex.jpg",
        text: "Full 12-week periodized training program. Phase 1: Foundation. Phase 2: Hypertrophy. Phase 3: Peak. Includes deload weeks, exercise substitutions, and progression charts.",
        mediaUrl: "/mock/posts/program.jpg",
        mediaType: "image",
        isPremium: true,
        createdAt: "2026-03-08T12:00:00Z",
        stats: { likes: 2_100, comments: 156 },
        comments: [],
      },
    ],
  },
  tradingwithsara: {
    username: "tradingwithsara",
    displayName: "Sara Chen",
    bio: "Former Goldman Sachs analyst. Full-time crypto trader since 2019. Daily market analysis, trade setups, and portfolio strategy. Sharing alpha that actually works.",
    avatarUrl: "/mock/avatars/sara.jpg",
    bannerUrl: "/mock/banners/sara-banner.jpg",
    isVerified: true,
    categories: ["Trading", "Crypto", "Finance"],
    subscriptionPrice: 29.99,
    stats: {
      posts: 567,
      subscribers: 12_350,
      likes: 245_000,
    },
    posts: [
      {
        id: "ts-001",
        creatorUsername: "tradingwithsara",
        creatorDisplayName: "Sara Chen",
        creatorAvatarUrl: "/mock/avatars/sara.jpg",
        text: "SOL breaking out of the descending wedge on the 4H chart. Volume confirmation is there. My targets and stop-loss levels for this setup.",
        mediaUrl: "/mock/posts/chart-1.jpg",
        mediaType: "image",
        isPremium: false,
        createdAt: "2026-03-12T08:00:00Z",
        stats: { likes: 1_230, comments: 67 },
        comments: [
          {
            id: "c3",
            username: "defi_degen",
            displayName: "0xMarcus",
            avatarUrl: "/mock/avatars/default.jpg",
            text: "Called it perfectly. Already up 12% on this entry.",
            createdAt: "2026-03-12T10:30:00Z",
          },
        ],
      },
      {
        id: "ts-002",
        creatorUsername: "tradingwithsara",
        creatorDisplayName: "Sara Chen",
        creatorAvatarUrl: "/mock/avatars/sara.jpg",
        text: "My complete DeFi yield farming strategy for this cycle. Which protocols, which chains, exact allocation percentages. This is how I am generating 40% APY with managed risk.",
        mediaUrl: "/mock/posts/defi-strat.jpg",
        mediaType: "image",
        isPremium: true,
        createdAt: "2026-03-11T07:00:00Z",
        stats: { likes: 3_400, comments: 201 },
        comments: [],
      },
      {
        id: "ts-003",
        creatorUsername: "tradingwithsara",
        creatorDisplayName: "Sara Chen",
        creatorAvatarUrl: "/mock/avatars/sara.jpg",
        text: "Weekly portfolio review: 3 winning trades, 1 small loss. Net +18.4% on the week. Full breakdown with entry/exit reasoning and what I learned from the loss.",
        mediaUrl: "/mock/posts/portfolio.jpg",
        mediaType: "image",
        isPremium: true,
        createdAt: "2026-03-09T20:00:00Z",
        stats: { likes: 2_890, comments: 134 },
        comments: [],
      },
    ],
  },
  jademakesart: {
    username: "jademakesart",
    displayName: "Jade Morales",
    bio: "Digital artist and illustrator. Creating exclusive art, timelapses, brushes, and tutorials. Patreon refugee. Commissions open for subscribers.",
    avatarUrl: "/mock/avatars/jade.jpg",
    bannerUrl: "/mock/banners/jade-banner.jpg",
    isVerified: false,
    categories: ["Art", "Digital Art", "Tutorials"],
    subscriptionPrice: 7.99,
    stats: {
      posts: 189,
      subscribers: 3_200,
      likes: 58_400,
    },
    posts: [
      {
        id: "jm-001",
        creatorUsername: "jademakesart",
        creatorDisplayName: "Jade Morales",
        creatorAvatarUrl: "/mock/avatars/jade.jpg",
        text: "New piece finished: 'Neon Samurai'. 14 hours across 3 sessions. Free wallpaper download in the comments.",
        mediaUrl: "/mock/posts/art-1.jpg",
        mediaType: "image",
        isPremium: false,
        createdAt: "2026-03-11T21:00:00Z",
        stats: { likes: 1_670, comments: 89 },
        comments: [
          {
            id: "c4",
            username: "artlover42",
            displayName: "Nina P",
            avatarUrl: "/mock/avatars/default.jpg",
            text: "The color palette on this is insane. Do you have a process video?",
            createdAt: "2026-03-11T22:15:00Z",
          },
        ],
      },
      {
        id: "jm-002",
        creatorUsername: "jademakesart",
        creatorDisplayName: "Jade Morales",
        creatorAvatarUrl: "/mock/avatars/jade.jpg",
        text: "Full timelapse of 'Neon Samurai' with commentary. Plus my complete Procreate brush set used in this piece. 23 custom brushes.",
        mediaUrl: "/mock/posts/timelapse.jpg",
        mediaType: "image",
        isPremium: true,
        createdAt: "2026-03-11T22:00:00Z",
        stats: { likes: 980, comments: 45 },
        comments: [],
      },
      {
        id: "jm-003",
        creatorUsername: "jademakesart",
        creatorDisplayName: "Jade Morales",
        creatorAvatarUrl: "/mock/avatars/jade.jpg",
        text: "Tutorial: How I create realistic lighting effects in digital paintings. Step by step, layer by layer. Beginner friendly.",
        mediaUrl: "/mock/posts/tutorial.jpg",
        mediaType: "image",
        isPremium: false,
        createdAt: "2026-03-10T15:00:00Z",
        stats: { likes: 723, comments: 31 },
        comments: [],
      },
    ],
  },
  marcuscooks: {
    username: "marcuscooks",
    displayName: "Marcus Thompson",
    bio: "Michelin-trained chef gone independent. Restaurant-quality recipes simplified for home kitchens. Exclusive recipes, technique breakdowns, and live cooking sessions weekly.",
    avatarUrl: "/mock/avatars/marcus.jpg",
    bannerUrl: "/mock/banners/marcus-banner.jpg",
    isVerified: true,
    categories: ["Cooking", "Food", "Lifestyle"],
    subscriptionPrice: 9.99,
    stats: {
      posts: 256,
      subscribers: 5_800,
      likes: 94_200,
    },
    posts: [
      {
        id: "mc-001",
        creatorUsername: "marcuscooks",
        creatorDisplayName: "Marcus Thompson",
        creatorAvatarUrl: "/mock/avatars/marcus.jpg",
        text: "Perfect seared scallops every time. The three things most home cooks get wrong and how to fix them. No more rubbery scallops.",
        mediaUrl: "/mock/posts/scallops.jpg",
        mediaType: "image",
        isPremium: false,
        createdAt: "2026-03-12T12:00:00Z",
        stats: { likes: 567, comments: 34 },
        comments: [],
      },
      {
        id: "mc-002",
        creatorUsername: "marcuscooks",
        creatorDisplayName: "Marcus Thompson",
        creatorAvatarUrl: "/mock/avatars/marcus.jpg",
        text: "My signature 5-course tasting menu recipe collection. These are the exact dishes that earned my restaurant its star. Full plating guides included.",
        mediaUrl: "/mock/posts/tasting-menu.jpg",
        mediaType: "image",
        isPremium: true,
        createdAt: "2026-03-10T10:00:00Z",
        stats: { likes: 1_890, comments: 112 },
        comments: [],
      },
    ],
  },
};

export function getCreator(username: string): Creator | null {
  return CREATORS[username] ?? null;
}

export function getPost(username: string, postId: string): Post | null {
  const creator = CREATORS[username];
  if (!creator) return null;
  return creator.posts.find((p) => p.id === postId) ?? null;
}

export function getAllCreators(): readonly Creator[] {
  return Object.values(CREATORS);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
