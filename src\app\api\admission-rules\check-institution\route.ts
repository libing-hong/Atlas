import { NextResponse } from "next/server";
import { checkInstitutionEligibility } from "@/lib/server/institution-eligibility";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { targetUniversityId?: string; institutionName?: string; average?: number };
    if (!body.targetUniversityId || !body.institutionName) return NextResponse.json({ error: "targetUniversityId and institutionName are required" }, { status: 400 });
    const internal = checkInstitutionEligibility({ targetUniversityId: body.targetUniversityId, institutionName: body.institutionName, average: body.average });
    const status = internal.status as string;
    const result = status === "accepted" || status === "accepted_grade_met"
      ? "accepted"
      : status === "accepted_grade_gap" || status === "not_found"
        ? "not_found"
        : "needs_confirmation";
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Unable to check institution eligibility" }, { status: 400 });
  }
}
