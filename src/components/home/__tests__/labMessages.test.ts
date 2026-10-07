import en from "../../../../messages/en.json";

function argumentUsers(node: unknown, names: readonly string[], path = ""): string[] {
  if (typeof node === "string") return names.some((name) => node.includes(`{${name}`)) ? [path] : [];
  if (!node || typeof node !== "object" || Array.isArray(node)) return [];
  return Object.entries(node).flatMap(([key, child]) => argumentUsers(child, names, path ? `${path}.${key}` : key));
}

describe("home.lab messages", () => {
  it("name a setting's arguments pieceCount and memorizeSeconds, leaving seconds for clocks and solve times", () => {
    expect(argumentUsers(en.home.lab, ["pieces", "seconds"])).toEqual(["method.clock", "record.bests.reading"]);
  });
});
