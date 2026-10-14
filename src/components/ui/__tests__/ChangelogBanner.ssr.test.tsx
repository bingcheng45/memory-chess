/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ChangelogBanner from "@/components/ui/ChangelogBanner";
import { LATEST_CHANGELOG_ENTRY } from "@/lib/changelog";
import messages from "../../../../messages/en.json";

const serve = (announce: boolean) =>
  renderToString(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <ChangelogBanner announce={announce} />
    </NextIntlClientProvider>,
  );

describe("ChangelogBanner server render", () => {
  it("is in the served HTML, with its hide script, while the release is announced", () => {
    const html = serve(true);

    expect(html).toContain('<aside id="changelog-banner"');
    expect(html).toContain(`Dismiss Memory Chess v${LATEST_CHANGELOG_ENTRY.version} update`);
    expect(html).toContain('<script>(function () {\n  try {\n    var banner = document.getElementById("changelog-banner");');
  });

  it("is absent from the served HTML once the release is no longer announced", () => {
    expect(serve(false)).toBe("");
  });
});
