import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY ?? "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET ?? "";

/** Token TTL in seconds (matches 20-minute max stream duration). */
const TOKEN_TTL_SECONDS = 25 * 60; // 25 min, slight buffer over 20-min max

function assertLiveKitConfig(): void {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error(
      "LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in environment variables",
    );
  }
}

/**
 * Generate a LiveKit token for a viewer (canPublish = false, canSubscribe = true).
 */
export async function generateViewerToken(
  roomName: string,
  identity: string,
  username: string,
): Promise<string> {
  assertLiveKitConfig();

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: username,
    ttl: TOKEN_TTL_SECONDS,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: false,
    canSubscribe: true,
  });

  return await token.toJwt();
}

/**
 * Generate a LiveKit token for a publisher/creator (canPublish = true, canSubscribe = true).
 */
export async function generatePublisherToken(
  roomName: string,
  identity: string,
  username: string,
): Promise<string> {
  assertLiveKitConfig();

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: username,
    ttl: TOKEN_TTL_SECONDS,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return await token.toJwt();
}
