import { Metadata } from "next";
import { db } from "@/utils/db/db";
import { usersTable, creatorProfilesTable } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import { EXPLORE_CREATORS } from "@/app/explore/mock-data";
import CreatorProfileClient from "./CreatorProfileClient";

const SITE_URL = "https://openfans.online";
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

interface CreatorMetaRow {
  readonly display_name: string;
  readonly username: string;
  readonly bio: string | null;
  readonly avatar_url: string | null;
  readonly banner_url: string | null;
}

async function fetchCreatorMeta(
  username: string,
): Promise<CreatorMetaRow | null> {
  try {
    const rows = await db
      .select({
        display_name: usersTable.display_name,
        username: usersTable.username,
        bio: usersTable.bio,
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

    if (rows.length > 0) {
      return rows[0];
    }
  } catch {
    // DB unavailable — fall through to mock data
  }

  // Fallback to mock data
  const mock = EXPLORE_CREATORS.find((c) => c.username === username);
  if (mock) {
    return {
      display_name: mock.displayName,
      username: mock.username,
      bio: mock.bio,
      avatar_url: mock.avatarUrl,
      banner_url: mock.bannerUrl,
    };
  }

  return null;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "\u2026";
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const creator = await fetchCreatorMeta(params.username);

  if (!creator) {
    return {
      title: "Creator Not Found | OpenFans",
      description: "This creator profile could not be found on OpenFans.",
    };
  }

  const title = `${creator.display_name} (@${creator.username}) on OpenFans`;
  const description = creator.bio
    ? truncate(creator.bio, 160)
    : `Subscribe to ${creator.display_name} on OpenFans`;
  const ogImage = creator.avatar_url ?? DEFAULT_OG_IMAGE;
  const profileUrl = `${SITE_URL}/${creator.username}`;
  const twitterCard = creator.banner_url ? "summary_large_image" : "summary";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: profileUrl,
      siteName: "OpenFans",
      type: "profile",
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

export default function CreatorProfilePage() {
  return <CreatorProfileClient />;
}
