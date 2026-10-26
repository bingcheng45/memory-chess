"use client";

import { LabRecordSection } from "./LabRecordSection";
import { useLabRecord } from "./useLabRecord";

/** The record section with the visitor's own rounds, read in the browser. */
export function LabRecord() {
  return <LabRecordSection record={useLabRecord()} />;
}
