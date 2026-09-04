import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const BTNS: { label: string; icon: string; prefix: string; suffix?: string; block?: boolean }[] = [
  { label: 'H2', icon: 'H₂', prefix: '## ', block: true },
  { label: 'H3', icon: 'H₃', prefix: '### ', block: true },
  { label: 'Bold', icon: 'B', prefix: '**', suffix: '**' },
  { label: 'Italic', icon: 'I', prefix: '*', suffix: '*' },
  { label: 'Strikethrough', icon: 'S', prefix: '~~', suffix: '~~' },
  { label: 'Link', icon: '🔗', prefix: '[', suffix: '](url)' },
  { label: 'Image', icon: '🖼', prefix: '![alt](', suffix: ')' },
  { label: 'List', icon: '≡', prefix: '- ', block: true },
  { label: 'Quote', icon: '❝', prefix: '> ', block: true },
  { label: 'Code', icon: '</>', prefix: '`', suffix: '`' },
];

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing...', className }: RichTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pos, setPos] = useState<{ s: number; e: number } | null>(null);

  useEffect(() => {
    if (pos && ref.current) {
      ref.current.selectionStart = pos.s;
      ref.current.selectionEnd = pos.e;
      setPos(null);
    }
  }, [value, pos]);

  const fmt = useCallback((prefix: string, suffix: string, block: boolean) => {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = value.substring(s, e);
    const before = value.substring(0, s);
    const after = value.substring(e);
    let nv: string;
    let ns: number;
    let ne: number;
    if (block) {
      const ls = before.lastIndexOf('\n') + 1;
      const le = after.indexOf('\n') === -1 ? value.length : e + after.indexOf('\n');
      const line = value.substring(ls, le);
      const clean = line.replace(/^(\s*)[-#>]+\s*/, '$1');
      nv = value.substring(0, ls) + prefix + clean + value.substring(le);
      ns = s + prefix.length;
      ne = e + prefix.length;
    } else if (sel) {
      const done = sel.startsWith(prefix) && sel.endsWith(suffix);
      if (done) {
        const inner = sel.slice(prefix.length, -suffix.length);
        nv = before + inner + after;
        ns = s;
        ne = s + inner.length;
      } else {
        nv = before + prefix + sel + suffix + after;
        ns = s + prefix.length;
        ne = e + prefix.length;
      }
    } else {
      nv = before + prefix + suffix + after;
      ns = s + prefix.length;
      ne = s + prefix.length;
    }
    setPos({ s: Math.max(0, ns), e: Math.max(0, ne) });
    onChange(nv);
  }, [value, onChange]);

  const onKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') { e.preventDefault(); fmt('**', '**', false); }
      if (e.key === 'i') { e.preventDefault(); fmt('*', '*', false); }
      if (e.key === 'k') { e.preventDefault(); fmt('[', '](url)', false); }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = ref.current;
      if (!el) return;
      const s = el.selectionStart;
      const e2 = el.selectionEnd;
      setPos({ s: s + 2, e: s + 2 });
      onChange(value.substring(0, s) + '  ' + value.substring(e2));
    }
  }, [fmt, value, onChange]);

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-surface', className)}>
      <div className="flex flex-wrap gap-1 border-b border-border bg-elevated/50 p-2">
        {BTNS.map((b) => (
          <button key={b.label} type="button" onClick={() => fmt(b.prefix, b.suffix ?? '', !!b.block)}
            title={b.label}
            className={cn('flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground',
              b.label === 'Bold' && 'font-bold', b.label === 'Italic' && 'italic', b.label === 'Strikethrough' && 'line-through')}>
            {b.icon}
          </button>
        ))}
      </div>
      <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey}
        placeholder={placeholder} rows={16} style={{ tabSize: 2 }}
        className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-faint focus:outline-none" />
      <div className="flex items-center justify-between border-t border-border bg-elevated/30 px-3 py-1.5 text-xs text-faint">
        <span>{value.length} chars · {value.split(/\s+/).filter(Boolean).length} words</span>
        <span>Markdown</span>
      </div>
    </div>
  );
}
