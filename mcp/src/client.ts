/**
 * Thin HTTP client for the Ownership Token Framework (OTF) public read API.
 *
 * All responses share the envelope `{ data, provenance }`. We keep the typing
 * deliberately loose (the API is the source of truth; the framework/rubric can
 * grow new metrics and criteria) and only model the fields this server reasons
 * about. Everything else is passed through untouched to the agent.
 */

// TODO(prod-domain): replace with the canonical production domain once it is
// finalized. Overridable at runtime via the OTF_API_BASE environment variable.
export const DEFAULT_API_BASE = "https://ownership-token-framework.vercel.app";

export function getApiBase(): string {
  const raw = (process.env.OTF_API_BASE ?? DEFAULT_API_BASE).trim();
  // Strip a trailing slash so we can join paths predictably.
  return raw.replace(/\/+$/, "");
}

/** Provenance block attached to every API response. */
export interface Provenance {
  snapshot_id?: string;
  commit_ref?: string;
  last_updated?: string | null;
  published_at?: string | null;
  source?: string;
  [key: string]: unknown;
}

export interface Envelope<T> {
  data: T;
  provenance: Provenance;
}

/** Slim row from the token index (`/api/v1/tokens`). */
export interface TokenIndexRow {
  id: string;
  name: string;
  symbol: string;
  network?: string;
  score?: { passing: number; total: number; percentage: number };
  positive?: number;
  neutral?: number;
  atRisk?: number;
  evidenceEntries?: number;
  criteriaStatuses?: Record<string, string>;
  [key: string]: unknown;
}

export interface TokenIndex {
  tokens: TokenIndexRow[];
  [key: string]: unknown;
}

/**
 * Error carrying an HTTP status so callers can map e.g. 404 to a clean,
 * user-facing tool error instead of an unhandled throw.
 */
export class OtfApiError extends Error {
  readonly status?: number;
  readonly url: string;

  constructor(message: string, url: string, status?: number) {
    super(message);
    this.name = "OtfApiError";
    this.url = url;
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 15_000;

async function fetchJson<T>(path: string): Promise<Envelope<T>> {
  const url = `${getApiBase()}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? `request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : err instanceof Error
          ? err.message
          : String(err);
    throw new OtfApiError(`Failed to reach OTF API: ${reason}`, url);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new OtfApiError(
      `OTF API responded with HTTP ${res.status} ${res.statusText}`,
      url,
      res.status,
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new OtfApiError(
      "OTF API returned a response that was not valid JSON",
      url,
      res.status,
    );
  }

  const envelope = json as Partial<Envelope<T>>;
  if (envelope == null || typeof envelope !== "object" || !("data" in envelope)) {
    throw new OtfApiError(
      "OTF API response did not match the expected { data, provenance } shape",
      url,
      res.status,
    );
  }

  return {
    data: envelope.data as T,
    provenance: (envelope.provenance ?? {}) as Provenance,
  };
}

export function getTokenIndex(): Promise<Envelope<TokenIndex>> {
  return fetchJson<TokenIndex>("/api/v1/tokens");
}

export function getTokenById(id: string): Promise<Envelope<Record<string, unknown>>> {
  const encoded = encodeURIComponent(id.toLowerCase());
  return fetchJson<Record<string, unknown>>(`/api/v1/tokens/${encoded}`);
}

export function getFramework(): Promise<Envelope<unknown>> {
  return fetchJson<unknown>("/api/v1/framework");
}

export function getFaq(): Promise<Envelope<unknown>> {
  return fetchJson<unknown>("/api/v1/faq");
}
