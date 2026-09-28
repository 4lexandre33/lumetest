import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  completeAt,
  collectVocabulary,
  highlightSource,
  offsetOfLine,
  tabAfterKeyword,
  indentOnEnter,
  insertSectionBreak,
  addLineNote,
  noteOnLine,
  type CompletionItem,
} from "../../narrative-engine/index.ts";
import { useIdeStore } from "../../ide-state/index.ts";
import { MutationSheet, PhraseSheet, emptyDraft } from "./WriteShell.tsx";
import {
  entityGuess,
  insertAtSelection,
  insertRegrasSection,
  insertMoldesSection,
  phrasesOfProject,
  bibliotecaOf,
  selectionOf,
  cadernoLive,
  MENU_CURSOR,
  MENU_MAIS,
  nascerPalavra,
  saberPalavra,
  ligarPalavra,
  maisUmPalavra,
  cartaoNaLinha,
  trechoDe,
  type DrawerHost,
  type MutationDraft,
  type TipoNascer,
} from "../lib/write-menu.ts";
import { addAnnotation, headingOf, markHitsOnPage, nextAnnotationId, parseAnotacoesSlice, type MarkHit, type NotebookAnnotation } from "../lib/annotations.ts";
import { proseTriggers, type ProseHit } from "../lib/prose-triggers.ts";
import { inRegrasFence, proseDegrau, type PhraseLeaf } from "../lib/degrau-prose.ts";
import { leituraAte } from "../lib/timeline.ts";
import { aplicarLinhaComando } from "../lib/comando.ts";
import { replaceBookSource } from "../lib/pages.ts";
import { useNotebookView } from "./notebook-view.tsx";
import { menuAnchor, menuDetail, menuOpens, menuSeal } from "../../ide-ui/index.ts";
import { CompletionMenu } from "../../ide-ui/lib/components/CompletionMenu.tsx";

const LINE_PX = 24;
const PAD_TOP = 16;

function intoOf(source: string, line: number): "rule" | "portrait" {
  const text = (source.split("\n")[Math.max(0, line - 1)] ?? "").trim();
  return /^(quando|se|narre)\b/i.test(text) ? "rule" : "portrait";
}

function columnOf(source: string, offset: number): number {
  return Math.max(0, offset - (source.lastIndexOf("\n", offset - 1) + 1));
}

function paintMarks(
  spans: { text: string; cls: string }[],
  hits: MarkHit[],
  live: boolean,
  onSelect?: (id: string) => void,
) {
  const atEnd = new Map<number, MarkHit[]>();
  for (const hit of hits) {
    const at = hit.column + hit.length;
    const list = atEnd.get(at) ?? [];
    list.push(hit);
    atEnd.set(at, list);
  }
  const nodes: ReactNode[] = [];
  let offset = 0;
  let k = 0;
  const badges = (at: number) => {
    const list = atEnd.get(at);
    if (!list) return;
    atEnd.delete(at);
    for (const hit of list) {
      nodes.push(
        <button
          key={hit.id}
          type="button"
          aria-label={`Mutação ${hit.mark}`}
          title="Mutação"
          className="pointer-events-auto align-super text-[10px] leading-none text-muted hover:text-fg"
          onClick={(e) => {
            e.preventDefault();
            if (!live) return;
            onSelect?.(hit.id);
          }}
        >
          {hit.mark}
        </button>,
      );
    }
  };
  badges(0);
  for (const sp of spans) {
    const start = offset;
    const end = offset + sp.text.length;
    const cuts = [...atEnd.keys()].filter((at) => at > start && at < end).sort((a, b) => a - b);
    let cursor = start;
    for (const at of cuts) {
      const slice = sp.text.slice(cursor - start, at - start);
      if (slice) {
        nodes.push(
          <span key={`t${k++}`} className={sp.cls}>
            {slice}
          </span>,
        );
      }
      cursor = at;
      badges(at);
    }
    const rest = sp.text.slice(cursor - start);
    if (rest) {
      nodes.push(
        <span key={`t${k++}`} className={sp.cls}>
          {rest}
        </span>,
      );
    }
    offset = end;
    badges(end);
  }
  for (const at of [...atEnd.keys()].sort((a, b) => a - b)) badges(at);
  return nodes;
}

