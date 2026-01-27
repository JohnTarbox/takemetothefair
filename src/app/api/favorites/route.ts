import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleFavorite } from "@/lib/favorites";
import type { FavoritableType } from "@/types";

const VALID_TYPES: FavoritableType[] = ["event", "venue", "vendor"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing type or id" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be event, venue, or vendor" },
        { status: 400 }
      );
    }

    const result = await toggleFavorite(session.user.id, type, id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
