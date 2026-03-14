import { Metadata } from "next";
import { db } from "@/utils/db/db";
import { usersTable, creatorProfilesTable, postsTable } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import SinglePostClient from "./SinglePostClient";

const SITE_URL = "https://openfans.online";
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

interface PostMetaRow {
  readonly title: string | null;
  readonly body: string | null;
}

interface CreatorMetaRow {
  readonly display_name: string;
  readonly username: string;
  readonly avatar_url: string | null;
  readonly banner_url: string | null;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "\u2026";
}

async function fetchPostAndCreatorMeta(
  username: string,
  postId: string,
): Promise<{ post: PostMetaRow; creator: CreatorMetaRow } | null> {
  try {
    const creatorRows = await db
      .select({
        id: usersTable.id,
        display_name: usersTable.display_name,
        username: usersTable.username,
        avatar_url: usersTable.avatar_url,
        banner_url: usersTable.banner_url,
      })
      .from(usersTable)
      .innerJoin(
        creatorProfilesTable,
        eq(usersTable.id, creatorProfilesTable.user_id),
      )
      .where(
        and(
          eq(usersTable.username, username),
          eq(usersTable.role, "creator"),
        ),
      )
      .limit(1);

    if (creatorRows.length === 0) return null;

    const creator = creatorRows[0];
    const postIdNum = parseInt(postId, 10);
    if (isNaN(postIdNum)) return null;

    const postRows = await db
      .select({
        title: postsTable.title,
        body: postsTable.body,
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.id, postIdNum),
          eq(postsTable.creator_id, creator.id),
        ),
      )
      .limit(1);

    if (postRows.length === 0) return null;

    return {
      post: postRows[0],
      creator: {
        display_name: creator.display_name,
        username: creator.username,
        avatar_url: creator.avatar_url,
        banner_url: creator.banner_url,
      },
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { username: string; postId: string };
}): Promise<Metadata> {
  const data = await fetchPostAndCreatorMeta(params.username, params.postId);

  if (!data) {
    return {
      title: `Post by @${params.username} | OpenFans`,
      description: `View this post by @${params.username} on OpenFans.`,
    };
  }

  const { post, creator } = data;
  const postTitle = post.title ?? "Post";
  const title = `${postTitle} by ${creator.display_name} (@${creator.username}) | OpenFans`;
  const description = post.body
    ? truncate(post.body, 160)
    : `A post by ${creator.display_name} on OpenFans`;
  const ogImage = creator.avatar_url ?? DEFAULT_OG_IMAGE;
  const postUrl = `${SITE_URL}/${creator.username}/post/${params.postId}`;
  const twitterCard = creator.banner_url ? "summary_large_image" : "summary";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: postUrl,
      siteName: "OpenFans",
      type: "article",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function PostPage() {
  return <SinglePostClient />;
}
