"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { useSettingsStore } from "@/stores/settingsStore";

interface CoordinatesSwitchProps {
  /** Called after each change has been written to the store. */
  readonly onChange?: (showCoordinates: boolean) => void;
}

/** The "Show board coordinates" switch, on /settings and in the game's setup card. Both write the same persisted setting. */
export function CoordinatesSwitch({ onChange }: CoordinatesSwitchProps) {
  const t = useTranslations("settings");
  const showCoordinates = useSettingsStore((state) => state.showCoordinates);
  const setShowCoordinates = useSettingsStore((state) => state.setShowCoordinates);
  const id = useId();
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;

  const toggle = () => {
    const next = !showCoordinates;
    setShowCoordinates(next);
    onChange?.(next);
  };

  return (
    <div className="lab-switch-field">
      <div className="lab-switch-row">
        <label id={labelId} htmlFor={id} className="lab-switch-label">
          {t("showCoordinates")}
        </label>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={showCoordinates}
          data-coordinates-switch=""
          // The inline prefill script writes the stored value before hydration, and the store hydrates with its
          // default and settles a render later, so this button and its state word may differ from the server's.
          suppressHydrationWarning
          aria-labelledby={labelId}
          aria-describedby={helpId}
          className="lab-switch"
          onClick={toggle}
        >
          <span className="lab-switch-track" aria-hidden="true">
            <span className="lab-switch-thumb" />
          </span>
          <span className="lab-switch-state" aria-hidden="true" data-on-label={t("on")} data-off-label={t("off")} suppressHydrationWarning>
            {showCoordinates ? t("on") : t("off")}
          </span>
        </button>
      </div>
      <p id={helpId} className="lab-switch-help">
        {t("coordinatesHelp")}
      </p>
    </div>
  );
}
