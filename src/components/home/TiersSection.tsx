"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  MEMORIZE_SECONDS_RANGE,
  PIECE_COUNT_RANGE,
  PRESET_FACTS,
} from "@/lib/reference/facts";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";
import { playHref } from "./links";

const DENSITY_SQUARES = 32;

function Density({ pieces, label }: { pieces: number; label: string }) {
  return (
    <div className="lab-dens" role="img" aria-label={label}>
      {Array.from({ length: DENSITY_SQUARES }, (_, index) => (
        <i key={index} data-on={index < pieces || undefined} />
      ))}
    </div>
  );
}

/** The real presets, read from the game's own rules, plus the custom ranges. */
export function TiersSection() {
  const t = useTranslations("home.lab.tiers");
  const presets = useTranslations("game.presets");
  const tags = useTranslations("home.lab.tags");

  return (
    <section className="lab-sec lab-sec-tight" id={LAB_SECTIONS.tiers.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="tiers" title={t("title")} lede={t("lede")} />
        <table className="lab-proto">
          <thead>
            <tr>
              <th scope="col">{t("columns.tier")}</th>
              <th scope="col">{t("columns.pieces")}</th>
              <th scope="col">{t("columns.exposure")}</th>
              <th scope="col">{t("columns.load")}</th>
            </tr>
          </thead>
          <tbody>
            {PRESET_FACTS.map(({ difficulty, pieceCount, memorizeSeconds }) => (
              <tr key={difficulty}>
                <td>
                  <div className="lab-tier-name">{presets(`${difficulty}.label`)}</div>
                  <div className="lab-tier-desc">{presets(`${difficulty}.description`)}</div>
                  <Link className="lab-go" href={playHref(pieceCount, memorizeSeconds)}>
                    {t("play")} →
                  </Link>
                </td>
                <td className="lab-num" data-label={t("columns.pieces")}>{pieceCount}</td>
                <td className="lab-num" data-label={t("columns.exposure")}>{memorizeSeconds}s</td>
                <td>
                  <Density pieces={pieceCount} label={t("loadLabel", { pieces: pieceCount })} />
                </td>
              </tr>
            ))}
            <tr>
              <td>
                <div className="lab-tier-name">
                  {t("custom.label")} <span className="lab-tag lab-tag-mint">{tags("rig")}</span>
                </div>
                <div className="lab-tier-desc">{t("custom.description")}</div>
                <Link className="lab-go" href="/game">
                  {t("play")} →
                </Link>
              </td>
              <td className="lab-num" data-label={t("columns.pieces")}>
                {PIECE_COUNT_RANGE.min}–{PIECE_COUNT_RANGE.max}
              </td>
              <td className="lab-num" data-label={t("columns.exposure")}>
                {MEMORIZE_SECONDS_RANGE.min}–{MEMORIZE_SECONDS_RANGE.max}s
              </td>
              <td>
                <Density
                  pieces={PIECE_COUNT_RANGE.max}
                  label={t("loadLabel", { pieces: PIECE_COUNT_RANGE.max })}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
