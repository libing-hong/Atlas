import { NextResponse } from "next/server";
import { getQs2026Rankings } from "@/lib/university-rankings";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("universityIds")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
  return NextResponse.json({ rankings: getQs2026Rankings(ids) }, { headers: { "cache-control": "public, max-age=3600" } });
}
