import { memo, useMemo, type ReactNode } from 'react';
import katex from 'katex';
import { parseMarkdown, parseInline, type Inline } from '../../domain/text/markdown';

const cache = new Map<string, string>();
function renderTex(tex: string, display: boolean): string {
  const key = `${display ? 'D' : 'I'}:${tex}`;
  let html = cache.get(key);
  if (html === undefined) {
    try {
      html = katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'htmlAndMathml', strict: 'ignore' });
    } catch {
      html = '';
    }
    cache.set(key, html);
  }
  return html;
}
/** Math is rendered by KaTeX with MathML output so screen readers can read it; the raw TeX is kept as the title for hover. */
export function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);
  return display ? <div className="math-display" dangerouslySetInnerHTML={{ __html: html }} /> : <span className="math" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Inlines({ nodes }: { nodes: Inline[] }): ReactNode {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case 'text': return <span key={i}>{n.v}</span>;
          case 'b': return <strong key={i}><Inlines nodes={n.c} /></strong>;
          case 'i': return <em key={i}><Inlines nodes={n.c} /></em>;
          case 'code': return <code key={i}>{n.v}</code>;
          case 'math': return <Tex key={i} tex={n.v} />;
        }
      })}
    </>
  );
}

/** Render Markdown-lite. `inline` renders a single paragraph without a <p> wrapper (for labels and short strings). */
export const Markdown = memo(function Markdown({ text, inline = false }: { text: string; inline?: boolean }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  if (inline) return <Inlines nodes={parseInline(text.replaceAll('⟦', '`').replaceAll('⟧', '`'))} />;
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'p': return <p key={i}><Inlines nodes={b.c} /></p>;
          case 'ul': return <ul key={i}>{b.items.map((it, j) => <li key={j}><Inlines nodes={it} /></li>)}</ul>;
          case 'ol': return <ol key={i}>{b.items.map((it, j) => <li key={j}><Inlines nodes={it} /></li>)}</ol>;
          case 'display': return <Tex key={i} tex={b.v} display />;
          case 'table':
            return (
              <div className="table-wrap" key={i}>
                <table>
                  <thead><tr>{b.head.map((h, j) => <th scope="col" key={j}><Inlines nodes={h} /></th>)}</tr></thead>
                  <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><Inlines nodes={c} /></td>)}</tr>)}</tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
});
