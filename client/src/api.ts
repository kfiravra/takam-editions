// The calls to the server, and the one hook that runs them. No data library.
import { useEffect, useState } from 'react';
import type { CompareResult, DocumentDetail, DocumentEntry, FileFormat } from '../../shared/types';

// An error crosses the API as a code. A failure without one (the server is down, the answer is not JSON)
// is a server error too.
function errorCode(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') return body.error;
  return 'server_error';
}

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url).catch(() => null);
  const body: unknown = response ? await response.json().catch(() => null) : null;
  if (!response?.ok || body === null) throw new Error(errorCode(body));
  return body as T;
}

// An id comes from the address of the page, so it is encoded before it enters the address of a call.
const documentUrl = (id: string) => `/api/documents/${encodeURIComponent(id)}`;

export const api = {
  documents: () => get<DocumentEntry[]>('/api/documents'),
  document: (id: string) => get<DocumentDetail>(documentUrl(id)),
  compare: (id: string, from: number, to: number) => get<CompareResult>(`${documentUrl(id)}/compare?from=${from}&to=${to}`),
  fileUrl: (id: string, edition: number, format: FileFormat) => `${documentUrl(id)}/editions/${edition}/${format}`,
};

export interface RequestState<T> {
  data: T | null;
  error: string | null; // an error code; format.ts turns it into a sentence
  loading: boolean;
}

interface Answer<T> {
  key: string;
  data: T | null;
  error: string | null;
}

// Runs the request again when the key changes. The request itself is a new function on every render,
// so the key is what says that something really changed.
export function useRequest<T>(key: string, request: () => Promise<T>): RequestState<T> {
  const [answer, setAnswer] = useState<Answer<T> | null>(null);

  useEffect(() => {
    let current = true;
    request().then(
      (data) => {
        if (current) setAnswer({ key, data, error: null });
      },
      (error: unknown) => {
        if (current) setAnswer({ key, data: null, error: error instanceof Error ? error.message : 'server_error' });
      },
    );
    // An answer that arrives after the key changed belongs to a page the user already left.
    return () => {
      current = false;
    };
  }, [key]);

  // Until the answer to this key arrives, the answer to the last one is not shown in its place.
  if (answer?.key !== key) return { data: null, error: null, loading: true };
  return { data: answer.data, error: answer.error, loading: false };
}
