"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  MEMORIZE_SECONDS_RANGE,
  PIECE_COUNT_RANGE,
  PRESET_FACTS,
} from "@/lib/reference/facts";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";
import { playHref } from "@/lib/game/roundLink";

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

interface TierRowProps {
  name: string;
  description: string;
  tag?: string;
  pieces: string;
  exposure: string;
  load: number;
  href: string;
}

function TierRow({ name, description, tag, pieces, exposure, load, href }: TierRowProps) {
  const t = useTranslations("home.lab.tiers");
  return (
    <tr>
      <td className="lab-tier">
        <div className="lab-tier-name">
          {name} {tag && <span className="lab-tag">{tag}</span>}
        </div>
        <div className="lab-tier-desc">{description}</div>
      </td>
      <td className="lab-num" data-label={t("columns.pieces")}>{pieces}</td>
      <td className="lab-num" data-label={t("columns.exposure")}>{exposure}</td>
      <td className="lab-load">
        <Density pieces={load} label={t("loadLabel", { pieceCount: load })} />
      </td>
      <td className="lab-act">
        <Link className="lab-btn lab-btn-secondary lab-btn-sm" href={href} aria-label={`${t("play")} ${name}`}>
          {t("play")}
        </Link>
      </td>
    </tr>
  );
}

export function TiersSection() {
  const t = useTranslations("home.lab.tiers");
  const presets = useTranslations("game.presets");
  const tags = useTranslations("home.lab.tags");

  return (
    <section className="lab-sec" id={LAB_SECTIONS.tiers.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="tiers" title={t("title")} lede={t("lede")} />
        <div className="lab-plate lab-proto-plate">
          <table className="lab-proto">
            <thead>
              <tr>
                <th scope="col">{t("columns.tier")}</th>
                <th scope="col" className="lab-num">{t("columns.pieces")}</th>
                <th scope="col" className="lab-num">{t("columns.exposure")}</th>
                <th scope="col" className="lab-num">{t("columns.load")}</th>
                <th scope="col">
                  <span className="lab-sr">{t("play")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PRESET_FACTS.map(({ difficulty, pieceCount, memorizeSeconds }) => (
                <TierRow
                  key={difficulty}
                  name={presets(`${difficulty}.label`)}
                  description={presets(`${difficulty}.description`)}
                  pieces={String(pieceCount)}
                  exposure={`${memorizeSeconds}s`}
                  load={pieceCount}
                  href={playHref(pieceCount, memorizeSeconds, "home_tier")}
                />
              ))}
              <TierRow
                name={t("custom.label")}
                description={t("custom.description")}
                tag={tags("rig")}
                pieces={`${PIECE_COUNT_RANGE.min}–${PIECE_COUNT_RANGE.max}`}
                exposure={`${MEMORIZE_SECONDS_RANGE.min}–${MEMORIZE_SECONDS_RANGE.max}s`}
                load={PIECE_COUNT_RANGE.max}
                href="/game"
              />
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
