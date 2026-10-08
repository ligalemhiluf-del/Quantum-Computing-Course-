import type { Module } from './types';

/** Detect a cycle in the prerequisite graph. Returns one cycle (as module ids) or null. */
export function findCycle(modules: Pick<Module, 'id' | 'prerequisiteModuleIds'>[]): string[] | null {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const state = new Map<string, 0 | 1 | 2>(); // 1 = visiting, 2 = done
  const stack: string[] = [];
  let found: string[] | null = null;
  const visit = (id: string) => {
    if (found) return;
    const s = state.get(id);
    if (s === 2) return;
    if (s === 1) {
      found = [...stack.slice(stack.indexOf(id)), id];
      return;
    }
    state.set(id, 1);
    stack.push(id);
    for (const p of byId.get(id)?.prerequisiteModuleIds ?? []) visit(p);
    stack.pop();
    state.set(id, 2);
  };
  for (const m of modules) visit(m.id);
  return found;
}

/** Topological order (prerequisites first). Throws if the graph has a cycle. Stable w.r.t. input order. */
export function topologicalOrder(modules: Pick<Module, 'id' | 'prerequisiteModuleIds'>[]): string[] {
  const cyc = findCycle(modules);
  if (cyc) throw new Error(`Prerequisite cycle: ${cyc.join(' -> ')}`);
  const out: string[] = [];
  const seen = new Set<string>();
  const byId = new Map(modules.map((m) => [m.id, m]));
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const p of byId.get(id)?.prerequisiteModuleIds ?? []) visit(p);
    out.push(id);
  };
  modules.forEach((m) => visit(m.id));
  return out;
}

/** Longest-path depth from roots; used for layered graph layout. */
export function depths(modules: Pick<Module, 'id' | 'prerequisiteModuleIds'>[]): Record<string, number> {
  const d: Record<string, number> = {};
  const byId = new Map(modules.map((m) => [m.id, m]));
  for (const id of topologicalOrder(modules)) {
    const ps = byId.get(id)!.prerequisiteModuleIds;
    d[id] = ps.length ? Math.max(...ps.map((p) => d[p])) + 1 : 0;
  }
  return d;
}

/** All transitive prerequisites of a module. */
export function ancestors(modules: Pick<Module, 'id' | 'prerequisiteModuleIds'>[], id: string): string[] {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const out = new Set<string>();
  const visit = (x: string) => {
    for (const p of byId.get(x)?.prerequisiteModuleIds ?? []) if (!out.has(p)) (out.add(p), visit(p));
  };
  visit(id);
  return [...out];
}
