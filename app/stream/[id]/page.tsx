import type { Metadata } from "next";
import StreamClient from "./StreamClient";

const SITE_URL = "https://openfans.online";

interface StreamPageProps {
  readonly params: { id: string };
}

export async function generateMetadata({
  params,
}: StreamPageProps): Promise<Metadata> {
  const streamId = params.id;
  let title = `Live Stream | OpenFans`;
  let description = "Watch a live stream on OpenFans.";

  try {
    const res = await fetch(`${SITE_URL}/api/streams/${streamId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const stream = data.stream ?? data;
      title = `${stream.title ?? "Live Stream"} by ${stream.creator?.display_name ?? "Creator"} | OpenFans`;
      description = stream.description ?? description;
    }
  } catch {
    // Fall through to defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/stream/${streamId}`,
      siteName: "OpenFans",
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function StreamPage({ params }: StreamPageProps) {
  return <StreamClient streamId={params.id} />;
}