type MenuState = { x: number; y: number; line: number; start: number; end: number; text: string };

export function NotebookEditor({
  value,
  onChange,
  onShowIndex,
  onShowTimeline,
  onSelectMark,
  onCaretLine,
  entities = [],
  rules = [],
  annotations = [],
  onBindMutation,
  onShowLine,
  lineBase = 1,
}: {
  value: string;
  onChange: (next: string, opts?: { flush?: boolean }) => void;
  onShowIndex?: () => void;
  onShowTimeline?: () => void;
  onSelectMark?: (id: string) => void;
  onCaretLine?: (line: number) => void;
  entities?: DrawerHost[];
  rules?: { id: string; narrative?: string }[];
  annotations?: NotebookAnnotation[];
  onBindMutation?: (draft: MutationDraft, heading: string) => void;
  onShowLine?: (line: number) => void;
  lineBase?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const live = cadernoLive(useIdeStore((s) => s.ideMode));
  const entitiesSource = useIdeStore((s) => s.project?.entitiesSource ?? "");
  const notebooks = useIdeStore((s) => s.project?.notebooksSource ?? "");
  const setEntities = useIdeStore((s) => s.setEntities);
  const setNotebooks = useIdeStore((s) => s.setNotebooks);
  const { bookId, setCartao } = useNotebookView();
  const scrollRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<number | null>(null);
  const cartaoLinha = useRef<number | null>(null);
  const segurarCartao = useRef(false);
  const selectionRef = useRef({ start: 0, end: 0 });
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CompletionItem[]>([]);
  const [active, setActive] = useState(0);
  const [replace, setReplace] = useState<{ start: number; end: number } | null>(null);
  const [menuPos, setMenuPos] = useState({ left: 8, top: 8 });
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [mais, setMais] = useState(false);
  const [isto, setIsto] = useState(false);
  const [sabe, setSabe] = useState("");
  const [ligarNome, setLigarNome] = useState("");
  const [ligarDestino, setLigarDestino] = useState("");
  const [folha, setFolha] = useState<null | "sabe" | "ligar">(null);
  const [note, setNote] = useState<{ line: number; text: string } | null>(null);
  const [draft, setDraft] = useState<MutationDraft | null>(null);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [phraseRange, setPhraseRange] = useState({ start: 0, end: 0 });
  const [proseHits, setProseHits] = useState<ProseHit[]>([]);

  const highlighted = useMemo(() => highlightSource(value, "notebook"), [value]);
  const split = useMemo(() => value.split("\n"), [value]);
  const lineCount = Math.max(1, split.length);
  const longest = useMemo(() => split.reduce((m, l) => Math.max(m, l.length), 8), [split]);
  const contentH = PAD_TOP * 2 + lineCount * LINE_PX;
  const phrases = useMemo(() => phrasesOfProject(entities, rules), [entities, rules]);
  const biblioteca = useMemo(() => bibliotecaOf(value, phrases), [value, phrases]);
  const entityIds = useMemo(() => entities.map((item) => item.id), [entities]);
  const marks = useMemo(() => markHitsOnPage(value, annotations), [value, annotations]);

  useEffect(() => {
    if (live) return;
    setMenu(null);
    setMais(false);
    setIsto(false);
    setFolha(null);
    setDraft(null);
    setPhrasesOpen(false);
    setProseHits([]);
  }, [live]);

  function setOpenBoth(v: boolean) {
    openRef.current = v;
    setOpen(v);
  }

  function moverLinha(line: number) {
    const next = cartaoNaLinha(cartaoLinha.current, line, segurarCartao.current);
    if (next.limpar) setCartao(null);
    cartaoLinha.current = next.linha;
    segurarCartao.current = next.segurar;
    onCaretLine?.(line);
  }

  function rememberSelection(start: number, end: number) {
    selectionRef.current = { start, end };
    caretRef.current = start;
  }

  function placeCaret(offset: number) {
    const ta = textareaRef.current;
    const sc = scrollRef.current;
    if (!ta) return;
    const start = Math.max(0, Math.min(offset, ta.value.length));
    rememberSelection(start, start);
    ta.focus();
    ta.setSelectionRange(start, start);
    const line = ta.value.slice(0, start).split("\n").length;
    const y = PAD_TOP + (line - 1) * LINE_PX;
    if (sc && (y < sc.scrollTop + LINE_PX || y > sc.scrollTop + sc.clientHeight - LINE_PX * 2)) {
      sc.scrollTop = Math.max(0, y - LINE_PX * 3);
    }
  }

  function suggest(source: string, offset: number, force = false) {
    const opened = menuOpens(source, offset, force);
    if (!opened) {
      setOpenBoth(false);
      setProseHits([]);
      return;
    }
    const project = useIdeStore.getState().project;
    const compiled = useIdeStore.getState().compiled;
    const localLine = source.slice(0, Math.max(0, offset)).split("\n").length;
    const full = project?.notebooksSource ?? source;
    const { world } = leituraAte(full, project?.entitiesSource ?? "", lineBase + localLine - 1);
    const vocab = collectVocabulary({
      worldModel: world,
      taxonomy: compiled?.taxonomy,
      extras: project?.extras,
      taxonomySource: project?.taxonomySource,
    });
    const dot = source[offset - 1] === ".";
    if (inRegrasFence(source, offset)) {
      const lineStart = source.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
      const local = source.slice(lineStart, offset);
      const stepped = completeAt(local, "rules", local.length, vocab);
      if (stepped.ctx.slot === "degrau") {
        if (stepped.items.length) {
          setItems(stepped.items);
          setProseHits([]);
          setActive(0);
          setReplace({ start: lineStart + stepped.ctx.replaceStart, end: lineStart + stepped.ctx.replaceEnd });
          setMenuPos(menuAnchor(source, offset, scrollRef.current, 56));
          setOpenBoth(true);
        } else {
          setOpenBoth(false);
          setProseHits([]);
        }
        return;
      }
    }
    const leaves: PhraseLeaf[] = [];
    for (const entity of world.values()) {
      for (const [key, raw] of Object.entries(entity.phrases ?? {})) {
        const insert = String(raw ?? "");
        if (insert) leaves.push({ owner: entity.id, key, insert });
      }
    }
    for (const rule of rules) {
      const insert = (rule.narrative ?? "").replace(/^['"]|['"]$/g, "");
      if (insert) leaves.push({ owner: rule.id, key: rule.id, insert });
    }
    const prose = proseDegrau(source, offset, vocab.entityIds.length ? vocab.entityIds : entityIds, leaves);
    if (prose) {
      const p = prose.ctx.prefix.toLowerCase();
      const items = p ? prose.items.filter((item) => item.label.toLowerCase().startsWith(p) || item.label.toLowerCase().includes(p)) : prose.items;
      if (items.length) {
        setItems(items);
        setProseHits([]);
        setActive(0);
        setReplace({ start: prose.ctx.replaceStart, end: prose.ctx.replaceEnd });
        setMenuPos(menuAnchor(source, offset, scrollRef.current, 56));
        setOpenBoth(true);
      } else {
        setOpenBoth(false);
        setProseHits([]);
      }
      return;
    }
    if (dot) {
      setOpenBoth(false);
      setProseHits([]);
      return;
    }
    const { ctx, items: next } = completeAt(source, "notebook", offset, vocab);
    const hits = live
      ? proseTriggers(source, offset, {
          entities: entities.map((item) => ({ id: item.id, name: "name" in item ? String((item as { name?: string }).name ?? "") : "" })),
          phrases,
          annotations,
        })
      : [];
    if (next.length || hits.length) {
      setItems(next);
      setProseHits(hits);
      setActive(0);
      setReplace({ start: ctx.replaceStart, end: ctx.replaceEnd });
      setMenuPos(menuAnchor(source, offset, scrollRef.current, 56));
      setOpenBoth(true);
      return;
    }
    setOpenBoth(false);
    setProseHits([]);
  }

  function apply(item: CompletionItem) {
    if (!replace) return;
    const insert = item.insert;
    const next = value.slice(0, replace.start) + insert + value.slice(replace.end);
    caretRef.current = replace.start + insert.length;
    selectionRef.current = { start: replace.start + insert.length, end: replace.start + insert.length };
    onChange(next);
    setOpenBoth(false);
    requestAnimationFrame(() => placeCaret(replace.start + insert.length));
  }

  function closeSheets() {
    setMenu(null);
    setMais(false);
    setIsto(false);
    setFolha(null);
    setDraft(null);
    setPhrasesOpen(false);
    setNote(null);
    setProseHits([]);
    setOpenBoth(false);
  }

  function applyProse(hit: ProseHit) {
    if (hit.kind === "phrase" && hit.insert) {
      const next = insertAtSelection(value, hit.start, hit.end, hit.insert);
      rememberSelection(next.offset, next.offset);
      onChange(next.source);
      setProseHits([]);
      requestAnimationFrame(() => placeCaret(next.offset));
      return;
    }
    if (hit.kind === "entity" && hit.entityId) {
      const line = value.slice(0, hit.start).split("\n").length;
      setDraft(emptyDraft(hit.entityId, hit.token, line, "tags", { column: columnOf(value, hit.start), into: intoOf(value, line) }));
      setProseHits([]);
      setOpenBoth(false);
      return;
    }
    setProseHits([]);
    setOpenBoth(false);
  }

  function palavraMarcada(): boolean {
    if (menu?.text.trim()) return true;
    setCartao({ ok: false, titulo: "marque a palavra", linhas: [] });
    setMenu(null);
    setIsto(false);
    return false;
  }

  function nascer(tag: TipoNascer) {
    if (!menu || !palavraMarcada()) return;
    const ran = nascerPalavra(entitiesSource, menu.text, tag);
    setCartao(ran.cartao);
    if (ran.cartao.ok && ran.entities !== entitiesSource) setEntities(ran.entities);
    setMenu(null);
    setIsto(false);
  }

  function guardarSabe() {
    if (!menu) return;
    const ran = saberPalavra(entitiesSource, menu.text, entityIds, sabe);
    setCartao(ran.cartao);
    if (ran.cartao.ok && ran.entities !== entitiesSource) setEntities(ran.entities);
    setFolha(null);
    setMenu(null);
    setSabe("");
  }

  function guardarLigacao() {
    if (!menu) return;
    const ran = ligarPalavra(entitiesSource, menu.text, entityIds, ligarNome, ligarDestino);
    setCartao(ran.cartao);
    if (!ran.cartao.ok || !ran.mut) {
      setFolha(null);
      setMenu(null);
      return;
    }
    onBindMutation?.(
      {
        entityId: ran.mut.id,
        drawer: "hardLinks",
        key: ligarNome.trim().toLowerCase(),
        value: ligarDestino.trim(),
        quote: menu.text.trim(),
        line: menu.line,
        op: "set",
        column: columnOf(value, menu.start),
      },
      headingOf(value, menu.line),
    );
    setFolha(null);
    setMenu(null);
    setLigarNome("");
  }

  function maisUm() {
    if (!menu || !palavraMarcada()) return;
    const ran = maisUmPalavra(entitiesSource, menu.text, entities);
    setCartao(ran.cartao);
    if (ran.cartao.ok && ran.entities !== entitiesSource) setEntities(ran.entities);
    setMenu(null);
  }

  function escolher(label: (typeof MENU_CURSOR)[number]) {
    if (!menu) return;
    if (label === "Isto é…") {
      if (!palavraMarcada()) return;
      setIsto(true);
      return;
    }
    if (label === "Mudar isto") {
      setDraft(emptyDraft(entityGuess(menu.text, entityIds), menu.text, menu.line, "tags", { column: columnOf(value, menu.start), into: intoOf(value, menu.line) }));
      setMenu(null);
      return;
    }
    if (label === "Ela sabe…") {
      if (!palavraMarcada()) return;
      setSabe("");
      setFolha("sabe");
      return;
    }
    if (label === "Ligar a…") {
      if (!palavraMarcada()) return;
      setLigarNome("");
      setLigarDestino(entityIds[0] ?? "");
      setFolha("ligar");
      return;
    }
    if (label === "Mais um como esta") {
      maisUm();
      return;
    }
    if (label === "Nesta linha") {
      moverLinha(menu.line);
      onShowLine?.(menu.line);
      setMenu(null);
      return;
    }
    setMais(true);
  }

  function escolherMais(label: (typeof MENU_MAIS)[number]) {
    if (!menu) return;
    if (label === "Adicionar nota") {
      setNote({ line: menu.line, text: noteOnLine(split[menu.line - 1] ?? "") ?? "" });
      setMenu(null);
      return;
    }
    if (label === "Biblioteca") {
      setPhraseRange({ start: menu.start, end: menu.end });
      setPhrasesOpen(true);
      setMenu(null);
      return;
    }
    if (label === "Ver índices") {
      onShowIndex?.();
      setMenu(null);
      return;
    }
    if (label === "Linha do tempo") {
      onShowTimeline?.();
      setMenu(null);
      return;
    }
    const pos = offsetOfLine(value, menu.line) + (split[menu.line - 1]?.length ?? 0);
    const next = label === "Secção de regras"
      ? insertRegrasSection(value, pos)
      : label === "Secção de moldes"
        ? insertMoldesSection(value, pos)
        : insertSectionBreak(value, pos);
    caretRef.current = next.offset;
    onChange(next.source);
    setMenu(null);
    requestAnimationFrame(() => placeCaret(next.offset));
  }

  function menuRows() {
    const fromItems = items.map((item, index) => ({
      id: `c-${item.kind}-${item.label}-${index}`,
      label: item.label,
      detail: menuDetail(item.detail, item.documentation),
      seal: item.detail === "frase" || item.detail.startsWith("frases") || item.label === "frases"
        ? "frase"
        : menuSeal(item.label, item.kind),
      pick: () => apply(item),
    }));
    const fromHits = proseHits.map((hit, index) => ({
      id: `p-${hit.kind}-${hit.label}-${index}`,
      label: hit.label,
      detail: menuDetail(hit.detail),
      seal: menuSeal(hit.label, hit.kind),
      pick: () => applyProse(hit),
    }));
    return open ? [...fromItems, ...fromHits] : [];
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    const ta = e.currentTarget;
    if ((e.ctrlKey || e.metaKey) && e.key === " ") {
      e.preventDefault();
      suggest(ta.value, ta.selectionStart, true);
      return;
    }
    if (e.key === "Escape") {
      closeSheets();
      return;
    }
    const rows = menuRows();
    if (open && rows.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % rows.length : (i - 1 + rows.length) % rows.length));
      return;
    }
    if (open && (e.key === "Enter" || e.key === "Tab") && rows[active]) {
      e.preventDefault();
      rows[active]!.pick();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      const ran = aplicarLinhaComando(ta.value, ta.selectionStart, entitiesSource, {
        prosa: notebooks || ta.value,
        linha: (notebooks ? lineBase : 1) + selectionOf(ta.value, ta.selectionStart, ta.selectionStart).line - 1,
      });
      if (ran) {
        e.preventDefault();
        setCartao(ran.cartao);
        if (ran.entities !== entitiesSource) setEntities(ran.entities);
        if (ran.anotacao || ran.source !== ta.value) segurarCartao.current = true;
        if (ran.anotacao) {
          if (!bookId) {
            segurarCartao.current = false;
            setCartao({ ok: false, titulo: "Não há caderno.", linhas: [] });
            return;
          }
          const base = replaceBookSource(notebooks, bookId, ran.source);
          const id = nextAnnotationId(parseAnotacoesSlice(base));
          setNotebooks(addAnnotation(base, { ...ran.anotacao, id, book: bookId }), { flush: true });
          caretRef.current = ran.offset;
          requestAnimationFrame(() => placeCaret(ran.offset));
          return;
        }
        if (ran.source !== ta.value) {
          caretRef.current = ran.offset;
          onChange(ran.source, { flush: true });
          requestAnimationFrame(() => placeCaret(ran.offset));
        }
        return;
      }
      const next = indentOnEnter(ta.value, ta.selectionStart);
      if (next) {
        e.preventDefault();
        caretRef.current = next.offset;
        onChange(next.source);
        requestAnimationFrame(() => placeCaret(next.offset));
        return;
      }
      return;
    }
    if (e.key === "Tab" && !open) {
      const next = tabAfterKeyword(ta.value, "notebook", ta.selectionStart);
      if (next) {
        e.preventDefault();
        caretRef.current = next.offset;
        onChange(next.source);
        requestAnimationFrame(() => placeCaret(next.offset));
      }
      return;
    }
  }

  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta || caretRef.current == null) return;
    const sel = selectionRef.current;
    const start = Math.max(0, Math.min(sel.start, ta.value.length));
    const end = Math.max(start, Math.min(sel.end, ta.value.length));
    if (ta.selectionStart !== start || ta.selectionEnd !== end) {
      ta.setSelectionRange(start, end);
    }
  }, [value]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto font-mono text-sm" style={{ lineHeight: `${LINE_PX}px` }}>
        <div className="flex" style={{ minWidth: `max(100%, calc(3rem + ${longest + 4}ch))`, height: contentH }}>
          <div
            className="sticky left-0 z-[1] w-14 shrink-0 border-r border-border bg-bg pr-1 text-right text-subtle"
            style={{ paddingTop: PAD_TOP, height: contentH }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="flex items-center justify-end gap-0.5" style={{ height: LINE_PX }}>
                {noteOnLine(split[i] ?? "") ? <span className="inline-block size-1.5 rounded-full bg-warn" title="Nota" /> : null}
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
              {highlighted.map((spans, i) => (
                <div key={i} className="min-w-max" style={{ height: LINE_PX }}>
                  {paintMarks(spans, live ? (marks.get(i + 1) ?? []) : [], live, onSelectMark)}
                  {spans.length === 0 ? " " : null}
                </div>
              ))}
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
                rememberSelection(e.currentTarget.selectionStart, e.currentTarget.selectionEnd);
                moverLinha(selectionOf(value, e.currentTarget.selectionStart, e.currentTarget.selectionStart).line);
              }}
              onChange={(e) => {
                const raw = e.target.value;
                const pos = e.target.selectionStart ?? raw.length;
                const tabbed = tabAfterKeyword(raw, "notebook", pos);
                const next = tabbed ? tabbed.source : raw;
                const caret = tabbed ? tabbed.offset : pos;
                rememberSelection(caret, caret);
                onChange(next);
                moverLinha(selectionOf(next, caret, caret).line);
                suggest(next, caret);
              }}
              onKeyDown={onKeyDown}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!live) return;
                const sc = scrollRef.current;
                const ta = textareaRef.current;
                if (!sc) return;
                const y = e.clientY - sc.getBoundingClientRect().top + sc.scrollTop - PAD_TOP;
                const line = Math.max(1, Math.min(lineCount, Math.floor(y / LINE_PX) + 1));
                const sel = selectionOf(value, ta?.selectionStart ?? 0, ta?.selectionEnd ?? 0);
                const trecho = trechoDe(value, sel.start, sel.end);
                rememberSelection(trecho.text ? trecho.start : sel.start, trecho.text ? trecho.end : sel.end);
                if (trecho.erro === "O trecho fica na mesma linha.") setCartao({ ok: false, titulo: trecho.erro, linhas: [] });
                setMais(false);
                setIsto(false);
                setMenu({
                  x: e.clientX,
                  y: e.clientY,
                  line: trecho.text ? trecho.line : line,
                  start: trecho.text ? trecho.start : sel.start,
                  end: trecho.text ? trecho.end : sel.end,
                  text: trecho.text,
                });
                setOpenBoth(false);
              }}
              onBlur={() =>
                setTimeout(() => {
                  setOpenBoth(false);
                  setProseHits([]);
                }, 160)
              }
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
              aria-label="Editor de caderno"
            />
          </div>
        </div>
      </div>
      {open ? (
        <CompletionMenu
          items={menuRows()}
          active={active}
          left={menuPos.left}
          top={menuPos.top}
          onPick={(index) => menuRows()[index]?.pick()}
        />
      ) : null}
      {menu ? <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Fechar menu" onClick={() => { setMenu(null); setMais(false); setIsto(false); setFolha(null); }} /> : null}
      {menu && !folha ? (
        <div
          className="fixed z-50 min-w-44 overflow-hidden rounded-sm border border-border bg-elevated py-1 shadow-xl"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {isto ? (
            <>
              {(["pessoa", "lugar", "objeto"] as const).map((tag) => (
                <button key={tag} type="button" className="flex w-full px-3 py-1.5 text-left text-sm capitalize hover:bg-surface" onClick={() => nascer(tag)}>
                  {tag}
                </button>
              ))}
              <button type="button" className="flex w-full px-3 py-1.5 text-left text-sm text-muted hover:bg-surface" onClick={() => setIsto(false)}>
                Voltar
              </button>
            </>
          ) : mais ? (
            <>
              {MENU_MAIS.map((label) => (
                <button key={label} type="button" className="flex w-full px-3 py-1.5 text-left text-sm hover:bg-surface" onClick={() => escolherMais(label)}>
                  {label}
                </button>
              ))}
              <button type="button" className="flex w-full px-3 py-1.5 text-left text-sm text-muted hover:bg-surface" onClick={() => setMais(false)}>
                Voltar
              </button>
            </>
          ) : (
            MENU_CURSOR.map((label) => (
              <button key={label} type="button" className="flex w-full px-3 py-1.5 text-left text-sm hover:bg-surface" onClick={() => escolher(label)}>
                {label}
              </button>
            ))
          )}
        </div>
      ) : null}
      {folha && menu ? (
        <form
          className="fixed z-50 w-64 rounded-sm border border-border bg-elevated p-3 shadow-xl"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.preventDefault()}
          onSubmit={(e) => {
            e.preventDefault();
            if (folha === "sabe") guardarSabe();
            else guardarLigacao();
          }}
        >
          <p className="text-[10px] tracking-[0.14em] text-muted uppercase">{folha === "sabe" ? "Ela sabe…" : "Ligar a…"}</p>
          {folha === "sabe" ? (
            <input
              autoFocus
              className="mt-2 h-8 w-full rounded-xs border border-border bg-surface px-2 text-sm text-fg outline-none"
              value={sabe}
              placeholder="o facto"
              onChange={(e) => setSabe(e.target.value)}
            />
          ) : (
            <>
              <input
                autoFocus
                className="mt-2 h-8 w-full rounded-xs border border-border bg-surface px-2 text-sm text-fg outline-none"
                value={ligarNome}
                placeholder="nome da ligação"
                onChange={(e) => setLigarNome(e.target.value)}
              />
              <select
                className="mt-2 h-8 w-full rounded-xs border border-border bg-surface px-2 text-sm text-fg outline-none"
                value={ligarDestino}
                onChange={(e) => setLigarDestino(e.target.value)}
              >
                {entityIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="h-7 rounded-xs px-2.5 text-sm text-muted hover:text-fg" onClick={() => { setFolha(null); setMenu(null); }}>
              Cancelar
            </button>
            <button type="submit" className="h-7 rounded-xs bg-surface px-2.5 text-sm text-fg">
              Guardar
            </button>
          </div>
        </form>
      ) : null}
      {note ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/70 p-4">
          <form
            className="w-full max-w-sm rounded-sm border border-border bg-elevated p-3 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              const next = addLineNote(value, note.line, note.text);
              caretRef.current = offsetOfLine(next, note.line);
              onChange(next);
              setNote(null);
            }}
          >
            <p className="text-[10px] tracking-[0.14em] text-muted uppercase">Nota · linha {note.line}</p>
            <textarea
              autoFocus
              className="mt-2 min-h-20 w-full resize-none rounded-xs border border-border bg-surface px-2 py-1.5 text-sm text-fg outline-none"
              value={note.text}
              onChange={(e) => setNote({ ...note, text: e.target.value })}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="h-7 rounded-xs px-2.5 text-sm text-muted hover:text-fg" onClick={() => setNote(null)}>
                Cancelar
              </button>
              <button type="submit" className="h-7 rounded-xs bg-surface px-2.5 text-sm text-fg">
                Guardar
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {draft ? (
        <MutationSheet
          entities={entities}
          draft={draft}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onStub={(bound) => {
            const quote = bound.quote.trim() || (split[bound.line - 1] ?? "").trim();
            onBindMutation?.({ ...bound, quote }, headingOf(value, bound.line));
            setDraft(null);
          }}
        />
      ) : null}
      {phrasesOpen ? (
        <PhraseSheet
          phrases={biblioteca}
          onCancel={() => setPhrasesOpen(false)}
          onPick={(phrase) => {
            const next = insertAtSelection(value, phraseRange.start, phraseRange.end, phrase.insert);
            rememberSelection(next.offset, next.offset);
            onChange(next.source);
            setPhrasesOpen(false);
            requestAnimationFrame(() => placeCaret(next.offset));
          }}
        />
      ) : null}
    </div>
  );
}
