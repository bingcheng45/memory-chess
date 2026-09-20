"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { COUNTRY_CODES, WORLD_CODE, countryName, flagEmoji, type CountryCode } from "@/lib/leaderboard/countries";

interface CountryOption {
  readonly code: CountryCode;
  readonly name: string;
  readonly search: string;
}

interface CountryPickerProps {
  readonly value: CountryCode;
  readonly onChange: (code: CountryCode) => void;
  readonly id: string;
  readonly disabled?: boolean;
}

const fold = (text: string): string =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const toOption = (code: CountryCode, name: string): CountryOption => ({
  code,
  name,
  search: `${fold(name)} ${code.toLowerCase()}`,
});

const LIST_MAX_HEIGHT_PX = 256;
const LIST_MIN_HEIGHT_PX = 120;
const VIEWPORT_MARGIN_PX = 12;
const SEARCH_ROW_HEIGHT_PX = 44;

interface Placement {
  readonly above: boolean;
  readonly maxHeight: number;
}

const BELOW_BY_DEFAULT: Placement = { above: false, maxHeight: LIST_MAX_HEIGHT_PX };

// The popup lives inside the submission dialog rather than a portal, so that a
// click in it is not an outside click that dismisses the dialog. It therefore
// has to fit the viewport itself: flip above the trigger when below is tighter,
// and never grow past the edge.
function placeAgainst(trigger: HTMLElement | null): Placement {
  const rect = trigger?.getBoundingClientRect();
  if (!rect || rect.height === 0) return BELOW_BY_DEFAULT;
  const below = window.innerHeight - rect.bottom - VIEWPORT_MARGIN_PX - SEARCH_ROW_HEIGHT_PX;
  const above = rect.top - VIEWPORT_MARGIN_PX - SEARCH_ROW_HEIGHT_PX;
  const flip = below < LIST_MIN_HEIGHT_PX && above > below;
  const room = flip ? above : below;
  return { above: flip, maxHeight: Math.max(0, Math.min(LIST_MAX_HEIGHT_PX, room)) };
}

const MOVES = new Map<string, (index: number, count: number) => number>([
  ["ArrowDown", (index, count) => (index + 1) % count],
  ["ArrowUp", (index, count) => (index - 1 + count) % count],
  ["Home", () => 0],
  ["End", (_index, count) => count - 1],
]);

export default function CountryPicker({ value, onChange, id, disabled }: CountryPickerProps) {
  const t = useTranslations("country");
  const locale = useLocale();
  const worldLabel = t("world");

  const options = useMemo<readonly CountryOption[]>(() => {
    const collator = new Intl.Collator(locale);
    const countries = COUNTRY_CODES.filter((code) => code !== WORLD_CODE)
      .map((code) => toOption(code, countryName(code, locale)))
      .sort((a, b) => collator.compare(a.name, b.name));
    return [toOption(WORLD_CODE, worldLabel), ...countries];
  }, [locale, worldLabel]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<Placement>(BELOW_BY_DEFAULT);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo<readonly CountryOption[]>(() => {
    const needle = fold(query.trim());
    return needle ? options.filter((option) => option.search.includes(needle)) : options;
  }, [options, query]);

  const activeOption = filtered[activeIndex];
  const selectedName = options.find((option) => option.code === value)?.name ?? value;
  const listboxId = `${id}-listbox`;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // The submission dialog dismisses on Escape from a document capture listener
  // registered before this one, and same-phase listeners run in registration
  // order, so the only place left to claim Escape for the list is one phase up.
  useEffect(() => {
    if (!open) return;
    const claimEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery("");
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", claimEscape, { capture: true });
    return () => window.removeEventListener("keydown", claimEscape, { capture: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const place = () => setPlacement(placeAgainst(triggerRef.current));
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  useEffect(() => {
    if (!open || !activeOption) return;
    document.getElementById(`${id}-option-${activeOption.code}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeOption, id]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapperRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const closeToTrigger = () => {
    close();
    triggerRef.current?.focus();
  };
  const openList = () => {
    const selectedIndex = options.findIndex((option) => option.code === value);
    setActiveIndex(selectedIndex === -1 ? 0 : selectedIndex);
    setQuery("");
    setOpen(true);
  };
  const select = (code: CountryCode) => {
    onChange(code);
    closeToTrigger();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const move = MOVES.get(event.key);
    if (move) {
      event.preventDefault();
      if (filtered.length > 0) setActiveIndex(move(activeIndex, filtered.length));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeOption) select(activeOption.code);
      return;
    }
    if (event.key === "Tab") close();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    openList();
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openList())}
        onKeyDown={handleTriggerKeyDown}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-bg-light bg-transparent px-3 text-left text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      >
        <span aria-hidden="true">{flagEmoji(value)}</span>
        <span className="min-w-0 truncate">{selectedName}</span>
      </button>
      {open && (
        <div
          data-placement={placement.above ? "above" : "below"}
          className={`absolute left-0 z-50 w-full rounded-md border border-bg-light bg-bg-card text-text-primary shadow-lg ${
            placement.above ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={filtered.length > 0 ? listboxId : undefined}
            aria-activedescendant={activeOption ? `${id}-option-${activeOption.code}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="h-10 w-full rounded-t-md border-b border-bg-light bg-transparent px-3 text-base outline-none placeholder:text-text-muted md:text-sm"
          />
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-text-muted">{t("noResults")}</p>
          ) : (
            <ul
              role="listbox"
              id={listboxId}
              style={{ maxHeight: `${placement.maxHeight}px` }}
              className="overflow-y-auto overscroll-contain py-1"
            >
              {filtered.map((option, index) => (
                <li
                  key={option.code}
                  role="option"
                  id={`${id}-option-${option.code}`}
                  aria-selected={option.code === value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    // Without this the search input blurs before the click lands.
                    event.preventDefault();
                    select(option.code);
                  }}
                  className={`flex min-h-[40px] cursor-pointer items-center gap-2 px-3 ${index === activeIndex ? "bg-bg-light" : ""}`}
                >
                  <span aria-hidden="true">{flagEmoji(option.code)}</span>
                  <span className="min-w-0 truncate">{option.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
