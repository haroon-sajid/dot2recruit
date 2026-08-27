// Helper for calling the n8n screening webhook with the shared secret.

const N8N_TIMEOUT_MS = 15_000;

export interface ScreeningTriggerPayload {
  candidateId: string;
  cvText: string;
  jdText: string;
  position: string;
  tenantId: string;
}

/**
 * Kick off the n8n screening workflow for a candidate.
 * Resolves on a 2xx response; throws on timeout, network error, or non-2xx.
 */
export async function triggerScreening(
  payload: ScreeningTriggerPayload,
): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!url) throw new Error("[n8n] N8N_WEBHOOK_URL is not set");
  if (!secret) throw new Error("[n8n] N8N_WEBHOOK_SECRET is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `[n8n] Webhook request timed out after ${N8N_TIMEOUT_MS / 1000}s`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `[n8n] Webhook responded with ${response.status} ${response.statusText}: ${text}`,
    );
  }
}