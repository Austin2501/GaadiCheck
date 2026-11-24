export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`Request to ${new URL(url).host} failed with status ${status}`);
    this.name = 'HttpError';
  }
}

interface FetchJsonOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** `fetch` with a timeout, JSON decoding and typed errors. Honours an upstream abort signal. */
export async function fetchJson<T = unknown>(
  url: string,
  { timeoutMs = 12_000, signal }: FetchJsonOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new HttpError(response.status, url);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
