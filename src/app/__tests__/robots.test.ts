import robots from "@/app/robots";

type Rule = { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] };

const rules = (): Rule[] => {
  const { rules } = robots();
  return Array.isArray(rules) ? rules : [rules];
};

const ruleFor = (agent: string) =>
  rules().find(({ userAgent }) => [userAgent].flat().includes(agent));

describe("robots.txt", () => {
  it.each(["GPTBot", "ClaudeBot", "CCBot", "meta-externalagent", "Bytespider"])(
    "shuts out the %s training crawler",
    (agent) => {
      expect(ruleFor(agent)).toMatchObject({ disallow: "/" });
    },
  );

  it.each(["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Googlebot", "Google-Extended"])(
    "leaves %s on the allow-everything rule",
    (agent) => {
      expect(ruleFor(agent)).toBeUndefined();
    },
  );

  it("still allows every other crawler", () => {
    expect(ruleFor("*")).toEqual({ userAgent: "*", allow: "/" });
  });
});
