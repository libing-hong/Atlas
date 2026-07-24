export type RecommendationApiData = {
  candidates?: unknown[];
  emptyReason?: string;
  generationStatus?: "complete" | "partial" | "empty";
  aiStatus?: "completed" | "unavailable";
  message?: string;
  code?: string;
};

type RetryOptions = {
  body: string;
  idempotencyKey: string;
  signal: AbortSignal;
  fetcher?: typeof fetch;
  wait?: (durationMs: number) => Promise<void>;
};

const TRANSIENT_RECOMMENDATION_CODES = new Set(["OPENAI_TIMEOUT", "OPENAI_REQUEST_FAILED"]);

export async function postRecommendationWithRetry({
  body,
  idempotencyKey,
  signal,
  fetcher = fetch,
  wait = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs)),
}: RetryOptions): Promise<{ response: Response; data: RecommendationApiData }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetcher("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body,
      signal,
    });
    const data = await response.json() as RecommendationApiData;
    if (response.ok || attempt === 1 || !TRANSIENT_RECOMMENDATION_CODES.has(data.code ?? "")) {
      return { response, data };
    }
    await wait(400);
  }
  throw new Error("RECOMMENDATION_RETRY_UNREACHABLE");
}
