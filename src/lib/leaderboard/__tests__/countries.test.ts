import {
  COUNTRY_CODES,
  WORLD_CODE,
  countryName,
  flagEmoji,
  parseCountryCode,
} from "@/lib/leaderboard/countries";

const WORLD_PLUS_ASSIGNED_COUNT = 250;

function requireCode(value: string) {
  const code = parseCountryCode(value);
  if (code === null) {
    throw new Error(`not an assigned country code: ${value}`);
  }
  return code;
}

/** The lib declares Intl.DisplayNames read-only, but the slot itself is configurable. */
function setDisplayNames(value: unknown) {
  Object.defineProperty(Intl, "DisplayNames", {
    value,
    configurable: true,
    writable: true,
  });
}

describe("parseCountryCode", () => {
  it.each([
    ["an assigned country", "SG"],
    ["the world code", "ZZ"],
  ])("accepts %s", (_name, value) => {
    expect(parseCountryCode(value)).toBe(value);
  });

  it.each([
    ["lowercase", "zz"],
    ["alpha-3", "USA"],
    ["the empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["a well-formed but unassigned pair", "QQ"],
    ["a number", 42],
    ["an object", {}],
  ])("rejects %s", (_name, value) => {
    expect(parseCountryCode(value)).toBeNull();
  });
});

describe("flagEmoji", () => {
  it("renders a real code as two regional indicator symbols", () => {
    expect(flagEmoji(requireCode("SG"))).toBe(String.fromCodePoint(0x1f1f8, 0x1f1ec));
  });

  it("renders the world code as a globe", () => {
    expect(flagEmoji(WORLD_CODE)).toBe(String.fromCodePoint(0x1f30d));
  });
});

describe("countryName", () => {
  it("translates the region name for the requested locale", () => {
    const singapore = requireCode("SG");
    const english = countryName(singapore, "en");
    const japanese = countryName(singapore, "ja");

    expect(english).toBe("Singapore");
    expect(japanese).not.toBe(english);
    expect(japanese.length).toBeGreaterThan(0);
  });

  it("falls back to the code on a runtime without Intl.DisplayNames", () => {
    const singapore = requireCode("SG");
    const original = Intl.DisplayNames;
    setDisplayNames(undefined);

    try {
      expect(countryName(singapore, "en")).toBe("SG");
    } finally {
      setDisplayNames(original);
    }
  });
});

describe("COUNTRY_CODES", () => {
  it("lists the world code first, then every assigned country", () => {
    expect(COUNTRY_CODES).toHaveLength(WORLD_PLUS_ASSIGNED_COUNT);
    expect(COUNTRY_CODES[0]).toBe(WORLD_CODE);
  });

  it("round-trips every entry through parseCountryCode", () => {
    for (const code of COUNTRY_CODES) {
      expect(parseCountryCode(code)).toBe(code);
    }
  });
});
