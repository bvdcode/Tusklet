const counterUrl = "/api/counter";

export async function requestCounter(
  method: "GET" | "POST",
  signal?: AbortSignal,
): Promise<number> {
  const response = await fetch(counterUrl, { method, signal });
  if (!response.ok) {
    throw new Error(`Counter request returned HTTP ${response.status}.`);
  }

  const payload: object | string | number | boolean | null =
    await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("count" in payload) ||
    typeof payload.count !== "number" ||
    !Number.isSafeInteger(payload.count)
  ) {
    throw new Error("Invalid counter response.");
  }

  return payload.count;
}
