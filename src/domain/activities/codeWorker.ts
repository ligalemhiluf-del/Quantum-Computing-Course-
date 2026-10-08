import { runCodeTests } from './codeRunner';
import type { CodeTest } from '../curriculum/types';

self.onmessage = (ev: MessageEvent<{ source: string; tests: CodeTest[] }>) => {
  (self as unknown as Worker).postMessage(runCodeTests(ev.data.source, ev.data.tests));
};
