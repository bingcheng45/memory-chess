import { guessCountry } from "@/components/daily/countryGuess";
import { WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";

const code = (value: string) => value as CountryCode;

describe("guessCountry", () => {
  it("takes SG from the connection when nothing was picked before", () => {
    expect(guessCountry({ saved: WORLD_CODE, geo: "SG", languages: ["en-US"] })).toEqual({ code: "SG", source: "connection" });
  });

  it("takes BR from a pt-BR browser when the connection names no country", () => {
    expect(guessCountry({ saved: WORLD_CODE, geo: null, languages: ["pt-BR", "pt", "en"] })).toEqual({ code: "BR", source: "language" });
  });

  it("guesses nothing from a bare en, which names no country", () => {
    expect(guessCountry({ saved: WORLD_CODE, geo: null, languages: ["en"] })).toBeNull();
  });

  it("keeps a JP picked before over SG from the connection", () => {
    expect(guessCountry({ saved: code("JP"), geo: "SG", languages: ["en-SG"] })).toEqual({ code: "JP", source: "saved" });
  });

  it("skips what is not a country: the world from the connection, a region of the world in es-419, a malformed tag", () => {
    expect(guessCountry({ saved: WORLD_CODE, geo: "ZZ", languages: ["es-419", "not a tag", "de-AT"] })).toEqual({ code: "AT", source: "language" });
    expect(guessCountry({ saved: WORLD_CODE, geo: "XX", languages: [] })).toBeNull();
  });
});
