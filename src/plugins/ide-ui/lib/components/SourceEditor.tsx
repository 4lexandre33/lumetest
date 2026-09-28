import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { completeAt, collectVocabulary, highlightSource, offsetOfLine, fieldListShouldComma, underlinesFor, tabAfterKeyword, indentOnEnter, expandEntityDecl, expandRuleStub, ctrlJumpDrawer, type CompletionItem, type SourceKind } from "../../../narrative-engine/index.ts";
import { useIdeStore } from "../../../ide-state/index.ts";
import { menuAnchor, menuDetail, menuOpens, menuSeal } from "../completion-menu.ts";
import { CompletionMenu } from "./CompletionMenu.tsx";
import { cn } from "../utils.ts";

const LINE_PX = 24;
const PAD_TOP = 16;

export function SourceEditor({
  kind,
  value,
  onChange,
}: {
  kind: SourceKind;
  value: string;
  onChange: (next: string) => void;
}) {
  const compiled = useIdeStore((s) => s.compiled);
  const issues = useIdeStore((s) => s.issues);
  const sourceFocus = useIdeStore((s) => s.sourceFocus);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<number | null>(null);
  const appliedNonce = useRef<number | null>(null);
  const ctrlPlain = useRef(true);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CompletionItem[]>([]);
  const [active, setActive] = useState(0);
  const [replace, setReplace] = useState<{ start: number; end: number } | null>(null);
  const [menuPos, setMenuPos] = useState({ left: 8, top: 8 });

  const file = kind;
  const lines = useMemo(() => highlightSource(value, kind), [value, kind]);
  const split = useMemo(() => value.split("\n"), [value]);
  const lineCount = Math.max(1, split.length);
  const longest = useMemo(() => split.reduce((m, l) => Math.max(m, l.length), 8), [split]);
  const contentH = PAD_TOP * 2 + lineCount * LINE_PX;
  const marks = useMemo(() => underlinesFor(issues, file), [issues, file]);
  const vocab = useMemo(() => {
    const project = useIdeStore.getState().project;
    return collectVocabulary({
      worldModel: compiled?.worldModel,
      extras: project?.extras,
      taxonomy: compiled?.taxonomy,
      taxonomySource: kind === "taxonomy" ? value : project?.taxonomySource,
    });
  }, [compiled, value, kind]);

  function placeCaret(offset: number) {
    const ta = textareaRef.current;
    const sc = scrollRef.current;
    if (!ta) return;
    const start = Math.max(0, Math.min(offset, ta.value.length));
    caretRef.current = start;
    ta.focus();
    ta.setSelectionRange(start, start);
    const line = ta.value.slice(0, start).split("\n").length;
    const y = PAD_TOP + (line - 1) * LINE_PX;
    if (sc) {
      if (y < sc.scrollTop + LINE_PX || y > sc.scrollTop + sc.clientHeight - LINE_PX * 2) {
        sc.scrollTop = Math.max(0, y - LINE_PX * 3);
      }
    }
  }

  function suggest(source: string, offset: number, force = false) {
    const { ctx, items: next } = completeAt(source, kind, offset, vocab);
    if (menuOpens(source, offset, force) && next.length) {
      setItems(next);
      setActive(0);
      setReplace({ start: ctx.replaceStart, end: ctx.replaceEnd });
      setMenuPos(menuAnchor(source, offset, scrollRef.current, 48));
      setOpen(true);
    } else {
      setOpen(false);
    }
  }

  function apply(item: CompletionItem) {
    if (!replace) return;
    let insert = item.insert;
    const left = value.slice(0, replace.start);
    if (kind === "taxonomy" && insert.startsWith(" ") && /\s$/.test(left)) insert = insert.trimStart();
    if (left.endsWith(":") && !insert.startsWith(" ") && !insert.startsWith("\n")) {
      insert = " " + insert;
    }
    if (/[\p{L}\p{N}_]$/u.test(insert) && kind === "rules" && !insert.endsWith(" ") && !insert.endsWith(":")) {
      const after = value[replace.end] ?? "";
      if (after && after !== " " && after !== "\n" && after !== ".") insert = insert + " ";
    }
    const next = value.slice(0, replace.start) + insert + value.slice(replace.end);
    caretRef.current = replace.start + insert.length;
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => placeCaret(replace.start + insert.length));
  }

  function expandEntityTemplate(ta: HTMLTextAreaElement): boolean {
    if (kind !== "entities") return false;
    const out = expandEntityDecl(value, ta.selectionStart);
    if (!out) return false;
    caretRef.current = out.caret;
    onChange(out.source);
    requestAnimationFrame(() => placeCaret(out.caret));
    return true;
  }

  function expandRuleTemplate(ta: HTMLTextAreaElement): boolean {
    if (kind !== "rules") return false;
    const out = expandRuleStub(value, ta.selectionStart);
    if (!out) return false;
    caretRef.current = out.caret;
    onChange(out.source);
    requestAnimationFrame(() => placeCaret(out.caret));
    return true;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Control" || e.key === "Meta") {
      if (!e.repeat) ctrlPlain.current = true;
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) ctrlPlain.current = false;
    const ta = e.currentTarget;
    if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length));
      return;
    }
    if (open && e.key === "Tab" && items[active]) {
      e.preventDefault();
      apply(items[active]!);
      return;
    }
    if (open && e.key === "Enter" && items[active]) {
      e.preventDefault();
      apply(items[active]!);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && expandEntityTemplate(ta)) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && expandRuleTemplate(ta)) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !open) {
      const next = indentOnEnter(ta.value, ta.selectionStart);
      if (next) {
        e.preventDefault();
        caretRef.current = next.offset;
        onChange(next.source);
        requestAnimationFrame(() => placeCaret(next.offset));
        return;
      }
    }
    if (e.key === "Tab" && !open) {
      const next = tabAfterKeyword(ta.value, kind, ta.selectionStart);
      if (next) {
        e.preventDefault();
        caretRef.current = next.offset;
        onChange(next.source);
        requestAnimationFrame(() => placeCaret(next.offset));
        return;
      }
    }
    if (e.key === " " && !e.ctrlKey && !e.metaKey && fieldListShouldComma(ta.value, ta.selectionStart)) {
      e.preventDefault();
      const pos = ta.selectionStart;
      const next = ta.value.slice(0, pos) + ", " + ta.value.slice(ta.selectionEnd);
      caretRef.current = pos + 2;
      onChange(next);
      requestAnimationFrame(() => placeCaret(pos + 2));
      return;
    }
    if (e.key === "Escape") setOpen(false);
    if ((e.ctrlKey || e.metaKey) && e.key === " ") {
      e.preventDefault();
      suggest(ta.value, ta.selectionStart, true);
    }
  }

  function onKeyUp(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Control" && e.key !== "Meta") return;
    if (!ctrlPlain.current || e.shiftKey || e.altKey) return;
    if (kind !== "entities") return;
    const ta = e.currentTarget;
    if (ta.selectionStart !== ta.selectionEnd) return;
    const next = ctrlJumpDrawer(ta.value, ta.selectionStart);
    if (next == null) return;
    e.preventDefault();
    setOpen(false);
    placeCaret(next);
  }

  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (sourceFocus && sourceFocus.file === file && appliedNonce.current !== sourceFocus.nonce) {
      appliedNonce.current = sourceFocus.nonce;
      placeCaret(offsetOfLine(value, sourceFocus.line));
      return;
    }
    if (caretRef.current != null && ta.selectionStart !== caretRef.current) {
      const pos = Math.max(0, Math.min(caretRef.current, ta.value.length));
      ta.setSelectionRange(pos, pos);
    }
  }, [sourceFocus, file, value]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-auto font-mono text-sm"
        style={{ lineHeight: `${LINE_PX}px` }}
      >
        <div className="flex" style={{ minWidth: `max(100%, calc(3rem + ${longest + 4}ch))`, height: contentH }}>
          <div
            aria-hidden
            className="sticky left-0 z-[1] w-12 shrink-0 border-r border-border bg-bg pr-2 text-right text-subtle"
            style={{ paddingTop: PAD_TOP, height: contentH }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} style={{ height: LINE_PX }}>
                {i + 1}
              </div>
            ))}
          </div>
          <div className="relative min-w-0 flex-1" style={{ minWidth: `${longest + 4}ch`, height: contentH }}>
            <pre
              aria-hidden
              className="pointer-events-none absolute inset-0 m-0 overflow-visible whitespace-pre text-fg"
              style={{ padding: `${PAD_TOP}px 24px ${PAD_TOP}px 16px`, fontSize: 14, lineHeight: `${LINE_PX}px` }}
            >
              {lines.map((spans, i) => {
                const sevs = marks.get(i + 1);
                const mark = sevs?.some((s) => s.severity === "error") ? "error" : sevs?.length ? "warning" : null;
                return (
                <div
                  key={i}
                  className={cn("min-w-max", mark === "error" && "underline-error", mark === "warning" && "underline-warning")}
                  style={{ height: LINE_PX }}
                >
                  {spans.map((sp, j) => (
                    <span key={j} className={sp.cls}>
                      {sp.text}
                    </span>
                  ))}
                  {spans.length === 0 ? " " : null}
                </div>
                );
              })}
            </pre>
            <textarea
              ref={textareaRef}
              value={value}
              spellCheck={false}
              wrap="off"
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              onSelect={(e) => {
                caretRef.current = e.currentTarget.selectionStart;
              }}
              onChange={(e) => {
                const raw = e.target.value;
                const pos = e.target.selectionStart ?? raw.length;
                const tabbed = tabAfterKeyword(raw, kind, pos);
                const next = tabbed ? tabbed.source : raw;
                const caret = tabbed ? tabbed.offset : pos;
                caretRef.current = caret;
                onChange(next);
                suggest(next, caret);
              }}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
              onBlur={() => setTimeout(() => setOpen(false), 160)}
              className="absolute inset-0 m-0 resize-none overflow-hidden bg-transparent font-mono text-sm whitespace-pre"
              style={{
                color: "transparent",
                caretColor: "var(--color-fg)",
                WebkitTextFillColor: "transparent",
                padding: `${PAD_TOP}px 24px ${PAD_TOP}px 16px`,
                fontSize: 14,
                lineHeight: `${LINE_PX}px`,
                tabSize: 4,
                border: 0,
              }}
              aria-label={kind === "entities" ? "Editor de entidades" : kind === "taxonomy" ? "Editor de taxonomia" : "Editor de regras"}
            />
          </div>
        </div>
      </div>
      {open && items.length > 0 ? (
        <CompletionMenu
          items={items.map((item, i) => ({
            id: `${item.kind}-${item.label}-${i}`,
            label: item.label,
            detail: menuDetail(item.detail, item.documentation),
            seal: menuSeal(item.label, item.kind),
          }))}
          active={active}
          left={menuPos.left}
          top={menuPos.top}
          onPick={(index) => {
            const item = items[index];
            if (item) apply(item);
          }}
        />
      ) : null}
      {issues.filter((i) => i.location.file === file).length ? (
        <p className="border-t border-border px-3 py-1 font-mono text-[11px] text-danger">
          {issues.filter((i) => i.location.file === file)[0]?.message}
        </p>
      ) : null}
    </div>
  );
}
