import { LEARN_SEARCH_COPY as COPY } from "@/lib/seo/learn/copy";
import { markQueryWords, type SearchResult } from "@/lib/seo/learn/search";

export default function LearnSearchResult({ result, query }: { readonly result: SearchResult; readonly query: string }) {
  return (
    <>
      <b className="ls-title">{result.title}</b>
      <span className="ls-group">{result.group ?? COPY.article}</span>
      {result.matchedQuestion ? (
        <span className="ls-question">
          {COPY.answers}{" "}
          {markQueryWords(result.matchedQuestion, query).map((word, index) =>
            word.mark ? <mark key={index}>{word.text}</mark> : word.text,
          )}
        </span>
      ) : null}
    </>
  );
}
