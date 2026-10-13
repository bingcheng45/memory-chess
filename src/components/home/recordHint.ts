import { SUMMARY_KEY } from "@/lib/lab/storage";

/**
 * Marks the script element `data-lab-record` when this browser's summary counts a round.
 *
 * §06 reserves each panel's room for a record only behind this mark, so a browser holding a record keeps that room
 * from the first paint and its record swaps in without moving anything, while a browser with none draws the Sample
 * panels at their own height. The record itself is in IndexedDB and answers only after the first paint; the summary
 * in local storage, which every saved round updates, answers at once.
 */
export const RECORD_HINT = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(SUMMARY_KEY)}));if(s&&s.rounds>0)document.currentScript.setAttribute("data-lab-record","")}catch(e){}`;
