// Re-export all mock data from the central location.
// This file exists as requested in the spec. All mock data
// is defined in @/lib/mock-data.ts for reuse across components.
export {
  getCreator,
  getPost,
  getAllCreators,
  formatNumber,
  timeAgo,
} from "@/lib/mock-data";

export type { Creator, Post, Comment } from "@/lib/mock-data";
