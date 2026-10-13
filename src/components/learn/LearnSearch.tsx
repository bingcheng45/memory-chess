"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { LEARN_SEARCH_COPY as COPY } from "@/lib/seo/learn/copy";
import { LEARN_SEARCH_INDEX_PATH, LEARN_SEARCH_PATH, guideRoundHref } from "@/lib/seo/learn/links";
import { outcomeOf, prepareIndex, search, type SearchDoc, type SearchIndex, type SearchResult } from "@/lib/seo/learn/search";
import LearnSearchResult from "./LearnSearchResult";

/** Screen readers hear the count once typing pauses, not on every key. */
const ANNOUNCE_AFTER_MS = 400;
/** A query is settled, and reported, once typing pauses this long. */
const SETTLE_AFTER_MS = 1000;
const MIN_REPORTED_LENGTH = 3;
const NO_RESULT_ROUND = { pieceCount: 6, memorizeTime: 10 } as const;

type Stage = { readonly id: string; readonly label: string };

function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function useSearchIndex() {
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const loading = useRef(false);
  const load = useCallback(() => {
    if (loading.current) return;
    loading.current = true;
    fetch(LEARN_SEARCH_INDEX_PATH)
      .then((response) => (response.ok ? (response.json() as Promise<SearchDoc[]>) : Promise.reject(new Error(String(response.status)))))
      .then((docs) => setIndex(prepareIndex(docs)))
      .catch(() => {
        loading.current = false;
      });
  }, []);
  return { index, load };
}

function report(query: string, results: readonly SearchResult[]) {
  trackEvent({
    name: "learn_search",
    params: {
      query_length: query.length,
      results: results.length,
      top: results[0]?.slug ?? "none",
      outcome: outcomeOf(results),
      surface: "hub",
    },
  });
}

/** The hub's question field: a combobox whose results float over the page, and a plain GET form without JavaScript. */
export default function LearnSearch({ stages }: { readonly stages: readonly Stage[] }) {
  const id = useId();
  const listId = `${id}-list`;
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const { index, load } = useSearchIndex();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [announced, setAnnounced] = useState("");

  const trimmed = query.trim();
  const results = index && trimmed ? search(trimmed, index) : [];
  const outcome = outcomeOf(results);
  const showPanel = open && trimmed.length > 0 && index !== null;

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isTextField(event.target)) return;
      event.preventDefault();
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      input.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  useEffect(() => {
    if (!index || !trimmed) {
      setAnnounced("");
      return;
    }
    const settled = search(trimmed, index);
    const announce = window.setTimeout(() => setAnnounced(COPY.matches(settled.length)), ANNOUNCE_AFTER_MS);
    const settle = trimmed.length >= MIN_REPORTED_LENGTH ? window.setTimeout(() => report(trimmed, settled), SETTLE_AFTER_MS) : 0;
    return () => {
      window.clearTimeout(announce);
      window.clearTimeout(settle);
    };
  }, [index, trimmed]);

  const select = (result: SearchResult, rank: number) =>
    trackEvent({
      name: "learn_search_select",
      params: { slug: result.slug, rank, matched_question: result.matchedQuestion !== null, surface: "hub" },
    });

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => {
        const next = current + step;
        if (next >= results.length) return -1;
        return next < -1 ? results.length - 1 : next;
      });
      return;
    }
    if (event.key === "Enter" && showPanel && active >= 0 && results[active]) {
      event.preventDefault();
      select(results[active], active + 1);
      window.location.assign(results[active].url);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (query) {
        setQuery("");
        setActive(-1);
        setOpen(false);
      } else {
        input.current?.blur();
        returnFocus.current?.focus();
      }
    }
  };

  const activeId = showPanel && active >= 0 && active < results.length ? `${id}-option-${active}` : undefined;

  return (
    <div className="ls" ref={root}>
      <form className="ls-form" role="search" method="get" action={LEARN_SEARCH_PATH} onSubmit={() => trimmed && index && report(trimmed, results)}>
        <label htmlFor={`${id}-q`} className="ls-label">
          {COPY.label}
        </label>
        <div className="ls-field">
          <input
            ref={input}
            id={`${id}-q`}
            name="q"
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder={COPY.placeholder}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            value={query}
            onFocus={load}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
          <kbd className="ls-kbd" aria-hidden="true">
            /
          </kbd>
          <button type="submit" className="ls-submit">
            {COPY.submit}
          </button>
        </div>
      </form>
      <div className="ls-panel" data-open={showPanel ? "" : undefined}>
        {showPanel && outcome !== "none" ? <p className="ls-panel-label">{outcome === "weak" ? COPY.closest : COPY.results}</p> : null}
        <div id={listId} role="listbox" aria-label={COPY.results}>
          {showPanel
            ? results.map((result, rank) => (
                <a
                  key={result.slug}
                  id={`${id}-option-${rank}`}
                  role="option"
                  aria-selected={rank === active}
                  href={result.url}
                  className="ls-option"
                  onClick={() => select(result, rank + 1)}
                  onMouseEnter={() => setActive(rank)}
                >
                  <LearnSearchResult result={result} query={trimmed} />
                </a>
              ))
            : null}
        </div>
        {showPanel && outcome === "none" ? (
          <div className="ls-none">
            <p>{COPY.none(trimmed)}</p>
            <p className="ls-none-hint">{COPY.noneHint}</p>
            <p className="ls-none-links">
              {stages.map((stage) => (
                <a key={stage.id} href={`#${stage.id}`} onClick={() => setOpen(false)}>
                  {stage.label}
                </a>
              ))}
              <a href={guideRoundHref(NO_RESULT_ROUND)}>{COPY.playRound}</a>
            </p>
          </div>
        ) : null}
      </div>
      <p className="lab-sr" role="status" aria-live="polite">
        {announced}
      </p>
    </div>
  );
}
