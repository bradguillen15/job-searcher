export type OllamaListResult =
  | { models: string[] }
  | { error: string };

const OLLAMA_LIST_TIMEOUT_MS = 10_000;

interface OllamaTagsResponse {
  models?: Array<{ name?: string }>;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/$/, "");
}

export async function listOllamaModels(
  baseUrl: string,
  fetchFn: typeof fetch = fetch
): Promise<OllamaListResult> {
  const normalized = normalizeBaseUrl(baseUrl);
  const url = `${normalized}/api/tags`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_LIST_TIMEOUT_MS);

  try {
    const response = await fetchFn(url, { signal: controller.signal });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const detail = body ? `: ${body.slice(0, 200)}` : "";
      return { error: `Ollama HTTP ${response.status}${detail}` };
    }

    const data = (await response.json()) as OllamaTagsResponse;
    const models = (data.models ?? [])
      .map((model) => model.name?.trim())
      .filter((name): name is string => Boolean(name));

    return { models };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { error: "Ollama request timed out" };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  } finally {
    clearTimeout(timeout);
  }
}
