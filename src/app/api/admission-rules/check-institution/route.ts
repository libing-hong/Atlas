import { checkInstitutionEligibility } from "@/lib/server/institution-eligibility";
import { institutionCheckSchema } from "@/lib/server/api-schemas";
import { apiError, apiException, apiResponse, createApiContext, enforceLimit, parseJson, validateMutationOrigin } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  try {
    if (!validateMutationOrigin(request)) throw apiException("FORBIDDEN_ORIGIN", 403); await enforceLimit(ctx, "institution-check", 30, 60_000);
    const body = await parseJson(request, institutionCheckSchema, 8_000); const internal = checkInstitutionEligibility(body); const status = internal.status as string;
    const result = status === "accepted" || status === "accepted_grade_met" ? "accepted" : status === "accepted_grade_gap" || status === "not_found" ? "not_found" : "needs_confirmation";
    return apiResponse(ctx, { result });
  } catch (error) { return apiError(ctx, error); }
}

