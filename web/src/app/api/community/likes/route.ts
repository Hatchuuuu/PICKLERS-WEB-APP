import { NextRequest, NextResponse } from "next/server";

/**
 * @deprecated Use /api/community/follows instead.
 * This route exists for backward compatibility and proxies to the new endpoint.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  // Map old liked_id param to new following_id
  const following_id = body.liked_id ?? body.following_id;
  const followsUrl = new URL("/api/community/follows", req.url);
  return fetch(followsUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: req.headers.get("cookie") ?? "",
    },
    body: JSON.stringify({ following_id }),
  }).then(async (res) => {
    const data = await res.json();
    // Map new response fields back to old format for backward compat
    return NextResponse.json(
      {
        liked: data.following,
        like_count: data.follower_count,
        ...data,
      },
      { status: res.status }
    );
  });
}
