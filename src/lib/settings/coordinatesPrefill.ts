export const SETTINGS_STORAGE_KEY = 'memory-chess-settings';

// The two functions below also ship as the source of an inline script that sets
// the coordinates switch before hydration (see coordinatesPrefillScript), so
// each stays self-contained: no imports, no module-scope names, and only syntax
// every browser parses without transpiling.

// The value the settings store reads from what it persisted: a v2 value as
// merged over the default, an older one as migrated, where a missing or null
// value means on.
export function storedShowCoordinates(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return true;
  const { state, version } = raw as { state?: unknown; version?: unknown };
  if (typeof state !== 'object' || state === null || !('showCoordinates' in state)) return true;
  const value = (state as { showCoordinates: unknown }).showCoordinates;
  if (version === 2) return Boolean(value);
  return value === null || value === undefined ? true : Boolean(value);
}

export function applyCoordinatesPrefill(root: ParentNode, on: boolean): void {
  root.querySelectorAll<HTMLElement>('[data-coordinates-switch]').forEach((button) => {
    const state = button.querySelector<HTMLElement>('[data-on-label]');
    button.setAttribute('aria-checked', String(on));
    if (state) state.textContent = state.getAttribute(on ? 'data-on-label' : 'data-off-label');
  });
}

export function coordinatesPrefillScript(): string {
  return `(function () {
  try {
    var stored = JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)}) || 'null');
    (${applyCoordinatesPrefill})(document, (${storedShowCoordinates})(stored));
  } catch (error) {}
})();`;
}
