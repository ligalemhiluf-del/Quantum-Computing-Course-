/** Tiny Markdown-lite parser (no HTML passthrough, so rendered content is always safe): paragraphs, lists, tables, **bold**, *italic*, `code`, $inline$ and $$display$$ math. */
export type Inline = { t: 'text'; v: string } | { t: 'b' | 'i'; c: Inline[] } | { t: 'code'; v: string } | { t: 'math'; v: string };
export type Block =
  | { t: 'p'; c: Inline[] }
  | { t: 'ul' | 'ol'; items: Inline[][] }
  | { t: 'display'; v: string }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] };

const norm = (s: string) => s.replaceAll('⟦', '`').replaceAll('⟧', '`');

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = '';
  const flush = () => { if (buf) out.push({ t: 'text', v: buf }); buf = ''; };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\' && i + 1 < src.length && '$*`\\'.includes(src[i + 1]) ) { buf += src[i + 1]; i += 2; continue; }
    if (ch === '`') {
      const j = src.indexOf('`', i + 1);
      if (j > i) { flush(); out.push({ t: 'code', v: src.slice(i + 1, j) }); i = j + 1; continue; }
    }
    if (ch === '$') {
      let j = i + 1;
      while (j < src.length && !(src[j] === '$' && src[j - 1] !== '\\')) j++;
      if (j < src.length && j > i + 1) { flush(); out.push({ t: 'math', v: src.slice(i + 1, j) }); i = j + 1; continue; }
    }
    if (ch === '*' && src[i + 1] === '*') {
      const j = src.indexOf('**', i + 2);
      if (j > i + 1) { flush(); out.push({ t: 'b', c: parseInline(src.slice(i + 2, j)) }); i = j + 2; continue; }
    }
    if (ch === '*' && src[i + 1] !== ' ' && src[i + 1] !== undefined) {
      const j = src.indexOf('*', i + 1);
      if (j > i + 1 && src[j - 1] !== ' ') { flush(); out.push({ t: 'i', c: parseInline(src.slice(i + 1, j)) }); i = j + 1; continue; }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

const splitRow = (line: string): string[] => {
  // Table cells may contain math with "|" (e.g. \lvert), so split only on pipes outside $...$.
  const cells: string[] = [];
  let cur = '';
  let inMath = false;
  for (const ch of line.trim().replace(/^\|/, '').replace(/\|$/, '')) {
    if (ch === '$') inMath = !inMath;
    if (ch === '|' && !inMath) { cells.push(cur.trim()); cur = ''; } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
};

function parseChunk(chunk: string, out: Block[]) {
  const lines = chunk.split('\n');
  let para: string[] = [];
  const flushPara = () => { if (para.length) out.push({ t: 'p', c: parseInline(para.join(' ')) }); para = []; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*[-*] /.test(line)) {
      flushPara();
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(parseInline(lines[i++].replace(/^\s*[-*] /, '')));
      i--;
      out.push({ t: 'ul', items });
    } else if (/^\s*\d+\. /.test(line)) {
      flushPara();
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) items.push(parseInline(lines[i++].replace(/^\s*\d+\. /, '')));
      i--;
      out.push({ t: 'ol', items });
    } else if (/^\s*\|/.test(line)) {
      flushPara();
      const tbl: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) tbl.push(splitRow(lines[i++]));
      i--;
      const body = tbl.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
      out.push({ t: 'table', head: body[0].map(parseInline), rows: body.slice(1).map((r) => r.map(parseInline)) });
    } else if (line.trim() === '') flushPara();
    else para.push(line.trim());
  }
  flushPara();
}

export function parseMarkdown(srcRaw: string): Block[] {
  const src = norm(srcRaw);
  const blocks: Block[] = [];
  const re = /\$\$([\s\S]+?)\$\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const text = (s: string) => s.split(/\n\s*\n/).forEach((c) => c.trim() && parseChunk(c, blocks));
  while ((m = re.exec(src))) {
    text(src.slice(last, m.index));
    blocks.push({ t: 'display', v: m[1].trim() });
    last = m.index + m[0].length;
  }
  text(src.slice(last));
  return blocks;
}

/** Every LaTeX snippet in a Markdown-lite string (used by tests to compile all authored math). */
export function extractMath(src: string): string[] {
  const res: string[] = [];
  const walkInline = (xs: Inline[]) => xs.forEach((x) => (x.t === 'math' ? res.push(x.v) : x.t === 'b' || x.t === 'i' ? walkInline(x.c) : undefined));
  for (const b of parseMarkdown(src)) {
    if (b.t === 'display') res.push(b.v);
    else if (b.t === 'p') walkInline(b.c);
    else if (b.t === 'ul' || b.t === 'ol') b.items.forEach(walkInline);
    else if (b.t === 'table') b.head.concat(...b.rows).forEach(walkInline);
  }
  return res;
}
