import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { courseData } from '../content';
import { ProgressStore, type StorageLike } from '../domain/progress/store';
import type { ProgressRecord } from '../domain/progress/schema';
import { createLocalTutor } from '../domain/tutor/local';
import { createRemoteTutor, isSafeEndpoint } from '../domain/tutor/remote';
import type { TutorProvider, TutorReply } from '../domain/tutor/types';

function browserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    const s = window.localStorage;
    s.getItem('qtutor.probe');
    return s;
  } catch {
    return null; // private mode / blocked storage: the app still works in memory
  }
}

let singleton: ProgressStore | null = null;
export function getStore(): ProgressStore {
  if (!singleton) singleton = new ProgressStore(courseData, browserStorage());
  return singleton;
}
/** For tests: replace the store (e.g. with an in-memory one). */
export function setStore(s: ProgressStore | null) { singleton = s; }

export function useStore(): ProgressStore { return getStore(); }
export function useProgress(): ProgressRecord {
  const s = getStore();
  return useSyncExternalStore(s.subscribe, s.getState, s.getState);
}

/* ---------------- session (in-memory) state: hints, tutor conversation, announcements ---------------- */
export type TutorMessage = { id: number; role: 'user' | 'tutor'; text: string; reply?: TutorReply };
export type LastResult = { correct: boolean; diagnosis?: string };
type Session = {
  hintLevels: Record<string, 0 | 1 | 2 | 3>;
  setHintLevel(id: string, level: 0 | 1 | 2 | 3): void;
  solutionRequests: Record<string, number>;
  bumpSolutionRequests(id: string): void;
  lastResults: Record<string, LastResult>;
  setLastResult(id: string, r: LastResult): void;
  messages: Record<string, TutorMessage[]>;
  addMessage(scope: string, m: Omit<TutorMessage, 'id'>): void;
  clearMessages(scope: string): void;
  focus: Record<string, string | null>;
  setFocus(scope: string, activityId: string | null): void;
  announcement: string;
  announce(msg: string): void;
  provider: TutorProvider;
};
const Ctx = createContext<Session | null>(null);
export const useSession = (): Session => {
  const c = useContext(Ctx);
  if (!c) throw new Error('SessionProvider missing');
  return c;
};

let msgId = 1;
export function SessionProvider({ children }: { children: ReactNode }) {
  const prog = useProgress();
  const [hintLevels, setHL] = useState<Session['hintLevels']>({});
  const [solutionRequests, setSR] = useState<Record<string, number>>({});
  const [lastResults, setLR] = useState<Record<string, LastResult>>({});
  const [messages, setMsgs] = useState<Record<string, TutorMessage[]>>({});
  const [focus, setFocusState] = useState<Record<string, string | null>>({});
  const [announcement, setAnn] = useState('');
  const local = useMemo(() => createLocalTutor(courseData), []);
  const rt = prog.preferences.remoteTutor;
  const provider = useMemo<TutorProvider>(
    () => (rt.enabled && rt.consent && isSafeEndpoint(rt.endpoint) ? createRemoteTutor({ endpoint: rt.endpoint, fallback: local }) : local),
    [rt.enabled, rt.consent, rt.endpoint, local],
  );

  // Apply display preferences to <html>.
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.textSize = prog.preferences.textSize;
    if (prog.preferences.theme === 'system') delete el.dataset.theme; else el.dataset.theme = prog.preferences.theme;
    el.dataset.reduceMotion = prog.preferences.reducedMotion === 'on' ? 'true' : 'false';
  }, [prog.preferences.textSize, prog.preferences.theme, prog.preferences.reducedMotion]);

  const value: Session = {
    hintLevels, solutionRequests, lastResults, messages, focus, announcement, provider,
    setHintLevel: useCallback((id, level) => setHL((h) => ({ ...h, [id]: Math.max(h[id] ?? 0, level) as 0 | 1 | 2 | 3 })), []),
    bumpSolutionRequests: useCallback((id) => setSR((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 })), []),
    setLastResult: useCallback((id, r) => setLR((s) => ({ ...s, [id]: r })), []),
    addMessage: useCallback((scope, m) => setMsgs((s) => ({ ...s, [scope]: [...(s[scope] ?? []), { ...m, id: msgId++ }] })), []),
    clearMessages: useCallback((scope) => setMsgs((s) => ({ ...s, [scope]: [] })), []),
    setFocus: useCallback((scope, id) => setFocusState((f) => ({ ...f, [scope]: id })), []),
    announce: useCallback((msg) => setAnn(`${msg}​${Date.now() % 2 ? '' : ' '}`), []),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
