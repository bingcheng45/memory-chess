/**
 * A right arrow drawn as an SVG so the page does not download Open Sans's two
 * symbol subsets (about 68 KB) for one glyph. The box and offsets reproduce
 * Open Sans's "→" at any font size, in em.
 */
export default function ArrowGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 97 37"
      width="0.97em"
      height="0.37em"
      fill="none"
      stroke="currentColor"
      strokeWidth="5.5"
      style={{ display: "inline-block", margin: "0 0.041em 0 0.04em", verticalAlign: "0.08em" }}
    >
      <path d="M0 18.5H96M68 4l28 14.5L68 33" />
    </svg>
  );
}
