import { NextResponse } from "next/server";
import { recommendations } from "@/lib/application-prototype-data";
import { buildProgramPortfolio } from "@/lib/program-matching";
import { normalizeStudentProfile } from "@/lib/student-profile";

export async function POST(request: Request) {
  try {
    const submitted = await request.json() as Record<string, unknown>;
    const profile = normalizeStudentProfile(submitted);
    const matches = buildProgramPortfolio(profile, recommendations).map(({ school, result }) => ({
      programId: school.id,
      universityId: school.universityId,
      universityName: school.universityName,
      programName: school.programName,
      result
    }));
    return NextResponse.json({ matches, disclaimer: "Atlas 方案匹配度用于帮助排序申请方案，不代表学校录取概率。" });
  } catch {
    return NextResponse.json({ message: "学生背景格式无法识别，请检查后重新提交。" }, { status: 400 });
  }
}

