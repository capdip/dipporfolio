import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface RichTextEditorHandle {
  focus: () => void;
}

interface ButtonDef {
  label: string;
  icon: string;
  prefix: string;
  suffix?: string;
  block?: boolean;
}

const BTNS: ButtonDef[] = [
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

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({ value, onChange, placeholder = 'Start writing...', className }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const valueRef = useRef(value);
    const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

    useEffect(() => {
      valueRef.current = value;
    }, [value]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    const saveSelection = useCallback(() => {
      const el = textareaRef.current;
      if (el) {
        selectionRef.current = {
          start: el.selectionStart,
          end: el.selectionEnd,
        };
      }
    }, []);

    const restoreSelection = useCallback((start: number, end: number) => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        requestAnimationFrame(() => {
          el.selectionStart = start;
          el.selectionEnd = end;
        });
      }
    }, []);

    const formatText = useCallback(
      (prefix: string, suffix: string = '', block: boolean = false) => {
        const el = textareaRef.current;
        if (!el) return;

        const currentValue = valueRef.current;
        const selStart = selectionRef.current.start;
        const selEnd = selectionRef.current.end;
        const selectedText = currentValue.substring(selStart, selEnd);
        const before = currentValue.substring(0, selStart);
        const after = currentValue.substring(selEnd);

        let newValue: string;
        let newCursorStart: number;
        let newCursorEnd: number;

        if (block) {
          const lineStart = before.lastIndexOf('\n') + 1;
          const newlineAfter = after.indexOf('\n');
          const lineEnd = newlineAfter === -1 ? currentValue.length : selEnd + newlineAfter;
          const lineContent = currentValue.substring(lineStart, lineEnd);
          const cleanLine = lineContent.replace(/^(\s*)(#{1,3}|>|-)\s*/, '$1');
          newValue = currentValue.substring(0, lineStart) + prefix + cleanLine + currentValue.substring(lineEnd);
          newCursorStart = selStart + prefix.length;
          newCursorEnd = selEnd + prefix.length;
        } else if (selectedText) {
          const isAlreadyFormatted = selectedText.startsWith(prefix) && selectedText.endsWith(suffix);
          if (isAlreadyFormatted) {
            const inner = selectedText.slice(prefix.length, -suffix.length || undefined);
            newValue = before + inner + after;
            newCursorStart = selStart;
            newCursorEnd = selStart + inner.length;
          } else {
            newValue = before + prefix + selectedText + suffix + after;
            newCursorStart = selStart + prefix.length;
            newCursorEnd = selEnd + prefix.length;
          }
        } else {
          newValue = before + prefix + suffix + after;
          newCursorStart = selStart + prefix.length;
          newCursorEnd = selStart + prefix.length;
        }

        newCursorStart = Math.max(0, Math.min(newCursorStart, newValue.length));
        newCursorEnd = Math.max(0, Math.min(newCursorEnd, newValue.length));

        onChange(newValue);
        valueRef.current = newValue;
        setTimeout(() => restoreSelection(newCursorStart, newCursorEnd), 0);
      },
      [onChange, restoreSelection]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.metaKey || e.ctrlKey) {
          switch (e.key.toLowerCase()) {
            case 'b':
              e.preventDefault();
              formatText('**', '**', false);
              break;
            case 'i':
              e.preventDefault();
              formatText('*', '*', false);
              break;
            case 'k':
              e.preventDefault();
              formatText('[', '](url)', false);
              break;
          }
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          saveSelection();
          const start = selectionRef.current.start;
          const end = selectionRef.current.end;
          const newValue = valueRef.current.substring(0, start) + '  ' + valueRef.current.substring(end);
          onChange(newValue);
          valueRef.current = newValue;
          setTimeout(() => restoreSelection(start + 2, start + 2), 0);
        }
      },
      [formatText, onChange, saveSelection, restoreSelection]
    );

    const handleSelect = useCallback(() => {
      saveSelection();
    }, [saveSelection]);

    const wordCount = value.split(/\s+/).filter(Boolean).length;

    return (
      <div className={cn('overflow-hidden rounded-lg border border-border bg-surface', className)}>
        <div className="flex flex-wrap gap-1 border-b border-border bg-elevated/50 p-2">
          {BTNS.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => {
                saveSelection();
                const el = textareaRef.current;
                if (el) {
                  selectionRef.current = {
                    start: el.selectionStart,
                    end: el.selectionEnd,
                  };
                }
                formatText(btn.prefix, btn.suffix ?? '', !!btn.block);
              }}
              title={btn.label}
              className={cn(
                'flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground transition-colors',
                btn.label === 'Bold' && 'font-bold',
                btn.label === 'Italic' && 'italic',
                btn.label === 'Strikethrough' && 'line-through'
              )}
            >
              {btn.icon}
            </button>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            valueRef.current = e.target.value;
          }}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClick={handleSelect}
          onKeyUp={handleSelect}
          placeholder={placeholder}
          rows={16}
          style={{ tabSize: 2 }}
          className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
        />
        <div className="flex items-center justify-between border-t border-border bg-elevated/30 px-3 py-1.5 text-xs text-faint">
          <span>{value.length} chars · {wordCount} words</span>
          <span>Markdown</span>
        </div>
      </div>
    );
  }
);

export default RichTextEditor;