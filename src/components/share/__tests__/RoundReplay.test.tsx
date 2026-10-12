import { render } from "@testing-library/react";
import { RoundReplay } from "@/components/share/RoundReplay";
import { sharePageOf } from "@/lib/share/sharePage";

const CODE = "1_g_4_100_84_383_1214_u14_3_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3_e86e110a110";

describe("RoundReplay clock", () => {
  it("reads '0.0 s of 8.4 s', with only the digits in the mono face", () => {
    const round = sharePageOf("result", CODE)?.round;
    if (!round) throw new Error("the fixture code has no round");

    const { container } = render(<RoundReplay round={round} />);
    const clock = container.querySelector(".lab-replay-clock > span:last-child") as HTMLElement;

    expect(clock.textContent).toBe("0.0 s of 8.4 s");
    expect([...clock.querySelectorAll(".lab-mono")].map((digits) => digits.textContent)).toEqual(["0.0", "8.4"]);
  });
});
