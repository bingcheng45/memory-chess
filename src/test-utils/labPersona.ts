import type { LabRecord } from "@/components/home/useLabRecord";
import { personaRounds, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";

/** A persona's record as the home page holds it once storage is read. Pass today "" for the server render. */
export function persona(name: PersonaName, today = PERSONA_TODAY): LabRecord {
  const records = personaRounds(name, PERSONA_TODAY);
  return {
    storage: "available",
    records,
    summary: records.length ? summarize(records) : EMPTY_SUMMARY,
    lastBackup: null,
    today,
    download: jest.fn(() => Promise.resolve()),
    importFile: jest.fn(() => Promise.resolve({ ok: true as const, added: 0, rejected: 0, overCap: 0, summary: null })),
  };
}
