"use client";

/** Wrapper de fetch que transforma erro de API em Error com mensagem legivel. */
export async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // resposta sem corpo
  }

  if (!response.ok) {
    const message =
      (payload as { error?: string } | null)?.error ??
      `Falha na requisicao (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export function apiJson(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
