/**
 * Whether the privacy page, in English and in every translated locale, names the return-visit params on round_complete
 * and the first round's day and round count kept in local storage. While false, a finished round sends none of the
 * three params and saves neither value. Set it to true in the PR that ships that text.
 */
export const RETURN_VISIT_DISCLOSED = true;
