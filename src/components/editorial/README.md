# Memory Chess editorial style

The changelog is the visual reference for editorial pages. The reusable rules
live in `editorialStyles.ts`, and the shared page shell, hero, and actions live
in `EditorialPage.tsx`.

- Use a near-black canvas and one peach accent.
- Keep prose in a narrow reading column (`max-w-2xl` or `max-w-3xl`).
- Prefer whitespace and quiet dividers to nested cards.
- Use mono, uppercase eyebrow labels sparingly for navigation and context.
- Keep body copy at 16px or larger with a 1.75–2 line height.
- Keep buttons rare; ordinary internal links should look like links.
- Use tables only for real comparisons, with horizontal scrolling on mobile.
- Avoid decorative imagery in the reading flow. Social previews may use the
  generated Open Graph routes because they are not part of the article UI.
