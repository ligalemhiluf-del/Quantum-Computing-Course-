import type { ProviderInfo, TutorProvider, TutorReply, TutorRequest } from './types';
import { validateTutorResponse } from './validate';

export const REMOTE_INFO: ProviderInfo = { id: 'remote-endpoint', label: 'Remote model via your configured server endpoint', kind: 'remote-model' };

/** Exactly what would leave the browser. Deliberately excludes notes, progress history, preferences, and any identifiers. */
export function buildRemotePayload(req: TutorRequest) {
  return {
    mode: req.mode,
    action: req.action,
    learnerText: req.text.slice(0, 2000),
    lesson: req.lessonId ?? null,
    item: req.activity ? { id: req.activity.id, prompt: req.activity.prompt, conceptTags: req.activity.conceptTags } : null,
    hintLevelUsed: req.hintLevel,
    attempted: req.attempted,
    weakPrerequisites: req.weakPrerequisites.map((w) => ({ module: w.moduleId, mastery: +w.mastery.toFixed(2) })),
  };
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/**
 * Adapter seam for a *server-side* LLM proxy that you host. The browser never holds API keys: it POSTs the sanitised payload
 * to `endpoint`, which must return `{ response: TutorResponse }`. Invalid, slow or failing replies fall back to `fallback`.
 * No such server ships with this MVP, so this provider is unverified against any real model.
 */
export function createRemoteTutor(opts: { endpoint: string; fallback: TutorProvider; fetchFn?: FetchLike; timeoutMs?: number }): TutorProvider {
  const { endpoint, fallback, timeoutMs = 8000 } = opts;
  const doFetch: FetchLike = opts.fetchFn ?? ((url, init) => fetch(url, init) as ReturnType<FetchLike>);
  return {
    info: REMOTE_INFO,
    disclosure: `Remote mode: each tutor request sends your question text, the current item's prompt and concept tags, your hint level and a coarse prerequisite-mastery summary to ${endpoint}. Notes, saved progress and identifiers are never sent. You are responsible for that server's privacy practices.`,
    async respond(req: TutorRequest): Promise<TutorReply> {
      const fail = async (why: string): Promise<TutorReply> => {
        const local = await fallback.respond(req);
        return { ...local, notice: `Remote tutor unavailable (${why}); this reply is from the local scripted tutor.` };
      };
      try {
        const ctl = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
        const timer = setTimeout(() => ctl?.abort(), timeoutMs);
        const res = await doFetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(buildRemotePayload(req)), signal: ctl?.signal });
        clearTimeout(timer);
        if (!res.ok) return fail(`HTTP ${res.status}`);
        const body = (await res.json()) as { response?: unknown };
        const v = validateTutorResponse(body?.response);
        if (!v.ok) return fail(`invalid response: ${v.error}`);
        return { ...v.value, provider: REMOTE_INFO };
      } catch (e) {
        return fail((e as Error).name === 'AbortError' ? 'timed out' : 'network error');
      }
    },
  };
}

export function isSafeEndpoint(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname));
  } catch {
    return false;
  }
}
