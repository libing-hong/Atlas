import { NextRequest, NextResponse } from "next/server";
import { enqueueDueProgramRefreshes } from "@/lib/program-ingestion/repository";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await enqueueDueProgramRefreshes(25, 30);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json(
      { error: "Unable to schedule program knowledge refreshes" },
      { status: 500 },
    );
  }
}
